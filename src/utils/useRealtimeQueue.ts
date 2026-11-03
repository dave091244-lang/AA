import { useState, useEffect, useRef, useCallback } from 'react';
import { QueueItem, CounterState, CallHistoryItem, CategoryKey } from '../types';
import { playVoiceAnnouncement, initAudioContext } from './audio';
import { getCanonicalThaiDate, getCanonicalThaiTime } from './time';

export interface RealtimeQueueState {
  queues: QueueItem[];
  countersState: Record<string, CounterState>;
  calledHistory: CallHistoryItem[];
  onlineDevicesCount: number;
  isConnected: boolean;
  latestIssuedTicket: QueueItem | null;
  setLatestIssuedTicket: (ticket: QueueItem | null) => void;
  issueTicket: (catKey: CategoryKey) => void;
  callQueue: (counterNum: string | number, catKey?: CategoryKey) => void;
  callSpecificTicket: (ticketId: string, counterNum: string | number, catKey?: CategoryKey) => void;
  recallQueue: (ticketNumber: string, counterNum: string | number) => void;
  completeQueue: (ticketId: string, counterNum: string | number) => void;
  skipQueue: (ticketId: string, counterNum: string | number) => void;
  clearAll: () => void;
}

function createInitialCounters(): Record<string, CounterState> {
  const map: Record<string, CounterState> = {};
  (['A', 'B', 'C'] as const).forEach((prefix) => {
    const catKey: CategoryKey = prefix === 'A' ? 'EMP' : prefix === 'B' ? 'MIG' : 'CAR';
    for (let i = 1; i <= 6; i++) {
      const id = `${prefix}${i}`;
      map[id] = {
        id,
        counterNum: i,
        categoryPrefix: prefix,
        categoryKey: catKey,
        label: `หมวด ${prefix} ช่อง #${i}`,
        current: null,
        status: 'ว่าง'
      };
    }
  });
  for (let i = 1; i <= 6; i++) {
    map[i] = map[`A${i}`];
  }
  return map;
}

const defaultCounters: Record<string, CounterState> = createInitialCounters();

const STATUS_PRIORITY: Record<QueueItem['status'], number> = {
  waiting: 1,
  called: 2,
  completed: 3,
  skipped: 3
};

function readLocalQueues(): QueueItem[] {
  try {
    const raw = localStorage.getItem('suphan_queues');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const lastCleared = Number(localStorage.getItem('suphan_last_cleared_at') || '0');
    return parsed.filter(
      (q: any) =>
        q &&
        typeof q.id === 'string' &&
        q.id.startsWith('Q_') &&
        typeof q.timestamp === 'number' &&
        q.timestamp > lastCleared
    );
  } catch {
    return [];
  }
}

export function useRealtimeQueue(
  soundEnabled: boolean,
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void
): RealtimeQueueState {
  const [queues, setQueues] = useState<QueueItem[]>(() => readLocalQueues());
  const [countersState, setCountersState] = useState<Record<string, CounterState>>(defaultCounters);
  const [calledHistory, setCalledHistory] = useState<CallHistoryItem[]>([]);
  const [onlineDevicesCount, setOnlineDevicesCount] = useState<number>(1);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [latestIssuedTicket, setLatestIssuedTicketState] = useState<QueueItem | null>(() => {
    try {
      const saved = localStorage.getItem('suphan_my_ticket');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const isReconcilingRef = useRef(false);

  const setLatestIssuedTicket = useCallback((ticket: QueueItem | null) => {
    setLatestIssuedTicketState(ticket);
    try {
      if (ticket) {
        localStorage.setItem('suphan_my_ticket', JSON.stringify(ticket));
      } else {
        localStorage.removeItem('suphan_my_ticket');
      }
    } catch {}
  }, []);

  const localBroadcastRef = useRef<BroadcastChannel | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Sync state helper with additive multi-device protection
  const applyState = useCallback((payload: {
    queues?: QueueItem[];
    counters?: Record<string, CounterState>;
    history?: CallHistoryItem[];
    onlineCount?: number;
    lastClearedAt?: number;
  }) => {
    const serverLastClearedAt = typeof payload.lastClearedAt === 'number' ? payload.lastClearedAt : 0;
    const localLastClearedAt = Number(localStorage.getItem('suphan_last_cleared_at') || '0');
    const effectiveClearedAt = Math.max(serverLastClearedAt, localLastClearedAt);

    try {
      if (effectiveClearedAt > 0) {
        localStorage.setItem('suphan_last_cleared_at', String(effectiveClearedAt));
      }
    } catch {}

    if (payload.queues) {
      const localQueues = readLocalQueues().filter((q) => q.timestamp > effectiveClearedAt);
      const serverQueues = payload.queues.filter((q) => q.timestamp > effectiveClearedAt);

      // Merge serverQueues + localQueues by id so neither device nor server restart ever deletes actual records
      const mergedMap = new Map<string, QueueItem>();
      for (const sq of serverQueues) {
        mergedMap.set(sq.id, sq);
      }

      const missingOnServer: QueueItem[] = [];
      for (const lq of localQueues) {
        const existing = mergedMap.get(lq.id);
        if (!existing) {
          mergedMap.set(lq.id, lq);
          missingOnServer.push(lq);
        } else {
          const sPrio = STATUS_PRIORITY[existing.status] || 1;
          const lPrio = STATUS_PRIORITY[lq.status] || 1;
          if (lPrio > sPrio) {
            mergedMap.set(lq.id, lq);
            missingOnServer.push(lq);
          }
        }
      }

      const mergedQueues = Array.from(mergedMap.values()).sort((a, b) => b.timestamp - a.timestamp);
      setQueues(mergedQueues);

      try {
        localStorage.setItem('suphan_queues', JSON.stringify(mergedQueues));
      } catch {}

      // If a staff member cleared all queues after the active ticket was issued, clear active ticket
      setLatestIssuedTicketState((current) => {
        if (!current) return null;
        if (current.timestamp <= effectiveClearedAt) {
          try {
            localStorage.removeItem('suphan_my_ticket');
          } catch {}
          return null;
        }
        const updated = mergedQueues.find((q) => q.id === current.id);
        if (updated) {
          try {
            localStorage.setItem('suphan_my_ticket', JSON.stringify(updated));
          } catch {}
          return updated;
        }
        return current;
      });

      // If this device holds genuine records that the server was missing, push them to the server
      if (missingOnServer.length > 0 && !isReconcilingRef.current) {
        isReconcilingRef.current = true;
        fetch('/api/queues/reconcile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientQueues: missingOnServer })
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((reconciled) => {
            if (reconciled && Array.isArray(reconciled.queues)) {
              setQueues(reconciled.queues);
              if (reconciled.counters) setCountersState(reconciled.counters);
              if (reconciled.history) setCalledHistory(reconciled.history);
              try {
                localStorage.setItem('suphan_queues', JSON.stringify(reconciled.queues));
              } catch {}
            }
          })
          .catch(() => {})
          .finally(() => {
            isReconcilingRef.current = false;
          });
      }
    }

    if (payload.counters) {
      setCountersState(payload.counters);
      try {
        localStorage.setItem('suphan_counters', JSON.stringify(payload.counters));
      } catch {}
    }
    if (payload.history) {
      setCalledHistory(payload.history);
      try {
        localStorage.setItem('suphan_history', JSON.stringify(payload.history));
      } catch {}
    }
    if (payload.onlineCount !== undefined) {
      setOnlineDevicesCount(payload.onlineCount);
    }
  }, []);

  // Fetch state from REST API
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        applyState(data);
        setIsConnected(true);
      }
    } catch {
      // Offline fallback: load from localStorage without deleting anything
      try {
        const savedQueues = readLocalQueues();
        const savedCounters = localStorage.getItem('suphan_counters');
        const savedHistory = localStorage.getItem('suphan_history');
        if (savedQueues.length > 0) setQueues(savedQueues);
        if (savedCounters) setCountersState(JSON.parse(savedCounters));
        if (savedHistory) setCalledHistory(JSON.parse(savedHistory));
      } catch {}
    }
  }, [applyState]);

  // Connect Server-Sent Events (SSE)
  useEffect(() => {
    // 1. Initial immediate REST fetch
    fetchState();

    // 2. Setup BroadcastChannel for zero-latency same-browser sync
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('suphan_employment_queue_channel');
      localBroadcastRef.current = channel;

      channel.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'UPDATE_STATE') {
          applyState(payload);
        } else if (type === 'ANNOUNCE' && soundEnabled) {
          playVoiceAnnouncement(payload.ticketNumber, payload.counterNum);
        }
      };
    }

    // 3. Connect to Server-Sent Events (SSE)
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      try {
        const es = new EventSource('/api/events');
        eventSourceRef.current = es;

        es.onopen = () => {
          setIsConnected(true);
        };

        es.addEventListener('init', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            applyState(data);
            setIsConnected(true);
          } catch {}
        });

        es.addEventListener('update', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            applyState(data);
            setIsConnected(true);
          } catch {}
        });

        es.addEventListener('announce', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (soundEnabled) {
              playVoiceAnnouncement(data.ticketNumber, data.counterNum);
            }
          } catch {}
        });

        es.onerror = () => {
          fetchState();
        };
      } catch {
        fetchState();
      }
    }

    // 4. Fallback Polling (Every 4 seconds to guarantee sync across all devices)
    const pollInterval = setInterval(() => {
      fetchState();
    }, 4000);

    return () => {
      clearInterval(pollInterval);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (localBroadcastRef.current) {
        localBroadcastRef.current.close();
      }
    };
  }, [applyState, fetchState, soundEnabled]);

  // Post action helper
  const postAction = useCallback(async (url: string, body: object = {}) => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setIsConnected(true);
        const data = await res.json();
        return data;
      }
    } catch (err) {
      console.warn(`Action to ${url} failed:`, err);
    }
    return null;
  }, []);

  // Actions
  const issueTicket = useCallback(async (catKey: CategoryKey) => {
    initAudioContext();
    const now = new Date();
    const clientTime = getCanonicalThaiTime(now);
    const clientDate = getCanonicalThaiDate(now);
    const result = await postAction('/api/tickets/issue', { 
      categoryKey: catKey,
      clientTime,
      clientDate
    });
    if (result && result.ticket) {
      setLatestIssuedTicket(result.ticket);
      showToast(`รับบัตรคิวสำเร็จ: ${result.ticket.ticketNumber}`, 'success');
      fetchState();
    }
  }, [postAction, showToast, fetchState, setLatestIssuedTicket]);

  const callQueue = useCallback(async (counterNum: string | number, catKey?: CategoryKey) => {
    initAudioContext();
    const result = await postAction('/api/queues/call', { counterNum, catKey });
    if (result && result.success && result.ticket) {
      const counterTarget = result.ticket.counter || counterNum;
      if (soundEnabled) {
        playVoiceAnnouncement(result.ticket.ticketNumber, counterTarget);
      }
      showToast(`เรียกคิว ${result.ticket.ticketNumber} เข้า${result.ticket.counterLabel || `ช่องบริการที่ ${counterTarget}`}`, 'success');
      fetchState();
    } else if (result && !result.success) {
      showToast(result.message || 'ไม่มีคิวรอรับบริการ', 'info');
    }
  }, [postAction, soundEnabled, showToast, fetchState]);

  const callSpecificTicket = useCallback(async (ticketId: string, counterNum: string | number, catKey?: CategoryKey) => {
    initAudioContext();
    const result = await postAction('/api/queues/call-specific', { ticketId, counterNum, catKey });
    if (result && result.success && result.ticket) {
      const counterTarget = result.ticket.counter || counterNum;
      if (soundEnabled) {
        playVoiceAnnouncement(result.ticket.ticketNumber, counterTarget);
      }
      showToast(`เรียกคิว ${result.ticket.ticketNumber} เข้า${result.ticket.counterLabel || `ช่องบริการที่ ${counterTarget}`}`, 'success');
      fetchState();
    }
  }, [postAction, soundEnabled, showToast, fetchState]);

  const recallQueue = useCallback(async (ticketNumber: string, counterNum: string | number) => {
    initAudioContext();
    if (soundEnabled) {
      playVoiceAnnouncement(ticketNumber, counterNum);
    }
    await postAction('/api/queues/recall', { ticketNumber, counterNum });
    showToast(`ประกาศเรียกซ้ำคิว ${ticketNumber} (ช่อง ${counterNum})`, 'info');
  }, [postAction, soundEnabled, showToast]);

  const completeQueue = useCallback(async (ticketId: string, counterNum: string | number) => {
    await postAction('/api/queues/complete', { ticketId, counterNum });
    showToast(`บันทึกบริการเสร็จสิ้น (ช่อง ${counterNum})`, 'success');
    fetchState();
  }, [postAction, showToast, fetchState]);

  const skipQueue = useCallback(async (ticketId: string, counterNum: string | number) => {
    await postAction('/api/queues/skip', { ticketId, counterNum });
    showToast(`ข้ามคิวเรียบร้อย (ช่อง ${counterNum})`, 'info');
    fetchState();
  }, [postAction, showToast, fetchState]);

  const clearAll = useCallback(async () => {
    const res = await postAction('/api/queues/reset', { pin: '123456' });
    const clearTs = res?.lastClearedAt || Date.now();
    try {
      localStorage.setItem('suphan_last_cleared_at', String(clearTs));
      localStorage.setItem('suphan_queues', '[]');
      localStorage.removeItem('suphan_my_ticket');
    } catch {}
    setQueues([]);
    setLatestIssuedTicket(null);
    showToast('เจ้าหน้าที่ล้างข้อมูลคิวทั้งหมดเรียบร้อยแล้ว', 'info');
    fetchState();
  }, [postAction, showToast, fetchState, setLatestIssuedTicket]);

  return {
    queues,
    countersState,
    calledHistory,
    onlineDevicesCount,
    isConnected,
    latestIssuedTicket,
    setLatestIssuedTicket,
    issueTicket,
    callQueue,
    callSpecificTicket,
    recallQueue,
    completeQueue,
    skipQueue,
    clearAll
  };
}

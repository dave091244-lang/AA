import express, { type Request, type Response } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type CategoryKey = 'EMP' | 'MIG' | 'CAR';

export interface QueueItem {
  id: string;
  ticketNumber: string;
  prefix: string;
  seqNumber: number;
  categoryKey: CategoryKey;
  categoryName: string;
  status: 'waiting' | 'called' | 'completed' | 'skipped';
  counter: string | number | null;
  counterLabel?: string;
  date: string;
  time: string;
  timestamp: number;
  calledAt?: number;
  completedAt?: number;
}

export interface CounterState {
  id?: string;
  counterNum?: number;
  categoryPrefix?: 'A' | 'B' | 'C';
  label?: string;
  current: string | null;
  ticketId?: string | null;
  status: 'ว่าง' | 'กำลังให้บริการ' | 'พักการให้บริการ';
  categoryKey?: CategoryKey | null;
}

export interface CallHistoryItem {
  ticketNumber: string;
  counter: string | number;
  counterLabel?: string;
  time: string;
  category: string;
  timestamp: number;
}

const CATEGORY_NAMES: Record<CategoryKey, { name: string; prefix: 'A' | 'B' | 'C' }> = {
  EMP: { name: 'งานจัดหางานในประเทศ / งานจัดหางานต่างประเทศ', prefix: 'A' },
  MIG: { name: 'งานควบคุมการทำงานของคนต่างด้าว / งานตรวจสอบการทำงานของคนต่างด้าว', prefix: 'B' },
  CAR: { name: 'งานแนะแนวอาชีพ', prefix: 'C' }
};

export interface CounterInfo {
  id: string; // e.g. 'A1', 'B3', 'C5'
  num: number; // 1..6
  prefix: 'A' | 'B' | 'C';
  catKey: CategoryKey;
  label: string; // 'หมวด A ช่อง #1'
}

function parseCounterId(counterVal: any, fallbackCatKey?: CategoryKey): CounterInfo {
  const str = String(counterVal || '').trim().toUpperCase();
  const match = str.match(/^([ABC])[-_ ]?([1-6])$/);
  if (match) {
    const prefix = match[1] as 'A' | 'B' | 'C';
    const num = parseInt(match[2], 10);
    const catKey: CategoryKey = prefix === 'A' ? 'EMP' : prefix === 'B' ? 'MIG' : 'CAR';
    return {
      id: `${prefix}${num}`,
      num,
      prefix,
      catKey,
      label: `หมวด ${prefix} ช่อง #${num}`
    };
  }

  const num = Math.min(6, Math.max(1, parseInt(str, 10) || 1));
  const prefix: 'A' | 'B' | 'C' = fallbackCatKey === 'MIG' ? 'B' : fallbackCatKey === 'CAR' ? 'C' : 'A';
  const catKey: CategoryKey = fallbackCatKey || (prefix === 'A' ? 'EMP' : prefix === 'B' ? 'MIG' : 'CAR');
  return {
    id: `${prefix}${num}`,
    num,
    prefix,
    catKey,
    label: `หมวด ${prefix} ช่อง #${num}`
  };
}

function createDefaultCounters(): Record<string, CounterState> {
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
        ticketId: null,
        status: 'ว่าง'
      };
    }
  });
  for (let i = 1; i <= 6; i++) {
    map[i] = map[`A${i}`];
  }
  return map;
}

const THAI_TIMEZONE = 'Asia/Bangkok';

function getThaiTime(date: Date = new Date()): string {
  return date.toLocaleTimeString('th-TH', {
    timeZone: THAI_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function getThaiDate(date: Date = new Date()): string {
  return date.toLocaleDateString('th-TH', {
    timeZone: THAI_TIMEZONE,
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  });
}

// Persistent Storage for Strict Reality-Based Queue Tracking (Retained until staff manual clear)
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'queue_records.json');
const META_FILE = path.resolve(DATA_DIR, 'queue_meta.json');
const TMP_BACKUP_FILE = path.resolve(os.tmpdir(), 'suphan_doe_queue_records.json');

interface PersistedStoragePayload {
  lastClearedAt: number;
  queues: QueueItem[];
}

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('Could not create data directory:', err);
  }
}

function isValidQueueItem(item: any): item is QueueItem {
  return (
    item &&
    typeof item === 'object' &&
    typeof item.id === 'string' &&
    item.id.startsWith('Q_') &&
    typeof item.ticketNumber === 'string' &&
    typeof item.timestamp === 'number' &&
    !isNaN(item.timestamp) &&
    (item.categoryKey === 'EMP' || item.categoryKey === 'MIG' || item.categoryKey === 'CAR')
  );
}

function normalizeQueueItem(item: QueueItem): QueueItem {
  const ts = item.timestamp || Date.now();
  const catInfo = CATEGORY_NAMES[item.categoryKey] || CATEGORY_NAMES.EMP;
  return {
    ...item,
    prefix: item.prefix || catInfo.prefix,
    categoryName: item.categoryName || catInfo.name,
    date: getThaiDate(new Date(ts)),
    time: item.time || getThaiTime(new Date(ts)),
    timestamp: ts
  };
}

function loadPersistedState(): PersistedStoragePayload {
  ensureDataDir();
  let loadedQueues: QueueItem[] = [];
  let loadedLastClearedAt = 0;

  // Read meta if exists
  try {
    if (fs.existsSync(META_FILE)) {
      const metaRaw = JSON.parse(fs.readFileSync(META_FILE, 'utf-8'));
      if (typeof metaRaw?.lastClearedAt === 'number') {
        loadedLastClearedAt = metaRaw.lastClearedAt;
      }
    }
  } catch {}

  // Try primary DATA_FILE first, then fallback to TMP_BACKUP_FILE
  const candidateFiles = [DATA_FILE, TMP_BACKUP_FILE];
  for (const filePath of candidateFiles) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(isValidQueueItem).map(normalizeQueueItem);
          if (valid.length > loadedQueues.length) {
            loadedQueues = valid;
          }
        } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.queues)) {
          if (typeof parsed.lastClearedAt === 'number' && parsed.lastClearedAt > loadedLastClearedAt) {
            loadedLastClearedAt = parsed.lastClearedAt;
          }
          const valid = parsed.queues
            .filter(isValidQueueItem)
            .map(normalizeQueueItem);
          if (valid.length > loadedQueues.length) {
            loadedQueues = valid;
          }
        }
      }
    } catch (err) {
      console.warn(`Could not read queue file ${filePath}:`, err);
    }
  }

  loadedQueues = loadedQueues
    .filter((q) => q.timestamp > loadedLastClearedAt)
    .sort((a, b) => b.timestamp - a.timestamp);

  return {
    lastClearedAt: loadedLastClearedAt,
    queues: loadedQueues
  };
}

export function saveQueueRecords(records: QueueItem[], clearedAtTimestamp: number): void {
  ensureDataDir();
  const normalized = records.map(normalizeQueueItem).sort((a, b) => b.timestamp - a.timestamp);
  const payload = {
    lastClearedAt: clearedAtTimestamp,
    queues: normalized,
    updatedAt: Date.now()
  };

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    fs.writeFileSync(META_FILE, JSON.stringify({ lastClearedAt: clearedAtTimestamp, updatedAt: Date.now() }, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save queue records to primary disk:', err);
  }
  try {
    fs.writeFileSync(TMP_BACKUP_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch {}
}

const initialPersisted = loadPersistedState();
let queues: QueueItem[] = initialPersisted.queues;
let lastClearedAt: number = initialPersisted.lastClearedAt;

// Restore active called state from actual records
function initializeCountersFromRealState(actualQueues: QueueItem[]): Record<string, CounterState> {
  const map = createDefaultCounters();
  // Sort oldest-to-newest so latest called ticket on a counter wins
  const activeCalled = [...actualQueues]
    .filter((q) => q.status === 'called')
    .sort((a, b) => (a.calledAt || a.timestamp) - (b.calledAt || b.timestamp));

  for (const ticket of activeCalled) {
    if (ticket.counter) {
      const counterInfo = parseCounterId(ticket.counter, ticket.categoryKey);
      map[counterInfo.id] = {
        id: counterInfo.id,
        counterNum: counterInfo.num,
        categoryPrefix: counterInfo.prefix,
        categoryKey: ticket.categoryKey,
        label: ticket.counterLabel || counterInfo.label,
        current: ticket.ticketNumber,
        ticketId: ticket.id,
        status: 'กำลังให้บริการ'
      };
      map[counterInfo.num] = map[counterInfo.id];
    }
  }
  return map;
}

function buildCalledHistoryFromQueues(actualQueues: QueueItem[]): CallHistoryItem[] {
  return [...actualQueues]
    .filter((q) => q.calledAt && q.counter)
    .sort((a, b) => (b.calledAt || 0) - (a.calledAt || 0))
    .slice(0, 20)
    .map((q) => ({
      ticketNumber: q.ticketNumber,
      counter: q.counter!,
      counterLabel: q.counterLabel || `ช่อง #${q.counter}`,
      time: q.calledAt ? getThaiTime(new Date(q.calledAt)) : q.time,
      category: q.categoryName,
      timestamp: q.calledAt || q.timestamp
    }));
}

let countersState: Record<string, CounterState> = initializeCountersFromRealState(queues);
let calledHistory: CallHistoryItem[] = buildCalledHistoryFromQueues(queues);

const STATUS_PRIORITY: Record<QueueItem['status'], number> = {
  waiting: 1,
  called: 2,
  completed: 3,
  skipped: 3
};

/**
 * Merges incoming actual queue records from a device without ever deleting existing server records.
 * Returns true if any new or updated record was merged.
 */
function reconcileClientQueues(incomingQueues: any[]): boolean {
  if (!Array.isArray(incomingQueues) || incomingQueues.length === 0) {
    return false;
  }

  let changed = false;
  const byId = new Map<string, QueueItem>();
  for (const q of queues) {
    byId.set(q.id, q);
  }

  for (const raw of incomingQueues) {
    if (!isValidQueueItem(raw)) continue;
    // Ignore tickets created at or before the last manual staff clear
    if (raw.timestamp <= lastClearedAt) continue;

    const item = normalizeQueueItem(raw);
    const existing = byId.get(item.id);

    if (!existing) {
      byId.set(item.id, item);
      changed = true;
    } else {
      const existingPrio = STATUS_PRIORITY[existing.status] || 1;
      const incomingPrio = STATUS_PRIORITY[item.status] || 1;
      if (
        incomingPrio > existingPrio ||
        (item.calledAt && !existing.calledAt) ||
        (item.completedAt && !existing.completedAt)
      ) {
        byId.set(item.id, {
          ...existing,
          ...item,
          status: incomingPrio >= existingPrio ? item.status : existing.status,
          counter: item.counter ?? existing.counter,
          counterLabel: item.counterLabel ?? existing.counterLabel,
          calledAt: item.calledAt ?? existing.calledAt,
          completedAt: item.completedAt ?? existing.completedAt
        });
        changed = true;
      }
    }
  }

  if (changed) {
    queues = Array.from(byId.values()).sort((a, b) => b.timestamp - a.timestamp);
    countersState = initializeCountersFromRealState(queues);
    calledHistory = buildCalledHistoryFromQueues(queues);
    saveQueueRecords(queues, lastClearedAt);
  }

  return changed;
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const isProduction = process.env.NODE_ENV === 'production';
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware
  app.use(express.json({ limit: '5mb' }));

  // CORS Middleware for API routes to allow requests from any frame/client
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Server-Sent Events (SSE) Client Pool
  const sseClients = new Set<Response>();

  // WebSocket Server Setup with explicit path to avoid colliding with Vite
  const wss = new WebSocketServer({ server, path: '/ws' });
  const wsClients = new Set<WebSocket>();

  function getTotalOnlineCount(): number {
    return Math.max(1, sseClients.size + wsClients.size);
  }

  function broadcastSSE(eventType: string, data: object) {
    const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of sseClients) {
      try {
        res.write(payload);
      } catch {
        sseClients.delete(res);
      }
    }
  }

  function broadcastWS(data: object) {
    const msg = JSON.stringify(data);
    for (const ws of wsClients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    }
  }

  function getFullStatePayload() {
    return {
      queues,
      counters: countersState,
      history: calledHistory,
      onlineCount: getTotalOnlineCount(),
      lastClearedAt
    };
  }

  function broadcastState(announcePayload?: { ticketNumber: string; counterNum: string | number; counterLabel?: string }) {
    const statePayload = getFullStatePayload();

    // Broadcast to SSE
    broadcastSSE('update', statePayload);
    if (announcePayload) {
      broadcastSSE('announce', announcePayload);
    }

    // Broadcast to WebSocket
    broadcastWS({ type: 'UPDATE_STATE', payload: statePayload });
    if (announcePayload) {
      broadcastWS({ type: 'ANNOUNCE', payload: announcePayload });
    }
  }

  // Periodic SSE Heartbeat Ping (keeps local network connections and browser proxies alive)
  setInterval(() => {
    for (const res of sseClients) {
      try {
        res.write(`: ping\n\n`);
      } catch {
        sseClients.delete(res);
      }
    }
  }, 15000);

  // 1. SSE Real-Time Stream Endpoint: /api/events
  app.get('/api/events', (req: Request, res: Response) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    sseClients.add(res);

    // Send initial full state immediately (never deletes existing data)
    res.write(`event: init\ndata: ${JSON.stringify(getFullStatePayload())}\n\n`);

    // Notify all about new client presence
    broadcastState();

    req.on('close', () => {
      sseClients.delete(res);
      broadcastState();
    });
  });

  // 2. REST API Endpoints (Rock-Solid for all Devices & Browsers)
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Suphan Buri Provincial Employment Office Queue System',
      onlineCount: getTotalOnlineCount(),
      totalStoredQueues: queues.length,
      lastClearedAt,
      sseClients: sseClients.size,
      wsClients: wsClients.size,
      time: new Date().toISOString()
    });
  });

  app.get('/api/state', (_req: Request, res: Response) => {
    res.json(getFullStatePayload());
  });

  // Additive Multi-Device State Reconciliation (ensures accessing from different devices or after server idle never loses data)
  app.post('/api/queues/reconcile', (req: Request, res: Response) => {
    const { clientQueues } = req.body || {};
    const changed = reconcileClientQueues(clientQueues);
    if (changed) {
      broadcastState();
    }
    res.json({
      success: true,
      merged: changed,
      ...getFullStatePayload()
    });
  });

  // Issue Ticket (Strictly actual user-initiated queue issuance)
  app.post('/api/tickets/issue', (req: Request, res: Response) => {
    const { categoryKey } = req.body;
    const catKey: CategoryKey = categoryKey === 'MIG' || categoryKey === 'CAR' ? categoryKey : 'EMP';
    const catInfo = CATEGORY_NAMES[catKey];

    const now = new Date();
    const date = getThaiDate(now);
    const time = getThaiTime(now);

    // Calculate sequence number within the same category for today (or overall if same day)
    const todayInCat = queues.filter((q) => {
      if (q.categoryKey !== catKey) return false;
      const qDate = q.timestamp ? getThaiDate(new Date(q.timestamp)) : q.date;
      return qDate === date;
    });
    const maxSeq = todayInCat.reduce((max, q) => Math.max(max, q.seqNumber || 0), 0);
    const nextSeq = maxSeq >= 999 ? 1 : maxSeq + 1;
    const ticketNumber = `${catInfo.prefix}${String(nextSeq).padStart(3, '0')}`;

    const newQueue: QueueItem = {
      id: `Q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ticketNumber,
      prefix: catInfo.prefix,
      seqNumber: nextSeq,
      categoryKey: catKey,
      categoryName: catInfo.name,
      status: 'waiting',
      counter: null,
      date,
      time,
      timestamp: now.getTime()
    };

    queues = [newQueue, ...queues];
    saveQueueRecords(queues, lastClearedAt);
    broadcastState();

    res.json({ success: true, ticket: newQueue });
  });

  // Call Next Queue
  app.post('/api/queues/call', (req: Request, res: Response) => {
    const { counterNum, catKey, counterId } = req.body;
    const counterInfo = parseCounterId(counterId || counterNum, catKey);

    const waitingList = queues
      .filter((q) => q.status === 'waiting' && (!counterInfo.catKey || q.categoryKey === counterInfo.catKey))
      .sort((a, b) => a.timestamp - b.timestamp);

    if (waitingList.length === 0) {
      res.json({ success: false, message: `ไม่มีคิวรอรับบริการในหมวด ${counterInfo.prefix}` });
      return;
    }

    const nextQueue = waitingList[0];

    // Mark previous called ticket on this counter as completed
    queues = queues.map((q) => {
      if (q.status === 'called' && (q.counter === counterInfo.id || q.counter === counterInfo.num) && q.id !== nextQueue.id) {
        return { ...q, status: 'completed' as const, completedAt: Date.now() };
      }
      if (q.id === nextQueue.id) {
        return { 
          ...q, 
          status: 'called' as const, 
          counter: counterInfo.id, 
          counterLabel: counterInfo.label, 
          calledAt: Date.now() 
        };
      }
      return q;
    });

    const updatedState: CounterState = {
      id: counterInfo.id,
      counterNum: counterInfo.num,
      categoryPrefix: counterInfo.prefix,
      label: counterInfo.label,
      current: nextQueue.ticketNumber,
      ticketId: nextQueue.id,
      status: 'กำลังให้บริการ',
      categoryKey: nextQueue.categoryKey
    };

    countersState = {
      ...countersState,
      [counterInfo.id]: updatedState,
      [counterInfo.num]: updatedState
    };

    calledHistory = [
      {
        ticketNumber: nextQueue.ticketNumber,
        counter: counterInfo.id,
        counterLabel: counterInfo.label,
        time: getThaiTime(),
        category: nextQueue.categoryName,
        timestamp: Date.now()
      },
      ...calledHistory
    ].slice(0, 20);

    saveQueueRecords(queues, lastClearedAt);

    broadcastState({ 
      ticketNumber: nextQueue.ticketNumber, 
      counterNum: counterInfo.id,
      counterLabel: counterInfo.label 
    });

    res.json({ 
      success: true, 
      ticket: { ...nextQueue, counter: counterInfo.id, counterLabel: counterInfo.label } 
    });
  });

  // Call Specific Queue
  app.post('/api/queues/call-specific', (req: Request, res: Response) => {
    const { ticketId, counterNum, counterId, catKey } = req.body;
    const target = queues.find((q) => q.id === ticketId);

    if (!target) {
      res.status(404).json({ success: false, message: 'ไม่พบหมายเลขคิว' });
      return;
    }

    const counterInfo = parseCounterId(counterId || counterNum, catKey || target.categoryKey);

    queues = queues.map((q) => {
      if (q.status === 'called' && (q.counter === counterInfo.id || q.counter === counterInfo.num) && q.id !== ticketId) {
        return { ...q, status: 'completed' as const, completedAt: Date.now() };
      }
      if (q.id === ticketId) {
        return { 
          ...q, 
          status: 'called' as const, 
          counter: counterInfo.id, 
          counterLabel: counterInfo.label, 
          calledAt: Date.now() 
        };
      }
      return q;
    });

    const updatedState: CounterState = {
      id: counterInfo.id,
      counterNum: counterInfo.num,
      categoryPrefix: counterInfo.prefix,
      label: counterInfo.label,
      current: target.ticketNumber,
      ticketId: target.id,
      status: 'กำลังให้บริการ',
      categoryKey: target.categoryKey
    };

    countersState = {
      ...countersState,
      [counterInfo.id]: updatedState,
      [counterInfo.num]: updatedState
    };

    calledHistory = [
      {
        ticketNumber: target.ticketNumber,
        counter: counterInfo.id,
        counterLabel: counterInfo.label,
        time: getThaiTime(),
        category: target.categoryName,
        timestamp: Date.now()
      },
      ...calledHistory
    ].slice(0, 20);

    saveQueueRecords(queues, lastClearedAt);

    broadcastState({ 
      ticketNumber: target.ticketNumber, 
      counterNum: counterInfo.id,
      counterLabel: counterInfo.label 
    });

    res.json({ 
      success: true, 
      ticket: { ...target, counter: counterInfo.id, counterLabel: counterInfo.label } 
    });
  });

  // Recall Queue
  app.post('/api/queues/recall', (req: Request, res: Response) => {
    const { ticketNumber, counterNum, counterId } = req.body;
    const counterInfo = parseCounterId(counterId || counterNum);
    broadcastSSE('announce', { 
      ticketNumber, 
      counterNum: counterInfo.id,
      counterLabel: counterInfo.label 
    });
    broadcastWS({ 
      type: 'ANNOUNCE', 
      payload: { 
        ticketNumber, 
        counterNum: counterInfo.id,
        counterLabel: counterInfo.label 
      } 
    });
    res.json({ success: true });
  });

  // Complete Queue
  app.post('/api/queues/complete', (req: Request, res: Response) => {
    const { ticketId, counterNum, counterId } = req.body;
    const counterInfo = parseCounterId(counterId || counterNum);

    queues = queues.map((q) =>
      q.id === ticketId ? { ...q, status: 'completed' as const, completedAt: Date.now() } : q
    );
    const clearedCounter: CounterState = { 
      id: counterInfo.id,
      counterNum: counterInfo.num,
      categoryPrefix: counterInfo.prefix,
      label: counterInfo.label,
      current: null, 
      status: 'ว่าง', 
      ticketId: null, 
      categoryKey: null 
    };

    countersState = {
      ...countersState,
      [counterInfo.id]: clearedCounter,
      [counterInfo.num]: clearedCounter
    };

    saveQueueRecords(queues, lastClearedAt);
    broadcastState();
    res.json({ success: true });
  });

  // Skip Queue
  app.post('/api/queues/skip', (req: Request, res: Response) => {
    const { ticketId, counterNum, counterId } = req.body;
    const counterInfo = parseCounterId(counterId || counterNum);

    queues = queues.map((q) =>
      q.id === ticketId ? { ...q, status: 'skipped' as const, completedAt: Date.now() } : q
    );
    const clearedCounter: CounterState = { 
      id: counterInfo.id,
      counterNum: counterInfo.num,
      categoryPrefix: counterInfo.prefix,
      label: counterInfo.label,
      current: null, 
      status: 'ว่าง', 
      ticketId: null, 
      categoryKey: null 
    };

    countersState = {
      ...countersState,
      [counterInfo.id]: clearedCounter,
      [counterInfo.num]: clearedCounter
    };

    saveQueueRecords(queues, lastClearedAt);
    broadcastState();
    res.json({ success: true });
  });

  // Manual Staff Reset Data (Retained until staff explicitly executes this reset)
  app.post('/api/queues/reset', (req: Request, res: Response) => {
    const { pin } = req.body || {};
    if (pin && String(pin).trim() !== '123456') {
      res.status(401).json({ success: false, message: 'รหัสผ่านเจ้าหน้าที่ไม่ถูกต้อง' });
      return;
    }

    lastClearedAt = Date.now();
    queues = [];
    countersState = createDefaultCounters();
    calledHistory = [];
    saveQueueRecords(queues, lastClearedAt);
    broadcastState();
    res.json({
      success: true,
      lastClearedAt,
      message: 'เจ้าหน้าที่ดำเนินการล้างข้อมูลคิวเรียบร้อยแล้ว'
    });
  });

  // WebSocket connection handler
  wss.on('connection', (ws) => {
    wsClients.add(ws);
    ws.send(JSON.stringify({
      type: 'INIT_STATE',
      payload: getFullStatePayload()
    }));

    ws.on('close', () => {
      wsClients.delete(ws);
      broadcastState();
    });

    ws.on('error', () => {
      wsClients.delete(ws);
      broadcastState();
    });
  });

  // Vite Development Middleware or Static Files in Production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    const indexPath = path.resolve(distPath, 'index.html');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(503).send('ระบบกำลังเตรียมไฟล์ กรุณารอสักครู่แล้วรีเฟรชหน้าจอ');
      }
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Suphan Buri Queue System running on http://0.0.0.0:${PORT}`);
    console.log(`🌐 Real-time SSE (/api/events) and Multi-Device State Reconciliation active`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

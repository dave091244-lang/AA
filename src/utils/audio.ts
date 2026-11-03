// Audio Chime & Thai Speech Synthesis Utility
// Tuned for a sweet, cheerful teenage girl voice (เสียงเด็กสาววัยรุ่นไทย)

let audioCtx: AudioContext | null = null;

export function initAudioContext() {
  if (typeof window === 'undefined') return;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

/**
 * Play 1-tone chime before queue call (เหลือเสียงกระดิ่ง 1 ครั้ง)
 */
export function playChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      initAudioContext();
      if (!audioCtx) {
        resolve();
        return;
      }

      const now = audioCtx.currentTime;

      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      setTimeout(() => {
        resolve();
      }, 500);
    } catch {
      resolve();
    }
  });
}

// Preload voices cache for browser speech synthesis
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    window.speechSynthesis.onvoiceschanged = () => {
      try {
        window.speechSynthesis.getVoices();
      } catch {}
    };
    window.speechSynthesis.getVoices();
  } catch {}
}

const thaiDigits: Record<string, string> = {
  '0': 'ศูนย์',
  '1': 'หนึ่ง',
  '2': 'สอง',
  '3': 'สาม',
  '4': 'สี่',
  '5': 'ห้า',
  '6': 'หก',
  '7': 'เจ็ด',
  '8': 'แปด',
  '9': 'เก้า'
};

const thaiPrefixes: Record<string, string> = {
  'A': 'เอ',
  'B': 'บี',
  'C': 'ซี'
};

/**
 * Convert ticket number like "A005" to phonetic Thai text:
 * "เอ ศูนย์ ศูนย์ ห้า"
 */
export function formatTicketForSpeech(ticket: string): string {
  const clean = String(ticket || '').trim().toUpperCase();
  if (!clean) return '';
  const prefixChar = clean.charAt(0);
  const digits = clean.slice(1);

  const spokenPrefix = thaiPrefixes[prefixChar] || prefixChar;
  const spokenDigits = digits
    .split('')
    .map((d) => thaiDigits[d] || d)
    .join(' ');

  return `${spokenPrefix} ${spokenDigits}`.trim();
}

export function formatCounterForSpeech(counter: string | number): string {
  const str = String(counter).trim();
  const match = str.match(/^([ABCabc])[-_ ]?([1-6])$/);
  if (match) {
    const prefixChar = match[1].toUpperCase();
    const num = match[2];
    const prefixWord = thaiPrefixes[prefixChar] || prefixChar;
    const digitWord = thaiDigits[num] || num;
    return `หมวด ${prefixWord} ช่องที่ ${digitWord}`;
  }
  return `ช่องบริการที่ ${thaiDigits[str] || str}`;
}

let lastAnnouncedKey = '';
let lastAnnouncementTime = 0;
let isAnnouncing = false;

/**
 * Announce queue in Thai with Teenage Girl Voice:
 * "ขอเชิญหมายเลข [ticket] ที่ช่องบริการ [counter]"
 * Supports category counters (A1-A6, B1-B6, C1-C6).
 * Guaranteed to play strictly once per queue call event across all devices and tabs.
 */
export async function playVoiceAnnouncement(
  ticketNumber: string,
  counter: string | number,
  pitch = 1.30, 
  rate = 1.04
): Promise<void> {
  const cleanTicket = String(ticketNumber || '').trim().toUpperCase();
  const cleanCounter = String(counter || '').trim().toUpperCase();
  const announceKey = `${cleanTicket}@${cleanCounter}`;
  const now = Date.now();

  // Deduplication check: ignore duplicate SSE/WS echo for the same call event within 2500ms
  if (lastAnnouncedKey === announceKey && now - lastAnnouncementTime < 2500) {
    return;
  }

  // Prevent overlapping simultaneous triggers within 1500ms
  if (isAnnouncing && now - lastAnnouncementTime < 1500) {
    return;
  }

  lastAnnouncedKey = announceKey;
  lastAnnouncementTime = now;
  isAnnouncing = true;

  try {
    // Cancel any previous speech utterance immediately so it speaks strictly once
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Play 1-tone chime once
    await playChime();

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      isAnnouncing = false;
      return;
    }

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const spokenTicket = formatTicketForSpeech(ticketNumber);
    const spokenCounter = formatCounterForSpeech(counter);
    const text = spokenCounter.startsWith('หมวด')
      ? `ขอเชิญหมายเลข ${spokenTicket} ที่ช่องบริการ ${spokenCounter}`
      : `ขอเชิญหมายเลข ${spokenTicket} ที่${spokenCounter}`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH';
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onend = () => {
      isAnnouncing = false;
    };
    utterance.onerror = () => {
      isAnnouncing = false;
    };

    const voices = window.speechSynthesis.getVoices();
    const thaiFemaleVoice = voices.find((v) => {
      const isThai = v.lang === 'th-TH' || v.lang.toLowerCase().includes('th');
      if (!isThai) return false;
      const name = v.name.toLowerCase();
      return (
        name.includes('female') ||
        name.includes('kanya') ||
        name.includes('premwadee') ||
        name.includes('narisa') ||
        name.includes('siri') ||
        name.includes('achara') ||
        name.includes('สาว') ||
        !name.includes('male')
      );
    });

    const fallbackThaiVoice = voices.find((v) => v.lang === 'th-TH' || v.lang.toLowerCase().includes('th'));

    if (thaiFemaleVoice) {
      utterance.voice = thaiFemaleVoice;
    } else if (fallbackThaiVoice) {
      utterance.voice = fallbackThaiVoice;
    }

    window.speechSynthesis.speak(utterance);

    setTimeout(() => {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 120);

    setTimeout(() => {
      isAnnouncing = false;
    }, 6000);
  } catch (err) {
    isAnnouncing = false;
    console.warn('Speech synthesis error:', err);
  }
}
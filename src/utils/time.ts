/**
 * Time formatting utilities to ensure queue times and dates always reflect
 * actual Thailand time (Asia/Bangkok, Buddhist Era) consistently across all devices.
 */

export const THAI_TIMEZONE = 'Asia/Bangkok';

export function getCanonicalThaiDate(dateOrTimestamp: Date | number = new Date()): string {
  const d = typeof dateOrTimestamp === 'number' ? new Date(dateOrTimestamp) : dateOrTimestamp;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('th-TH', {
    timeZone: THAI_TIMEZONE,
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  });
}

export function getCanonicalThaiTime(dateOrTimestamp: Date | number = new Date()): string {
  const d = typeof dateOrTimestamp === 'number' ? new Date(dateOrTimestamp) : dateOrTimestamp;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString('th-TH', {
    timeZone: THAI_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export function formatQueueTime(item?: { time: string; timestamp?: number } | null): string {
  if (!item) return '-';
  if (item.timestamp && !isNaN(item.timestamp)) {
    return getCanonicalThaiTime(item.timestamp);
  }
  return item.time || '-';
}

export function formatQueueDate(item?: { date: string; timestamp?: number } | null): string {
  if (!item) return '-';
  if (item.timestamp && !isNaN(item.timestamp)) {
    return getCanonicalThaiDate(item.timestamp);
  }
  return item.date || '-';
}

export function formatTimestampToTime(timestamp?: number | null): string {
  if (!timestamp || isNaN(timestamp)) return '-';
  return getCanonicalThaiTime(timestamp);
}

export interface RetrospectiveDayInfo {
  dateStr: string;
  label: string;
  shortLabel: string;
  daysAgo: number;
}

/**
 * Generates the 5-day retrospective period dates (Today + past 4 days = 5 days total)
 * in Thailand timezone (Asia/Bangkok).
 */
export function getLast5DaysRetrospective(): RetrospectiveDayInfo[] {
  const days: RetrospectiveDayInfo[] = [];
  const now = new Date();

  for (let i = 0; i < 5; i++) {
    const target = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = getCanonicalThaiDate(target);
    const label =
      i === 0
        ? `วันนี้ (${dateStr})`
        : i === 1
        ? `เมื่อวานนี้ (${dateStr})`
        : `ย้อนหลัง ${i} วัน (${dateStr})`;
    const shortLabel =
      i === 0
        ? `วันนี้ (${dateStr})`
        : i === 1
        ? `เมื่อวาน (${dateStr})`
        : `${dateStr}`;

    days.push({
      dateStr,
      label,
      shortLabel,
      daysAgo: i
    });
  }

  return days;
}

export type CategoryKey = 'EMP' | 'MIG' | 'CAR';

export interface ServiceCategory {
  id: CategoryKey;
  prefix: 'A' | 'B' | 'C';
  name: string;
  subTitle: string;
  desc: string;
  color: string;
  bgLight: string;
  badgeBg: string;
}

export type QueueStatus = 'waiting' | 'called' | 'completed' | 'skipped';

export interface QueueItem {
  id: string;
  ticketNumber: string;
  prefix: string;
  seqNumber: number;
  categoryKey: CategoryKey;
  categoryName: string;
  status: QueueStatus;
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
  current: string | null;
  ticketId?: string | null;
  status: 'ว่าง' | 'กำลังให้บริการ' | 'พักการให้บริการ';
  categoryKey?: CategoryKey | null;
  label?: string;
}

export interface CallHistoryItem {
  ticketNumber: string;
  counter: string | number;
  counterLabel?: string;
  time: string;
  category: string;
  timestamp: number;
}

export const CATEGORIES: Record<CategoryKey, ServiceCategory> = {
  EMP: {
    id: 'EMP',
    prefix: 'A',
    name: 'งานจัดหางานในประเทศ / งานจัดหางานต่างประเทศ',
    subTitle: 'ฝ่ายส่งเสริมการมีงานทำ',
    desc: 'สมัครงาน ขึ้นทะเบียนผู้ว่างงาน รายงานตัวกรณีว่างงาน และบริการไปทำงานต่างประเทศ',
    color: 'from-blue-600 to-indigo-700',
    bgLight: 'bg-blue-50 border-blue-200 text-blue-900',
    badgeBg: 'bg-blue-600 text-white'
  },
  MIG: {
    id: 'MIG',
    prefix: 'B',
    name: 'งานควบคุมการทำงานของคนต่างด้าว / งานตรวจสอบการทำงานของคนต่างด้าว',
    subTitle: 'ฝ่ายควบคุมการทำงานของคนต่างด้าว',
    desc: 'แจ้งเข้า-ออกจากงาน ยื่นคำขอใบอนุญาตทำงาน เปลี่ยนนายจ้าง และต่ออายุใบอนุญาต',
    color: 'from-amber-600 to-orange-700',
    bgLight: 'bg-amber-50 border-amber-200 text-amber-900',
    badgeBg: 'bg-amber-600 text-white'
  },
  CAR: {
    id: 'CAR',
    prefix: 'C',
    name: 'งานแนะแนวอาชีพ',
    subTitle: 'ฝ่ายส่งเสริมการมีงานทำ',
    desc: 'ส่งเสริมอาชีพให้ผู้สูงอายุ คนพิการ ผู้พ้นโทษ แนะแนวอาชีพ ส่งเสริมรับงานไปทำที่บ้าน',
    color: 'from-emerald-600 to-teal-700',
    bgLight: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    badgeBg: 'bg-emerald-600 text-white'
  }
};

export const COUNTERS_PER_CATEGORY = [1, 2, 3, 4, 5, 6];

export interface CategoryCounterInfo {
  id: string; // e.g. 'A1', 'B3', 'C2'
  num: number; // 1..6
  catKey: CategoryKey;
  prefix: 'A' | 'B' | 'C';
  label: string; // 'หมวด A ช่อง #1'
  shortLabel: string; // 'ช่อง A1'
}

export const CATEGORY_COUNTERS: Record<CategoryKey, CategoryCounterInfo[]> = {
  EMP: COUNTERS_PER_CATEGORY.map((num) => ({
    id: `A${num}`,
    num,
    catKey: 'EMP',
    prefix: 'A',
    label: `หมวด A ช่อง #${num}`,
    shortLabel: `ช่อง A${num}`
  })),
  MIG: COUNTERS_PER_CATEGORY.map((num) => ({
    id: `B${num}`,
    num,
    catKey: 'MIG',
    prefix: 'B',
    label: `หมวด B ช่อง #${num}`,
    shortLabel: `ช่อง B${num}`
  })),
  CAR: COUNTERS_PER_CATEGORY.map((num) => ({
    id: `C${num}`,
    num,
    catKey: 'CAR',
    prefix: 'C',
    label: `หมวด C ช่อง #${num}`,
    shortLabel: `ช่อง C${num}`
  }))
};

export const ALL_CATEGORY_COUNTERS: CategoryCounterInfo[] = [
  ...CATEGORY_COUNTERS.EMP,
  ...CATEGORY_COUNTERS.MIG,
  ...CATEGORY_COUNTERS.CAR
];

export const COUNTERS = [1, 2, 3, 4, 5, 6];

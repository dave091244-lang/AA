import React, { useState, useEffect } from 'react';
import { 
  CATEGORIES, 
  CategoryKey, 
  QueueItem, 
  CounterState, 
  COUNTERS_PER_CATEGORY 
} from '../types';
import { 
  Lock, 
  Volume2, 
  CheckCircle, 
  SkipForward, 
  LogOut, 
  Search, 
  Clock, 
  UserCheck, 
  Flame,
  ArrowRight,
  Layers,
  Building2,
  History
} from 'lucide-react';
import { formatQueueTime, formatQueueDate, formatTimestampToTime, getCanonicalThaiDate } from '../utils/time';

interface StaffDeskProps {
  queues: QueueItem[];
  countersState: Record<string, CounterState>;
  onCallQueue: (counterNum: string | number, catKey?: CategoryKey) => void;
  onRecallQueue: (ticketNumber: string, counterNum: string | number) => void;
  onCompleteQueue: (ticketId: string, counterNum: string | number) => void;
  onSkipQueue: (ticketId: string, counterNum: string | number) => void;
  onCallSpecificTicket: (ticketId: string, counterNum: string | number, catKey?: CategoryKey) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const StaffDesk: React.FC<StaffDeskProps> = ({
  queues,
  countersState,
  onCallQueue,
  onRecallQueue,
  onCompleteQueue,
  onSkipQueue,
  onCallSpecificTicket,
  showToast
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('suphan_staff_auth') === 'true';
  });
  const [password, setPassword] = useState('');
  
  // Category A, B, C & Counter 1-6 Selection
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('EMP');
  const [selectedCounterNum, setSelectedCounterNum] = useState<number>(1);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('EMP');
  const [listMode, setListMode] = useState<'waiting' | 'past'>('waiting');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const activePrefix = CATEGORIES[selectedCategory].prefix; // 'A' | 'B' | 'C'
  const selectedCounterId = `${activePrefix}${selectedCounterNum}`; // e.g. 'A1', 'B2', 'C1'
  const selectedCounterLabel = `หมวด ${activePrefix} ช่อง #${selectedCounterNum}`;

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '123456') {
      setIsLoggedIn(true);
      localStorage.setItem('suphan_staff_auth', 'true');
      showToast('เข้าสู่ระบบเจ้าหน้าที่สำเร็จ', 'success');
    } else {
      showToast('รหัสผ่านเจ้าหน้าที่ไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง', 'error');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('suphan_staff_auth');
    showToast('ออกจากระบบเจ้าหน้าที่แล้ว', 'info');
  };

  // Find currently active called ticket on this selected counter
  const activeTicket = countersState[selectedCounterId]?.ticketId
    ? queues.find(q => q.id === countersState[selectedCounterId]?.ticketId && q.status === 'called')
    : queues
        .filter(q => q.status === 'called' && (
          q.counter === selectedCounterId || 
          (q.categoryKey === selectedCategory && q.counter === selectedCounterNum)
        ))
        .sort((a, b) => (b.calledAt || b.timestamp) - (a.calledAt || a.timestamp))[0];

  // Elapsed timer for active ticket
  useEffect(() => {
    if (!activeTicket?.calledAt) {
      setElapsedSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      const diffSec = Math.floor((Date.now() - (activeTicket.calledAt || Date.now())) / 1000);
      setElapsedSeconds(diffSec);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTicket?.calledAt]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Filtered waiting list
  const waitingQueues = queues.filter(q => {
    if (q.status !== 'waiting') return false;
    if (categoryFilter !== 'ALL' && q.categoryKey !== categoryFilter) return false;
    if (searchFilter && !q.ticketNumber.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    return true;
  });

  // Past queue entries (completed, called, or skipped)
  const pastQueues = queues.filter(q => {
    if (q.status === 'waiting') return false;
    if (categoryFilter !== 'ALL' && q.categoryKey !== categoryFilter) return false;
    if (searchFilter && !q.ticketNumber.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    return true;
  });

  // Count tickets served by this counter today
  const todayStr = getCanonicalThaiDate();
  const servedTodayByCounter = queues.filter(
    q =>
      q.status === 'completed' &&
      formatQueueDate(q) === todayStr &&
      (q.counter === selectedCounterId ||
        (q.categoryKey === selectedCategory && q.counter === selectedCounterNum))
  ).length;

  // Waiting count in current category
  const waitingInSelectedCategory = queues.filter(
    q => q.status === 'waiting' && q.categoryKey === selectedCategory
  ).length;

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 shadow-2xl border border-slate-200">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-900 to-indigo-700 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 font-heading">
            เข้าสู่ระบบเจ้าหน้าที่
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            สำนักงานจัดหางานจังหวัดสุพรรณบุรี
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              รหัสผ่านเจ้าหน้าที่ (Staff PIN)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านเจ้าหน้าที่"
              className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-800 focus:outline-none text-base"
              autoFocus
              required
            />
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
              * สำหรับเจ้าหน้าที่สำนักงานจัดหางานจังหวัดสุพรรณบุรีเท่านั้น
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-900 hover:bg-blue-800 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
          >
            <span>เข้าสู่ระบบเคาน์เตอร์</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Top Counter Bar with Category Navigation & Counters 1-6 */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        
        {/* Step 1: Category Selection Tabs (A, B, C) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-900" />
              <span>เลือกหมวดหมู่งานบริการ:</span>
            </span>
          </div>

          {/* Category Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full sm:w-auto">
            {Object.entries(CATEGORIES).map(([key, cat]) => {
              const catKey = key as CategoryKey;
              const isCatSelected = selectedCategory === catKey;
              const waitingCount = queues.filter(q => q.status === 'waiting' && q.categoryKey === catKey).length;

              return (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedCategory(catKey);
                    setCategoryFilter(catKey);
                  }}
                  className={`px-3 py-2 rounded-xl text-left font-bold transition flex items-center justify-between gap-2 border text-xs sm:text-sm ${
                    isCatSelected
                      ? 'bg-blue-900 text-white border-blue-900 shadow-sm ring-2 ring-amber-400'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-black ${
                      isCatSelected ? 'bg-amber-400 text-blue-950' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {cat.prefix}
                    </span>
                    <span className="truncate">{cat.name.split('/')[0]}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isCatSelected ? 'bg-blue-800 text-amber-300' : 'bg-slate-200 text-slate-600'
                  }`}>
                    รอ {waitingCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Counters 1 to 6 in the selected category */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider mr-2">
              ช่องบริการหมวด {activePrefix} (1–6):
            </span>
            <div className="grid grid-cols-6 gap-1.5 w-full sm:w-auto">
              {COUNTERS_PER_CATEGORY.map((num) => {
                const counterId = `${activePrefix}${num}`;
                const cState = countersState[counterId];
                const isServing = Boolean(cState?.current);
                const isSelected = selectedCounterNum === num;

                return (
                  <button
                    key={num}
                    onClick={() => setSelectedCounterNum(num)}
                    className={`h-12 sm:w-20 rounded-xl font-bold transition flex flex-col items-center justify-center relative text-xs sm:text-sm ${
                      isSelected
                        ? 'bg-blue-950 text-white shadow-md ring-2 ring-amber-400'
                        : isServing
                        ? 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 font-mono">หมวด {activePrefix}</span>
                    <span className="font-black text-sm">ช่อง #{num}</span>
                    {isServing && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute top-1.5 right-1.5 animate-pulse" title="กำลังให้บริการ"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Active Counter Info Badge & Logout */}
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-emerald-100 text-emerald-900 px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border border-emerald-200">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{selectedCounterLabel} ({selectedCounterId})</span>
              </span>
              <span className="hidden lg:inline text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-xl">
                บริการแล้ววันนี้: <strong className="text-slate-800">{servedTodayByCounter}</strong> คิว
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl border border-red-200 transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ออก</span>
            </button>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Call Actions & Active Ticket Control (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active Serving Card */}
          <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-200 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>คิวที่กำลังให้บริการ ({selectedCounterLabel})</span>
              </span>
              {activeTicket && (
                <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" /> {formatTimer(elapsedSeconds)}
                </span>
              )}
            </div>

            {activeTicket ? (
              <div className="space-y-4 text-center">
                <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-6 rounded-2xl shadow-inner relative">
                  <span className="text-xs text-blue-200 block mb-1">
                    {activeTicket.categoryName}
                  </span>
                  <div className="text-5xl sm:text-6xl font-black font-mono tracking-wider text-amber-400">
                    {activeTicket.ticketNumber}
                  </div>
                  <div className="text-[11px] text-blue-300 mt-2">
                    เริ่มเรียกเมื่อ {formatTimestampToTime(activeTicket.calledAt || activeTicket.timestamp)} น.
                  </div>
                </div>

                {/* Serving Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button
                    onClick={() => onRecallQueue(activeTicket.ticketNumber, selectedCounterId)}
                    className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold py-3 px-2 rounded-xl text-xs sm:text-sm shadow transition flex flex-col sm:flex-row items-center justify-center gap-1"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>เรียกซ้ำ</span>
                  </button>

                  <button
                    onClick={() => onCompleteQueue(activeTicket.id, selectedCounterId)}
                    className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold py-3 px-2 rounded-xl text-xs sm:text-sm shadow transition flex flex-col sm:flex-row items-center justify-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>เสร็จสิ้น</span>
                  </button>

                  <button
                    onClick={() => onSkipQueue(activeTicket.id, selectedCounterId)}
                    className="bg-slate-200 hover:bg-red-100 hover:text-red-700 active:scale-95 text-slate-700 font-bold py-3 px-2 rounded-xl text-xs sm:text-sm transition flex flex-col sm:flex-row items-center justify-center gap-1"
                  >
                    <SkipForward className="w-4 h-4" />
                    <span>ข้ามคิว</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                  <UserCheck className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium">ยังไม่มีคิวที่กำลังให้บริการ</p>
                <p className="text-xs text-slate-400">กดปุ่ม "เรียกคิวถัดไป หมวด {activePrefix}" ด้านล่างเพื่อเริ่มให้บริการ</p>
              </div>
            )}
          </div>

          {/* Call Next Action Panel */}
          <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 font-heading text-base flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-blue-900" />
              <span>ปุ่มเรียกคิว ({selectedCounterLabel})</span>
            </h3>

            {/* Giant Call Next in Current Category Button */}
            <button
              onClick={() => onCallQueue(selectedCounterId, selectedCategory)}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-[0.98] text-white font-black py-4 px-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 text-lg sm:text-xl font-heading"
            >
              <Volume2 className="w-7 h-7 text-amber-300 animate-pulse" />
              <span>เรียกคิวถัดไป หมวด {activePrefix} ({waitingInSelectedCategory} คิวรอ)</span>
            </button>

            {/* Category-Specific Call Buttons */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                หรือเรียกเฉพาะหมวดหมู่อื่นเข้าช่องนี้:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {Object.entries(CATEGORIES).map(([key, cat]) => {
                  const catKey = key as CategoryKey;
                  const countInCat = queues.filter(
                    q => q.categoryKey === catKey && q.status === 'waiting'
                  ).length;

                  return (
                    <button
                      key={key}
                      onClick={() => onCallQueue(selectedCounterId, catKey)}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        selectedCategory === catKey
                          ? 'bg-blue-100/70 border-blue-300 text-blue-950 font-semibold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-blue-900 text-sm">
                          หมวด {cat.prefix}
                        </span>
                        <span className="text-[10px] font-bold bg-white text-blue-950 px-1.5 py-0.5 rounded-full border border-slate-200">
                          {countInCat}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-600 truncate mt-1">
                        {cat.name.split('/')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Live Waiting Queue Table (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl shadow-md border border-slate-200 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              {/* Tab Switcher: Waiting Queues vs Past Queue Entries */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
                <button
                  onClick={() => setListMode('waiting')}
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                    listMode === 'waiting'
                      ? 'bg-blue-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>รอรับบริการ ({waitingQueues.length})</span>
                </button>

                <button
                  onClick={() => setListMode('past')}
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                    listMode === 'past'
                      ? 'bg-blue-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <History className="w-4 h-4 text-emerald-400" />
                  <span>ประวัติคิวที่ผ่านมา ({pastQueues.length})</span>
                </button>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setCategoryFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    categoryFilter === 'ALL' ? 'bg-white text-blue-950 font-bold shadow-xs' : 'text-slate-600'
                  }`}
                >
                  ทั้งหมด
                </button>
                {Object.entries(CATEGORIES).map(([k, cat]) => (
                  <button
                    key={k}
                    onClick={() => setCategoryFilter(k)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition ${
                      categoryFilter === k ? 'bg-white text-blue-950 font-bold shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    หมวด {cat.prefix}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder={
                  listMode === 'waiting'
                    ? 'ค้นหาคิวรอ เช่น A001, B002, C001...'
                    : 'ค้นหาประวัติคิวที่ผ่านมา เช่น หมายเลขคิว หรือช่องบริการ...'
                }
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-[440px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 z-10">
                  {listMode === 'waiting' ? (
                    <tr>
                      <th className="py-3 px-4">เลขคิว</th>
                      <th className="py-3 px-4">ประเภทบริการ</th>
                      <th className="py-3 px-4">เวลากดคิว</th>
                      <th className="py-3 px-4 text-right">ดำเนินการ</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="py-3 px-4">เลขคิว</th>
                      <th className="py-3 px-4">บริการ / ช่อง</th>
                      <th className="py-3 px-4">เวลาเรียก / เสร็จสิ้น</th>
                      <th className="py-3 px-4">สถานะ</th>
                      <th className="py-3 px-4 text-right">เรียกซ้ำ</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {listMode === 'waiting' ? (
                    waitingQueues.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-400">
                          ไม่มีคิวรอรับบริการในหมวดนี้
                        </td>
                      </tr>
                    ) : (
                      waitingQueues.map((q, idx) => (
                        <tr key={q.id} className="hover:bg-blue-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-black text-blue-950 text-sm font-mono">
                              {q.ticketNumber}
                            </span>
                            {idx === 0 && (
                              <span className="ml-2 bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                คิวแรก
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            <span className="font-medium text-slate-800">{q.categoryName}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono">
                            {formatQueueTime(q)} น.
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => onCallSpecificTicket(q.id, selectedCounterId, q.categoryKey)}
                              className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] transition inline-flex items-center gap-1 shadow-sm"
                            >
                              <Volume2 className="w-3 h-3" />
                              <span>เรียกเข้า {selectedCounterId}</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )
                  ) : (
                    /* Past Queue Entries List */
                    pastQueues.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          ยังไม่มีประวัติคิวที่เคยให้บริการในหมวดนี้
                        </td>
                      </tr>
                    ) : (
                      pastQueues.map((q) => (
                        <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-black text-blue-950 text-sm font-mono">
                              {q.ticketNumber}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-mono">
                              {formatQueueDate(q)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-800 block truncate max-w-[150px]">
                              {q.categoryName}
                            </span>
                            <span className="text-[10px] text-blue-900 font-bold">
                              {q.counterLabel || (q.counter ? `ช่อง #${q.counter}` : '-')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[11px] font-mono text-slate-600">
                            <div>เรียก: {q.calledAt ? `${formatTimestampToTime(q.calledAt)} น.` : '-'}</div>
                            <div>เสร็จ: {q.completedAt ? `${formatTimestampToTime(q.completedAt)} น.` : '-'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              q.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : q.status === 'called'
                                ? 'bg-blue-100 text-blue-800 animate-pulse'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {q.status === 'completed' ? 'เสร็จสิ้น' : q.status === 'called' ? 'กำลังรับบริการ' : 'ข้ามคิว'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => onRecallQueue(q.ticketNumber, selectedCounterId)}
                              className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-2.5 py-1 rounded-lg text-[11px] transition inline-flex items-center gap-1 border border-amber-300"
                              title={`เรียกซ้ำคิว ${q.ticketNumber} เข้า ${selectedCounterId}`}
                            >
                              <Volume2 className="w-3 h-3 text-amber-700" />
                              <span>เรียกซ้ำ</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>

          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>* เสียงประกาศภาษาไทยจะเล่นอัตโนมัติ 1 ครั้งเมื่อกดเรียก</span>
            <span>สำนักงานจัดหางานจังหวัดสุพรรณบุรี</span>
          </div>

        </div>

      </div>

    </div>
  );
};

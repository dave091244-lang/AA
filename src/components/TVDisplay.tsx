import React, { useState, useEffect, useRef } from 'react';
import { 
  QueueItem, 
  CounterState, 
  CallHistoryItem, 
  CATEGORIES,
  CategoryKey,
  COUNTERS_PER_CATEGORY 
} from '../types';
import { 
  Building2, 
  Maximize, 
  Minimize, 
  Volume2, 
  VolumeX, 
  Clock, 
  Calendar,
  Sparkles,
  Radio,
  QrCode,
  Monitor,
  ZoomIn,
  ZoomOut,
  Layers
} from 'lucide-react';
import { initAudioContext, playChime } from '../utils/audio';
import { formatQueueTime } from '../utils/time';
import { DoeLogo } from './DoeLogo';

interface TVDisplayProps {
  queues: QueueItem[];
  countersState: Record<string, CounterState>;
  calledHistory: CallHistoryItem[];
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  onlineDevicesCount: number;
  onOpenConnectModal: () => void;
}

export const TVDisplay: React.FC<TVDisplayProps> = ({
  queues,
  countersState,
  calledHistory,
  soundEnabled,
  setSoundEnabled,
  onlineDevicesCount,
  onOpenConnectModal
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [is22InchMode, setIs22InchMode] = useState(true); // Default to 22-inch optimized layout
  const [scaleFactor, setScaleFactor] = useState<number>(1);
  const [categoryViewTab, setCategoryViewTab] = useState<'ALL' | CategoryKey>('ALL');
  const containerRef = useRef<HTMLDivElement>(null);

  // Live Clock Tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current) {
        containerRef.current.requestFullscreen().catch(() => {
          document.documentElement.requestFullscreen().catch(() => {});
        });
      } else {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Thai Date formatting with Buddhist Era (B.E. = year + 543)
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const thaiDays = [
    'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'
  ];

  const dayName = thaiDays[currentTime.getDay()];
  const dateNum = currentTime.getDate();
  const monthName = thaiMonths[currentTime.getMonth()];
  const thaiYear = currentTime.getFullYear() + 543;

  const thaiDateFormatted = `${dayName}ที่ ${dateNum} ${monthName} พ.ศ. ${thaiYear}`;
  const thaiTimeFormatted = currentTime.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Most recent called ticket
  const activeCalledQueues = queues.filter(q => q.status === 'called');
  const latestCalled = activeCalledQueues.sort((a, b) => (b.calledAt || 0) - (a.calledAt || 0))[0] || null;

  return (
    <div
      ref={containerRef}
      className={`bg-slate-950 text-white shadow-2xl flex flex-col justify-between border-2 border-blue-900/60 relative overflow-hidden transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none w-screen h-screen p-4 lg:p-6 cursor-default'
          : is22InchMode
          ? 'w-full max-w-[1680px] mx-auto h-[calc(100vh-5.25rem)] min-h-[580px] rounded-3xl p-3.5 sm:p-5 lg:p-5'
          : 'w-full min-h-[80vh] rounded-3xl p-4 sm:p-6'
      }`}
      style={scaleFactor !== 1 ? { transform: `scale(${scaleFactor})`, transformOrigin: 'top center' } : {}}
    >
      
      {/* Background Decorative Accents */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header Bar (Proportionally optimized for 22-inch display) */}
      <div className="flex flex-col md:flex-row justify-between items-center pb-3 border-b border-slate-800/80 gap-2.5 relative z-10 shrink-0">
        
        {/* Left: Department Official Emblem & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 lg:w-13 lg:h-13 bg-white/10 rounded-2xl flex items-center justify-center font-black shadow-lg border border-amber-400/40 shrink-0 p-1 backdrop-blur-xs">
            <DoeLogo className="w-10 h-10 lg:w-11 lg:h-11 drop-shadow-md" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-900/90 text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded border border-blue-700">
                กรมการจัดหางาน
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                <Radio className="w-2.5 h-2.5 animate-pulse" /> ซิงค์สด ({onlineDevicesCount} เครื่อง)
              </span>
            </div>
            <h1 className="text-base sm:text-xl lg:text-2xl font-black font-heading text-white tracking-tight flex items-center gap-2">
              <span>สำนักงานจัดหางานจังหวัดสุพรรณบุรี</span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              ระบบแสดงผลบัตรคิวบริการประชาชน 3 หมวดงาน (หมวด A, B, C ช่องบริการ 1–6)
            </p>
          </div>
        </div>

        {/* Center: Live Date & Clock */}
        <div className="flex items-center gap-2 sm:gap-3 bg-slate-900/90 px-3.5 sm:px-4 py-2 rounded-2xl border border-slate-800 text-center shadow-inner">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-300 font-medium">
            <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="hidden sm:inline font-mono">{thaiDateFormatted}</span>
            <span className="sm:hidden font-mono">{dateNum}/{currentTime.getMonth()+1}/{thaiYear}</span>
          </div>
          <div className="h-4 w-px bg-slate-700"></div>
          <div className="flex items-center gap-1.5 text-base sm:text-xl lg:text-2xl font-black font-mono text-amber-400 tracking-wider">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{thaiTimeFormatted}</span>
          </div>
        </div>

        {/* Right Controls: 22" Scale Toggle, Audio, QR, Fullscreen */}
        <div className="flex items-center space-x-1.5 shrink-0">
          
          {/* Zoom scale for small/large wall TVs */}
          <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => setScaleFactor(prev => Math.max(0.85, Number((prev - 0.05).toFixed(2))))}
              className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition"
              title="ลดขนาดตัวอักษร"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] font-mono px-1.5 text-slate-400">
              {Math.round(scaleFactor * 100)}%
            </span>
            <button
              onClick={() => setScaleFactor(prev => Math.min(1.25, Number((prev + 0.05).toFixed(2))))}
              className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition"
              title="เพิ่มขนาดตัวอักษร"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={onOpenConnectModal}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl border border-amber-500/40 transition flex items-center gap-1 text-xs font-bold"
            title="สแกน QR เพื่อเปิดบนมือถือ"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">QR</span>
          </button>

          <button
            onClick={() => {
              initAudioContext();
              playChime();
              setSoundEnabled(!soundEnabled);
            }}
            className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-bold ${
              soundEnabled
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                : 'bg-red-950/80 text-red-300 border-red-700 hover:bg-red-900'
            }`}
            title="เปิด/ปิดเสียงประกาศ"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" /> : <VolumeX className="w-4 h-4 text-red-400" />}
            <span className="hidden sm:inline">{soundEnabled ? 'เปิดเสียง' : 'ปิดเสียง'}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl border border-blue-700 shadow-md transition flex items-center gap-1 text-xs font-bold"
            title="แสดงเต็มหน้าจอ 22 นิ้ว (Fullscreen F11)"
          >
            {isFullscreen ? <Minimize className="w-4 h-4 text-amber-400" /> : <Maximize className="w-4 h-4 text-amber-400" />}
            <span className="hidden sm:inline">{isFullscreen ? 'ย่อ' : 'เต็มจอ'}</span>
          </button>
        </div>

      </div>

      {/* Main Display Area (2 Columns - Perfectly proportioned for 22-inch Screen) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 my-3 flex-1 min-h-0 items-stretch relative z-10 overflow-hidden">
        
        {/* Left Column: Big Calling Screen (6 cols) */}
        <div className="lg:col-span-6 bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 border-2 border-amber-400/90 rounded-2xl p-4 sm:p-5 lg:p-6 flex flex-col justify-between items-center text-center shadow-xl relative overflow-hidden">
          
          <div className="w-full flex items-center justify-between shrink-0">
            <div className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 font-black px-3.5 py-1 rounded-full text-xs tracking-wide shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>กำลังเรียกขาน (CURRENT CALL)</span>
            </div>
            <span className="text-[11px] text-blue-200">
              โปรดสังเกตหมายเลขและช่องบริการ
            </span>
          </div>

          {latestCalled ? (
            <div className="space-y-4 my-auto py-2 flex flex-col items-center justify-center">
              {/* Massive Ticket Number - Crisp and balanced for 22" (No overflow) */}
              <div className="text-7xl sm:text-8xl lg:text-8xl font-black text-amber-400 font-mono tracking-wider drop-shadow-[0_12px_24px_rgba(245,158,11,0.35)] animate-pulse-slow leading-none">
                {latestCalled.ticketNumber}
              </div>

              {/* Service Counter Target Banner with Category and Counter */}
              <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 border-2 border-amber-300 py-3 px-6 sm:px-8 rounded-2xl shadow-xl">
                <span className="text-white text-base sm:text-lg lg:text-xl font-bold font-heading mr-2.5">
                  เชิญที่ช่องบริการ
                </span>
                <span className="text-amber-300 text-3xl sm:text-4xl lg:text-5xl font-black font-mono">
                  {latestCalled.counterLabel || (latestCalled.counter ? `ช่อง ${latestCalled.counter}` : '')}
                </span>
              </div>

              {/* Service Category */}
              <div className="text-slate-200 text-sm sm:text-base font-medium tracking-wide max-w-md">
                {latestCalled.categoryName}
              </div>
            </div>
          ) : (
            <div className="my-auto py-8 text-center text-slate-400 space-y-2">
              <div className="w-13 h-13 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-amber-400/70">
                <Clock className="w-7 h-7" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-300 font-heading">
                โปรดรอเรียกคิวสักครู่...
              </p>
              <p className="text-xs text-slate-500">
                เมื่อเจ้าหน้าที่กดเรียกคิว หน้าจอจะแสดงหมายเลขและประกาศเสียงภาษาไทยทันที
              </p>
            </div>
          )}

          <div className="w-full flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 shrink-0">
            <span>สำนักงานจัดหางานจังหวัดสุพรรณบุรี • กรมการจัดหางาน</span>
            <span className="text-amber-400/90 font-medium hidden sm:inline">© Wissanu Khammarun</span>
          </div>

        </div>

        {/* Right Column: Divided Counters Matrix - Category A, B, C (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 lg:p-4 flex flex-col justify-between shadow-xl overflow-hidden">
          <div className="flex-1 flex flex-col justify-between overflow-y-auto">
            
            {/* Header with Category Filter Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 mb-2 gap-2 shrink-0">
              <h3 className="text-xs sm:text-sm font-bold text-amber-400 font-heading flex items-center gap-1.5">
                <Monitor className="w-4 h-4" />
                <span>สถานะช่องบริการแยกตามหมวด (Category A, B, C)</span>
              </h3>
              
              {/* Category Tab Filter */}
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg text-[11px] border border-slate-800">
                <button
                  onClick={() => setCategoryViewTab('ALL')}
                  className={`px-2 py-0.5 rounded font-bold transition ${
                    categoryViewTab === 'ALL'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ทั้งหมด
                </button>
                {Object.entries(CATEGORIES).map(([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => setCategoryViewTab(key as CategoryKey)}
                    className={`px-2 py-0.5 rounded font-bold transition ${
                      categoryViewTab === key
                        ? 'bg-blue-900 text-amber-300 shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    หมวด {cat.prefix}
                  </button>
                ))}
              </div>
            </div>

            {/* Displaying Categories A, B, C */}
            <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
              {Object.entries(CATEGORIES)
                .filter(([key]) => categoryViewTab === 'ALL' || categoryViewTab === key)
                .map(([key, cat]) => {
                  const prefix = cat.prefix;
                  const waitingCount = queues.filter(q => q.status === 'waiting' && q.categoryKey === key).length;

                  return (
                    <div key={key} className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800">
                      {/* Category Header */}
                      <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-800/60">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-blue-900 text-amber-400 font-black text-xs flex items-center justify-center border border-blue-700">
                            {prefix}
                          </span>
                          <span className="text-xs font-bold text-slate-200">
                            หมวด {prefix}: {cat.name.split('/')[0]}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-950/50 border border-amber-800 px-2 py-0.2 rounded-full">
                          รอ {waitingCount} คิว
                        </span>
                      </div>

                      {/* Counters 1 to 6 Grid */}
                      <div className="grid grid-cols-6 gap-1.5">
                        {COUNTERS_PER_CATEGORY.map((num) => {
                          const counterId = `${prefix}${num}`;
                          const cState = countersState[counterId];
                          const hasTicket = Boolean(cState?.current);

                          return (
                            <div
                              key={num}
                              className={`rounded-lg p-1.5 text-center transition-all flex flex-col justify-between border ${
                                hasTicket
                                  ? 'bg-gradient-to-b from-blue-950 to-slate-900 border-amber-400/80 shadow-md ring-1 ring-amber-400/40'
                                  : 'bg-slate-900/60 border-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold mb-0.5">
                                <span className={hasTicket ? 'text-amber-300 font-black' : 'text-slate-400'}>
                                  {prefix}{num}
                                </span>
                                <span className={`w-1.5 h-1.5 rounded-full ${hasTicket ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`}></span>
                              </div>

                              <div className="text-base sm:text-lg font-black font-mono text-amber-300 my-0.5 tracking-tight leading-tight">
                                {cState?.current || '-'}
                              </div>

                              <div className={`text-[8.5px] font-bold px-1 py-0.2 rounded truncate ${
                                hasTicket
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-slate-800/80 text-slate-500'
                              }`}>
                                {hasTicket ? 'บริการ' : 'ว่าง'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>

          </div>

          {/* Footer of Right Column */}
          <div className="mt-2.5 p-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
            <span>คิวรอรับบริการรวมทุกหมวด:</span>
            <span className="font-bold text-amber-400 font-mono text-sm">
              {queues.filter(q => q.status === 'waiting').length} คิว
            </span>
          </div>

        </div>

      </div>

      {/* Bottom Recent Called Ticker Bar with Creator Copyright in Bottom-Right Corner */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 relative z-10 shrink-0">
        <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-hidden">
          <div className="bg-amber-400 text-blue-950 font-black px-3 py-1 rounded-lg text-xs uppercase tracking-wider shrink-0 flex items-center gap-1 shadow-sm">
            <span>ประวัติเรียกคิวล่าสุด</span>
          </div>

          <div className="flex gap-2.5 overflow-x-auto w-full py-0.5 scrollbar-none items-center">
            {calledHistory.length === 0 ? (
              <span className="text-xs text-slate-500 italic">
                ยังไม่มีประวัติการเรียกคิววันนี้
              </span>
            ) : (
              calledHistory.map((h, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 px-3 py-1 rounded-lg flex items-center gap-2 shrink-0 shadow-xs"
                >
                  <span className="font-black text-amber-400 text-sm font-mono">
                    {h.ticketNumber}
                  </span>
                  <span className="text-xs text-slate-300 font-medium">
                    {h.counterLabel || `ช่อง #${h.counter}`}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({formatQueueTime(h)})
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Creator Copyright in bottom-right corner */}
        <div className="shrink-0 text-center sm:text-right border-t sm:border-t-0 sm:border-l border-slate-800 pt-1.5 sm:pt-0 sm:pl-3 w-full sm:w-auto">
          <div className="text-[11px] text-slate-400 whitespace-nowrap">
            © พัฒนาโดย <strong className="text-amber-400 font-bold">Wissanu Khammarun</strong>
          </div>
        </div>
      </div>

    </div>
  );
};

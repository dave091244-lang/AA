import React, { useState } from 'react';
import { 
  CATEGORIES, 
  CategoryKey, 
  QueueItem, 
  CounterState 
} from '../types';
import { 
  Ticket, 
  Clock, 
  Printer, 
  RotateCcw, 
  Building, 
  BellRing, 
  ChevronRight,
  Info,
  QrCode,
  Smartphone,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  History
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { formatQueueTime, formatQueueDate, formatTimestampToTime } from '../utils/time';
import { printTicketThermal } from '../utils/print';
import { DoeLogo } from './DoeLogo';

interface ServiceSeekerProps {
  queues: QueueItem[];
  countersState: Record<string, CounterState>;
  onIssueTicket: (catKey: CategoryKey) => void;
  activeTicket: QueueItem | null;
  onClearActiveTicket: () => void;
  onOpenConnectModal: () => void;
}

export const ServiceSeeker: React.FC<ServiceSeekerProps> = ({
  queues,
  onIssueTicket,
  activeTicket,
  onClearActiveTicket,
  onOpenConnectModal
}) => {
  // Find the latest state of user's active ticket
  const currentTicketStatus = activeTicket
    ? queues.find(q => q.id === activeTicket.id) || activeTicket
    : null;

  // Queues ahead of current ticket in same category
  const queuesAhead = currentTicketStatus && currentTicketStatus.status === 'waiting'
    ? queues.filter(
        q => q.categoryKey === currentTicketStatus.categoryKey && 
             q.status === 'waiting' && 
             q.timestamp < currentTicketStatus.timestamp
      ).length
    : 0;

  const estimatedWaitMin = Math.max(3, queuesAhead * 4);

  // State for citizen past/current queue lookup
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<QueueItem | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showLookupBox, setShowLookupBox] = useState(false);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = lookupQuery.trim().toUpperCase();
    if (!clean) return;
    const found = queues.find(
      q => q.ticketNumber.toUpperCase() === clean || q.id.toUpperCase() === clean
    );
    setLookupResult(found || null);
    setHasSearched(true);
  };

  const handleClearLookup = () => {
    setLookupQuery('');
    setLookupResult(null);
    setHasSearched(false);
  };

  const handlePrint = () => {
    if (currentTicketStatus) {
      printTicketThermal(currentTicketStatus, queuesAhead, estimatedWaitMin);
    } else {
      window.print();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 p-6 sm:p-8 text-white shadow-2xl border border-blue-800">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 bg-amber-400 text-blue-950 px-3 py-1 rounded-full text-xs font-bold shadow">
              <Ticket className="w-3.5 h-3.5" />
              <span>ตู้รับบัตรคิวอัตโนมัติ (Queue Kiosk)</span>
            </span>
            <button
              onClick={onOpenConnectModal}
              className="inline-flex items-center gap-1.5 bg-blue-800/80 hover:bg-blue-700 text-amber-300 px-3 py-1 rounded-full text-xs font-semibold border border-blue-600 transition"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>เปิดบนมือถือของท่าน</span>
            </button>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight mb-2">
            ยินดีต้อนรับผู้มาติดต่อราชการ
          </h2>
          <p className="text-blue-200 text-sm sm:text-base max-w-2xl font-light">
            สำนักงานจัดหางานจังหวัดสุพรรณบุรี กรมการจัดหางาน กระทรวงแรงงาน
            <br className="hidden sm:inline" /> กรุณาเลือกประเภทงานบริการที่ท่านต้องการติดต่อเพื่อรับบัตรคิว
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-8 translate-y-8">
          <Building className="w-72 h-72 text-white" />
        </div>
      </div>

      {/* Citizen Past/Current Queue Ticket Lookup Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center font-bold shrink-0">
              <Search className="w-5 h-5 text-blue-800" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 font-heading">
                ตรวจสอบและค้นหาประวัติบัตรคิวของท่าน
              </h4>
              <p className="text-xs text-slate-500">
                กรอกหมายเลขคิว (เช่น A001, B002, C001) เพื่อดูสถานะ ประวัติการรับบริการ หรือพิมพ์บัตรคิวซ้ำ
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowLookupBox(!showLookupBox)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 font-semibold text-xs transition flex items-center gap-1.5 border border-blue-200 shrink-0 cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
            <span>{showLookupBox ? 'ซ่อนการค้นหา' : 'ค้นหาประวัติคิว'}</span>
          </button>
        </div>

        {/* Collapsible search form & result */}
        {showLookupBox && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
            <form onSubmit={handleLookup} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="กรอกหมายเลขคิว เช่น A001, B002..."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-800 focus:outline-none uppercase font-mono font-bold tracking-wide"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition shadow-sm cursor-pointer"
              >
                ค้นหา
              </button>
              {(lookupQuery || hasSearched) && (
                <button
                  type="button"
                  onClick={handleClearLookup}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  ล้าง
                </button>
              )}
            </form>

            {/* Result display */}
            {hasSearched && (
              lookupResult ? (
                <div className="bg-slate-50 rounded-2xl p-4 border border-blue-200 animate-in fade-in space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black font-mono text-blue-950">
                        {lookupResult.ticketNumber}
                      </span>
                      <span className="text-xs font-semibold text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded-full">
                        {lookupResult.categoryName}
                      </span>
                    </div>

                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      lookupResult.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : lookupResult.status === 'called'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300 animate-pulse'
                        : lookupResult.status === 'waiting'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-300'
                    }`}>
                      {lookupResult.status === 'waiting' ? '⏳ รอเรียกรับบริการ' :
                       lookupResult.status === 'called' ? '📢 กำลังรับบริการ' :
                       lookupResult.status === 'completed' ? '✅ เสร็จสิ้นบริการแล้ว' : '❌ ข้ามคิว'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">ช่องบริการที่เรียก</span>
                      <span className="font-bold text-slate-800 text-xs">
                        {lookupResult.counterLabel || (lookupResult.counter ? `ช่อง #${lookupResult.counter}` : '-')}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">เวลากดรับบัตร</span>
                      <span className="font-semibold text-slate-800 text-xs">
                        {formatQueueTime(lookupResult)} น.
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">เวลาเริ่มเรียกคิว</span>
                      <span className="font-semibold text-slate-800 text-xs">
                        {lookupResult.calledAt ? `${formatTimestampToTime(lookupResult.calledAt)} น.` : '-'}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">เวลาเสร็จสิ้น</span>
                      <span className="font-semibold text-slate-800 text-xs">
                        {lookupResult.completedAt ? `${formatTimestampToTime(lookupResult.completedAt)} น.` : '-'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => printTicketThermal(lookupResult)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>พิมพ์บัตรคิวนี้ (Thermal Slip)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-xs text-center">
                  ไม่พบข้อมูลคิว <strong>"{lookupQuery.toUpperCase()}"</strong> ในระบบ กรุณาตรวจสอบหมายเลขคิวอีกครั้ง
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Main Choice or Ticket View */}
      {!currentTicketStatus || currentTicketStatus.status === 'completed' || currentTicketStatus.status === 'skipped' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 font-heading">
              เลือกประเภทงานบริการ (Service Category)
            </h3>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-blue-600" /> กดปุ่มเพื่อรับบัตรคิวทันที
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {Object.entries(CATEGORIES).map(([key, cat]) => {
              const catKey = key as CategoryKey;
              const waitingInCat = queues.filter(
                q => q.categoryKey === catKey && q.status === 'waiting'
              ).length;

              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 hover:shadow-xl hover:border-blue-400 transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-800 text-amber-400 flex items-center justify-center font-black text-2xl shadow-md border border-blue-700">
                        {cat.prefix}
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        รอรับบริการ {waitingInCat} คิว
                      </span>
                    </div>

                    <h4 className="font-bold text-lg text-slate-900 mb-1 font-heading group-hover:text-blue-900 transition-colors">
                      {cat.name}
                    </h4>
                    <p className="text-xs text-blue-800 font-medium mb-3">
                      {cat.subTitle}
                    </p>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6">
                      {cat.desc}
                    </p>
                  </div>

                  <button
                    onClick={() => onIssueTicket(catKey)}
                    className="w-full bg-blue-900 hover:bg-blue-800 active:scale-[0.98] text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group-hover:bg-amber-500 group-hover:text-blue-950"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>รับบัตรคิว หมวด {cat.prefix}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Real-time Ticket Status Card (Thermal Slip Format) */
        <div className="space-y-6">
          <div className="max-w-md mx-auto">
            {/* Status Alert Badge */}
            {currentTicketStatus.status === 'called' ? (
              <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg font-bold text-center mb-4 animate-bounce flex items-center justify-center gap-2">
                <BellRing className="w-6 h-6 animate-spin" />
                <span className="text-lg">ถึงคิวของท่านแล้ว! เชิญที่{currentTicketStatus.counterLabel || (currentTicketStatus.counter ? `ช่องบริการ #${currentTicketStatus.counter}` : 'ช่องบริการ')}</span>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded-2xl text-center text-sm font-medium mb-4 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>กรุณานั่งรอเรียกคิว ณ จุดพักคอย จอแสดงผลจะประกาศเมื่อถึงคิวท่าน</span>
              </div>
            )}

            {/* Thermal Ticket Container (Printable) */}
            <div 
              id="printable-ticket" 
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-slate-200 text-slate-900 relative"
            >
              <div className="text-center pb-4 border-b border-dashed border-slate-300">
                <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                  <DoeLogo className="w-16 h-16 drop-shadow-sm" />
                </div>
                <h3 className="font-bold text-base text-slate-900 font-heading">
                  สำนักงานจัดหางานจังหวัดสุพรรณบุรี
                </h3>
                <p className="text-[11px] text-slate-500">
                  กรมการจัดหางาน กระทรวงแรงงาน
                </p>
                <div className="mt-2 text-xs font-semibold text-blue-800 bg-blue-50 py-1 px-3 rounded-full inline-block">
                  {currentTicketStatus.categoryName}
                </div>
              </div>

              {/* Huge Ticket Code */}
              <div className="text-center py-6">
                <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                  หมายเลขคิวของท่าน (Ticket Number)
                </span>
                <div className="text-6xl sm:text-7xl font-black text-blue-950 font-mono tracking-tight my-1">
                  {currentTicketStatus.ticketNumber}
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  เวลาที่รับบัตร: {formatQueueTime(currentTicketStatus)} น. ({formatQueueDate(currentTicketStatus)})
                </div>
              </div>

              {/* Status & Position Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center mb-6 space-y-2">
                {currentTicketStatus.status === 'called' ? (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
                      สถานะ: กำลังเรียกรับบริการ
                    </span>
                    <div className="text-2xl font-black text-emerald-700">
                      เชิญที่{currentTicketStatus.counterLabel || (currentTicketStatus.counter ? `ช่องบริการที่ #${currentTicketStatus.counter}` : 'ช่องบริการ')}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 divide-x divide-slate-200 text-left">
                    <div className="pr-3">
                      <span className="text-[11px] text-slate-400 block">จำนวนคิวที่รอข้างหน้า</span>
                      <span className="text-2xl font-black text-blue-900">
                        {queuesAhead}
                      </span>
                      <span className="text-xs text-slate-500 ml-1">คิว</span>
                    </div>
                    <div className="pl-3">
                      <span className="text-[11px] text-slate-400 block">ประมาณเวลารอ</span>
                      <span className="text-2xl font-black text-amber-600">
                        ~{estimatedWaitMin}
                      </span>
                      <span className="text-xs text-slate-500 ml-1">นาที</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Tracking QR Code */}
              <div className="pt-2 pb-4 text-center border-t border-dashed border-slate-300">
                <div className="flex flex-col items-center justify-center gap-1.5 text-slate-600 mb-2">
                  <div className="bg-white p-2 rounded-xl border border-slate-200 inline-block shadow-xs">
                    <QRCodeSVG
                      value={typeof window !== 'undefined' ? window.location.href : ''}
                      size={80}
                      level="L"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-blue-900">
                    สแกนเพื่อติดตามคิวบนโทรศัพท์มือถือ
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  REF: {currentTicketStatus.id}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  โปรดเก็บรักษาบัตรคิวนี้ไว้เพื่อแสดงต่อเจ้าหน้าที่
                </p>
              </div>

              {/* Action Buttons for Kiosk User */}
              <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-2 no-print">
                <button
                  onClick={handlePrint}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>พิมพ์บัตรคิว (Print)</span>
                </button>
                <button
                  onClick={onClearActiveTicket}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>รับบัตรคิวใหม่</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Connectivity & Device Support Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-5 rounded-3xl border border-blue-900 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">รองรับการเชื่อมต่อพร้อมกันทุกอุปกรณ์ (Multi-Device Sync)</h4>
            <p className="text-xs text-slate-400">
              เจ้าหน้าที่ใช้คอมพิวเตอร์ประจำเคาน์เตอร์, ประชาชนดูคิวบนมือถือ, และทีวีห้องรอรับบริการเปิดพร้อมกันได้ไม่จำกัด
            </p>
          </div>
        </div>
        <button
          onClick={onOpenConnectModal}
          className="bg-amber-400 hover:bg-amber-300 text-blue-950 px-4 py-2 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-1.5 shadow"
        >
          <QrCode className="w-4 h-4" />
          <span>แชร์ / เชื่อมต่อเครื่องอื่น</span>
        </button>
      </div>

    </div>
  );
};

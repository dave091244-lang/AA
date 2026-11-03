import React, { useState, useMemo } from 'react';
import { QueueItem } from '../types';
import { 
  FileSpreadsheet, 
  FileText,
  Trash2, 
  Printer, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Users,
  Calendar,
  Filter,
  Search,
  Eye,
  X,
  Copy,
  Check,
  ShieldCheck,
  Lock
} from 'lucide-react';
import {
  formatQueueTime,
  formatQueueDate,
  formatTimestampToTime,
  getLast5DaysRetrospective
} from '../utils/time';
import { exportReportToWord } from '../utils/wordExport';
import { printOfficialReport, printTicketThermal } from '../utils/print';

interface LogsReportProps {
  queues: QueueItem[];
  onClearAll: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

function formatDuration(startMs?: number, endMs?: number): string {
  if (!startMs || !endMs || endMs <= startMs) return '-';
  const diffSec = Math.floor((endMs - startMs) / 1000);
  const min = Math.floor(diffSec / 60);
  const sec = diffSec % 60;
  if (min === 0) return `${sec} วินาที`;
  return `${min} นาที ${sec > 0 ? `${sec} วินาที` : ''}`;
}

export const LogsReport: React.FC<LogsReportProps> = ({
  queues,
  onClearAll,
  showToast
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterDate, setFilterDate] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTicketDetail, setSelectedTicketDetail] = useState<QueueItem | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearPin, setClearPin] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  // 5-Day Retrospective Dates (Today + past 4 days = 5 days)
  const last5Days = useMemo(() => getLast5DaysRetrospective(), []);
  const last5DaysDateSet = useMemo(() => new Set(last5Days.map((d) => d.dateStr)), [last5Days]);

  // Count actual tickets per date (normalized via formatQueueDate)
  const countsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const q of queues) {
      const d = formatQueueDate(q);
      map[d] = (map[d] || 0) + 1;
    }
    return map;
  }, [queues]);

  // Any additional historical dates beyond the 5-day window that are still retained until staff clears
  const extraRetainedDates = useMemo(() => {
    const allDates = Array.from(new Set(queues.map((q) => formatQueueDate(q)))).filter(
      (d) => d && d !== '-' && !last5DaysDateSet.has(d)
    );
    return allDates;
  }, [queues, last5DaysDateSet]);

  // Total actual tickets within the 5-day retrospective period
  const totalInLast5Days = useMemo(() => {
    return queues.filter((q) => last5DaysDateSet.has(formatQueueDate(q))).length;
  }, [queues, last5DaysDateSet]);

  // Filter queues by Category, Status, Date (including 5-day retrospective), and Search Query
  const filteredQueues = useMemo(() => {
    return queues.filter((q) => {
      const qDate = formatQueueDate(q);
      if (filterCategory !== 'ALL' && q.categoryKey !== filterCategory) return false;
      if (filterStatus !== 'ALL' && q.status !== filterStatus) return false;
      if (filterDate === 'LAST_5_DAYS') {
        if (!last5DaysDateSet.has(qDate)) return false;
      } else if (filterDate !== 'ALL' && qDate !== filterDate) {
        return false;
      }
      if (searchQuery.trim()) {
        const qLower = searchQuery.toLowerCase().trim();
        const matchNumber = q.ticketNumber.toLowerCase().includes(qLower);
        const matchCategory = q.categoryName.toLowerCase().includes(qLower);
        const matchCounter = (q.counterLabel || `ช่อง #${q.counter || ''}`).toLowerCase().includes(qLower);
        if (!matchNumber && !matchCategory && !matchCounter) return false;
      }
      return true;
    });
  }, [queues, filterCategory, filterStatus, filterDate, searchQuery, last5DaysDateSet]);

  // Analytics Stats calculated for the active Date filter
  const baseQueuesForStats = useMemo(() => {
    if (filterDate === 'ALL') return queues;
    if (filterDate === 'LAST_5_DAYS') {
      return queues.filter((q) => last5DaysDateSet.has(formatQueueDate(q)));
    }
    return queues.filter((q) => formatQueueDate(q) === filterDate);
  }, [queues, filterDate, last5DaysDateSet]);

  const totalIssued = baseQueuesForStats.length;
  const waitingCount = baseQueuesForStats.filter((q) => q.status === 'waiting').length;
  const completedCount = baseQueuesForStats.filter((q) => q.status === 'completed').length;
  const calledCount = baseQueuesForStats.filter((q) => q.status === 'called').length;
  const skippedCount = baseQueuesForStats.filter((q) => q.status === 'skipped').length;

  const getCategoryName = (key: string) => {
    if (key === 'EMP') return 'หมวด A - จัดหางานในประเทศ/ต่างประเทศ';
    if (key === 'MIG') return 'หมวด B - แรงงานต่างด้าว';
    if (key === 'CAR') return 'หมวด C - แนะแนวอาชีพ';
    return 'ทั้งหมดทุกหมวดงาน';
  };

  const getStatusName = (key: string) => {
    if (key === 'waiting') return 'รอเรียกคิว';
    if (key === 'called') return 'กำลังรับบริการ';
    if (key === 'completed') return 'เสร็จสิ้นบริการ';
    if (key === 'skipped') return 'ข้ามคิว';
    return 'ทุกสถานะ';
  };

  const getActiveDateLabel = () => {
    if (filterDate === 'ALL') {
      return `ข้อมูลที่เก็บบันทึกทั้งหมด (${queues.length} คิว)`;
    }
    if (filterDate === 'LAST_5_DAYS') {
      return `ย้อนหลัง 5 วัน (${last5Days[4]?.dateStr} - ${last5Days[0]?.dateStr})`;
    }
    const foundDay = last5Days.find((d) => d.dateStr === filterDate);
    return foundDay ? foundDay.label : `วันที่ ${filterDate}`;
  };

  // Export to Excel / CSV with UTF-8 BOM
  const handleExportCSV = () => {
    if (filteredQueues.length === 0) {
      showToast('ไม่มีข้อมูลคิวจริงในช่วงวันที่เลือกสำหรับส่งออก', 'info');
      return;
    }

    let csv = '\uFEFF';
    csv += 'ลำดับ,หมายเลขคิว,หมวดหมู่บริการ,ช่องบริการ,วันที่,เวลากดคิว,เวลาเรียก,เวลาเสร็จสิ้น,สถานะ\n';

    const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    filteredQueues.forEach((q, index) => {
      const statusText = 
        q.status === 'waiting' ? 'รอเรียกคิว' :
        q.status === 'called' ? 'กำลังรับบริการ' :
        q.status === 'completed' ? 'เสร็จสิ้นบริการ' : 'ข้ามคิว';

      const calledTime = q.calledAt ? formatTimestampToTime(q.calledAt) : '-';
      const completedTime = q.completedAt ? formatTimestampToTime(q.completedAt) : '-';
      const counterStr = q.counterLabel || (q.counter ? `ช่อง #${q.counter}` : '-');

      const row = [
        index + 1,
        escapeCsv(q.ticketNumber),
        escapeCsv(q.categoryName),
        escapeCsv(counterStr),
        escapeCsv(formatQueueDate(q)),
        escapeCsv(formatQueueTime(q)),
        escapeCsv(calledTime),
        escapeCsv(completedTime),
        escapeCsv(statusText)
      ];
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `รายงานคิว_จัดหางานสุพรรณบุรี_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('ดาวน์โหลดรายงาน Excel/CSV เรียบร้อยแล้ว (รองรับภาษาไทย)', 'success');
  };

  // Export to Microsoft Word (.doc)
  const handleExportWord = () => {
    if (filteredQueues.length === 0) {
      showToast('ไม่มีข้อมูลคิวจริงในช่วงวันที่เลือกสำหรับส่งออก', 'info');
      return;
    }

    exportReportToWord(filteredQueues, {
      categoryLabel: getCategoryName(filterCategory),
      statusLabel: getStatusName(filterStatus),
      dateLabel: getActiveDateLabel(),
      totalIssued,
      completedCount,
      waitingCount,
      calledCount,
      skippedCount
    });

    showToast('ดาวน์โหลดเอกสาร Word (.doc) เรียบร้อยแล้ว', 'success');
  };

  // Dedicated Official A4 Report Printing
  const handlePrint = () => {
    if (filteredQueues.length === 0) {
      showToast('ไม่มีข้อมูลคิวจริงในช่วงวันที่เลือกสำหรับพิมพ์รายงาน', 'info');
      return;
    }

    printOfficialReport(filteredQueues, {
      categoryLabel: getCategoryName(filterCategory),
      statusLabel: getStatusName(filterStatus),
      dateLabel: getActiveDateLabel(),
      totalIssued,
      completedCount,
      waitingCount,
      calledCount,
      skippedCount
    });

    showToast('เปิดหน้าต่างสั่งพิมพ์รายงาน A4 ทางการแล้ว', 'success');
  };

  const handleConfirmStaffClear = (e: React.FormEvent) => {
    e.preventDefault();
    if (clearPin.trim() !== '123456') {
      showToast('รหัสผ่านเจ้าหน้าที่ไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง', 'error');
      return;
    }
    onClearAll();
    setClearPin('');
    setShowClearConfirm(false);
  };

  return (
    <div className="space-y-6">

      {/* Data Retention & Multi-Device Protection Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 border border-blue-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white">
                ระบบจัดเก็บข้อมูลคิวย้อนหลัง 5 วัน (บันทึกเฉพาะคิวจริง • ข้อมูลไม่สูญหายเมื่อเปิดข้ามอุปกรณ์)
              </h3>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Retained Until Staff Clears
              </span>
            </div>
            <p className="text-[11px] text-blue-200 mt-0.5">
              ข้อมูลคิวที่กดรับจริงจะถูกเก็บรักษาไว้ในระบบกลางและซิงค์อัตโนมัติทุกอุปกรณ์ จนกว่าเจ้าหน้าที่จะยืนยันรหัสเพื่อสั่งล้างข้อมูลด้วยตนเอง
            </p>
          </div>
        </div>
        <div className="text-right shrink-0 bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 self-end sm:self-center">
          <div className="text-[10px] text-blue-200">ข้อมูลสะสมในระบบ</div>
          <div className="text-sm font-black font-mono text-amber-300">{queues.length} รายการจริง</div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">คิวที่ออกจริง</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {totalIssued}
          </div>
          <span className="text-[11px] text-slate-400">{getActiveDateLabel()}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">รอเรียกรับบริการ</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">
            {waitingCount}
          </div>
          <span className="text-[11px] text-slate-400">คิว</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">กำลังให้บริการ</span>
            <AlertCircle className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 font-mono">
            {calledCount}
          </div>
          <span className="text-[11px] text-slate-400">คิว</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">เสร็จสิ้นบริการ</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
            {completedCount}
          </div>
          <span className="text-[11px] text-slate-400">
            {totalIssued > 0 ? Math.round((completedCount / totalIssued) * 100) : 0}% ของคิว
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">ข้ามคิว / สละสิทธิ์</span>
            <span className="text-xs text-red-500 font-bold">•</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-600 font-mono">
            {skippedCount}
          </div>
          <span className="text-[11px] text-slate-400">คิว</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200 space-y-5">
        
        {/* Header & Export Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 font-heading">
                ประวัติคิวย้อนหลัง 5 วัน และรายงานสรุปผล
              </h2>
              <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                {getActiveDateLabel()}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              บันทึกเฉพาะข้อมูลคิวที่ออกจริงเท่านั้น • ข้อมูลคงอยู่จนกว่าเจ้าหน้าที่จะสั่งล้างข้อมูล
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Word (.doc) Export Button */}
            <button
              onClick={handleExportWord}
              className="bg-blue-800 hover:bg-blue-700 active:scale-95 text-white font-bold px-3.5 py-2.5 rounded-xl shadow transition flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
              title="ส่งออกเอกสาร Microsoft Word (.doc)"
            >
              <FileText className="w-4 h-4 text-blue-200" />
              <span>ส่งออก Word (.doc)</span>
            </button>

            {/* Excel (.CSV) Export Button */}
            <button
              onClick={handleExportCSV}
              className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold px-3.5 py-2.5 rounded-xl shadow transition flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
              title="ส่งออกตาราง Microsoft Excel (.CSV)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>ส่งออก Excel (.CSV)</span>
            </button>

            {/* Print Official Report Button */}
            <button
              onClick={handlePrint}
              className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 transition flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
              title="พิมพ์รายงานสรุป A4 ทางการ"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>พิมพ์รายงาน</span>
            </button>

            <button
              onClick={() => {
                setClearPin('');
                setShowClearConfirm(true);
              }}
              className="bg-red-50 hover:bg-red-100 text-red-600 font-medium px-3 py-2.5 rounded-xl border border-red-200 transition flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer"
              title="ล้างข้อมูลคิว (เฉพาะเจ้าหน้าที่)"
            >
              <Trash2 className="w-4 h-4" />
              <span>ล้างข้อมูล (เจ้าหน้าที่)</span>
            </button>
          </div>
        </div>

        {/* Search Bar & 5-Day Retrospective Selector */}
        <div className="space-y-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          
          {/* Fast Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาประวัติคิวย้อนหลัง เช่น หมายเลขคิว (A001, B002, C001) หรือช่องบริการ..."
              className="w-full bg-white pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-800 focus:outline-none shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                title="ล้างคำค้นหา"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 5-Day Retrospective Quick Selector Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-900" />
                <span>เลือกดูข้อมูลย้อนหลัง 5 วัน (5-Day Retrospective Period):</span>
              </span>
              <span className="text-[11px] text-slate-500">
                บันทึกตามการกดบัตรคิวจริง
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                onClick={() => setFilterDate('ALL')}
                className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                  filterDate === 'ALL'
                    ? 'bg-blue-900 text-white font-bold shadow-xs'
                    : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                ทั้งหมด ({queues.length} คิว)
              </button>

              <button
                onClick={() => setFilterDate('LAST_5_DAYS')}
                className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                  filterDate === 'LAST_5_DAYS'
                    ? 'bg-indigo-900 text-white font-bold shadow-xs'
                    : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                รวมย้อนหลัง 5 วัน ({totalInLast5Days} คิว)
              </button>

              {last5Days.map((day) => {
                const count = countsByDate[day.dateStr] || 0;
                const isSelected = filterDate === day.dateStr;
                return (
                  <button
                    key={day.dateStr}
                    onClick={() => setFilterDate(day.dateStr)}
                    className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-900 text-white font-bold shadow-xs'
                        : count > 0
                        ? 'bg-white hover:bg-blue-50 text-slate-800 border border-blue-300'
                        : 'bg-white hover:bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    <span>{day.shortLabel}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isSelected
                          ? 'bg-amber-400 text-blue-950'
                          : count > 0
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {count} คิว
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3-Way Filter Bar with Dynamic Date Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-200/80">
            {/* 1. Date Filter (5-Day Retrospective + All retained dates) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-900" />
                <span>เลือกช่วงเวลา / วันที่:</span>
              </label>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full bg-white px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-800 focus:outline-none"
              >
                <option value="ALL">ข้อมูลสะสมทั้งหมด ({queues.length} คิว)</option>
                <option value="LAST_5_DAYS">รวมย้อนหลัง 5 วัน ({totalInLast5Days} คิว)</option>
                <optgroup label="รายวัน (ย้อนหลัง 5 วัน)">
                  {last5Days.map((day) => {
                    const count = countsByDate[day.dateStr] || 0;
                    return (
                      <option key={day.dateStr} value={day.dateStr}>
                        {day.label} — {count} คิวจริง
                      </option>
                    );
                  })}
                </optgroup>
                {extraRetainedDates.length > 0 && (
                  <optgroup label="วันที่ก่อนหน้า (ที่ยังไม่ได้สั่งล้าง)">
                    {extraRetainedDates.map((d) => (
                      <option key={d} value={d}>
                        วันที่ {d} — {countsByDate[d] || 0} คิวจริง
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* 2. Category Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-blue-900" />
                <span>หมวดหมู่งานบริการ:</span>
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-white px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-800 focus:outline-none"
              >
                <option value="ALL">ทั้งหมดทุกหมวดงาน</option>
                <option value="EMP">หมวด A - จัดหางานในประเทศ/ต่างประเทศ</option>
                <option value="MIG">หมวด B - แรงงานต่างด้าว</option>
                <option value="CAR">หมวด C - แนะแนวอาชีพ</option>
              </select>
            </div>

            {/* 3. Status Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <span>สถานะของคิว:</span>
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-white px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-800 focus:outline-none"
              >
                <option value="ALL">ทุกสถานะ</option>
                <option value="waiting">รอเรียกคิว</option>
                <option value="called">กำลังรับบริการ</option>
                <option value="completed">เสร็จสิ้นบริการ</option>
                <option value="skipped">ข้ามคิว</option>
              </select>
            </div>

            {/* Count Summary Info */}
            <div className="flex flex-col justify-end">
              <span className="text-[11px] text-slate-500">
                ผลการค้นหาประวัติคิว:
              </span>
              <span className="text-xs text-slate-700 font-medium">
                พบ <strong className="text-blue-900 font-bold text-sm">{filteredQueues.length}</strong> รายการ (จากทั้งหมด {queues.length})
              </span>
            </div>
          </div>
        </div>

        {/* Log Table */}
        <div id="printable-report" className="overflow-x-auto rounded-2xl border border-slate-200 max-h-[550px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 z-10">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">เลขคิว</th>
                <th className="py-3 px-4">ประเภทงานบริการ</th>
                <th className="py-3 px-4">ช่องบริการ</th>
                <th className="py-3 px-4">วันที่ / เวลากดคิว</th>
                <th className="py-3 px-4">เริ่มเรียก</th>
                <th className="py-3 px-4">เสร็จสิ้น</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4 text-center">ดูประวัติ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQueues.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    <div className="max-w-md mx-auto space-y-2 text-slate-400">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Users className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600">
                        {queues.length === 0 
                          ? 'ยังไม่มีประวัติการกดรับบัตรคิวจริงในระบบ'
                          : `ไม่มีการกดรับบัตรคิวในวันที่หรือเงื่อนไขที่เลือก (${getActiveDateLabel()})`}
                      </p>
                      <p className="text-xs text-slate-400">
                        ระบบบันทึกเฉพาะข้อมูลจากการกดรับบัตรคิวจริงเท่านั้น และเก็บรักษาข้อมูลไว้จนกว่าเจ้าหน้าที่จะสั่งล้างข้อมูล
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredQueues.map((q, idx) => (
                  <tr 
                    key={q.id} 
                    onClick={() => setSelectedTicketDetail(q)}
                    className="hover:bg-blue-50/70 transition-colors cursor-pointer group"
                    title="คลิกเพื่อดูรายละเอียดประวัติคิวนี้"
                  >
                    <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <span className="font-black text-blue-950 text-sm font-mono group-hover:text-blue-700">
                        {q.ticketNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {q.categoryName}
                    </td>
                    <td className="py-3 px-4">
                      {q.counter ? (
                        <span className="bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded">
                          {q.counterLabel || `ช่อง #${q.counter}`}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {formatQueueDate(q)} {formatQueueTime(q)} น.
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {q.calledAt ? `${formatTimestampToTime(q.calledAt)} น.` : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {q.completedAt ? `${formatTimestampToTime(q.completedAt)} น.` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        q.status === 'waiting'
                          ? 'bg-amber-100 text-amber-800'
                          : q.status === 'called'
                          ? 'bg-blue-100 text-blue-800 animate-pulse'
                          : q.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {q.status === 'waiting' && 'รอเรียกคิว'}
                        {q.status === 'called' && 'กำลังรับบริการ'}
                        {q.status === 'completed' && 'เสร็จสิ้นบริการ'}
                        {q.status === 'skipped' && 'ข้ามคิว'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTicketDetail(q);
                        }}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold px-2.5 py-1 rounded-lg border border-blue-200 transition inline-flex items-center gap-1 text-[11px] cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-700" />
                        <span>ดูข้อมูล</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Selected Past Queue Entry Detail Modal */}
      {selectedTicketDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-black">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 font-heading">
                    รายละเอียดประวัติคิว {selectedTicketDetail.ticketNumber}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {selectedTicketDetail.categoryName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicketDetail(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ticket Badge & Status */}
            <div className="bg-gradient-to-br from-blue-950 to-indigo-900 text-white rounded-2xl p-5 text-center space-y-1 relative overflow-hidden shadow-inner">
              <span className="text-xs text-blue-200">หมายเลขคิว (Ticket Code)</span>
              <div className="text-5xl font-black font-mono tracking-wider text-amber-400">
                {selectedTicketDetail.ticketNumber}
              </div>
              <div className="pt-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  selectedTicketDetail.status === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : selectedTicketDetail.status === 'called'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                    : selectedTicketDetail.status === 'waiting'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                    : 'bg-slate-500/20 text-slate-300 border border-slate-400/40'
                }`}>
                  สถานะ: {
                    selectedTicketDetail.status === 'waiting' ? 'รอเรียกคิว' :
                    selectedTicketDetail.status === 'called' ? 'กำลังรับบริการ' :
                    selectedTicketDetail.status === 'completed' ? 'เสร็จสิ้นบริการ' : 'ข้ามคิว'
                  }
                </span>
              </div>
            </div>

            {/* Timeline & Durations */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 text-xs">
              <span className="font-bold text-slate-700 block uppercase tracking-wider text-[11px]">
                บันทึกไทม์ไลน์และระยะเวลา (Event Timeline):
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">ช่องบริการที่ให้บริการ</span>
                  <span className="font-bold text-blue-900 text-sm">
                    {selectedTicketDetail.counterLabel || (selectedTicketDetail.counter ? `ช่อง #${selectedTicketDetail.counter}` : '-')}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">วันที่ออกบัตร</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {formatQueueDate(selectedTicketDetail)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-200">
                <div className="flex justify-between items-center text-slate-600">
                  <span>1. เวลากดรับบัตรคิว:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {formatQueueTime(selectedTicketDetail)} น.
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>2. เวลาเริ่มเรียกเข้ารับบริการ:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {selectedTicketDetail.calledAt ? `${formatTimestampToTime(selectedTicketDetail.calledAt)} น.` : '-'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-blue-900 font-medium bg-blue-50/60 p-1.5 rounded-lg">
                  <span>⏳ ระยะเวลารอคอย (Wait Duration):</span>
                  <span className="font-bold">
                    {formatDuration(selectedTicketDetail.timestamp, selectedTicketDetail.calledAt)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>3. เวลาเสร็จสิ้นการบริการ:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {selectedTicketDetail.completedAt ? `${formatTimestampToTime(selectedTicketDetail.completedAt)} น.` : '-'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-emerald-900 font-medium bg-emerald-50/60 p-1.5 rounded-lg">
                  <span>⚡ ระยะเวลาให้บริการ (Service Duration):</span>
                  <span className="font-bold">
                    {formatDuration(selectedTicketDetail.calledAt, selectedTicketDetail.completedAt)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-700 font-bold pt-1 border-t border-slate-200">
                  <span>รวมเวลาในระบบทั้งหมด (Total Turnaround):</span>
                  <span className="font-mono text-blue-950">
                    {formatDuration(selectedTicketDetail.timestamp, selectedTicketDetail.completedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => {
                  printTicketThermal(selectedTicketDetail);
                  showToast(`สั่งพิมพ์บัตรคิว ${selectedTicketDetail.ticketNumber} ซ้ำแล้ว`, 'success');
                }}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-3 rounded-xl transition text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>พิมพ์บัตรคิวซ้ำ (Thermal Slip)</span>
              </button>

              <button
                onClick={() => {
                  const info = `บัตรคิว ${selectedTicketDetail.ticketNumber} | ${selectedTicketDetail.categoryName} | ช่อง: ${selectedTicketDetail.counterLabel || selectedTicketDetail.counter || '-'} | วันที่: ${formatQueueDate(selectedTicketDetail)} ${formatQueueTime(selectedTicketDetail)} น.`;
                  navigator.clipboard.writeText(info).then(() => {
                    setCopiedId(true);
                    setTimeout(() => setCopiedId(false), 2000);
                  });
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-3 rounded-xl transition text-xs flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
              </button>

              <button
                onClick={() => setSelectedTicketDetail(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff-Protected Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleConfirmStaffClear}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4"
          >
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-heading">
              ยืนยันรหัสเจ้าหน้าที่เพื่อล้างข้อมูลคิว
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              ข้อมูลคิวจะถูกเก็บรักษาไว้จนกว่าเจ้าหน้าที่จะสั่งล้างข้อมูลด้วยตนเอง กรุณากรอก<strong>รหัสผ่านเจ้าหน้าที่ (PIN)</strong> เพื่อยืนยัน
            </p>
            <input
              type="password"
              value={clearPin}
              onChange={(e) => setClearPin(e.target.value)}
              placeholder="กรอกรหัส PIN เจ้าหน้าที่"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-center font-mono text-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
              autoFocus
            />
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowClearConfirm(false);
                  setClearPin('');
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition shadow cursor-pointer"
              >
                ยืนยันล้างข้อมูล
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

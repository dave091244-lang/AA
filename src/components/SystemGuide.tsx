import React, { useState } from 'react';
import { 
  Ticket, 
  Users, 
  Tv, 
  FileSpreadsheet, 
  FileText,
  Calendar,
  Volume2, 
  Play, 
  Sparkles, 
  Printer, 
  Smartphone, 
  QrCode, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Monitor,
  Download,
  AlertCircle,
  HelpCircle,
  Cpu
} from 'lucide-react';
import { playVoiceAnnouncement, initAudioContext } from '../utils/audio';
import { DoeLogo } from './DoeLogo';
import { CATEGORIES } from '../types';

interface SystemGuideProps {
  onGenerateDemoData: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

type GuideSection = 'ticketing' | 'counters' | 'screens' | 'reporting' | 'audio_setup';

export const SystemGuide: React.FC<SystemGuideProps> = ({
  onGenerateDemoData,
  showToast
}) => {
  const [activeSection, setActiveSection] = useState<GuideSection>('ticketing');
  const [testTicket, setTestTicket] = useState('A001');
  const [testCounter, setTestCounter] = useState(1);
  const [testPitch, setTestPitch] = useState(1.30);

  const handleTestVoice = async () => {
    initAudioContext();
    await playVoiceAnnouncement(testTicket, testCounter, testPitch);
    showToast(`ทดสอบเสียงประกาศ (เล่นครั้งเดียว): ${testTicket} ช่อง ${testCounter}`, 'success');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Manual Header Card with Official Emblem */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50/80 rounded-2xl p-1.5 flex items-center justify-center border border-amber-300 shadow-sm shrink-0">
              <DoeLogo className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-sm" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-900 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-800">
                  คู่มือการใช้งานระบบ (User Manual)
                </span>
                <span className="text-xs text-slate-400">เวอร์ชัน 2.0 (Official)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading mt-1">
                ระบบบริหารจัดการคิวบริการประชาชน
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                สำนักงานจัดหางานจังหวัดสุพรรณบุรี กรมการจัดหางาน กระทรวงแรงงาน
              </p>
            </div>
          </div>
          
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 px-4 py-2.5 rounded-2xl flex items-center gap-2.5 shadow-xs shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="text-xs font-black flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>โหมดปฏิบัติงานจริง (Production Mode)</span>
              </div>
              <div className="text-[11px] text-emerald-700">
                ปิดระบบคิวทดสอบ • บันทึกเฉพาะเหตุการณ์จริง 100%
              </div>
            </div>
          </div>
        </div>

        {/* 4 Core Sections Navigation Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-6">
          <button
            onClick={() => setActiveSection('ticketing')}
            className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
              activeSection === 'ticketing'
                ? 'bg-blue-900 text-white border-blue-900 shadow-md ring-2 ring-blue-800/30'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Ticket className={`w-5 h-5 shrink-0 ${activeSection === 'ticketing' ? 'text-amber-300' : 'text-blue-900'}`} />
            <div>
              <div className="text-xs sm:text-sm font-bold">1. การกดรับบัตรคิว</div>
              <div className={`text-[11px] ${activeSection === 'ticketing' ? 'text-blue-200' : 'text-slate-400'}`}>
                Kiosk & มือถือ
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveSection('counters')}
            className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
              activeSection === 'counters'
                ? 'bg-blue-900 text-white border-blue-900 shadow-md ring-2 ring-blue-800/30'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Users className={`w-5 h-5 shrink-0 ${activeSection === 'counters' ? 'text-amber-300' : 'text-blue-900'}`} />
            <div>
              <div className="text-xs sm:text-sm font-bold">2. เคาน์เตอร์บริการ</div>
              <div className={`text-[11px] ${activeSection === 'counters' ? 'text-blue-200' : 'text-slate-400'}`}>
                โต๊ะปฏิบัติการ 1-6
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveSection('screens')}
            className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
              activeSection === 'screens'
                ? 'bg-blue-900 text-white border-blue-900 shadow-md ring-2 ring-blue-800/30'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Tv className={`w-5 h-5 shrink-0 ${activeSection === 'screens' ? 'text-amber-300' : 'text-blue-900'}`} />
            <div>
              <div className="text-xs sm:text-sm font-bold">3. จอแสดงผลคิว</div>
              <div className={`text-[11px] ${activeSection === 'screens' ? 'text-blue-200' : 'text-slate-400'}`}>
                จอ TV โถงพักคอย
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveSection('reporting')}
            className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
              activeSection === 'reporting'
                ? 'bg-blue-900 text-white border-blue-900 shadow-md ring-2 ring-blue-800/30'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className={`w-5 h-5 shrink-0 ${activeSection === 'reporting' ? 'text-amber-300' : 'text-blue-900'}`} />
            <div>
              <div className="text-xs sm:text-sm font-bold">4. รายงาน & ส่งออก</div>
              <div className={`text-[11px] ${activeSection === 'reporting' ? 'text-blue-200' : 'text-slate-400'}`}>
                Excel & พิมพ์ A4
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* SECTION 1: QUEUE TICKETING (การกดรับบัตรคิว) */}
      {activeSection === 'ticketing' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-900">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
                หมวดที่ 1: ขั้นตอนการกดรับบัตรคิว (Queue Ticketing System)
              </h3>
              <p className="text-xs text-slate-500">
                สำหรับผู้รับบริการ ณ จุดกดบัตรคิวอัตโนมัติ (Kiosk) หรือผ่านสมาร์ตโฟน
              </p>
            </div>
          </div>

          {/* Workflow Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 relative">
              <div className="w-8 h-8 rounded-full bg-blue-900 text-amber-300 font-black text-sm flex items-center justify-center mb-3">
                1
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-1">
                เลือกหมวดหมู่งานบริการ
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                ผู้รับบริการแตะเลือกปุ่มบริการที่ต้องการบนหน้าจอสัมผัส:
              </p>
              <ul className="text-xs space-y-1.5 text-slate-700">
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-blue-900 shrink-0">หมวด A:</span>
                  <span>{CATEGORIES.EMP.name}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-amber-700 shrink-0">หมวด B:</span>
                  <span>{CATEGORIES.MIG.name}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-emerald-700 shrink-0">หมวด C:</span>
                  <span>{CATEGORIES.CAR.name}</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 relative">
              <div className="w-8 h-8 rounded-full bg-blue-900 text-amber-300 font-black text-sm flex items-center justify-center mb-3">
                2
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-1">
                รับบัตรคิว & บันทึกเวลาจริง
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                ระบบจะรันหมายเลขคิวอัตโนมัติ (เช่น A001, B002) พร้อมบันทึก <strong>เวลาจริง (Actual Time)</strong> ตามเวลาประเทศไทย (GMT+7)
              </p>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div>• แสดงจำนวนคิวที่ต้องรอข้างหน้า</div>
                <div>• คำนวณเวลาโดยประมาณที่ต้องรอ</div>
                <div>• ปิดคำลงท้าย เพื่อความกระชับและชัดเจน</div>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 relative">
              <div className="w-8 h-8 rounded-full bg-blue-900 text-amber-300 font-black text-sm flex items-center justify-center mb-3">
                3
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-1">
                พิมพ์บัตรคิว หรือ สแกนติดตาม
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                สามารถสั่งพิมพ์สลิปความร้อน หรือสแกน QR Code เพื่อเดินไปทำธุระและดูสถานะคิวสดบนมือถือได้
              </p>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1 text-blue-900 font-semibold">
                  <Printer className="w-3.5 h-3.5" /> รองรับเครื่องพิมพ์ 80mm / 58mm
                </div>
                <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <QrCode className="w-3.5 h-3.5" /> ซิงค์สถานะสดเมื่อถูกเรียกคิว
                </div>
              </div>
            </div>
          </div>

          {/* Thermal Slip Printing Guide */}
          <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 space-y-3">
            <h4 className="font-bold text-sm text-blue-950 flex items-center gap-2">
              <Printer className="w-4 h-4 text-blue-900" />
              <span>คำแนะนำการเชื่อมต่อเครื่องพิมพ์บัตรคิว (Thermal Receipt Printer)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
              <div className="bg-white p-3 rounded-xl border border-blue-100">
                <span className="font-bold text-blue-900 block mb-1">การตั้งค่ากระดาษพิมพ์:</span>
                เลือกรองรับกระดาษความร้อนขนาดมาตรฐาน <strong>80 มม.</strong> หรือ <strong>58 มม.</strong> โดยระบบได้ตั้งค่าหน้ากระดาษแบบตัดขอบอัตโนมัติพร้อมเส้นประสำหรับฉีก
              </div>
              <div className="bg-white p-3 rounded-xl border border-blue-100">
                <span className="font-bold text-blue-900 block mb-1">ความคมชัดของสลิป:</span>
                หัวสลิปจะพิมพ์ตราสัญลักษณ์ทางการของ <strong>กรมการจัดหางาน</strong> พร้อมระบุชื่อฝ่าย, เลขคิวขนาดใหญ่พิเศษ, วันที่และเวลากดรับคิวอย่างชัดเจน
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: SERVICE COUNTERS (เคาน์เตอร์บริการเจ้าหน้าที่) */}
      {activeSection === 'counters' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-800">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
                หมวดที่ 2: โต๊ะปฏิบัติการเคาน์เตอร์บริการ (Staff Counter Desk)
              </h3>
              <p className="text-xs text-slate-500">
                รองรับการแบ่งเคาน์เตอร์บริการเป็น 3 หมวดหมู่ชัดเจน: หมวด A (ช่อง 1–6), หมวด B (ช่อง 1–6), และ หมวด C (ช่อง 1–6)
              </p>
            </div>
          </div>

          {/* Category Division Information Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-lg bg-blue-900 text-white font-black text-xs flex items-center justify-center">A</span>
                <span className="font-bold text-sm text-blue-950">หมวด A: ช่องบริการ 1 – 6</span>
              </div>
              <p className="text-xs text-slate-600 mb-2">งานจัดหางานในประเทศ / ต่างประเทศ (คิว A001–A999)</p>
              <div className="text-[11px] font-mono text-blue-900 font-semibold bg-white p-2 rounded-xl border border-blue-100">
                ช่องบริการ A1, A2, A3, A4, A5, A6
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-lg bg-amber-600 text-white font-black text-xs flex items-center justify-center">B</span>
                <span className="font-bold text-sm text-amber-950">หมวด B: ช่องบริการ 1 – 6</span>
              </div>
              <p className="text-xs text-slate-600 mb-2">งานควบคุมและตรวจสอบคนต่างด้าว (คิว B001–B999)</p>
              <div className="text-[11px] font-mono text-amber-900 font-semibold bg-white p-2 rounded-xl border border-amber-100">
                ช่องบริการ B1, B2, B3, B4, B5, B6
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">C</span>
                <span className="font-bold text-sm text-emerald-950">หมวด C: ช่องบริการ 1 – 6</span>
              </div>
              <p className="text-xs text-slate-600 mb-2">งานแนะแนวอาชีพและส่งเสริมมีงานทำ (คิว C001–C999)</p>
              <div className="text-[11px] font-mono text-emerald-900 font-semibold bg-white p-2 rounded-xl border border-emerald-100">
                ช่องบริการ C1, C2, C3, C4, C5, C6
              </div>
            </div>
          </div>

          {/* Operational Flow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-blue-900 uppercase">ขั้นตอนที่ 1: เข้าสู่ระบบ</span>
              <h4 className="font-bold text-sm text-slate-900">ล็อกอิน & เลือกหมวดและช่องบริการ</h4>
              <p className="text-xs text-slate-600">
                เจ้าหน้าที่ล็อกอินด้วยรหัส PIN จากนั้นแตะเลือกหมวดงาน (A, B หรือ C) และเลือกหมายเลขช่องบริการที่ตนเองประจำอยู่ (ช่อง 1 ถึง 6)
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-emerald-800 uppercase">ขั้นตอนที่ 2: กดเรียกคิว</span>
              <h4 className="font-bold text-sm text-slate-900">เรียกคิวในหมวดของตนเอง</h4>
              <p className="text-xs text-slate-600">
                <strong>ปุ่มเขียวใหญ่:</strong> กดเรียกคิวถัดไปของหมวดที่ตนเองประจำอยู่ได้ทันทีอย่างรวดเร็ว (FIFO) พร้อมระบบเสียงประกาศภาษาไทย 1 ครั้ง
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-amber-700 uppercase">ขั้นตอนที่ 3: ปุ่มจัดการระหว่างบริการ</span>
              <h4 className="font-bold text-sm text-slate-900">เรียกซ้ำ / เสร็จสิ้น / ข้ามคิว</h4>
              <p className="text-xs text-slate-600">
                • <strong>เรียกซ้ำ (Recall):</strong> ประกาศเรียกคิวเดิมอีกครั้ง<br />
                • <strong>เสร็จสิ้น (Complete):</strong> ปิดเคสและบันทึกเวลาเสร็จ<br />
                • <strong>ข้ามคิว (Skip):</strong> กรณีผู้รับบริการไม่มาแสดงตัว
              </p>
            </div>
          </div>

          {/* Feature Highlight: Single Announcement Sound */}
          <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 space-y-1">
              <span className="font-bold text-sm block">ระบบป้องกันเสียงซ้ำซ้อน (Play Announcement Once Only):</span>
              <p className="leading-relaxed">
                ระบบได้รับการปรับปรุงให้มีระบบ Deduplication Guard เมื่อเจ้าหน้าที่กดเรียกคิว เสียงกระดิ่ง (1-Tone Chime) และเสียงเด็กสาววัยรุ่นไทยจะเล่นประกาศ <strong>เพียงครั้งเดียวเท่านั้น</strong> ป้องกันการเล่นเสียงซ้อนกันระหว่างแท็บหรืออุปกรณ์ในเครือข่าย
              </p>
            </div>
          </div>

          {/* Specific Queue Calling from Table */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2">
            <span className="font-bold text-slate-900 text-sm block">การเรียกคิวแบบเจาะจง (Call Specific Ticket):</span>
            <p className="leading-relaxed">
              ที่ตารางด้านล่างของหน้าเคาน์เตอร์ จะแสดงรายชื่อคิวที่กำลังรอทั้งหมด เจ้าหน้าที่สามารถใช้ช่องค้นหา (Search) หรือคลิกปุ่ม <strong>"เรียกคิวนี้"</strong> ที่แถวของบัตรคิวนั้นๆ เพื่อเจาะจงเรียกคิวเข้าช่องบริการได้ทันที
            </p>
          </div>
        </div>
      )}

      {/* SECTION 3: DISPLAY SCREENS (หน้าจอแสดงผลคิว TV) */}
      {activeSection === 'screens' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-900">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
                หมวดที่ 3: จอแสดงผลคิวสำหรับผู้มาติดต่อ (Display Screens / TV Display)
              </h3>
              <p className="text-xs text-slate-500">
                สำหรับแสดงผลบนจอ TV / Smart TV / จอภาพขนาด 22 นิ้วขึ้นไป ณ โถงพักคอย
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-900">องค์ประกอบบนหน้าจอ TV</h4>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-blue-900 block mb-0.5">1. ป้ายเรียกคิวปัจจุบัน (Calling Focus Banner - ฝั่งซ้าย):</strong>
                  แสดงหมายเลขคิวขนาดใหญ่พิเศษ พร้อมเอฟเฟกต์กะพริบและระบุช่องบริการ เพื่อดึงดูดสายตาผู้รับบริการในโถงพักคอย
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-blue-900 block mb-0.5">2. ตารางสถานะเคาน์เตอร์ 1-6 (Counter Grid - ฝั่งขวา):</strong>
                  แสดงสถานะสดของทุกช่องบริการแบบตารางขนาดใหญ่ มองเห็นชัดเจนจากระยะไกล
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-blue-900 block mb-0.5">3. แถบวิ่งประวัติการเรียกคิวย้อนหลัง (Recent Ticker):</strong>
                  ด้านล่างหน้าจอแสดงรายการคิวที่เพิ่งถูกเรียกไปล่าสุด 20 รายการ
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-blue-900 block mb-0.5">4. วันที่และนาฬิกาดิจิทัลเวลาจริง:</strong>
                  แสดงวันเดือนปี พ.ศ. และเวลาเดินวินาทีแบบเรียลไทม์
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-900">การติดตั้งและการเปิดใช้งาน</h4>
              <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                  <span className="text-amber-400 font-bold">ปุ่มควบคุมบนมุมขวาบนของหน้าจอ TV:</span>
                  <Monitor className="w-4 h-4 text-slate-400" />
                </div>
                <ul className="text-xs space-y-2 text-slate-300">
                  <li>• <strong>ปุ่ม 22 นิ้ว (พอดีจอ):</strong> ปรับขนาดตัวอักษรและระยะขอบให้พอดีกับจอภาพ 22 นิ้ว หรือ TV 1080p / 4K</li>
                  <li>• <strong>ปุ่มเต็มจอ (Fullscreen):</strong> กดปุ่มขยาย หรือกด <code>F11</code> บนคีย์บอร์ดเพื่อซ่อนแถบเมนูของเบราว์เซอร์</li>
                  <li>• <strong>ปุ่มเปิด/ปิดเสียง:</strong> ควบคุมให้จอ TV เปล่งเสียงประกาศ หรือปิดเสียงหากใช้ลำโพงรวมของอาคาร</li>
                </ul>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950">
                <strong>💡 เคล็ดลับการตั้งค่า:</strong> สามารถเปิดหน้าจอ TV ในเครื่องคอมพิวเตอร์ที่ต่อสาย HDMI ไปยังจอโทรทัศน์ ณ โถงพักคอย และเปิดแท็บ "จอแสดงผล (TV)" ทิ้งไว้ได้ตลอดทั้งวันโดยไม่ต้องรีเฟรชหน้าจอ
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: REPORTING & EXPORTING (ระบบรายงานและส่งออก) */}
      {activeSection === 'reporting' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-900">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
                หมวดที่ 4: ระบบรายงานและการส่งออกข้อมูล (Reporting & Exporting)
              </h3>
              <p className="text-xs text-slate-500">
                สำหรับการสรุปสถิติประจำวัน การส่งออกไฟล์ Word (.doc), Excel (.CSV), การดูข้อมูลคิวย้อนหลัง และการพิมพ์รายงานราชการ A4
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">ส่งออก Word (.doc)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                สร้างเอกสาร Microsoft Word (.doc) พร้อมหัวหนังสือราชการ, ตราสัญลักษณ์กรมการจัดหางาน, สรุป KPI, และตารางข้อมูลพร้อมช่องลงลายมือชื่อ
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">ส่งออก Excel (.CSV)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                ฝังรหัส <strong>UTF-8 BOM</strong> เปิดใน Microsoft Excel ได้ภาษาไทยถูกต้อง 100% บันทึกเวลาแบบละเอียดระดับวินาที
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm">
                <Calendar className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">ดูย้อนหลัง 5 วัน</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                ตัวกรองวันที่มีตัวเลือกดูย้อนหลัง 5 วัน (วันนี้, เมื่อวานนี้, 2-4 วันก่อน) หรือดูภาพรวมทั้งหมด พร้อมคำนวณ KPI อัตโนมัติตามวันที่เลือก
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-sm">
                <Printer className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">พิมพ์รายงาน A4</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                ระบบพิมพ์เอกสาร A4 ผ่านเฟรมเฉพาะ จัดหน้าสวยงาม ตัวอักษรคมชัด ไม่ติดส่วนควบคุมและไม่มีหน้าขาวว่างเปล่า
              </p>
            </div>
          </div>

          {/* Excel Column Structure Table */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 block">โครงสร้างคอลัมน์ในไฟล์ Excel ที่ส่งออก:</span>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">ลำดับ</th>
                    <th className="py-2 px-3">หมายเลขคิว</th>
                    <th className="py-2 px-3">หมวดหมู่งาน</th>
                    <th className="py-2 px-3">ช่องบริการ</th>
                    <th className="py-2 px-3">วันที่ / เวลากดคิว</th>
                    <th className="py-2 px-3">เวลาเริ่มเรียก</th>
                    <th className="py-2 px-3">เวลาเสร็จสิ้น</th>
                    <th className="py-2 px-3">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-mono text-[11px]">
                  <tr>
                    <td className="py-2 px-3">1</td>
                    <td className="py-2 px-3 font-bold text-blue-900">A001</td>
                    <td className="py-2 px-3 font-sans">งานจัดหางานในประเทศ</td>
                    <td className="py-2 px-3 font-sans">ช่อง #1</td>
                    <td className="py-2 px-3">15:45 น.</td>
                    <td className="py-2 px-3">15:48 น.</td>
                    <td className="py-2 px-3">15:58 น.</td>
                    <td className="py-2 px-3 text-emerald-700 font-sans font-bold">เสร็จสิ้นบริการ</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Voice Tester & Audio Check Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-blue-900" />
            <h4 className="font-bold text-sm sm:text-base text-slate-900 font-heading">
              ทดสอบระบบเสียงประกาศเรียกคิว (Audio & Speech Synthesis Test)
            </h4>
          </div>
          <span className="inline-flex items-center gap-1 bg-pink-100 text-pink-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-pink-200 shadow-xs">
            👧 เสียงเด็กสาววัยรุ่นไทย (เล่นเสียง 1 ครั้ง)
          </span>
        </div>

        <p className="text-xs text-slate-600">
          ระบบใช้เสียงกระดิ่งเตือน (1-Tone Chime) 1 ครั้ง ตามด้วยเสียงเด็กสาววัยรุ่นไทย โทนเสียงสดใส นุ่มนวล สุภาพ และชัดเจน: <em>"ขอเชิญหมายเลข ... ที่ช่องบริการที่ ..."</em> (ตัดคำว่า ค่ะ ออกตามระเบียบ)
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-700">เลขคิว:</span>
            <input
              type="text"
              value={testTicket}
              onChange={(e) => setTestTicket(e.target.value.toUpperCase())}
              className="w-20 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold uppercase text-center bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-700">ช่องบริการ:</span>
            <select
              value={testCounter}
              onChange={(e) => setTestCounter(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
            >
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <option key={num} value={num}>ช่อง #{num}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-700">โทนเสียง:</span>
            <select
              value={testPitch}
              onChange={(e) => setTestPitch(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
            >
              <option value={1.22}>สาววัยรุ่นเสียงหวาน (Pitch 1.22)</option>
              <option value={1.30}>สาววัยรุ่นสดใส - มาตรฐาน (Pitch 1.30)</option>
              <option value={1.38}>เด็กสาวเสียงใสแจ๋ว (Pitch 1.38)</option>
            </select>
          </div>

          <button
            onClick={handleTestVoice}
            className="bg-blue-900 hover:bg-blue-800 active:scale-95 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Play className="w-3.5 h-3.5" />
            <span>กดทดสอบฟังเสียงประกาศ</span>
          </button>
        </div>
      </div>

    </div>
  );
};

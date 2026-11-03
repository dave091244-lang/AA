import React from 'react';
import { 
  Users, 
  Headphones, 
  Tv, 
  FileSpreadsheet, 
  Settings, 
  Radio, 
  Volume2,
  QrCode
} from 'lucide-react';
import { DoeLogo } from './DoeLogo';
import { playChime, initAudioContext } from '../utils/audio';

export type NavTab = 'seeker' | 'staff' | 'tv' | 'logs' | 'setup';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  waitingCount: number;
  onlineCount: number;
  isConnected: boolean;
  onOpenConnectModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  waitingCount,
  onlineCount,
  isConnected,
  onOpenConnectModal
}) => {
  const handleTestSound = () => {
    initAudioContext();
    playChime();
  };

  return (
    <header className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 text-white shadow-xl sticky top-0 z-40 border-b border-blue-900/60">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-3">
          
          {/* Logo & Agency Title */}
          <div className="flex items-center space-x-3 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-white rounded-2xl p-1 flex items-center justify-center shadow-lg ring-2 ring-amber-400 border border-slate-100 shrink-0">
                  <DoeLogo className="w-10 h-10 object-contain drop-shadow-sm" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold font-heading tracking-wide text-white leading-tight">
                    สำนักงานจัดหางานจังหวัดสุพรรณบุรี
                  </h1>
                  <span className="hidden sm:inline-block bg-blue-900/80 text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-blue-700/60">
                    กรมการจัดหางาน
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300 font-light">
                  <span className="hidden md:inline">Suphan Buri Provincial Employment Office</span>
                  <span className="hidden md:inline text-slate-500">•</span>
                  <button
                    onClick={onOpenConnectModal}
                    className="text-emerald-400 font-medium flex items-center gap-1.5 hover:underline cursor-pointer bg-slate-900/80 px-2 py-0.5 rounded-full border border-emerald-900/80"
                  >
                    <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span>{isConnected ? `ออนไลน์ ${onlineCount} อุปกรณ์ (ทุกเครื่องซิงค์สด)` : 'กำลังเชื่อมต่อ...'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Mobile Connect button for small screens */}
            <div className="flex items-center gap-1 lg:hidden">
              <button
                onClick={onOpenConnectModal}
                title="เชื่อมต่ออุปกรณ์อื่น"
                className="p-2 text-amber-300 bg-blue-900/60 hover:bg-blue-800 rounded-lg border border-blue-700/80 flex items-center gap-1 text-xs"
              >
                <QrCode className="w-4 h-4" />
                <span className="font-bold">{onlineCount}</span>
              </button>
              <button
                onClick={handleTestSound}
                title="ทดสอบเสียงกระดิ่ง"
                className="p-2 text-slate-300 hover:text-amber-400 bg-blue-900/40 rounded-lg border border-blue-800"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 w-full lg:w-auto justify-center overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-blue-900/70 shadow-inner">
              <button
                onClick={() => setActiveTab('seeker')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'seeker'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>รับบัตรคิว</span>
                {waitingCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === 'seeker' ? 'bg-slate-950 text-amber-400 font-bold' : 'bg-blue-600 text-white'
                  }`}>
                    {waitingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('staff')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'staff'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Headphones className="w-4 h-4" />
                <span>เคาน์เตอร์บริการ</span>
              </button>

              <button
                onClick={() => setActiveTab('tv')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'tv'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Tv className="w-4 h-4" />
                <span>จอแสดงผล (22")</span>
              </button>

              <button
                onClick={() => setActiveTab('logs')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'logs'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">ประวัติคิวย้อนหลัง & รายงาน</span>
                <span className="sm:hidden">ประวัติคิว</span>
              </button>

              <button
                onClick={() => setActiveTab('setup')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'setup'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>คู่มือ</span>
              </button>
            </nav>

            {/* Multi-Device QR Connect Button */}
            <button
              onClick={onOpenConnectModal}
              title="เปิด QR Code เชื่อมต่อทุกอุปกรณ์ (มือถือ/ทีวี/โต๊ะทำงาน)"
              className="hidden lg:flex items-center gap-1.5 text-xs text-amber-300 hover:text-slate-950 bg-gradient-to-r from-amber-500/20 to-amber-500/30 hover:bg-amber-400 px-3 py-2 rounded-xl border border-amber-500/50 transition font-bold shadow-sm"
            >
              <QrCode className="w-4 h-4 text-amber-300" />
              <span>เชื่อมต่อทุกอุปกรณ์ ({onlineCount})</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

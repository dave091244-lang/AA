import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Smartphone, 
  Tv, 
  Monitor, 
  Tablet, 
  Copy, 
  Check, 
  X, 
  Radio
} from 'lucide-react';

interface DeviceConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onlineCount: number;
  isConnected: boolean;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const DeviceConnectModal: React.FC<DeviceConnectModalProps> = ({
  isOpen,
  onClose,
  onlineCount,
  isConnected,
  showToast
}) => {
  const [copied, setCopied] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    showToast('คัดลอกลิงก์เรียบร้อยแล้ว', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-xs sm:max-w-sm w-full p-4 sm:p-5 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150 space-y-3.5"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header & Close Button */}
        <div className="flex items-start justify-between gap-2 pr-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200/80 mb-1">
              <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-600" />
              <span>{isConnected ? `ออนไลน์ ${onlineCount} เครื่อง` : 'กำลังเชื่อมต่อ...'}</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 font-heading leading-tight">
              เชื่อมต่อใช้งานทุกอุปกรณ์
            </h3>
            <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
              สแกน QR ด้วยกล้องมือถือ เพื่อเปิดใช้งานร่วมกัน
            </p>
          </div>

          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compact QR Code Centerpiece */}
        <div className="bg-slate-50 p-3 rounded-xl border border-dashed border-blue-200 flex flex-col items-center justify-center">
          <div className="bg-white p-2.5 rounded-lg shadow-xs border border-slate-200">
            <QRCodeSVG
              value={currentUrl}
              size={124}
              level="M"
              includeMargin={false}
            />
          </div>
          <span className="text-[10px] text-slate-500 font-medium mt-1.5 flex items-center gap-1">
            <Smartphone className="w-3 h-3 text-blue-900" /> สแกนเปิดบนโทรศัพท์มือถือ
          </span>
        </div>

        {/* Compact Link Copy Bar */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="flex-1 bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-mono select-all focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="bg-blue-900 hover:bg-blue-800 active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
            </button>
          </div>
        </div>

        {/* Mini Device Chips */}
        <div className="flex items-center justify-around gap-1 pt-1.5 border-t border-slate-100 text-[10px] text-slate-600">
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            <Smartphone className="w-3 h-3 text-blue-800" />
            <span>มือถือ</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            <Tablet className="w-3 h-3 text-amber-600" />
            <span>คีออสค์</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            <Monitor className="w-3 h-3 text-indigo-700" />
            <span>เคาน์เตอร์</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            <Tv className="w-3 h-3 text-emerald-600" />
            <span>Smart TV</span>
          </div>
        </div>

        {/* Bottom Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-xl text-xs transition"
        >
          ปิดหน้าต่าง
        </button>

      </div>
    </div>
  );
};

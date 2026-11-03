import React, { useState } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { ServiceSeeker } from './components/ServiceSeeker';
import { StaffDesk } from './components/StaffDesk';
import { TVDisplay } from './components/TVDisplay';
import { LogsReport } from './components/LogsReport';
import { SystemGuide } from './components/SystemGuide';
import { DeviceConnectModal } from './components/DeviceConnectModal';
import { useRealtimeQueue } from './utils/useRealtimeQueue';
import { Bell, CheckCircle2, AlertTriangle, WifiOff } from 'lucide-react';

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('seeker');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  // Show Toast Alert
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Date.now().toString();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 4500);
  };

  // Real-time synchronization hook connected to server WebSocket
  const {
    queues,
    countersState,
    calledHistory,
    onlineDevicesCount,
    isConnected,
    latestIssuedTicket,
    setLatestIssuedTicket,
    issueTicket,
    callQueue,
    callSpecificTicket,
    recallQueue,
    completeQueue,
    skipQueue,
    clearAll,
    generateDemo
  } = useRealtimeQueue(soundEnabled, showToast);

  const waitingCount = queues.filter((q) => q.status === 'waiting').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        waitingCount={waitingCount}
        onlineCount={onlineDevicesCount}
        isConnected={isConnected}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
      />

      {/* Connectivity Banner (if disconnected) */}
      {!isConnected && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-sm">
          <WifiOff className="w-4 h-4 animate-bounce" />
          <span>กำลังเชื่อมต่อสัญญาณระบบคิวกลางแบบเรียลไทม์... ข้อมูลจะซิงค์ให้อัตโนมัติเมื่อเชื่อมต่อสำเร็จ</span>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-slate-900 text-white border-emerald-500'
                : toast.type === 'error'
                ? 'bg-red-950 text-white border-red-500'
                : 'bg-slate-900 text-white border-amber-400'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-400" />}
            {toast.type === 'info' && <Bell className="w-5 h-5 text-amber-400" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 w-full mx-auto ${
        activeTab === 'tv'
          ? 'max-w-[1680px] p-2 sm:p-3 flex flex-col'
          : 'max-w-7xl p-4 sm:p-6'
      }`}>
        {activeTab === 'seeker' && (
          <ServiceSeeker
            queues={queues}
            countersState={countersState}
            onIssueTicket={issueTicket}
            activeTicket={latestIssuedTicket}
            onClearActiveTicket={() => setLatestIssuedTicket(null)}
            onOpenConnectModal={() => setIsConnectModalOpen(true)}
          />
        )}

        {activeTab === 'staff' && (
          <StaffDesk
            queues={queues}
            countersState={countersState}
            onCallQueue={callQueue}
            onRecallQueue={recallQueue}
            onCompleteQueue={completeQueue}
            onSkipQueue={skipQueue}
            onCallSpecificTicket={callSpecificTicket}
            showToast={showToast}
          />
        )}

        {activeTab === 'tv' && (
          <TVDisplay
            queues={queues}
            countersState={countersState}
            calledHistory={calledHistory}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
            onlineDevicesCount={onlineDevicesCount}
            onOpenConnectModal={() => setIsConnectModalOpen(true)}
          />
        )}

        {activeTab === 'logs' && (
          <LogsReport
            queues={queues}
            onClearAll={clearAll}
            showToast={showToast}
          />
        )}

        {activeTab === 'setup' && (
          <SystemGuide
            onGenerateDemoData={generateDemo}
            showToast={showToast}
          />
        )}
      </main>

      {/* Multi-Device Connection QR Modal */}
      <DeviceConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onlineCount={onlineDevicesCount}
        isConnected={isConnected}
        showToast={showToast}
      />

      {/* Official Footer with Creator Copyright in bottom-right corner */}
      {activeTab !== 'tv' && (
        <footer className="bg-slate-950 text-slate-400 py-3.5 px-4 sm:px-6 border-t border-slate-800 text-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="text-center sm:text-left space-y-0.5">
              <p className="font-semibold text-slate-300">
                สำนักงานจัดหางานจังหวัดสุพรรณบุรี (Suphan Buri Provincial Employment Office)
              </p>
              <p className="text-[11px] text-slate-500">
                กรมการจัดหางาน กระทรวงแรงงาน • ศาลากลางจังหวัดสุพรรณบุรี ชั้น 2 ตำบลสนามชัย อำเภอเมืองสุพรรณบุรี จังหวัดสุพรรณบุรี 72000 • โทรศัพท์ 0 3553 5388
              </p>
            </div>
            <div className="text-center sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800 w-full sm:w-auto">
              <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-medium bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-800">
                <span>© พัฒนาระบบโดย</span>
                <span className="font-bold text-white">Wissanu Khammarun</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                All Rights Reserved • Created by Wissanu Khammarun
              </div>
            </div>
          </div>
        </footer>
      )}

    </div>
  );
}

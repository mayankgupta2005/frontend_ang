import React, { useState } from 'react';
import { NovaProvider, useNova } from './contexts/NovaContext';
import { useTTS } from './hooks/useTTS';

import { ViewSwitcher } from './components/ViewSwitcher';
import { AccidentBanner } from './components/AccidentBanner';
import { AddDeviceModal } from './components/AddDeviceModal';

import { RiderView } from './views/RiderView';
import { ParentView } from './views/ParentView';
import { PoliceView } from './views/PoliceView';
import { AdminView } from './views/AdminView';

function DashboardShell() {
  const { device, connectionStatus, userRole } = useNova();
  const { ttsEnabled, toggleTTS } = useTTS();
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [currentView, setCurrentView] = useState(() => {
    const saved = localStorage.getItem('novashield_last_view');
    if (saved && isViewAllowed(saved, userRole)) return saved;
    // Default based on role
    if (userRole === 'RIDER') return 'rider-view';
    if (userRole === 'FAMILY') return 'parent-view';
    if (userRole === 'POLICE') return 'police-view';
    if (userRole === 'ADMIN') return 'admin-view';
    return 'rider-view';
  });

  function isViewAllowed(view, role) {
    if (view === 'rider-view' && ['RIDER', 'ADMIN'].includes(role)) return true;
    if (view === 'parent-view' && ['FAMILY', 'ADMIN', 'POLICE'].includes(role)) return true;
    if (view === 'police-view' && ['POLICE', 'ADMIN'].includes(role)) return true;
    if (view === 'admin-view' && role === 'ADMIN') return true;
    return false;
  }

  const handleViewChange = (view) => {
    if (isViewAllowed(view, userRole)) {
      setCurrentView(view);
      localStorage.setItem('novashield_last_view', view);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative pb-12">
      {/* Top Navbar */}
      <nav className="border-b border-white/10 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <a href="index.html" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(0,240,255,0.3)]">N</div>
            <div className="hidden sm:block">
              <div className="text-white font-bold leading-none tracking-wide">NovaShield</div>
              <div className="text-gray-400 text-xs mt-1 font-mono uppercase tracking-widest">Emergency Platform</div>
            </div>
          </a>

          <div className="flex items-center gap-4 sm:gap-6">
            <button 
              onClick={toggleTTS}
              className="text-gray-400 hover:text-white transition-colors p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              aria-label={ttsEnabled ? "Disable Voice Assistant" : "Enable Voice Assistant"}
            >
              {ttsEnabled ? '🔊' : '🔇'}
            </button>

            {/* Persistent Connection Status */}
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-full px-3 py-1">
              <span className={`w-2 h-2 rounded-full ${
                connectionStatus === 'live' ? 'bg-safe animate-pulse-dot' : 
                connectionStatus === 'connecting' ? 'bg-warning animate-pulse' : 'bg-gray-500'
              }`}></span>
              <span className="text-xs font-mono text-gray-300 hidden sm:inline">
                {connectionStatus === 'live' ? 'LIVE' : connectionStatus === 'connecting' ? 'CONNECTING...' : 'OFFLINE'}
              </span>
            </div>

            <div className="flex items-center gap-3 border-l border-white/10 pl-4 sm:pl-6 hidden sm:flex">
              <div className="text-sm font-medium text-gray-300">
                {device ? device.name : 'No device linked'}
              </div>
              <button 
                onClick={() => setIsAddDeviceOpen(true)}
                className="text-xs font-bold bg-primary/20 hover:bg-primary/30 text-primary px-3 py-1.5 rounded-full border border-primary/30 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                + Add Device
              </button>
            </div>

            <div className="flex items-center gap-3 border-l border-white/10 pl-4 sm:pl-6">
              <div className="hidden md:block text-right">
                <div className="text-sm font-bold text-white">{localStorage.getItem('ns_user_name') || 'Rider'}</div>
                <div className="text-[10px] text-primary font-mono uppercase tracking-wider">{userRole}</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                {(localStorage.getItem('ns_user_name') || 'R').charAt(0).toUpperCase()}
              </div>
              <a href="login.html" className="ml-2 text-xs text-gray-400 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">Logout</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Global Accident Banner */}
      <AccidentBanner />

      {/* Main Dashboard Body */}
      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 relative z-10">
        
        <ViewSwitcher currentView={currentView} setCurrentView={handleViewChange} />

        <div className="mt-6">
          {!isViewAllowed(currentView, userRole) ? (
             <div className="glass-panel p-12 text-center">
               <div className="text-4xl mb-4">⛔</div>
               <h2 className="text-2xl font-bold text-white mb-2">Not Authorized</h2>
               <p className="text-gray-400">Your role ({userRole}) does not have permission to access this view.</p>
             </div>
          ) : (
            <>
              {currentView === 'rider-view' && <RiderView />}
              {currentView === 'parent-view' && <ParentView />}
              {currentView === 'police-view' && <PoliceView />}
              {currentView === 'admin-view' && <AdminView />}
            </>
          )}
        </div>

      </main>

      {/* Ambient background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <AddDeviceModal 
        isOpen={isAddDeviceOpen} 
        onClose={() => setIsAddDeviceOpen(false)} 
      />
    </div>
  );
}

export default function DashboardApp() {
  return (
    <NovaProvider>
      <DashboardShell />
    </NovaProvider>
  );
}

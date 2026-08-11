import React from 'react';
import CountUp from 'react-countup';
import { useNova } from '../contexts/NovaContext';
import { SkeletonTile } from '../components/SkeletonTile';
import { MapPanel } from '../components/MapPanel';

export function RiderView() {
  const { telemetry, connectionStatus, sendCommand } = useNova();

  const isStale = connectionStatus === 'offline';
  const hasData = !!telemetry;

  const handleSOS = () => {
    sendCommand('sos_on');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Speed */}
        <div className="glass-panel p-4 flex items-center gap-4">
          <div className="bg-blue-900/50 text-primary w-12 h-12 rounded-full flex items-center justify-center text-xl">🚴</div>
          <div>
            <div className="text-sm text-gray-400 font-semibold">Speed</div>
            {hasData ? (
              <div className="text-2xl font-bold font-mono text-white flex items-baseline gap-1">
                <CountUp end={telemetry.speed || 0} duration={0.5} />
                <span className="text-sm text-gray-500 font-sans">km/h</span>
                {isStale && <span className="text-xs text-warning ml-2">(Last Known)</span>}
              </div>
            ) : <SkeletonTile className="h-8 w-16" />}
          </div>
        </div>

        {/* GPS */}
        <div className="glass-panel p-4 flex items-center gap-4">
          <div className="bg-red-900/50 text-emergency w-12 h-12 rounded-full flex items-center justify-center text-xl">📍</div>
          <div>
            <div className="text-sm text-gray-400 font-semibold">GPS</div>
            {hasData ? (
              <div className="text-xl font-bold text-white">
                {telemetry.latitude ? 'Locked' : 'Searching...'} 
                {isStale && <span className="text-xs text-warning block font-normal">(Last Known)</span>}
              </div>
            ) : <SkeletonTile className="h-8 w-20" />}
          </div>
        </div>

        {/* Battery */}
        <div className="glass-panel p-4 flex items-center gap-4">
          <div className="bg-green-900/50 text-safe w-12 h-12 rounded-full flex items-center justify-center text-xl">🔋</div>
          <div>
            <div className="text-sm text-gray-400 font-semibold">Battery</div>
            {hasData ? (
              <div className="text-2xl font-bold font-mono text-white flex items-baseline gap-1">
                <CountUp end={telemetry.batt || 0} duration={0.5} />%
                {isStale && <span className="text-xs text-warning ml-2 font-sans">(Stale)</span>}
              </div>
            ) : <SkeletonTile className="h-8 w-16" />}
          </div>
        </div>
        
        {/* Network */}
        <div className="glass-panel p-4 flex items-center gap-4">
          <div className="bg-blue-900/50 text-primary w-12 h-12 rounded-full flex items-center justify-center text-xl">📶</div>
          <div>
            <div className="text-sm text-gray-400 font-semibold">Network</div>
            {hasData ? (
              <div className="text-xl font-bold text-white">
                {telemetry.signal >= 3 ? 'Strong' : telemetry.signal >= 1 ? 'Weak' : 'No Signal'}
                {isStale && <span className="text-xs text-warning block font-normal">(Offline)</span>}
              </div>
            ) : <SkeletonTile className="h-8 w-20" />}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Live Map */}
          <div className="glass-panel p-1">
            <MapPanel telemetry={telemetry} height="400px" />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {/* AI Safety Assistant */}
          <div className="glass-panel p-5">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-primary">✨</span> AI Safety Assistant
            </h3>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Ride Style</div>
                <div className="text-gray-500 font-semibold italic">Data Unavailable (AI Model Offline)</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Crash Probability</div>
                <div className="text-white font-mono text-xl font-bold">-- <span className="text-gray-500 text-sm font-sans block italic">N/A</span></div>
              </div>
              <div className="text-sm text-gray-500 italic px-2">
                "AI Assistant is currently disconnected from the telemetry stream."
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-panel p-5 space-y-3">
             <button 
                onClick={handleSOS}
                className="w-full py-4 bg-emergency/20 hover:bg-emergency/30 text-emergency border border-emergency/50 rounded-xl font-bold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                aria-label="Trigger SOS Alarm"
              >
                🚨 Trigger SOS Alarm
              </button>
              <button 
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                aria-label="Share Live Location"
              >
                📤 Share Location
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}

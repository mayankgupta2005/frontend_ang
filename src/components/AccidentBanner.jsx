import React, { useEffect } from 'react';
import { useNova } from '../contexts/NovaContext';
import { useTTS } from '../hooks/useTTS';

export function AccidentBanner() {
  const { accidentState } = useNova();
  const { announce } = useTTS();

  useEffect(() => {
    if (accidentState === 'ACCIDENT') {
      announce('Critical Alert: Accident Detected! Emergency response protocol initiated.', true, 'assertive');
    }
  }, [accidentState, announce]);

  if (accidentState !== 'ACCIDENT') return null;

  return (
    <div className="w-full bg-emergency/20 border-b-2 border-emergency px-6 py-4 flex items-center justify-between shadow-[0_0_30px_rgba(255,42,95,0.4)] animate-pulse-fast">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-emergency rounded-full flex items-center justify-center text-2xl shadow-lg">
          🚨
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">ACCIDENT DETECTED</h2>
          <p className="text-red-200">SOS Dispatched. Awaiting emergency confirmation.</p>
        </div>
      </div>
      <button 
        className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full shadow-lg transition-colors border border-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        aria-label="Stop SOS Alarm"
      >
        Dismiss Alert
      </button>
    </div>
  );
}

import React from 'react';
import { useNova } from '../contexts/NovaContext';

export function ViewSwitcher({ currentView, setCurrentView }) {
  const { userRole } = useNova();
  const isSecondary = currentView === 'police-view' || currentView === 'admin-view';

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
      {/* Primary Segmented Control */}
      <div 
        className="flex bg-background-secondary/80 rounded-full p-1 border border-white/10 shadow-inner"
        role="tablist" 
        aria-label="Dashboard Views"
      >
        {['RIDER', 'ADMIN'].includes(userRole) && (
          <button
            onClick={() => setCurrentView('rider-view')}
            className={`flex items-center gap-2 px-6 py-2 text-sm font-semibold rounded-full transition-all duration-250 ${
              currentView === 'rider-view'
                ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'text-gray-400 hover:text-white bg-transparent'
            }`}
            role="tab"
            aria-selected={currentView === 'rider-view'}
            aria-label="Rider Dashboard"
          >
            <span>🏍️</span> Rider
          </button>
        )}
        
        {['FAMILY', 'ADMIN', 'POLICE'].includes(userRole) && (
          <button
            onClick={() => setCurrentView('parent-view')}
            className={`flex items-center gap-2 px-6 py-2 text-sm font-semibold rounded-full transition-all duration-250 ${
              currentView === 'parent-view'
                ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'text-gray-400 hover:text-white bg-transparent'
            }`}
            role="tab"
            aria-selected={currentView === 'parent-view'}
            aria-label="Parent and Family View"
          >
            <span>👨‍👩‍👧</span> Parent & Family
          </button>
        )}
      </div>

      {/* Secondary Dropdown */}
      {['POLICE', 'ADMIN'].includes(userRole) && (
        <div>
          <select
            value={isSecondary ? currentView : ''}
            onChange={(e) => {
              if (e.target.value) setCurrentView(e.target.value);
            }}
            className="bg-background border border-white/10 text-white text-sm rounded-full px-4 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Secondary Views"
          >
            <option value="" disabled hidden>More Views...</option>
            {['POLICE', 'ADMIN'].includes(userRole) && <option value="police-view">🚓 Police & Investigation</option>}
            {['ADMIN'].includes(userRole) && <option value="admin-view">⚙️ Admin Telemetry</option>}
          </select>
        </div>
      )}
    </div>
  );
}

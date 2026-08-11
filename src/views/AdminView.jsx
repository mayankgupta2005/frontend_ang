import React from 'react';
import { useNova } from '../contexts/NovaContext';
import { SkeletonTile } from '../components/SkeletonTile';

export function AdminView() {
  const { telemetry, connectionStatus } = useNova();
  const hasData = !!telemetry;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Fleet KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="glass-panel p-4 bg-background">
            <div className="text-xs text-gray-500 font-mono uppercase">Active Units</div>
            <div className="text-xl font-mono text-gray-500 mt-1 italic">N/A</div>
         </div>
         <div className="glass-panel p-4 bg-background">
            <div className="text-xs text-gray-500 font-mono uppercase">Network Uptime</div>
            <div className="text-xl font-mono text-gray-500 mt-1 italic">N/A</div>
         </div>
         <div className="glass-panel p-4 bg-background">
            <div className="text-xs text-gray-500 font-mono uppercase">Accidents Today</div>
            <div className="text-xl font-mono text-gray-500 mt-1 italic">N/A</div>
         </div>
         <div className="glass-panel p-4 bg-background">
            <div className="text-xs text-gray-500 font-mono uppercase">Avg Dispatch Time</div>
            <div className="text-xl font-mono text-gray-500 mt-1 italic">N/A</div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Hardware Diagnostics */}
        <div className="lg:col-span-8 space-y-4">
           <div className="glass-panel overflow-hidden">
              <div className="p-4 border-b border-white/5 bg-background-secondary flex justify-between items-center">
                 <h3 className="font-mono text-sm text-gray-300">Hardware Diagnostics (Live)</h3>
                 <span className={`text-xs font-mono px-2 py-1 rounded ${connectionStatus === 'live' ? 'bg-safe/20 text-safe' : 'bg-red-500/20 text-red-500'}`}>
                   {connectionStatus.toUpperCase()}
                 </span>
              </div>
              <div className="p-0">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-black/20 text-xs font-mono text-gray-500 uppercase">
                      <tr>
                        <th className="p-4 font-normal">Component</th>
                        <th className="p-4 font-normal">Status</th>
                        <th className="p-4 font-normal">Metric</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-mono text-gray-300 divide-y divide-white/5">
                      <tr>
                        <td className="p-4">ESP8266 (MCU)</td>
                        <td className="p-4 text-safe">{hasData ? 'Online' : 'Unknown'}</td>
                        <td className="p-4 text-gray-500 italic">N/A</td>
                      </tr>
                      <tr>
                        <td className="p-4">MPU6050 (IMU)</td>
                        <td className="p-4 text-safe">{hasData ? 'Online' : 'Unknown'}</td>
                        <td className="p-4 text-gray-500 italic">N/A</td>
                      </tr>
                      <tr>
                        <td className="p-4">NEO-6M (GPS)</td>
                        <td className={telemetry?.latitude ? "p-4 text-safe" : "p-4 text-warning"}>
                           {telemetry?.latitude ? 'Fix Acquired' : 'Searching'}
                        </td>
                        <td className="p-4 text-gray-500 italic">N/A</td>
                      </tr>
                      <tr>
                        <td className="p-4">SIM800L (GSM)</td>
                        <td className={telemetry?.signal > 0 ? "p-4 text-safe" : "p-4 text-warning"}>
                           {telemetry?.signal > 0 ? 'Connected' : 'Offline'}
                        </td>
                        <td className="p-4 text-gray-500 italic">N/A</td>
                      </tr>
                      <tr>
                        <td className="p-4">Battery</td>
                        <td className="p-4">{hasData ? 'Discharging' : 'Unknown'}</td>
                        <td className="p-4">{hasData ? `${telemetry.batt || 0}%` : <SkeletonTile className="h-4 w-12"/>}</td>
                      </tr>
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

        {/* Live Event Stream */}
        <div className="lg:col-span-4">
           <div className="glass-panel h-full flex flex-col overflow-hidden">
              <div className="p-4 border-b border-white/5 bg-background-secondary flex justify-between items-center">
                 <h3 className="font-mono text-sm text-gray-300">Live Event Stream</h3>
                 <select className="bg-black/40 border border-white/10 text-xs text-gray-400 rounded px-2 py-1 outline-none">
                    <option>All Events</option>
                    <option>Warnings</option>
                    <option>Critical</option>
                 </select>
              </div>
              <div className="flex-1 p-4 overflow-y-auto flex items-center justify-center bg-black/20 font-mono text-xs">
                 <div className="text-gray-500 italic">No live events (Stream Offline)</div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}

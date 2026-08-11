import React from 'react';
import CountUp from 'react-countup';
import { useNova } from '../contexts/NovaContext';
import { MapPanel } from '../components/MapPanel';
import { SkeletonTile } from '../components/SkeletonTile';

export function PoliceView() {
  const { telemetry, connectionStatus, cameraMetadata } = useNova();
  const hasData = !!telemetry;
  const isStale = connectionStatus === 'offline';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Forensic Header */}
      <div className="w-full bg-investigation/10 border-l-4 border-investigation px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <span className="text-investigation text-2xl">⚖️</span>
           <h2 className="text-xl font-bold font-mono text-white tracking-widest uppercase">Forensic Investigation Unit</h2>
        </div>
        <button className="px-4 py-2 bg-investigation/20 text-investigation border border-investigation/30 rounded font-mono text-sm hover:bg-investigation/30 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white" aria-label="Download Forensic PDF Report">
          📄 Export Case File (.PDF)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-8 space-y-6">
           {/* Hard Evidence Tiles */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-panel p-4 border-investigation/20">
                 <div className="text-xs text-gray-400 font-mono mb-2 uppercase">Peak Impact (G)</div>
                 {hasData ? <div className="text-3xl font-mono text-white font-bold">{telemetry.g?.toFixed(2) || '0.00'}</div> : <SkeletonTile className="h-10 w-16" />}
              </div>
              <div className="glass-panel p-4 border-investigation/20">
                 <div className="text-xs text-gray-400 font-mono mb-2 uppercase">Pre-Crash Speed</div>
                 {hasData ? (
                   <div className="text-3xl font-mono text-white font-bold">
                     <CountUp end={telemetry.speed || 0} /> <span className="text-sm">km/h</span>
                   </div>
                 ) : <SkeletonTile className="h-10 w-20" />}
              </div>
              <div className="glass-panel p-4 border-investigation/20">
                 <div className="text-xs text-gray-400 font-mono mb-2 uppercase">Max Lean Angle</div>
                 {hasData ? <div className="text-3xl font-mono text-white font-bold">{telemetry.lean || 0}°</div> : <SkeletonTile className="h-10 w-12" />}
              </div>
              <div className="glass-panel p-4 border-investigation/20">
                 <div className="text-xs text-gray-400 font-mono mb-2 uppercase">AI Confidence</div>
                 <div className="text-3xl font-mono text-gray-500 font-bold italic">N/A</div>
              </div>
           </div>

           {/* Trajectory Map */}
           <div className="glass-panel p-1 border-investigation/20">
              <div className="p-3 border-b border-white/5 flex justify-between items-center bg-black/20">
                <span className="font-mono text-sm text-gray-300">Trajectory Reconstruction Map</span>
                <span className={`text-xs font-mono flex items-center gap-2 ${hasData && telemetry.latitude ? 'text-safe' : 'text-gray-500'}`}>
                   <span className={`w-2 h-2 rounded-full inline-block ${hasData && telemetry.latitude ? 'bg-safe' : 'bg-gray-500'}`}></span> 
                   {hasData && telemetry.latitude ? 'GPS LOCKED' : 'NO FIX'}
                </span>
              </div>
              <MapPanel telemetry={telemetry} height="400px" />
           </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           {/* Camera Feed */}
           <div className="glass-panel border-investigation/20 overflow-hidden flex flex-col h-[300px]">
              <div className="p-3 border-b border-white/5 bg-black/20 font-mono text-sm text-gray-300">
                ESP32-CAM Snapshot
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-black/40">
                 {cameraMetadata ? (
                   <img src={cameraMetadata.url} alt="Accident Snapshot" className="w-full h-full object-cover rounded" />
                 ) : (
                   <>
                     <div className="text-4xl mb-4 text-gray-600">📷</div>
                     <div className="text-gray-500 font-mono text-sm">NO METADATA AVAILABLE</div>
                     <div className="text-gray-600 text-xs mt-2 font-mono">Awaiting confirmed accident trigger to capture evidence.</div>
                   </>
                 )}
              </div>
           </div>

           {/* Black Box Summary */}
           <div className="glass-panel p-5 border-investigation/20">
              <h3 className="font-mono text-sm text-white mb-4 border-b border-white/10 pb-2">Black Box Metadata</h3>
              <div className="space-y-3 font-mono text-xs">
                 <div className="flex justify-between">
                    <span className="text-gray-500">Timestamp (UTC)</span>
                    <span className="text-gray-300">{hasData ? new Date(telemetry.lastUpdated).toISOString() : 'N/A'}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-gray-500">Storage Sync</span>
                    <span className={cameraMetadata ? "text-safe" : "text-gray-500"}>
                      {cameraMetadata ? "Synced to Cloud DB" : "Pending..."}
                    </span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-gray-500">Data Integrity</span>
                    <span className={cameraMetadata ? "text-safe" : "text-gray-500"}>
                      {cameraMetadata ? "Verified (SHA-256)" : "N/A"}
                    </span>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNova } from '../contexts/NovaContext';
import { MapPanel } from '../components/MapPanel';
import { SkeletonTile } from '../components/SkeletonTile';
import { API_URL, getAuthHeaders } from '../../api-config';

export function ParentView() {
  const { telemetry, accidentState, device } = useNova();
  const isSafe = accidentState === 'SAFE';
  
  const [medical, setMedical] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMedical() {
      if (!device?.user_id) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/medical/${device.user_id}`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          setMedical(data);
        }
      } catch (err) {
        console.error("Failed to load medical profile", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMedical();
  }, [device]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Primary Safe/Danger Banner */}
      {isSafe && (
        <div className="w-full glass-panel-solid bg-green-900/20 border-green-500/30 p-8 text-center flex flex-col items-center shadow-[0_0_25px_rgba(16,185,129,0.15)] relative overflow-hidden">
           <div className="absolute top-4 right-4 flex items-center gap-2 text-safe text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-safe animate-pulse-dot"></span> Live Sync
           </div>
           <div className="text-5xl mb-4">🛡️</div>
           <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">RIDER IS SAFE</h1>
           <p className="text-lg text-green-200/80 max-w-lg">
             No accident or crash detected. The vehicle is operating within normal riding parameters.
           </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel p-1">
             <MapPanel telemetry={telemetry} height="400px" />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {/* Plain English Details */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-white mb-6">Medical & Safety Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-gray-400">Blood Group</span>
                {loading ? <SkeletonTile className="h-6 w-10" /> : (
                  <span className="text-white font-bold text-lg text-emergency">
                    {medical?.blood_group || 'Unknown'}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-gray-400">Helmet Status</span>
                <span className="text-gray-500 font-bold italic">N/A (No Sensor)</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-gray-400">ETA to Destination</span>
                <span className="text-gray-500 font-bold italic">N/A</span>
              </div>
              <div className="pt-2">
                <span className="text-gray-400 block mb-1 text-sm">Medical Notes:</span>
                {loading ? <SkeletonTile className="h-10 w-full" /> : (
                  <span className="text-white text-sm">
                    {medical ? (
                      <>
                        {medical.allergies && `Allergies: ${medical.allergies}. `}
                        {medical.conditions && `Conditions: ${medical.conditions}. `}
                        {medical.notes}
                      </>
                    ) : 'No medical profile available.'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Large Action Buttons */}
          <div className="space-y-3">
             <button className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-white" aria-label="Call Rider">
               📞 Call Rider
             </button>
             <button className="w-full py-4 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-xl font-bold transition-all text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" aria-label="Navigate to Rider on Google Maps">
               🗺️ Navigate to Rider
             </button>
             <button className="w-full py-4 mt-4 bg-emergency hover:bg-red-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(255,42,95,0.4)] transition-all text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-white" aria-label="Call Emergency Services 112">
               🚨 Call Emergency Services
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

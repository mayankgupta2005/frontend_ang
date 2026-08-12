import React, { useState } from 'react';
import { API_URL, getAuthHeaders } from '../../api-config';
import { useNova } from '../contexts/NovaContext';

export function AddDeviceModal({ isOpen, onClose }) {
  const { loadDevices } = useNova();
  const [deviceId, setDeviceId] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/devices`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          device_id: deviceId,
          device_type: "BLACKBOX",
          name: deviceName
        })
      });

      if (res.ok) {
        alert("Device successfully linked!");
        await loadDevices();
        onClose();
        setDeviceId('');
        setDeviceName('');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "Error adding device");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-primary">➕</span> Add New Device
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-xl font-bold p-1">
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-emergency/20 border border-emergency/50 text-emergency p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label text-xs">Device ID</label>
            <input 
              type="text" 
              required
              placeholder="e.g., nova_blackbox_01"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label text-xs">Device Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g., Meri Activa"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="btn btn-ghost"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Linking...' : 'Link Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

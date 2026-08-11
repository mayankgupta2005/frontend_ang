import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WS_BASE_URL, getAuthHeaders, handleUnauthorized, getUserRole } from '../../api-config';

const NovaContext = createContext();

export function NovaProvider({ children }) {
  const [device, setDevice] = useState(null); // Currently selected device
  const [devices, setDevices] = useState([]);
  
  // Connection states: 'connecting', 'live', 'offline'
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  
  // Core telemetry state
  const [telemetry, setTelemetry] = useState(null);
  
  // Computed accident state
  const [accidentState, setAccidentState] = useState('SAFE'); // SAFE, WARNING, ACCIDENT
  
  // Role
  const [userRole, setUserRole] = useState(getUserRole());
  
  // Forensic/Camera metadata
  const [cameraMetadata, setCameraMetadata] = useState(null);

  // Connect to WS when device changes
  useEffect(() => {
    if (!device) return;
    
    setConnectionStatus('connecting');
    const wsUrl = `${WS_BASE_URL}/ws/dashboard/${device.id}`;
    let ws = new WebSocket(wsUrl);
    
    // Heartbeat timeout for "Last Known" logic
    let heartbeatTimeout;
    
    ws.onopen = () => {
      setConnectionStatus('live');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle ping
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        // Handle telemetry event
        if (data.type === 'telemetry') {
           const t = data.data;
           setTelemetry({ 
             ...t, 
             speed: t.speed_kmh,
             batt: t.battery,
             lean: t.lean_angle,
             g: t.g_force,
             lastUpdated: Date.now() 
           });
           setConnectionStatus('live');
        } else if (data.type === 'device_status') {
           if (data.data.is_online === false) setConnectionStatus('offline');
        } else if (data.type === 'accident_status') {
           // Derived Accident State
           if (data.data.status === 'confirmed_accident') {
             setAccidentState('ACCIDENT');
           } else if (data.data.status === 'false_alarm' || data.data.status === 'normal' || data.data.status === 'sos_cancelled') {
             setAccidentState('SAFE');
           }
        }
        
        clearTimeout(heartbeatTimeout);
        heartbeatTimeout = setTimeout(() => {
          setConnectionStatus('offline'); // Data is stale
        }, 10000); // 10 seconds without data = offline/stale
        
      } catch (err) {
        console.error("WS Parse error", err);
      }
    };
    
    ws.onclose = () => {
      setConnectionStatus('offline');
    };
    
    ws.onerror = () => {
      setConnectionStatus('offline');
    };
    
    return () => {
      clearTimeout(heartbeatTimeout);
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [device]);

  // Load devices on mount
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        // Mocking device load, replace with real API call using getAuthHeaders()
        const res = await fetch(`${WS_BASE_URL.replace('ws', 'http')}/api/devices`, {
          headers: getAuthHeaders()
        });
        if (handleUnauthorized(res)) return;
        if (res.ok) {
          const data = await res.json();
          setDevices(data);
          if (data.length > 0) setDevice(data[0]);
        } else {
          // Fallback mock device for dev
          const mockDevice = { id: 'test_dev_001', name: 'Rider 1 (Test)' };
          setDevices([mockDevice]);
          setDevice(mockDevice);
        }
      } catch (e) {
        console.warn("Failed to fetch devices, using mock");
        const mockDevice = { id: 'test_dev_001', name: 'Rider 1 (Test)' };
        setDevices([mockDevice]);
        setDevice(mockDevice);
      }
    };
    fetchDevices();
  }, []);

  // API Call helper for commands (e.g. SOS, Buzzer)
  const sendCommand = useCallback(async (command, payload = {}) => {
    if (!device) return;
    try {
      const res = await fetch(`${WS_BASE_URL.replace('ws', 'http')}/api/commands`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ device_id: device.id, command, payload })
      });
      if (handleUnauthorized(res)) return;
      return res.ok;
    } catch (e) {
      console.error("Command failed", e);
      return false;
    }
  }, [device]);

  return (
    <NovaContext.Provider value={{
      device, setDevice, devices,
      connectionStatus,
      telemetry,
      accidentState, setAccidentState,
      cameraMetadata, setCameraMetadata,
      sendCommand,
      userRole
    }}>
      {children}
    </NovaContext.Provider>
  );
}

export const useNova = () => useContext(NovaContext);

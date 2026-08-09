import { API_URL, WS_BASE_URL, getAuthHeaders, getUserId, clearAuthData, handleUnauthorized } from './api-config.js';
/* ========================================================
   NOVASHIELD FRONTEND APPLICATION LOGIC
   Emergency Response & Telematics Platform
   ======================================================== */

const BlackBox = (() => {
  const activeAnimations = {};
  let currentUser = null;
  let currentDeviceId = null;
  let wsConnection = null;
  let cameraPollTimer = null;

  /* ---- API Helpers ---- */
  async function loadRider() {
    const uid = getUserId();
    if (!uid) return null;
    try {
      const res = await fetch(`${API_URL}/medical?user_id=${uid}`, {
        headers: getAuthHeaders()
      });
      if (handleUnauthorized(res)) return null;
      if (res.ok) {
        const d = await res.json();
        return {
          name: d.full_name || 'Rider',
          age: d.dob || '27',
          bloodGroup: d.blood_group || 'O+',
          emergency: d.emergency_contact_phone || '+91 90000 00000',
        };
      }
      return null;
    } catch (e) {
      console.error("[loadRider] API error:", e);
      return null;
    }
  }

  function hideSplash() {
    const splash = document.getElementById('loading-splash');
    if (splash && splash.style.opacity !== '0') {
      splash.style.opacity = '0';
      setTimeout(() => { splash.parentNode && splash.parentNode.removeChild(splash); }, 500);
    }
  }

  /* ===================================================
     DASHBOARD PAGE SETUP
     =================================================== */
  function setupDashboard() {
    setTimeout(hideSplash, 6000);

    /* ---- Tab Switching Logic ---- */
    const tabs = document.querySelectorAll('.dash-tab');
    const views = document.querySelectorAll('.dash-view');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetViewId = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        views.forEach(v => v.classList.remove('active'));

        tab.classList.add('active');
        const targetView = document.getElementById(targetViewId);
        if (targetView) targetView.classList.add('active');

        setTimeout(() => {
          if (riderMap) riderMap.invalidateSize();
          if (parentMap) parentMap.invalidateSize();
          if (policeMap) policeMap.invalidateSize();
        }, 200);
      });
    });

    /* ---- Live telemetry state ---- */
    const live = { speed: 0, lean: 0, g: 0.0, batt: 0 };

    function setLive() {
      const speedEl = document.getElementById('live-speed');
      const leanEl = document.getElementById('live-lean');
      const gEl = document.getElementById('live-g');
      const battValEl = document.getElementById('batt-val');
      const battBarEl = document.getElementById('batt-bar');

      if (speedEl) speedEl.textContent = live.speed;
      if (leanEl) leanEl.textContent = live.lean + '°';
      if (gEl) gEl.textContent = live.g.toFixed(1) + 'G';
      if (battValEl) battValEl.textContent = live.batt + '%';
      if (battBarEl) battBarEl.style.width = live.batt + '%';
    }

    /* ---- Crash & Emergency State ---- */
    let isCrashed = false;
    let crashTimer = null;
    let countdownVal = 10;

    /* Maps */
    let riderMap = null, parentMap = null, policeMap = null;
    let riderMarker = null, parentMarker = null, policeMarker = null;
    let currentPos = { lat: 0, lng: 0 };
    let hasValidLocation = false;

    /* Logs */
    const logEl = document.getElementById('event-log');
    let logs = [];

    function renderLog(list) {
      if (!logEl) return;
      logEl.innerHTML = '';
      list.forEach(l => {
        const div = document.createElement('div');
        div.style.padding = '8px 12px';
        div.style.borderRadius = '6px';
        div.style.background = 'var(--bg)';
        div.style.borderLeft = l.type === 'alert' ? '3px solid var(--emergency)' : l.type === 'warning' ? '3px solid var(--warning)' : '3px solid var(--accent)';

        div.innerHTML = `<span style="color:var(--text-muted); font-size:0.75rem;">${l.t}</span> <span style="margin-left:8px; color:var(--text);">${l.m}</span>`;
        logEl.appendChild(div);
      });
    }

    /* ---- Crash Trigger (Emergency Mode) ---- */
    const overlay = document.getElementById('crash-overlay');
    const countdownEl = document.getElementById('crash-countdown');
    const cancelSosBtn = document.getElementById('cancel-sos-btn');

    function triggerCrashAlert() {
      if (isCrashed) return;
      isCrashed = 'alerting';

      const sysStatusDot = document.getElementById('system-status-dot');
      const sysStatusText = document.getElementById('system-status-text');
      if (sysStatusDot) sysStatusDot.className = 'status-dot status-dot-red';
      if (sysStatusText) sysStatusText.textContent = '⚠ ACCIDENT DETECTED · EMERGENCY MODE';

      const parentCard = document.getElementById('parent-status-card');
      const parentIcon = document.getElementById('parent-status-icon');
      const parentText = document.getElementById('parent-status-text');
      const parentSub = document.getElementById('parent-status-sub');
      if (parentCard) { parentCard.className = 'parent-status-card alert'; }
      if (parentIcon) parentIcon.textContent = '🚨';
      if (parentText) parentText.textContent = 'ACCIDENT DETECTED!';
      if (parentSub) parentSub.textContent = 'Emergency services notified.';

      const tlCrashDot = document.getElementById('tl-crash-dot');
      const tlCrashText = document.getElementById('tl-crash-text');
      const tlSosDot = document.getElementById('tl-sos-dot');
      const tlSosText = document.getElementById('tl-sos-text');

      if (tlCrashDot) { tlCrashDot.className = 'timeline-dot emergency'; }
      if (tlCrashText) tlCrashText.textContent = 'Impact logged';
      if (tlSosDot) { tlSosDot.className = 'timeline-dot active'; }
      if (tlSosText) tlSosText.textContent = 'Dispatching SMS & Calls...';

      if (overlay) overlay.classList.add('show');

      countdownVal = 10;
      if (countdownEl) countdownEl.textContent = countdownVal;

      const timeStr = new Date().toTimeString().slice(0, 8);
      logs = [{ t: timeStr, m: '⚠ CRASH DETECTED by backend telemetry.', type: 'alert' }, ...logs].slice(0, 15);
      renderLog(logs);

      crashTimer = setInterval(() => {
        countdownVal--;
        if (countdownEl) countdownEl.textContent = countdownVal;
        if (countdownVal <= 0) {
          clearInterval(crashTimer);
          triggerSOSDispatch();
        }
      }, 1000);
    }

    function triggerSOSDispatch() {
      isCrashed = 'dispatched';
      const tlSosDot = document.getElementById('tl-sos-dot');
      const tlSosText = document.getElementById('tl-sos-text');
      if (tlSosDot) tlSosDot.className = 'timeline-dot completed';
      if (tlSosText) tlSosText.textContent = 'Sent to Family, Police & Hospital';

      const timeStr = new Date().toTimeString().slice(0, 8);
      logs = [{ t: timeStr, m: '🚑 SOS Dispatched (simulated UI state).', type: 'alert' }, ...logs].slice(0, 15);
      renderLog(logs);
    }

    function resetSystem() {
      isCrashed = false;
      if (overlay) overlay.classList.remove('show');
      if (crashTimer) clearInterval(crashTimer);

      updateTelemetryUI(telemetryState);

      const parentCard = document.getElementById('parent-status-card');
      const parentIcon = document.getElementById('parent-status-icon');
      const parentText = document.getElementById('parent-status-text');
      const parentSub = document.getElementById('parent-status-sub');
      if (parentCard) parentCard.className = 'parent-status-card safe';
      if (parentIcon) parentIcon.textContent = '🛡️';
      if (parentText) parentText.textContent = 'RIDER IS SAFE';
      if (parentSub) parentSub.textContent = 'Normal riding parameters.';

      const tlCrashDot = document.getElementById('tl-crash-dot');
      const tlCrashText = document.getElementById('tl-crash-text');
      const tlSosDot = document.getElementById('tl-sos-dot');
      const tlSosText = document.getElementById('tl-sos-text');

      if (tlCrashDot) tlCrashDot.className = 'timeline-dot pending';
      if (tlCrashText) tlCrashText.textContent = 'No crash detected';
      if (tlSosDot) tlSosDot.className = 'timeline-dot pending';
      if (tlSosText) tlSosText.textContent = 'Standby';

      const timeStr = new Date().toTimeString().slice(0, 8);
      logs = [{ t: timeStr, m: '✓ System reset. Telemetry normalized.', type: 'info' }, ...logs].slice(0, 15);
      renderLog(logs);
    }

    if (cancelSosBtn) {
      cancelSosBtn.addEventListener('click', () => {
        if (!currentDeviceId) return;
        fetch(`${API_URL}/cancel-sos`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ device_id: currentDeviceId })
        }).then(res => {
          if (res.ok) resetSystem();
        }).catch(console.error);
      });
    }

    /* ---- Update Rider Profile in UI ---- */
    function updateDashboardUI(r) {
      const avatar = document.getElementById('avatar');
      const riderName = document.getElementById('rider-name');
      const statBlood = document.getElementById('stat-blood');
      const statAge = document.getElementById('stat-age');
      const statEmg = document.getElementById('stat-emg');
      const crashEmgNum = document.getElementById('crash-emg-num');
      const parentBlood = document.getElementById('parent-blood');

      if (avatar) avatar.textContent = (r.name || 'R').slice(0, 1).toUpperCase();
      if (riderName) riderName.textContent = r.name || 'Rider';
      if (statBlood) statBlood.textContent = r.bloodGroup || 'O+';
      if (parentBlood) parentBlood.textContent = r.bloodGroup || 'O+';
      if (statAge) statAge.textContent = r.age || '27';
      if (statEmg) statEmg.textContent = r.emergency || '+91 90000 00000';
      if (crashEmgNum) crashEmgNum.textContent = `Alerting ${r.emergency || '+91 90000 00000'}`;
    }

    /* ---- Telemetry UX States ---- */
    const TELEMETRY_TIMEOUT_MS = 10000;
    let telemetryState = 'OFFLINE';
    let lastTelemetryTimestamp = 0;

    function updateTelemetryUI(state) {
      telemetryState = state;
      const sysBadge = document.getElementById('system-status-badge');
      const sysDot = document.getElementById('system-status-dot');
      const sysText = document.getElementById('system-status-text');
      const rtdbStatus = document.getElementById('rtdb-status');

      const mapBadge = document.querySelector('.map-large-card .status-badge');
      const parentMapBadge = document.querySelector('#parent-view .status-badge');

      const adminCards = document.querySelectorAll('#admin-view .metric-card');
      let mcuStatus = null;
      adminCards.forEach(c => {
         if (c.innerHTML.includes('ESP32 MCU Status')) {
             mcuStatus = c.querySelector('.metric-value');
         }
      });

      if (sysBadge && sysDot && sysText && !isCrashed) {
        if (state === 'ONLINE') {
          sysBadge.className = 'status-badge status-safe';
          sysBadge.style.background = '';
          sysBadge.style.color = '';
          sysDot.className = 'status-dot status-dot-green';
          sysDot.style.background = '';
          sysText.textContent = 'System Armed · Live Telemetry';
        } else if (state === 'STALE') {
          sysBadge.className = 'status-badge status-alert';
          sysBadge.style.background = '#fff3cd';
          sysBadge.style.color = '#856404';
          sysDot.className = 'status-dot';
          sysDot.style.background = '#ffc107';
          sysText.textContent = 'No telemetry received recently · Showing last known data';
        } else if (state === 'OFFLINE') {
          sysBadge.className = 'status-badge';
          sysBadge.style.background = '#e2e8f0';
          sysBadge.style.color = '#475569';
          sysDot.className = 'status-dot';
          sysDot.style.background = '#64748b';
          sysText.textContent = 'Device disconnected · Showing last known data';
        } else if (state === 'CONNECTING') {
          sysBadge.className = 'status-badge';
          sysBadge.style.background = '#e0f2fe';
          sysBadge.style.color = '#0369a1';
          sysDot.className = 'status-dot';
          sysDot.style.background = '#0284c7';
          sysText.textContent = 'Connecting to device...';
        }
      }

      if (rtdbStatus) {
        if (state === 'ONLINE') { rtdbStatus.textContent = '● Data Syncing'; rtdbStatus.className = 'status-badge status-online'; }
        else if (state === 'STALE') { rtdbStatus.textContent = '● STALE'; rtdbStatus.className = 'status-badge status-alert'; }
        else if (state === 'OFFLINE') { rtdbStatus.textContent = '○ OFFLINE'; rtdbStatus.className = 'status-badge'; }
        else if (state === 'CONNECTING') { rtdbStatus.textContent = '○ CONNECTING…'; rtdbStatus.className = 'status-badge'; }
      }

      if (mcuStatus) {
         if (state === 'ONLINE') { mcuStatus.textContent = 'Online'; mcuStatus.className = 'metric-value text-accent'; mcuStatus.style.color = ''; }
         else if (state === 'STALE') { mcuStatus.textContent = 'Stale'; mcuStatus.className = 'metric-value text-alert'; mcuStatus.style.color = '#856404'; }
         else { mcuStatus.textContent = 'Offline'; mcuStatus.className = 'metric-value'; mcuStatus.style.color = '#64748b'; }
      }

      if (mapBadge) {
        if (state === 'ONLINE') { mapBadge.textContent = '● GPS Live Sync'; mapBadge.className = 'status-badge status-online'; }
        else { mapBadge.textContent = '○ Last Known GPS'; mapBadge.className = 'status-badge'; }
      }
      if (parentMapBadge) {
        if (state === 'ONLINE') { parentMapBadge.textContent = '● GPS Live Sync'; parentMapBadge.className = 'status-badge status-online'; }
        else { parentMapBadge.textContent = '○ Last Known GPS'; parentMapBadge.className = 'status-badge'; }
      }

      const values = document.querySelectorAll('.stat-card-value, .safe-banner-value');
      values.forEach(val => {
        if (!val.dataset.base) val.dataset.base = val.textContent;
        if (state === 'ONLINE') {
          val.textContent = val.dataset.base;
          val.style.color = '';
        } else {
          if (!val.textContent.includes(' (Last Known)')) {
            val.textContent = `${val.dataset.base} (Last Known)`;
            val.style.color = '#64748b';
          }
        }
      });
    }

    setInterval(() => {
      const safeSubtitle = document.querySelector('.safe-banner-subtitle');
      const mapCoords = document.getElementById('map-coords');

      if (lastTelemetryTimestamp === 0) {
        if (safeSubtitle) safeSubtitle.textContent = `Waiting for telemetry...`;
        if (mapCoords) {
           if (!mapCoords.dataset.original) mapCoords.dataset.original = mapCoords.textContent.trim();
           mapCoords.textContent = `${mapCoords.dataset.original} · (Waiting for data)`;
        }
        return;
      }

      const elapsed = Date.now() - lastTelemetryTimestamp;

      if (elapsed > TELEMETRY_TIMEOUT_MS && telemetryState === 'ONLINE') {
        updateTelemetryUI('STALE');
      }

      let timeStr = 'Just now';
      if (elapsed >= 1000) {
        const sec = Math.floor(elapsed / 1000);
        if (sec < 60) {
          timeStr = `${sec} sec ago`;
        } else {
          timeStr = `${Math.floor(sec / 60)} min ago`;
        }
      }

      if (safeSubtitle) safeSubtitle.textContent = `Last Updated: ${timeStr}`;

      if (mapCoords && hasValidLocation) {
        if (!mapCoords.dataset.original) {
          mapCoords.dataset.original = mapCoords.textContent.trim();
        }
        if (telemetryState !== 'ONLINE') {
          mapCoords.textContent = `${mapCoords.dataset.original} · (Last Known: ${timeStr})`;
        } else {
          mapCoords.textContent = mapCoords.dataset.original;
        }
      }
    }, 1000);

    /* ---- Devices, WebSocket & API Logic ---- */

    async function loadDevices() {
      try {
        const res = await fetch(`${API_URL}/devices`, { headers: getAuthHeaders() });
        if (handleUnauthorized(res)) return;
        const devices = await res.json();

        const selector = document.getElementById('device-selector');
        selector.innerHTML = '';
        if (!devices || devices.length === 0) {
          selector.innerHTML = '<option value="">No devices found</option>';
          return;
        }

        devices.forEach(d => {
          const opt = document.createElement('option');
          opt.value = d.id;
          opt.textContent = `${d.id} (${d.type || 'UNKNOWN'})`;
          selector.appendChild(opt);
        });

        currentDeviceId = devices[0].id;
        connectWebSocket(currentDeviceId);
        startCameraPoll();

        selector.addEventListener('change', (e) => {
          currentDeviceId = e.target.value;
          connectWebSocket(currentDeviceId);
          startCameraPoll();
        });

      } catch (err) {
        console.error("Failed to load devices", err);
        const selector = document.getElementById('device-selector');
        if (selector) selector.innerHTML = '<option value="">Error loading devices</option>';
      }
    }

    let wsReconnectDelay = 1000;
    const WS_MAX_RECONNECT_DELAY = 30000;
    let manualDisconnect = false;

    function connectWebSocket(deviceId) {
      if (!deviceId) return;

      if (wsConnection) {
        manualDisconnect = true;
        wsConnection.close();
      }
      manualDisconnect = false;

      const wsUrl = `${WS_BASE_URL}/ws/dashboard/${deviceId}`;
      updateTelemetryUI('CONNECTING');

      wsConnection = new WebSocket(wsUrl);

      wsConnection.onopen = () => {
        hideSplash();
        wsReconnectDelay = 1000;
      };

      wsConnection.onmessage = (event) => {
        hideSplash();

        try {
          const data = JSON.parse(event.data);

          if (data.type === 'accident_status' || data.accident_status === 'CONFIRMED' || event.data.includes("CONFIRMED_ACCIDENT")) {
             if (!isCrashed) triggerCrashAlert();
          }
          if (data.type === 'device_status' && data.status === 'offline') {
             updateTelemetryUI('OFFLINE');
             return;
          }

          if (data.speed_kmh !== undefined || data.latitude !== undefined) {
            lastTelemetryTimestamp = Date.now();
            if (telemetryState !== 'ONLINE') updateTelemetryUI('ONLINE');

            if (!isCrashed) {
              live.speed = data.speed_kmh ?? data.speed ?? 0;
              live.lean = data.lean_angle ?? data.lean ?? 0;

              let computedG = data.g_force ?? data.gforce ?? 0.0;
              if (data.ax !== undefined) {
                 computedG = Math.sqrt(data.ax*data.ax + data.ay*data.ay + data.az*data.az);
              }
              live.g = computedG;
              if (data.battery !== undefined) live.batt = data.battery;

              const dt = new Date().toTimeString().slice(0, 8);
              logs = [{ t: dt, m: `Telemetry update: ${live.speed}km/h`, type: 'info' }, ...logs].slice(0, 15);
              renderLog(logs);

              if (data.latitude && data.longitude) {
                if (!hasValidLocation) {
                  currentPos.lat = data.latitude;
                  currentPos.lng = data.longitude;
                  hasValidLocation = true;
                  initMaps();
                } else {
                  currentPos.lat = data.latitude;
                  currentPos.lng = data.longitude;
                  if (riderMarker) riderMarker.setLatLng([currentPos.lat, currentPos.lng]);
                  if (parentMarker) parentMarker.setLatLng([currentPos.lat, currentPos.lng]);
                  if (policeMarker) policeMarker.setLatLng([currentPos.lat, currentPos.lng]);
                }
                const mapCoords = document.getElementById('map-coords');
                if (mapCoords) mapCoords.textContent = `LAT ${currentPos.lat.toFixed(5)}° N · LON ${currentPos.lng.toFixed(5)}° E`;
              }
              setLive();
            }
          }
        } catch (_) {
          if (event.data === "CONFIRMED_ACCIDENT" && !isCrashed) triggerCrashAlert();
        }
      };

      wsConnection.onerror = () => {
        updateTelemetryUI('OFFLINE');
      };

      wsConnection.onclose = () => {
        if (manualDisconnect) return;
        updateTelemetryUI('OFFLINE');
        setTimeout(() => {
          if (!manualDisconnect) connectWebSocket(currentDeviceId);
        }, wsReconnectDelay);
        wsReconnectDelay = Math.min(wsReconnectDelay * 2, WS_MAX_RECONNECT_DELAY);
      };
    }

    const initApp = async () => {
      const uid = getUserId();
      if (!uid) {
        window.location.href = 'login.html';
        return;
      }
      const r = await loadRider() || { name: 'Rider', age: '27', bloodGroup: 'O+', emergency: '+91 90000 00000' };
      updateDashboardUI(r);
      loadDevices();
      setupCommands();
    };

    initApp();

    /* ---- Command API Integration ---- */
    function setupCommands() {
      const cmdBtns = document.querySelectorAll('.cmd-btn');
      const feedback = document.getElementById('command-feedback');
      const badge = document.getElementById('cmd-status-badge');

      cmdBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
          const cmd = btn.dataset.cmd;
          if (!currentDeviceId || !cmd) return;

          feedback.style.display = 'block';
          feedback.textContent = `Sending ${cmd}...`;
          badge.textContent = '● Sending';
          badge.style.color = 'var(--text-muted)';

          btn.disabled = true;

          try {
            const res = await fetch(`${API_URL}/commands`, {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify({ device_id: currentDeviceId, command: cmd })
            });

            if (!res.ok) throw new Error('Command failed');
            const data = await res.json();

            feedback.textContent = `Command status: ${data.status || 'RECEIVED'}`;
            badge.textContent = '● Executed';
            badge.style.color = 'var(--accent)';

            const timeStr = new Date().toTimeString().slice(0, 8);
            logs = [{ t: timeStr, m: `Command ${cmd} sent. Status: ${data.status || 'RECEIVED'}`, type: 'info' }, ...logs].slice(0, 15);
            renderLog(logs);

          } catch (e) {
            feedback.textContent = `Error: ${e.message}`;
            badge.textContent = '● Failed';
            badge.style.color = 'var(--emergency)';
          } finally {
            setTimeout(() => { btn.disabled = false; feedback.style.display = 'none'; }, 3000);
          }
        });
      });
    }

    /* ---- Camera Integration ---- */
    async function fetchCameraMetadata() {
      if (!currentDeviceId) return;
      const statusText = document.getElementById('camera-loading-text');
      const snapshot = document.getElementById('camera-snapshot');
      const stream = document.getElementById('camera-stream');
      const camStatus = document.getElementById('cam-status-badge');
      const lastUpdate = document.getElementById('cam-last-update');

      if (statusText) {
        statusText.style.display = 'block';
        statusText.textContent = 'Fetching camera metadata...';
      }

      try {
        const res = await fetch(`${API_URL}/camera/${currentDeviceId}/metadata`, { headers: getAuthHeaders() });
        if (handleUnauthorized(res)) return;

        if (!res.ok) {
           if (res.status === 404) {
             throw new Error("No camera metadata available for this device");
           }
           if (res.status === 403) {
             throw new Error("Permission denied to access camera metadata");
           }
           throw new Error(`Failed to fetch camera metadata (${res.status})`);
        }

        const data = await res.json();

        if (data.status === 'online' || data.is_online) {
           if (camStatus) {
               camStatus.textContent = '● Live';
               camStatus.style.color = 'var(--accent)';
               camStatus.style.borderColor = 'var(--accent)';
           }
        } else {
           if (camStatus) {
               camStatus.textContent = '○ Offline';
               camStatus.style.color = 'var(--text-secondary)';
               camStatus.style.borderColor = 'var(--border)';
           }
        }

        if (data.last_updated && lastUpdate) {
           const d = new Date(data.last_updated);
           lastUpdate.textContent = d.toLocaleTimeString();
        }

        // Handle stream vs snapshot vs fallback
        if (data.stream_url && (data.stream_url.endsWith('.mp4') || data.stream_url.startsWith('http'))) {
           if (snapshot) snapshot.style.display = 'none';
           if (statusText) statusText.style.display = 'none';
           if (stream) {
             stream.style.display = 'block';
             if (stream.src !== data.stream_url) stream.src = data.stream_url;
           }
        } else if (data.snapshot_url && data.snapshot_url.trim() !== '') {
           if (stream) stream.style.display = 'none';
           if (snapshot) {
             snapshot.onerror = () => {
               snapshot.style.display = 'none';
               if (statusText) {
                 statusText.style.display = 'block';
                 statusText.textContent = "Snapshot image failed to load";
               }
             };
             snapshot.onload = () => {
               if (statusText) statusText.style.display = 'none';
               snapshot.style.display = 'block';
             };
             snapshot.src = data.snapshot_url;
           }
        } else {
           if (stream) stream.style.display = 'none';
           if (snapshot) snapshot.style.display = 'none';
           if (statusText) {
             statusText.style.display = 'block';
             statusText.textContent = "No camera snapshot available";
           }
        }
      } catch (err) {
        if (snapshot) snapshot.style.display = 'none';
        if (stream) stream.style.display = 'none';
        if (statusText) {
          statusText.style.display = 'block';
          statusText.textContent = err.message;
        }
        if (camStatus) {
           camStatus.textContent = '○ Unavailable';
           camStatus.style.color = 'var(--text-secondary)';
           camStatus.style.borderColor = 'var(--border)';
        }
      }
    }

    function startCameraPoll() {
      if (cameraPollTimer) clearInterval(cameraPollTimer);
      fetchCameraMetadata();
      cameraPollTimer = setInterval(fetchCameraMetadata, 30000); // refresh every 30s
    }

    const refCamBtn = document.getElementById('refresh-camera-btn');
    if (refCamBtn) refCamBtn.addEventListener('click', fetchCameraMetadata);

    /* Logout Button */
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        clearAuthData();
        window.location.href = 'index.html';
      });
    }

    /* Maps Initialization */
    function initMaps() {
      if (!window.L || !hasValidLocation) return;
      if (riderMap) return; // already init

      const mapOptions = { zoomControl: true, attributionControl: false };
      const tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      const mapDiv = document.getElementById('map');
      if (mapDiv) {
        riderMap = L.map('map', mapOptions).setView([currentPos.lat, currentPos.lng], 15);
        L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(riderMap);
        riderMarker = L.marker([currentPos.lat, currentPos.lng]).addTo(riderMap);
      }

      const parentMapDiv = document.getElementById('parent-map');
      if (parentMapDiv) {
        parentMap = L.map('parent-map', mapOptions).setView([currentPos.lat, currentPos.lng], 15);
        L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(parentMap);
        parentMarker = L.marker([currentPos.lat, currentPos.lng]).addTo(parentMap);
      }

      const policeMapDiv = document.getElementById('police-map');
      if (policeMapDiv) {
        policeMap = L.map('police-map', mapOptions).setView([currentPos.lat, currentPos.lng], 15);
        L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(policeMap);
        policeMarker = L.marker([currentPos.lat, currentPos.lng]).addTo(policeMap);
      }
    }

    /* Charts (Clearing mock data rendering) */
    function drawRideChart() {
      const canvas = document.getElementById('ride-chart');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = 200 * dpr;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, rect.width, 200);
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.fillText('Awaiting historical data sync...', 20, 100);
    }

    function drawWeekChart() {
      const canvas = document.getElementById('week-chart');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = 160 * dpr;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, rect.width, 160);
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.fillText('Awaiting historical data sync...', 20, 80);
    }

    drawRideChart();
    drawWeekChart();
    setLive();
  }

  return { setupDashboard };
})();

export default BlackBox;

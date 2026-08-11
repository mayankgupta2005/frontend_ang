# Frontend to Backend Mapping

## Overview
- **Framework/Build System:** Vanilla JavaScript with Vite.
- **Environment Variables:** `VITE_API_URL` is used for the backend URL.
- **Authentication:** JWT is stored in `localStorage` as `ns_token`. The `Bearer <token>` pattern is already implemented via `api-config.js`. No Firebase SDK is present in the frontend.
- **Mock/Hardcoded Data:** The frontend contains numerous hardcoded values, specifically `device_001`, fake telemetry charts, simulated crash buttons, hardcoded initial GPS coordinates, seed logs, and dummy admin statistics.
- **Secrets/Security:** No Firebase Admin SDK, JWT secrets, or MongoDB URLs are exposed in the frontend.

## Feature Mapping

| Feature | Current Frontend | Backend Endpoint/WS | Required Change |
| --- | --- | --- | --- |
| **Authentication (Login)** | `POST /api/auth/login` | `POST /api/auth/login` | None. Existing implementation is correct. |
| **Device Management / List** | None. Assumes single rider and hardcoded `device_001`. | `GET /api/devices` | Add a UI component to list devices, displaying type, status, and allowing the user to select an active device. |
| **Device Details / Status** | None. Hardcoded `device_001` status. | `GET /api/devices/{id}/status` | Add logic to fetch and display the selected device's status and metadata (BLACKBOX, ALERT_MODULE, CAMERA). |
| **Live Telemetry** | `ws://<domain>/ws/telemetry/device_001` | `ws://<domain>/ws/dashboard/{device_id}` | Update WebSocket URL to `/ws/dashboard/{device_id}`. Remove fake mock telemetry data and simulated movement. Handle device selection dynamically instead of `device_001`. |
| **Connection State UI** | `CONNECTING`, `ONLINE`, `STALE`, `OFFLINE` implemented based on WS. | Backend WebSocket/Status | Ensure UI states accurately reflect the connection and stale thresholds. Keep LAST KNOWN visible when STALE/OFFLINE. |
| **Accident / SOS UI** | Simulated via "Simulate Crash" button (`POST /api/alerts`). Listens to `CONFIRMED_ACCIDENT` via WS. | `GET /api/devices/{id}/accident` and WS `accident_status` / `device_status` | Remove manual simulation (unless behind dev flag). Read actual `accident_status` from WS payloads to show emergency state. Do not show hardware as executed unless `EXECUTED` is reported. |
| **False Alarm / Cancel** | "Cancel False Alarm" button (`POST /api/cancel-sos`). Sends `FALSE_ALARM` via WS. | `POST /api/cancel-sos` | Ensure it posts using the selected `device_id` dynamically. Update accident/command state based on backend response. |
| **Command UI** | None. | `POST /api/commands`, `GET /api/commands/{id}/status` | Add UI for device controls (e.g., buzzer, LEDs). Display command lifecycle states (PENDING, RECEIVED, EXECUTED, FAILED). |
| **Camera UI** | Hardcoded `<video src="No_I_have_given_the_screensho.mp4">` under Police View. | `GET /api/camera/{id}/metadata`, `POST /api/camera/{id}/metadata` | Adapt Police View or add Camera Section to use `/api/camera/{id}/metadata`. Handle stream URL or snapshot URL correctly. Display offline/unavailable errors. |
| **GPS / Map** | Leaflet maps initialized with hardcoded coordinates. Fake marker updates. | Valid telemetry GPS data | Read valid latitude/longitude from live telemetry. Show "LAST KNOWN LOCATION" if stale. Do not fake coordinates. |
| **Mock Data Removal** | Present in `app.js` and `dashboard.html`. | N/A | Remove `device_001` hardcoding, chart mock data, simulated logs, simulated crash timers, and fake stat generation. |

## Next Steps
1. **Remove Mock Data:** Strip out all fake device IDs, logs, charts, and simulation buttons.
2. **Device Selection UI:** Implement a device selector so the user can pick which device to monitor, allowing dynamic `device_id` usage.
3. **API Integration:** Integrate the missing APIs (`/api/devices`, `/api/commands`, `/api/camera/{id}/metadata`).
4. **WebSocket Update:** Update the telemetry connection to use the correct `/ws/dashboard/{device_id}` endpoint.
5. **Command & Camera UI:** Add UI components to handle device commands and display the camera stream/snapshot correctly.

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';

export function MapPanel({ telemetry, height = "400px" }) {
  const defaultCenter = [28.7041, 77.1025]; // Delhi
  const position = telemetry?.latitude && telemetry?.longitude 
    ? [telemetry.latitude, telemetry.longitude] 
    : defaultCenter;

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg border border-white/10" style={{ height }}>
      <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {telemetry?.latitude && (
          <Marker position={position}>
            <Popup>
              <div className="text-gray-900 font-bold">Rider Position</div>
              <div className="text-gray-600 text-sm">Lat: {telemetry.latitude.toFixed(4)}<br/>Lng: {telemetry.longitude.toFixed(4)}</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function MapView({ route }) {
  // Default to US center
  const center = [41.5, -88];
  const markers = [
    { pos: [44.5, -88.0], label: "Current" },
    { pos: [43.0, -87.0], label: "Pickup" },
    { pos: [38.8, -89.9], label: "Dropoff" },
  ];

  const polyline = markers.map(m => m.pos);

  return (
    <div
      style={{
        height: 320,
        borderRadius: 8,
        overflow: "hidden",
        border: "1px solid #eee",
      }}
    >
      <MapContainer
        center={center}
        zoom={5}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {markers.map((m, i) => (
          <Marker key={i} position={m.pos}>
            <Popup>{m.label}</Popup>
          </Marker>
        ))}
        <Polyline positions={polyline} color="#0077ff" />
      </MapContainer>
    </div>
  );
}

export default MapView;

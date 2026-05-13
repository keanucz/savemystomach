"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MarkerData {
  lat: number;
  lng: number;
  label: string;
  type: "resident" | "stop" | "market";
}

interface MapInnerProps {
  center: [number, number];
  markers: MarkerData[];
  zoom?: number;
}

const MARKER_COLORS: Record<MarkerData["type"], string> = {
  resident: "#2dd4bf", // teal
  stop: "#f97066", // coral
  market: "#9ca3af", // gray
};

function createIcon(type: MarkerData["type"]) {
  const color = MARKER_COLORS[type];
  return L.divIcon({
    html: `<div style="
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: ${color};
      border: 2px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    "></div>`,
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

export default function MapInner({
  center,
  markers,
  zoom = 14,
}: MapInnerProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "300px", width: "100%", borderRadius: "0.5rem" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((marker) => (
        <Marker
          key={`${marker.lat}-${marker.lng}-${marker.label}`}
          position={[marker.lat, marker.lng]}
          icon={createIcon(marker.type)}
        >
          <Popup>{marker.label}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

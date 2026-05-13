"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
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
  lines?: Array<{ from: [number, number]; to: [number, number] }>;
  zoom?: number;
}

const MARKER_COLORS: Record<MarkerData["type"], string> = {
  resident: "#166534",
  stop: "#f97316",
  market: "#6b7280",
};

function createIcon(type: MarkerData["type"]): L.DivIcon {
  const color = MARKER_COLORS[type];
  return L.divIcon({
    html: `<div style="
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: ${color};
      border: 2.5px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.25);
    "></div>`,
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export default function MapInner({
  center,
  markers,
  lines = [],
  zoom = 14,
}: MapInnerProps) {
  return (
    <div className="h-[250px] w-full overflow-hidden rounded-lg sm:h-[350px]">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {lines.map((line, i) => (
          <Polyline
            key={`line-${i}`}
            positions={[line.from, line.to]}
            pathOptions={{ color: "#6b7280", weight: 2, dashArray: "6 4", opacity: 0.7 }}
          />
        ))}
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
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Business } from "@/lib/api";
import { useMapStore } from "@/stores/map";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const CATEGORY_COLORS: Record<string, string> = {
  salud: "#ef4444",
  gastronomia: "#f97316",
  comercio: "#3b82f6",
  educacion: "#8b5cf6",
  servicios: "#06b6d4",
  turismo: "#10b981",
  entretenimiento: "#ec4899",
  otro: "#6b7280",
};

function createIcon(category: string | null) {
  const color = CATEGORY_COLORS[category || "otro"] || CATEGORY_COLORS.otro;
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

function FitBounds({ businesses }: { businesses: Business[] }) {
  const map = useMap();
  useEffect(() => {
    if (businesses.length === 0) return;
    const bounds = L.latLngBounds(
      businesses
        .filter((b) => b.lat && b.lng)
        .map((b) => [b.lat!, b.lng!] as [number, number])
    );
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [businesses, map]);
  return null;
}

export default function BusinessMap() {
  const { businesses, selectBusiness, categoryFilter } = useMapStore();

  const filtered = categoryFilter
    ? businesses.filter((b) => b.category === categoryFilter)
    : businesses;

  const markers = filtered.filter((b) => b.lat && b.lng);

  return (
    <MapContainer
      center={[-12.0464, -77.0428]}
      zoom={14}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds businesses={markers} />
      {markers.map((b) => (
        <Marker
          key={b.id}
          position={[b.lat!, b.lng!]}
          icon={createIcon(b.category)}
          eventHandlers={{ click: () => selectBusiness(b) }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{b.name}</p>
              <p className="text-gray-600">
                {b.category}/{b.subcategory}
              </p>
              {b.address && <p className="text-gray-500">{b.address}</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

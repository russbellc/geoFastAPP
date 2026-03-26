"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { useMapStore } from "@/stores/map";
import "leaflet/dist/leaflet.css";

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

export default function BusinessMap() {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const { businesses, selectBusiness, categoryFilter } = useMapStore();

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-12.0464, -77.0428],
      zoom: 14,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    const map = mapRef.current;
    const markers = markersRef.current;
    if (!map || !markers) return;

    markers.clearLayers();

    const filtered = categoryFilter
      ? businesses.filter((b) => b.category === categoryFilter)
      : businesses;

    const points = filtered.filter((b) => b.lat && b.lng);

    points.forEach((b) => {
      const marker = L.marker([b.lat!, b.lng!], { icon: createIcon(b.category) });
      marker.bindPopup(`
        <div style="font-size:13px;">
          <b>${b.name}</b><br/>
          <span style="color:#666;">${b.category}/${b.subcategory}</span>
          ${b.address ? `<br/><span style="color:#999;">${b.address}</span>` : ""}
        </div>
      `);
      marker.on("click", () => selectBusiness(b));
      markers.addLayer(marker);
    });

    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map((b) => [b.lat!, b.lng!] as [number, number]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  }, [businesses, categoryFilter, selectBusiness]);

  return <div ref={containerRef} className="h-full w-full" />;
}

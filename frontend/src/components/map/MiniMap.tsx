"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MiniMapProps {
  lat: number;
  lng: number;
  name: string;
}

export default function MiniMap({ lat, lng, name }: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Cleanup previous
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 17,
      zoomControl: false,
      dragging: true,
      scrollWheelZoom: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      subdomains: ["a", "b", "c", "d"],
    }).addTo(map);

    const icon = L.divIcon({
      className: "minimap-marker",
      html: `<div style="
        background:#b4c5ff;
        width:16px;height:16px;
        border-radius:50%;
        border:3px solid #fff;
        box-shadow:0 0 12px rgba(180,197,255,0.6), 0 2px 8px rgba(0,0,0,0.4);
      "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    L.marker([lat, lng], { icon }).addTo(map).bindPopup(
      `<div style="font-family:Manrope;font-weight:700;font-size:13px;color:#dae2fd;background:#171f33;padding:8px 12px;border-radius:8px;">${name}</div>`,
      { className: "geointel-popup", closeButton: false }
    ).openPopup();

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, name]);

  return <div ref={containerRef} className="w-full h-full rounded-xl" />;
}

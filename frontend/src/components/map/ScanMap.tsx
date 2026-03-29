"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ScanMapProps {
  lat: number;
  lng: number;
  radiusKm: number;
  onMarkerDrag: (lat: number, lng: number) => void;
}

const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const DARK_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

export default function ScanMap({ lat, lng, radiusKm, onMarkerDrag }: ScanMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 14,
      zoomControl: false,
    });

    L.tileLayer(DARK_TILES, { attribution: DARK_ATTRIBUTION }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Draggable marker
    const markerIcon = L.divIcon({
      className: "scan-marker",
      html: `<div style="
        width: 24px; height: 24px;
        background: #b4c5ff;
        border: 3px solid #fff;
        border-radius: 50%;
        box-shadow: 0 0 16px rgba(180,197,255,0.6), 0 4px 8px rgba(0,0,0,0.3);
        cursor: grab;
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const marker = L.marker([lat, lng], {
      icon: markerIcon,
      draggable: true,
    }).addTo(map);

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      onMarkerDrag(pos.lat, pos.lng);
    });

    // Radius circle
    const circle = L.circle([lat, lng], {
      radius: radiusKm * 1000,
      color: "#b4c5ff",
      fillColor: "#b4c5ff",
      fillOpacity: 0.08,
      weight: 2,
      dashArray: "6 4",
    }).addTo(map);

    markerRef.current = marker;
    circleRef.current = circle;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update marker + circle position
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    const circle = circleRef.current;
    if (!map || !marker || !circle) return;

    marker.setLatLng([lat, lng]);
    circle.setLatLng([lat, lng]);
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng]);

  // Update radius
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radiusKm * 1000);
    }
  }, [radiusKm]);

  return <div ref={containerRef} className="h-full w-full" />;
}

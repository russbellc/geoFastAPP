"use client";

import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import { useMapStore } from "@/stores/map";
import { Business } from "@/lib/api";
import "leaflet/dist/leaflet.css";

const CATEGORY_COLORS: Record<string, string> = {
  salud: "#ffb4ab",
  gastronomia: "#4edea3",
  comercio: "#b4c5ff",
  educacion: "#adc8f5",
  servicios: "#4edea3",
  turismo: "#7f9fff",
  entretenimiento: "#4edea3",
  otro: "#8e9199",
};

const CLUSTER_THRESHOLD = 50;

function createIcon(category: string | null) {
  const color = CATEGORY_COLORS[category || "otro"] || CATEGORY_COLORS.otro;
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background:${color};
      width:14px;height:14px;
      border-radius:50%;
      border:2px solid rgba(11,19,38,0.8);
      box-shadow:0 0 8px ${color}80, 0 2px 6px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function createClusterIcon(count: number) {
  const size = count < 10 ? 36 : count < 50 ? 42 : count < 100 ? 48 : 54;
  const color = count < 10 ? "#b4c5ff" : count < 50 ? "#7f9fff" : count < 100 ? "#4edea3" : "#ffb4ab";
  return L.divIcon({
    className: "cluster-marker",
    html: `<div style="
      background:${color}30;
      width:${size}px;height:${size}px;
      border-radius:50%;
      border:2px solid ${color};
      box-shadow:0 0 12px ${color}60;
      display:flex;align-items:center;justify-content:center;
      font-family:Inter,sans-serif;font-weight:700;font-size:${size < 42 ? 12 : 14}px;color:#dae2fd;
    ">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** Cluster precision based on zoom level: higher zoom = more decimals = smaller clusters */
function getClusterPrecision(zoom: number): number {
  if (zoom >= 17) return 4;
  if (zoom >= 15) return 3;
  if (zoom >= 13) return 3;
  if (zoom >= 10) return 2;
  return 1;
}

interface Cluster {
  lat: number;
  lng: number;
  businesses: Business[];
}

function clusterPoints(points: Business[], precision: number): Cluster[] {
  const groups: Record<string, Business[]> = {};
  for (const b of points) {
    const key = `${b.lat!.toFixed(precision)},${b.lng!.toFixed(precision)}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  }
  return Object.values(groups).map((businesses) => {
    const lat = businesses.reduce((s, b) => s + b.lat!, 0) / businesses.length;
    const lng = businesses.reduce((s, b) => s + b.lng!, 0) / businesses.length;
    return { lat, lng, businesses };
  });
}

const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const DARK_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

export default function BusinessMap() {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const markerMapRef = useRef<Map<number, L.Marker>>(new Map());
  const pointsRef = useRef<Business[]>([]);
  const { businesses, selectBusiness, categoryFilter, focusBusiness } = useMapStore();

  const renderMarkers = useCallback(() => {
    const map = mapRef.current;
    const markers = markersRef.current;
    if (!map || !markers) return;

    markers.clearLayers();
    markerMapRef.current.clear();

    const points = pointsRef.current;
    const zoom = map.getZoom();
    const shouldCluster = points.length > CLUSTER_THRESHOLD;

    if (shouldCluster) {
      const precision = getClusterPrecision(zoom);
      const clusters = clusterPoints(points, precision);

      for (const cluster of clusters) {
        if (cluster.businesses.length === 1) {
          // Single business - render normal marker
          const b = cluster.businesses[0];
          const color = CATEGORY_COLORS[b.category || "otro"] || CATEGORY_COLORS.otro;
          const marker = L.marker([b.lat!, b.lng!], { icon: createIcon(b.category) });
          marker.bindPopup(`
            <div style="font-family:Inter,sans-serif;font-size:12px;color:#dae2fd;background:#171f33;padding:12px;border-radius:12px;min-width:200px;border:1px solid #43474e30;">
              <div style="font-family:Manrope,sans-serif;font-weight:700;font-size:14px;margin-bottom:4px;">${b.name}</div>
              <div style="color:#c4c6cf;font-size:11px;margin-bottom:6px;">${b.category || "General"} ${b.subcategory ? `/ ${b.subcategory}` : ""}</div>
              ${b.address ? `<div style="color:#8e9199;font-size:10px;margin-bottom:4px;">
                <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${color};box-shadow:0 0 6px ${color}80;margin-right:4px;"></span>
                ${b.address}
              </div>` : ""}
              ${b.phone ? `<div style="color:#4edea3;font-size:10px;">Tel: ${b.phone}</div>` : ""}
              ${b.website ? `<div style="color:#b4c5ff;font-size:10px;margin-top:2px;">Web: ${b.website}</div>` : ""}
            </div>
          `, { className: "geointel-popup", closeButton: false });
          marker.on("click", () => selectBusiness(b));
          markers.addLayer(marker);
          markerMapRef.current.set(b.id, marker);
        } else {
          // Cluster marker
          const clusterMarker = L.marker([cluster.lat, cluster.lng], {
            icon: createClusterIcon(cluster.businesses.length),
          });
          const names = cluster.businesses.slice(0, 5).map((b) => b.name).join("<br>");
          const extra = cluster.businesses.length > 5 ? `<br><span style="color:#8e9199;font-size:10px;">+${cluster.businesses.length - 5} mas...</span>` : "";
          clusterMarker.bindPopup(`
            <div style="font-family:Inter,sans-serif;font-size:12px;color:#dae2fd;background:#171f33;padding:12px;border-radius:12px;min-width:180px;border:1px solid #43474e30;">
              <div style="font-family:Manrope,sans-serif;font-weight:700;font-size:13px;margin-bottom:6px;">${cluster.businesses.length} negocios</div>
              <div style="color:#c4c6cf;font-size:11px;line-height:1.6;">${names}${extra}</div>
            </div>
          `, { className: "geointel-popup", closeButton: false });
          clusterMarker.on("click", () => {
            map.setView([cluster.lat, cluster.lng], zoom + 2, { animate: true });
          });
          markers.addLayer(clusterMarker);
        }
      }
    } else {
      // No clustering needed - render all individual markers
      points.forEach((b) => {
        const color = CATEGORY_COLORS[b.category || "otro"] || CATEGORY_COLORS.otro;
        const marker = L.marker([b.lat!, b.lng!], { icon: createIcon(b.category) });
        marker.bindPopup(`
          <div style="font-family:Inter,sans-serif;font-size:12px;color:#dae2fd;background:#171f33;padding:12px;border-radius:12px;min-width:200px;border:1px solid #43474e30;">
            <div style="font-family:Manrope,sans-serif;font-weight:700;font-size:14px;margin-bottom:4px;">${b.name}</div>
            <div style="color:#c4c6cf;font-size:11px;margin-bottom:6px;">${b.category || "General"} ${b.subcategory ? `/ ${b.subcategory}` : ""}</div>
            ${b.address ? `<div style="color:#8e9199;font-size:10px;margin-bottom:4px;">
              <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${color};box-shadow:0 0 6px ${color}80;margin-right:4px;"></span>
              ${b.address}
            </div>` : ""}
            ${b.phone ? `<div style="color:#4edea3;font-size:10px;">Tel: ${b.phone}</div>` : ""}
            ${b.website ? `<div style="color:#b4c5ff;font-size:10px;margin-top:2px;">Web: ${b.website}</div>` : ""}
          </div>
        `, { className: "geointel-popup", closeButton: false });
        marker.on("click", () => selectBusiness(b));
        markers.addLayer(marker);
        markerMapRef.current.set(b.id, marker);
      });
    }
  }, [selectBusiness]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-12.0464, -77.0428],
      zoom: 14,
      zoomControl: false,
    });

    L.tileLayer(DARK_TILES, { attribution: DARK_ATTRIBUTION }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Re-render clusters on zoom change
    map.on("zoomend", () => {
      if (pointsRef.current.length > CLUSTER_THRESHOLD) {
        renderMarkers();
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [renderMarkers]);

  // Update markers when data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const filtered = categoryFilter
      ? businesses.filter((b) => b.category === categoryFilter)
      : businesses;

    pointsRef.current = filtered.filter((b) => b.lat && b.lng);
    renderMarkers();

    if (pointsRef.current.length > 0) {
      const bounds = L.latLngBounds(pointsRef.current.map((b) => [b.lat!, b.lng!] as [number, number]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  }, [businesses, categoryFilter, renderMarkers]);

  // Focus on business (zoom + open popup)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusBusiness || !focusBusiness.lat || !focusBusiness.lng) return;

    map.setView([focusBusiness.lat, focusBusiness.lng], 18, { animate: true });

    // Open popup after zoom animation
    setTimeout(() => {
      const marker = markerMapRef.current.get(focusBusiness.id);
      if (marker) {
        marker.openPopup();
      }
    }, 500);
  }, [focusBusiness]);

  return <div ref={containerRef} className="h-full w-full" />;
}

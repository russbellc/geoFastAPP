"use client";

import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";

interface DrawMapProps {
  onPolygonDrawn: (coords: [number, number][]) => void;
  onPolygonCleared: () => void;
}

export default function DrawMap({ onPolygonDrawn, onPolygonCleared }: DrawMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

  const stableOnDrawn = useCallback(onPolygonDrawn, [onPolygonDrawn]);
  const stableOnCleared = useCallback(onPolygonCleared, [onPolygonCleared]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-12.0464, -77.0428],
      zoom: 13,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    const drawControl = new L.Control.Draw({
      position: "topright",
      draw: {
        polygon: {
          allowIntersection: false,
          shapeOptions: {
            color: "#3b82f6",
            weight: 2,
            fillOpacity: 0.15,
          },
        },
        polyline: false,
        circle: false,
        rectangle: false,
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });
    map.addControl(drawControl);

    // Evento: poligono dibujado
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.on(L.Draw.Event.CREATED, (e: any) => {
      drawnItems.clearLayers();
      const layer = e.layer as L.Polygon;
      drawnItems.addLayer(layer);

      const latLngs = (layer.getLatLngs()[0] as L.LatLng[]);
      const coords: [number, number][] = latLngs.map((ll) => [ll.lat, ll.lng]);
      stableOnDrawn(coords);
    });

    // Evento: poligono editado
    map.on(L.Draw.Event.EDITED, () => {
      drawnItems.eachLayer((layer) => {
        const polygon = layer as L.Polygon;
        const latLngs = (polygon.getLatLngs()[0] as L.LatLng[]);
        const coords: [number, number][] = latLngs.map((ll) => [ll.lat, ll.lng]);
        stableOnDrawn(coords);
      });
    });

    // Evento: poligono eliminado
    map.on(L.Draw.Event.DELETED, () => {
      stableOnCleared();
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [stableOnDrawn, stableOnCleared]);

  return <div ref={containerRef} className="h-full w-full rounded-lg" />;
}

"use client";

import dynamic from "next/dynamic";

const DrawMap = dynamic(() => import("./DrawMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-800 rounded-lg">
      <p className="text-gray-400">Cargando mapa...</p>
    </div>
  ),
});

export default function DrawMapWrapper(props: {
  onPolygonDrawn: (coords: [number, number][]) => void;
  onPolygonCleared: () => void;
}) {
  return <DrawMap {...props} />;
}

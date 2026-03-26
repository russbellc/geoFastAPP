"use client";

import dynamic from "next/dynamic";

const DrawMap = dynamic(() => import("./DrawMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-surface-container-lowest rounded-2xl">
      <p className="text-on-surface-variant text-sm">Loading map...</p>
    </div>
  ),
});

export default function DrawMapWrapper(props: {
  onPolygonDrawn: (coords: [number, number][]) => void;
  onPolygonCleared: () => void;
}) {
  return <DrawMap {...props} />;
}

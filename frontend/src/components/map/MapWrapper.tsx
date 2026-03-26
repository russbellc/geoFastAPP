"use client";

import dynamic from "next/dynamic";

const BusinessMap = dynamic(() => import("./BusinessMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-surface-container-lowest">
      <p className="text-on-surface-variant text-sm">Loading map...</p>
    </div>
  ),
});

export default function MapWrapper() {
  return <BusinessMap />;
}

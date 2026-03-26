"use client";

import dynamic from "next/dynamic";

const BusinessMap = dynamic(() => import("./BusinessMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-900">
      <p className="text-gray-400">Cargando mapa...</p>
    </div>
  ),
});

export default function MapWrapper() {
  return <BusinessMap />;
}

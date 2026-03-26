"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useMapStore } from "@/stores/map";
import MapWrapper from "@/components/map/MapWrapper";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardPage() {
  const { setBusinesses, setTerritoryId } = useMapStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getBusinesses({ per_page: 100 });
        setBusinesses(data.items);
        if (data.items.length > 0) {
          setTerritoryId(data.items[0].territory_id);
        }
      } catch (err) {
        console.error("Error cargando negocios:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [setBusinesses, setTerritoryId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400">Cargando negocios...</p>
      </div>
    );
  }

  return (
    <>
      <Sidebar />
      <div className="flex-1">
        <MapWrapper />
      </div>
    </>
  );
}

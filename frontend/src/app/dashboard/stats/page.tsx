"use client";

import { useEffect, useState } from "react";
import { api, TerritoryStats } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#ef4444", "#f97316", "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#ec4899", "#6b7280"];
const LEAD_COLORS: Record<string, string> = { hot: "#ef4444", warm: "#f59e0b", cold: "#6b7280" };

export default function StatsPage() {
  const [stats, setStats] = useState<TerritoryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTerritoryStats(1).then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex-1 flex items-center justify-center"><p className="text-gray-400">Cargando estadisticas...</p></div>;
  if (!stats) return <div className="flex-1 flex items-center justify-center"><p className="text-gray-400">Sin datos disponibles</p></div>;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">{stats.territory_name} — Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total negocios" value={stats.total_businesses} />
        <KpiCard label="Enriquecidos" value={stats.total_enriched} />
        <KpiCard label="Score promedio" value={stats.avg_opportunity_score ? `${stats.avg_opportunity_score}` : "N/A"} />
        <KpiCard label="Categorias" value={stats.categories.length} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Distribucion por categoria */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h3 className="text-white font-semibold mb-4">Negocios por categoria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.categories}>
              <XAxis dataKey="category" tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <YAxis tick={{ fill: "#9ca3af" }} />
              <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }} labelStyle={{ color: "#fff" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {stats.categories.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribucion de leads */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h3 className="text-white font-semibold mb-4">Distribucion de leads</h3>
          {stats.lead_distribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={stats.lead_distribution} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name || ""}: ${value}`}>
                  {stats.lead_distribution.map((entry) => (
                    <Cell key={entry.status} fill={LEAD_COLORS[entry.status] || "#6b7280"} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">Enriquece negocios para ver leads</p>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}

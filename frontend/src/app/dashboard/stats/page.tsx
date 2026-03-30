"use client";

import { useEffect, useState } from "react";
import { api, TerritoryStats } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const PIE_COLORS = ["#b4c5ff", "#4edea3", "#adc8f5", "#2d3449"];

export default function StatsPage() {
  const [stats, setStats] = useState<TerritoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanCount, setScanCount] = useState(0);

  useEffect(() => {
    // Load global stats by aggregating across all territories from scan history
    (async () => {
      try {
        const history = await api.getScanHistory();
        const doneScans = history.filter((s: any) => s.status === "done" && s.total_found > 0);
        setScanCount(doneScans.length);

        // Try loading stats from first available territory, then aggregate
        const territoryIds = Array.from(new Set(doneScans.map((s: any) => s.territory_id)));
        let aggregated: TerritoryStats | null = null;

        for (const tid of territoryIds) {
          try {
            const tStats = await api.getTerritoryStats(tid);
            if (!aggregated) {
              aggregated = { ...tStats, territory_name: "Global" };
            } else {
              aggregated.total_businesses += tStats.total_businesses;
              aggregated.total_enriched += tStats.total_enriched;
              // Merge categories
              for (const cat of tStats.categories) {
                const existing = aggregated.categories.find((c) => c.category === cat.category);
                if (existing) existing.count += cat.count;
                else aggregated.categories.push({ ...cat });
              }
              // Merge lead distribution
              for (const ld of tStats.lead_distribution) {
                const existing = aggregated.lead_distribution.find((l) => l.status === ld.status);
                if (existing) existing.count += ld.count;
                else aggregated.lead_distribution.push({ ...ld });
              }
            }
          } catch { /* skip territory */ }
        }

        if (aggregated) {
          aggregated.categories.sort((a, b) => b.count - a.count);
          setStats(aggregated);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-on-surface-variant text-sm">Cargando datos de inteligencia...</p>
      </div>
    );
  }

  const kpis = stats
    ? [
        { icon: "storefront", label: "Total Negocios", value: stats.total_businesses.toLocaleString(), trend: "", color: "primary" },
        { icon: "ads_click", label: "Leads Generados", value: stats.total_enriched.toLocaleString(), trend: "", color: "secondary" },
        { icon: "public", label: "Territorios Escaneados", value: scanCount.toString(), trend: "", color: "tertiary" },
      ]
    : [
        { icon: "storefront", label: "Total Negocios", value: "0", trend: "--", color: "primary" },
        { icon: "ads_click", label: "Leads Generados", value: "0", trend: "--", color: "secondary" },
        { icon: "public", label: "Territorios Escaneados", value: "0", trend: "--", color: "tertiary" },
      ];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-10 pt-8 pb-12 bg-surface-dim">
      {/* Header */}
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight mb-2">
            Panel de Inteligencia
          </h2>
          <p className="text-on-surface-variant font-body">
            Distribucion geoespacial de negocios y seguimiento de generacion de leads en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-tertiary px-3 py-1 bg-tertiary-container/30 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-tertiary rounded-full blur-[1px]" />
            Monitoreo en Vivo
          </span>
          <button className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all">
            <span className="material-symbols-outlined text-sm">filter_list</span>
            Filtros
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-surface-container-low p-6 rounded-xl group hover:bg-surface-container/80 transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 bg-${kpi.color}/10 rounded-lg text-${kpi.color}`}>
                <span className="material-symbols-outlined">{kpi.icon}</span>
              </div>
              {kpi.trend && (
                <span className="text-tertiary text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  {kpi.trend}
                </span>
              )}
            </div>
            <h3 className="text-on-surface-variant text-sm font-medium mb-1">{kpi.label}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-headline font-black text-on-surface">{kpi.value}</span>
              <span className="text-on-surface-variant text-xs">entidades activas</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Geospatial Distribution placeholder */}
          <div className="bg-surface-container-low rounded-xl overflow-hidden">
            <div className="p-6 flex justify-between items-center bg-surface-container-high/40">
              <div>
                <h3 className="font-headline font-bold text-on-surface">Distribucion Geoespacial</h3>
                <p className="text-xs text-on-surface-variant">
                  {stats?.territory_name || "Territorio"} — Negocios activos
                </p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs font-bold bg-primary text-on-primary rounded-lg transition-all">
                  Mapa de Calor
                </button>
                <button className="px-3 py-1.5 text-xs font-bold bg-surface-container-highest text-on-surface-variant rounded-lg hover:text-on-surface transition-all">
                  Cluster
                </button>
              </div>
            </div>
            <div className="h-[300px] relative bg-surface-container-lowest">
              {/* Decorative heatmap overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-surface-dim/80 to-transparent" />
              <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-primary/20 blur-[60px] rounded-full" />
              <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-tertiary/10 blur-[80px] rounded-full" />
              <div className="absolute bottom-1/3 left-1/2 w-24 h-24 bg-secondary/15 blur-[50px] rounded-full" />
              {/* Legend */}
              <div className="absolute bottom-6 right-6 bg-surface-container-highest/90 backdrop-blur-md p-4 rounded-xl border border-outline-variant/10">
                <h4 className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">
                  Leyenda de Densidad
                </h4>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-[10px] text-on-surface">Alta Concentracion</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-tertiary" />
                    <span className="text-[10px] text-on-surface">Mercado Emergente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-on-surface-variant/20" />
                    <span className="text-[10px] text-on-surface">Baja Densidad</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Timeline (Bar Chart) */}
          <div className="bg-surface-container-low p-6 rounded-xl">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="font-headline font-bold text-on-surface">Linea de Tiempo</h3>
                <p className="text-xs text-on-surface-variant">
                  Entidades de negocio por categoria
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Actual
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-outline-variant/30" /> Anterior
                </span>
              </div>
            </div>
            {stats && stats.categories.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.categories}>
                  <XAxis
                    dataKey="category"
                    tick={{ fill: "#c4c6cf", fontSize: 11, fontFamily: "Inter" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#c4c6cf", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#2d3449",
                      border: "1px solid #43474e",
                      borderRadius: 8,
                      color: "#dae2fd",
                      fontFamily: "Inter",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#b4c5ff" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-end justify-between gap-2 px-2">
                <div className="w-full flex items-end gap-1.5 h-full">
                  {[40, 35, 55, 75, 60, 45, 85, 70, 50, 95, 65, 55, 80, 60, 40].map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-t-sm hover:bg-primary/40 transition-all duration-300 ${
                        [3, 6, 9, 12].includes(i)
                          ? "bg-primary/60 hover:bg-primary"
                          : "bg-surface-container-highest"
                      }`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-8">
          {/* Market Distribution Donut */}
          <div className="bg-surface-container-low p-6 rounded-xl">
            <h3 className="font-headline font-bold text-on-surface mb-6">Distribucion del Mercado</h3>
            {stats && stats.categories.length > 0 ? (
              <>
                <div className="w-48 h-48 mx-auto mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.categories.slice(0, 4)}
                        dataKey="count"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        strokeWidth={0}
                      >
                        {stats.categories.slice(0, 4).map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  {stats.categories.slice(0, 4).map((cat, i) => (
                    <div key={cat.category} className="flex justify-between items-center group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">
                          {cat.category}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-on-surface-variant">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <DonutPlaceholder />
            )}
          </div>

          {/* Recent Leads */}
          <div className="bg-surface-container-low p-6 rounded-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-on-surface">Leads Recientes</h3>
              <a className="text-xs font-bold text-primary hover:underline" href="/dashboard/leads">
                Ver Todo
              </a>
            </div>
            <div className="space-y-6">
              <LeadItem icon="restaurant" name="The Golden Plate" location="San Francisco, CA" status="Alto Potencial" statusColor="text-tertiary" />
              <LeadItem icon="medical_services" name="Wellness Core Clinic" location="Oakland, CA" status="Monitoreando" statusColor="text-on-surface-variant" />
              <LeadItem icon="terminal" name="Quant Systems" location="Palo Alto, CA" status="Contactado" statusColor="text-primary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadItem({
  icon, name, location, status, statusColor,
}: {
  icon: string; name: string; location: string; status: string; statusColor: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-lg bg-surface-container-high flex-shrink-0 flex items-center justify-center border border-outline-variant/10">
        <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
      </div>
      <div>
        <h4 className="text-sm font-bold text-on-surface">{name}</h4>
        <p className="text-xs text-on-surface-variant mb-1">{location}</p>
        <span className={`text-[10px] font-bold ${statusColor} uppercase tracking-tighter`}>
          {status}
        </span>
      </div>
    </div>
  );
}

function DonutPlaceholder() {
  return (
    <>
      <div className="relative w-48 h-48 mx-auto mb-8">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="none" stroke="#2d3449" strokeWidth="3.5" />
          <circle cx="18" cy="18" r="16" fill="none" stroke="#b4c5ff" strokeWidth="3.5" strokeDasharray="45, 100" strokeLinecap="round" />
          <circle cx="18" cy="18" r="16" fill="none" stroke="#4edea3" strokeWidth="3.5" strokeDasharray="25, 100" strokeDashoffset="-45" strokeLinecap="round" />
          <circle cx="18" cy="18" r="16" fill="none" stroke="#adc8f5" strokeWidth="3.5" strokeDasharray="15, 100" strokeDashoffset="-70" strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-headline font-black text-on-surface">100%</span>
          <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Categorizado</span>
        </div>
      </div>
      <div className="space-y-4">
        {[
          { color: "bg-primary", label: "Tecnologia", pct: "45%" },
          { color: "bg-tertiary", label: "Comercio", pct: "25%" },
          { color: "bg-secondary", label: "Servicios", pct: "15%" },
          { color: "bg-surface-container-highest", label: "Otros", pct: "15%" },
        ].map((item) => (
          <div key={item.label} className="flex justify-between items-center group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-sm font-medium text-on-surface">{item.label}</span>
            </div>
            <span className="text-xs font-bold text-on-surface-variant">{item.pct}</span>
          </div>
        ))}
      </div>
    </>
  );
}

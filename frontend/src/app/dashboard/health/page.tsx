"use client";

import { useEffect, useState } from "react";
import { api, Business, HealthStats } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const LEAD_COLORS: Record<string, string> = { hot: "#ffb4ab", warm: "#adc8f5", cold: "#8e9199" };
const SUBCAT_COLORS = ["#4edea3", "#b4c5ff", "#adc8f5", "#7f9fff", "#4edea3", "#ffb4ab", "#8e9199", "#2d3449"];

const SUBCAT_ICONS: Record<string, string> = {
  clinica: "local_hospital",
  hospital: "emergency",
  consultorio: "stethoscope",
  dentista: "dentistry",
  farmacia: "medication",
  psicologia: "psychology",
  fisioterapia: "physical_therapy",
  laboratorio: "biotech",
  optica: "visibility",
  nutricion: "restaurant",
  ginecologia: "pregnant_woman",
  dermatologia: "dermatology",
  pediatria: "child_care",
  centro_medico: "medical_information",
  veterinaria: "pets",
};

export default function HealthPage() {
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getHealthStats(),
      api.getBusinesses({ category: "salud", per_page: 100 }),
    ])
      .then(([healthStats, bizData]) => {
        setStats(healthStats);
        setBusinesses(bizData.items);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-on-surface-variant text-sm">Loading health intelligence...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-10 pt-8 pb-12 bg-surface-dim">
      {/* Header */}
      <div className="mb-10 flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-tertiary-container/30 rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-tertiary text-3xl" style={{ fontVariationSettings: '"FILL" 1' }}>
              local_hospital
            </span>
          </div>
          <div>
            <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight mb-1">
              Health Niche Intelligence
            </h2>
            <p className="text-on-surface-variant font-body">
              Specialized health sector analysis — clinics, practices, pharmacies & more.
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-tertiary px-3 py-1 bg-tertiary-container/30 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-tertiary rounded-full blur-[1px]" />
          LiaFlow Scoring
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <HealthKpi
          icon="local_hospital"
          label="Health Businesses"
          value={stats?.total_health || 0}
          color="tertiary"
        />
        <HealthKpi
          icon="ads_click"
          label="Enriched Profiles"
          value={stats?.total_enriched || 0}
          color="primary"
        />
        <HealthKpi
          icon="speed"
          label="Avg Score"
          value={stats?.avg_opportunity_score ? Math.round(stats.avg_opportunity_score) : 0}
          color="secondary"
        />
        <HealthKpi
          icon="whatshot"
          label="Hot Leads"
          value={stats?.lead_distribution.find(l => l.status === "hot")?.count || 0}
          color="error"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Subcategories Chart */}
        <div className="lg:col-span-2 bg-surface-container-low p-6 rounded-xl">
          <h3 className="font-headline font-bold text-on-surface mb-6">Subcategory Distribution</h3>
          {stats && stats.subcategories.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.subcategories} layout="vertical">
                <XAxis type="number" tick={{ fill: "#c4c6cf", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="subcategory"
                  type="category"
                  tick={{ fill: "#c4c6cf", fontSize: 11, fontFamily: "Inter" }}
                  axisLine={false}
                  tickLine={false}
                  width={120}
                />
                <Tooltip
                  contentStyle={{ background: "#2d3449", border: "1px solid #43474e", borderRadius: 8, color: "#dae2fd", fontSize: 12 }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {stats.subcategories.map((_, i) => (
                    <Cell key={i} fill={SUBCAT_COLORS[i % SUBCAT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Scan a territory with niche 'salud' to see subcategory data" />
          )}
        </div>

        {/* Lead Distribution Donut */}
        <div className="bg-surface-container-low p-6 rounded-xl">
          <h3 className="font-headline font-bold text-on-surface mb-6">Lead Quality</h3>
          {stats && stats.lead_distribution.length > 0 ? (
            <>
              <div className="w-40 h-40 mx-auto mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.lead_distribution}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      strokeWidth={0}
                    >
                      {stats.lead_distribution.map((entry) => (
                        <Cell key={entry.status} fill={LEAD_COLORS[entry.status] || "#2d3449"} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {stats.lead_distribution.map((lead) => (
                  <div key={lead.status} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: LEAD_COLORS[lead.status] }} />
                      <span className="text-sm font-medium text-on-surface capitalize">{lead.status}</span>
                    </div>
                    <span className="text-xs font-bold text-on-surface-variant">{lead.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState message="Enrich health businesses to see lead distribution" />
          )}

          {/* Sources */}
          {stats && stats.sources.length > 0 && (
            <div className="mt-8 pt-6 border-t border-outline-variant/10">
              <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">Data Sources</h4>
              <div className="space-y-2">
                {stats.sources.map((src) => (
                  <div key={src.category} className="flex justify-between items-center">
                    <span className="text-sm text-on-surface capitalize">{src.category}</span>
                    <span className="text-xs font-bold text-on-surface-variant">{src.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Health Businesses Grid */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-headline font-bold text-on-surface text-lg">Health Directory</h3>
          <span className="text-xs text-on-surface-variant">{businesses.length} businesses</span>
        </div>
        {businesses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {businesses.map((biz) => (
              <HealthBusinessCard key={biz.id} business={biz} />
            ))}
          </div>
        ) : (
          <EmptyState message="No health businesses found. Launch a scan with niche 'salud' to discover health businesses." />
        )}
      </div>
    </div>
  );
}

function HealthKpi({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className="bg-surface-container-low p-6 rounded-xl hover:bg-surface-container/80 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg bg-${color}/10 text-${color}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
      <h3 className="text-on-surface-variant text-sm font-medium mb-1">{label}</h3>
      <span className="text-3xl font-headline font-black text-on-surface">{value}</span>
    </div>
  );
}

function HealthBusinessCard({ business }: { business: Business }) {
  const icon = SUBCAT_ICONS[business.subcategory || ""] || "local_hospital";
  return (
    <div className="bg-surface-container-high p-5 rounded-xl hover:bg-surface-container-highest transition-all group cursor-pointer">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-tertiary-container/20 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-tertiary text-lg">{icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-headline font-bold text-sm text-on-surface group-hover:text-primary transition-colors truncate">
            {business.name}
          </h4>
          <p className="text-[11px] text-on-surface-variant truncate">{business.address || "Unknown location"}</p>
          <div className="flex gap-2 mt-2">
            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-tertiary-container/20 text-tertiary border border-tertiary/20 uppercase">
              {business.subcategory || "salud"}
            </span>
            {business.source !== "osm" && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant border border-outline-variant/10 uppercase">
                {business.source}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-3">
        <span className="material-symbols-outlined text-3xl text-on-surface-variant/30">search_off</span>
        <p className="text-on-surface-variant text-sm max-w-sm">{message}</p>
      </div>
    </div>
  );
}

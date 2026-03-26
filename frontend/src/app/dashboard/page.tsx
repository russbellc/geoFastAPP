"use client";

import { useEffect, useState } from "react";
import { api, Business } from "@/lib/api";
import { useMapStore } from "@/stores/map";
import MapWrapper from "@/components/map/MapWrapper";

export default function DashboardPage() {
  const { businesses, setBusinesses, setTerritoryId, selectedBusiness, selectBusiness, categoryFilter, setCategoryFilter } = useMapStore();
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
        console.error("Error loading businesses:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [setBusinesses, setTerritoryId]);

  const categories = Array.from(new Set(businesses.map((b) => b.category || "otro"))).sort();
  const filtered = categoryFilter
    ? businesses.filter((b) => b.category === categoryFilter)
    : businesses;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Opportunities Sidebar */}
      <aside className="w-96 bg-surface-container-low flex flex-col z-30 shadow-2xl shrink-0">
        {/* Filters Header */}
        <div className="p-5 space-y-4 bg-surface-container-low shadow-sm">
          <div className="flex justify-between items-center">
            <h2 className="font-headline font-bold text-lg text-on-surface">Opportunities</h2>
            <span className="text-[10px] font-bold bg-surface-container-highest px-2 py-1 rounded text-primary tracking-widest">
              {filtered.length} RESULTS
            </span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <select
                value={categoryFilter || ""}
                onChange={(e) => setCategoryFilter(e.target.value || null)}
                className="w-full bg-surface-container-highest border-none rounded-lg py-2 pl-3 pr-8 text-xs font-medium focus:ring-1 focus:ring-primary/40 appearance-none text-on-surface"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-sm">
                expand_more
              </span>
            </div>
            <div className="flex-1 relative">
              <select className="w-full bg-surface-container-highest border-none rounded-lg py-2 pl-3 pr-8 text-xs font-medium focus:ring-1 focus:ring-primary/40 appearance-none text-on-surface">
                <option>All Scores</option>
                <option>Score &gt; 80</option>
                <option>Score &gt; 50</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-sm">
                filter_alt
              </span>
            </div>
          </div>
        </div>

        {/* Business List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-on-surface-variant text-sm">Loading businesses...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-on-surface-variant text-sm">No businesses found</p>
            </div>
          ) : (
            filtered.map((biz) => (
              <OpportunityCard
                key={biz.id}
                business={biz}
                isSelected={selectedBusiness?.id === biz.id}
                onClick={() => selectBusiness(biz)}
              />
            ))
          )}
        </div>
      </aside>

      {/* Map Area */}
      <section className="flex-1 relative bg-surface-container-lowest">
        <MapWrapper />

        {/* Map Legend */}
        <div className="absolute bottom-8 left-8 bg-surface-container-low/90 backdrop-blur-md p-4 rounded-2xl z-[1000] shadow-2xl border border-outline-variant/10">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-3">
            Territory Heatmap
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-primary glow-pip" style={{ color: "#b4c5ff" }} />
              <span className="text-[11px] font-medium text-on-surface">High Concentration</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-tertiary glow-pip" style={{ color: "#4edea3" }} />
              <span className="text-[11px] font-medium text-on-surface">Emerging Market</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-error glow-pip" style={{ color: "#ffb4ab" }} />
              <span className="text-[11px] font-medium text-on-surface">Low Activity</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function OpportunityCard({
  business,
  isSelected,
  onClick,
}: {
  business: Business;
  isSelected: boolean;
  onClick: () => void;
}) {
  const score = Math.floor(Math.random() * 50) + 50; // placeholder until profiles loaded
  const leadStatus = score >= 80 ? "hot" : score >= 50 ? "warm" : "cold";

  const statusStyles = {
    hot: "bg-error/10 text-error border-error/20",
    warm: "bg-secondary/10 text-secondary border-secondary/20",
    cold: "bg-outline-variant/20 text-on-surface-variant border-outline-variant/20",
  };

  const scoreColor = {
    hot: "text-tertiary",
    warm: "text-primary",
    cold: "text-on-surface-variant",
  };

  return (
    <div
      onClick={onClick}
      className={`group p-4 rounded-xl transition-all cursor-pointer ${
        isSelected
          ? "bg-surface-container-highest ring-1 ring-primary/30"
          : "bg-surface-container-high hover:bg-surface-container-highest"
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-headline font-bold text-sm group-hover:text-primary transition-colors truncate">
            {business.name}
          </h3>
          <p className="text-[11px] text-on-surface-variant truncate">
            {business.address || "Unknown"} | {business.category || "General"}
          </p>
        </div>
        <div className="flex flex-col items-end ml-3">
          <span className={`${scoreColor[leadStatus]} font-black text-lg leading-none`}>
            {score}
          </span>
          <span className="text-[8px] uppercase tracking-tighter text-on-surface-variant">
            OPP SCORE
          </span>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 uppercase ${statusStyles[leadStatus]}`}>
          <span className={`w-1.5 h-1.5 rounded-full glow-pip ${
            leadStatus === "hot" ? "bg-error" : leadStatus === "warm" ? "bg-secondary" : "bg-outline-variant"
          }`} style={{ color: leadStatus === "hot" ? "#ffb4ab" : leadStatus === "warm" ? "#adc8f5" : undefined }} />
          {leadStatus}
        </span>
        {business.category && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant border border-outline-variant/10 uppercase">
            {business.category}
          </span>
        )}
      </div>
    </div>
  );
}

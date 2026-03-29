"use client";

import { useEffect, useState, useCallback } from "react";
import { api, Business } from "@/lib/api";
import { useMapStore } from "@/stores/map";
import MapWrapper from "@/components/map/MapWrapper";

export default function DashboardPage() {
  const { setBusinesses, setTerritoryId, selectedBusiness, selectBusiness } = useMapStore();

  const [items, setItems] = useState<Business[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [territories, setTerritories] = useState<{ id: number; name: string }[]>([]);
  const [selectedTerritory, setSelectedTerritory] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const perPage = 20;

  // Load territories from scan history
  useEffect(() => {
    async function loadTerritories() {
      try {
        const history = await api.getScanHistory();
        const done = history.filter((h: any) => h.status === "done" && h.total_found > 0);
        const terrs = done.map((h: any) => ({
          id: h.territory_id,
          name: `#${h.territory_id}${h.nicho ? ` — ${h.nicho}` : ""} (${h.total_found})`,
        }));
        setTerritories(terrs);
        if (terrs.length > 0) setSelectedTerritory(terrs[0].id);
      } catch {}
    }
    loadTerritories();
  }, []);

  // Load businesses (server-side filtering)
  const loadBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (selectedTerritory) params.territory_id = selectedTerritory;
      if (categoryFilter) params.category = categoryFilter;
      if (searchQuery) params.search = searchQuery;

      const data = await api.getBusinesses(params);
      setItems(data.items);
      setTotal(data.total);
      setBusinesses(data.items);
      if (selectedTerritory) setTerritoryId(selectedTerritory);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedTerritory, categoryFilter, searchQuery, setBusinesses, setTerritoryId]);

  useEffect(() => {
    if (selectedTerritory !== null) loadBusinesses();
  }, [loadBusinesses, selectedTerritory]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [selectedTerritory, categoryFilter, searchQuery]);

  // Get categories for the current territory (load all to get category list)
  const [categories, setCategories] = useState<string[]>([]);
  useEffect(() => {
    if (!selectedTerritory) return;
    api.getBusinesses({ territory_id: selectedTerritory, per_page: 1 }).then(() => {
      // We'll derive categories from stats instead
      api.getTerritoryStats(selectedTerritory).then((stats) => {
        setCategories(stats.categories.map((c: any) => c.category));
      }).catch(() => {});
    }).catch(() => {});
  }, [selectedTerritory]);

  const totalPages = Math.ceil(total / perPage);

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar */}
      <aside data-onboarding="opportunities" className="w-96 bg-surface-container-low flex flex-col z-30 shadow-2xl shrink-0">
        {/* Header */}
        <div className="p-4 space-y-3 bg-surface-container-low shadow-sm">
          <div className="flex justify-between items-center">
            <h2 className="font-headline font-bold text-lg text-on-surface">Oportunidades</h2>
            <span className="text-[10px] font-bold bg-surface-container-highest px-2 py-1 rounded text-primary tracking-widest">
              {total} RESULTADOS
            </span>
          </div>

          {/* Territory selector */}
          {territories.length > 0 && (
            <div className="relative">
              <select
                value={selectedTerritory || ""}
                onChange={(e) => setSelectedTerritory(Number(e.target.value))}
                className="w-full bg-surface-container-highest border-none rounded-lg py-2 pl-3 pr-8 text-xs font-medium focus:ring-1 focus:ring-primary/40 appearance-none text-on-surface"
              >
                {territories.map((t) => (
                  <option key={t.id} value={t.id}>Territorio {t.name}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-sm">map</span>
            </div>
          )}

          {/* Search */}
          <div className="flex gap-2">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Buscar negocio..."
              className="flex-1 px-3 py-2 bg-surface-container-highest border-none rounded-lg text-xs text-on-surface focus:ring-1 focus:ring-primary/40 outline-none placeholder:text-on-surface-variant/40"
            />
            <button onClick={handleSearch} className="px-2 py-2 bg-primary text-on-primary rounded-lg">
              <span className="material-symbols-outlined text-sm">search</span>
            </button>
            {searchQuery && (
              <button onClick={() => { setSearchInput(""); setSearchQuery(""); }} className="px-2 py-2 bg-surface-container-highest text-on-surface-variant rounded-lg">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>

          {/* Category + Score filters */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <select
                value={categoryFilter || ""}
                onChange={(e) => setCategoryFilter(e.target.value || null)}
                className="w-full bg-surface-container-highest border-none rounded-lg py-2 pl-3 pr-8 text-xs font-medium focus:ring-1 focus:ring-primary/40 appearance-none text-on-surface"
              >
                <option value="">Todas las Categorias</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-sm">expand_more</span>
            </div>
          </div>

          {searchQuery && (
            <p className="text-xs text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">search</span>
              Buscando: &quot;{searchQuery}&quot;
            </p>
          )}
        </div>

        {/* Business List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-on-surface-variant text-sm">Cargando negocios...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-on-surface-variant text-sm">
                {searchQuery ? `No se encontro "${searchQuery}"` : "No se encontraron negocios"}
              </p>
            </div>
          ) : (
            items.map((biz) => (
              <OpportunityCard
                key={biz.id}
                business={biz}
                isSelected={selectedBusiness?.id === biz.id}
                onClick={() => selectBusiness(biz)}
              />
            ))
          )}
        </div>

        {/* Paginator */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-outline-variant/10 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-surface-container-highest text-on-surface-variant rounded-lg text-xs font-bold disabled:opacity-30 hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <span className="text-xs text-on-surface-variant">
              Pag. <span className="text-on-surface font-bold">{page}</span> de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 bg-surface-container-highest text-on-surface-variant rounded-lg text-xs font-bold disabled:opacity-30 hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        )}
      </aside>

      {/* Map */}
      <section data-onboarding="map" className="flex-1 relative bg-surface-container-lowest">
        <MapWrapper />
        <div className="absolute bottom-8 left-8 bg-surface-container-low/90 backdrop-blur-md p-4 rounded-2xl z-[1000] shadow-2xl border border-outline-variant/10">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-3">Mapa de Calor</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-primary glow-pip" style={{ color: "#b4c5ff" }} />
              <span className="text-[11px] font-medium text-on-surface">Alta Concentracion</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-tertiary glow-pip" style={{ color: "#4edea3" }} />
              <span className="text-[11px] font-medium text-on-surface">Mercado Emergente</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-error glow-pip" style={{ color: "#ffb4ab" }} />
              <span className="text-[11px] font-medium text-on-surface">Baja Actividad</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function OpportunityCard({
  business, isSelected, onClick,
}: { business: Business; isSelected: boolean; onClick: () => void }) {
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
            {business.address || "Desconocido"} | {business.category || "General"}
          </p>
        </div>
        <div className="flex flex-col items-end ml-3">
          <span className="text-on-surface-variant/50 text-[9px] uppercase tracking-tighter">
            {business.source || "osm"}
          </span>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        {business.category && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant border border-outline-variant/10 uppercase">
            {business.category}
          </span>
        )}
        {business.subcategory && business.subcategory !== business.category && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant border border-outline-variant/10 uppercase">
            {business.subcategory}
          </span>
        )}
        {business.website && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase">
            web
          </span>
        )}
        {business.phone && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-tertiary-container/20 text-tertiary border border-tertiary/20 uppercase">
            tel
          </span>
        )}
      </div>
    </div>
  );
}

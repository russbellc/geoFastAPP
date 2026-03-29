"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api, Business } from "@/lib/api";
import { useMapStore } from "@/stores/map";
import MapWrapper from "@/components/map/MapWrapper";

export default function DashboardPage() {
  const { setBusinesses, setTerritoryId, selectedBusiness, selectBusiness, zoomToBusiness } = useMapStore();

  const [items, setItems] = useState<Business[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Filters
  const [territories, setTerritories] = useState<{ id: number; name: string }[]>([]);
  const [selectedTerritory, setSelectedTerritory] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [subcategoryFilter, setSubcategoryFilter] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Category/subcategory options
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<{ subcategory: string; count: number }[]>([]);

  const perPage = 50;

  // Load territories
  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  // Load categories when territory changes
  useEffect(() => {
    if (!selectedTerritory) return;
    api.getTerritoryStats(selectedTerritory).then((stats) => {
      setCategories(stats.categories.map((c: any) => c.category));
    }).catch(() => {});
  }, [selectedTerritory]);

  // Load subcategories when category changes (dependent combo)
  useEffect(() => {
    if (!selectedTerritory) return;
    setSubcategoryFilter([]);
    if (!categoryFilter) {
      setSubcategories([]);
      return;
    }
    const token = api.getToken();
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/stats/territory/${selectedTerritory}/subcategories?category=${categoryFilter}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setSubcategories(data.map((d: any) => ({ subcategory: d.subcategory, count: d.count }))))
      .catch(() => setSubcategories([]));
  }, [categoryFilter, selectedTerritory]);

  // Load businesses
  const loadBusinesses = useCallback(async (pageNum: number, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const params: Record<string, string | number> = { page: pageNum, per_page: perPage };
      if (selectedTerritory) params.territory_id = selectedTerritory;
      if (categoryFilter) params.category = categoryFilter;
      if (subcategoryFilter.length > 0) params.subcategory = subcategoryFilter.join(",");
      if (searchQuery) params.search = searchQuery;

      const data = await api.getBusinesses(params);
      const newItems = append ? [...items, ...data.items] : data.items;
      setItems(newItems);
      setTotal(data.total);
      setHasMore(newItems.length < data.total);
      setBusinesses(newItems);
      if (selectedTerritory) setTerritoryId(selectedTerritory);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedTerritory, categoryFilter, subcategoryFilter, searchQuery, items, setBusinesses, setTerritoryId]);

  // Initial load + filter changes
  useEffect(() => {
    setPage(1);
    setItems([]);
    if (selectedTerritory !== null) loadBusinesses(1, false);
  }, [selectedTerritory, categoryFilter, subcategoryFilter, searchQuery]);

  // Infinite scroll
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || loadingMore || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadBusinesses(nextPage, true);
    }
  }, [loadingMore, hasMore, page, loadBusinesses]);

  const handleSearch = () => setSearchQuery(searchInput);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar */}
      <aside data-onboarding="opportunities" className="w-96 bg-surface-container-low flex flex-col z-30 shadow-2xl shrink-0">
        {/* Header */}
        <div className="p-4 space-y-3 bg-surface-container-low shadow-sm shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="font-headline font-bold text-lg text-on-surface">Oportunidades</h2>
            <span className="text-[10px] font-bold bg-surface-container-highest px-2 py-1 rounded text-primary tracking-widest">
              {total} RESULTADOS
            </span>
          </div>

          {/* Territory */}
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

          {/* Category + Subcategory (dependent) */}
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
          {/* Subcategory multi-selector */}
          {subcategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {subcategories.map((sc) => {
                const selected = subcategoryFilter.includes(sc.subcategory);
                return (
                  <button
                    key={sc.subcategory}
                    onClick={() => setSubcategoryFilter(
                      selected
                        ? subcategoryFilter.filter((s) => s !== sc.subcategory)
                        : [...subcategoryFilter, sc.subcategory]
                    )}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                      selected
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-highest text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {sc.subcategory} ({sc.count})
                  </button>
                );
              })}
              {subcategoryFilter.length > 0 && (
                <button
                  onClick={() => setSubcategoryFilter([])}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-all"
                >
                  Limpiar
                </button>
              )}
            </div>
          )}

          {searchQuery && (
            <p className="text-xs text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">search</span>
              Buscando: &quot;{searchQuery}&quot;
            </p>
          )}
        </div>

        {/* Business List (infinite scroll) */}
        <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
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
            <>
              {items.map((biz) => (
                <OpportunityCard
                  key={biz.id}
                  business={biz}
                  isSelected={selectedBusiness?.id === biz.id}
                  onClick={() => selectBusiness(biz)}
                  onDoubleClick={() => zoomToBusiness(biz)}
                />
              ))}
              {loadingMore && (
                <div className="flex items-center justify-center py-4">
                  <p className="text-on-surface-variant text-xs">Cargando mas...</p>
                </div>
              )}
              {!hasMore && items.length > 0 && (
                <p className="text-center text-on-surface-variant/50 text-[10px] py-2">
                  Mostrando {items.length} de {total}
                </p>
              )}
            </>
          )}
        </div>
      </aside>

      {/* Map */}
      <section data-onboarding="map" className="flex-1 relative bg-surface-container-lowest">
        <MapWrapper />
        <div className="absolute bottom-8 left-8 bg-surface-container-low/90 backdrop-blur-md p-4 rounded-2xl z-[1000] shadow-2xl border border-outline-variant/10">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-3">Mapa de Calor</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-primary glow-pip" style={{ color: "#b4c5ff" }} /><span className="text-[11px] font-medium text-on-surface">Alta Concentracion</span></div>
            <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-tertiary glow-pip" style={{ color: "#4edea3" }} /><span className="text-[11px] font-medium text-on-surface">Mercado Emergente</span></div>
            <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-error glow-pip" style={{ color: "#ffb4ab" }} /><span className="text-[11px] font-medium text-on-surface">Baja Actividad</span></div>
          </div>
        </div>
      </section>
    </div>
  );
}

function OpportunityCard({ business, isSelected, onClick, onDoubleClick }: { business: Business; isSelected: boolean; onClick: () => void; onDoubleClick: () => void }) {
  return (
    <div onClick={onClick} onDoubleClick={onDoubleClick} className={`group p-4 rounded-xl transition-all cursor-pointer ${isSelected ? "bg-surface-container-highest ring-1 ring-primary/30" : "bg-surface-container-high hover:bg-surface-container-highest"}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-headline font-bold text-sm group-hover:text-primary transition-colors truncate">{business.name}</h3>
          <p className="text-[11px] text-on-surface-variant truncate">{business.address || "Desconocido"}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {business.category && <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant border border-outline-variant/10 uppercase">{business.category}</span>}
        {business.subcategory && business.subcategory !== business.category && <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase">{business.subcategory}</span>}
        {business.website && <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-tertiary-container/20 text-tertiary border border-tertiary/20 uppercase">web</span>}
        {business.phone && <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/20 uppercase">tel</span>}
      </div>
    </div>
  );
}

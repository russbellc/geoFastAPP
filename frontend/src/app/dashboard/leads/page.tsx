"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { api, Business, BusinessProfile } from "@/lib/api";
import ScoreExplainer from "@/components/ScoreExplainer";

const MiniMap = dynamic(() => import("@/components/map/MiniMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-surface-container-lowest rounded-xl flex items-center justify-center"><p className="text-on-surface-variant text-xs">Cargando mapa...</p></div>,
});

export default function LeadsPage() {
  const [items, setItems] = useState<Business[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Filters
  const [territories, setTerritories] = useState<{ id: number; name: string }[]>([]);
  const [selectedTerritory, setSelectedTerritory] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<{ subcategory: string; count: number }[]>([]);

  // Items with profiles included
  const [profileMap, setProfileMap] = useState<Record<number, any>>({});

  // Modal
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<BusinessProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

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
      } catch {}
    })();
  }, []);

  // Load categories (global or per territory)
  useEffect(() => {
    if (selectedTerritory) {
      api.getTerritoryStats(Number(selectedTerritory)).then((stats) => {
        setCategories(stats.categories.map((c: any) => c.category));
      }).catch(() => setCategories([]));
    } else {
      // Load all categories
      api.getBusinesses({ per_page: 1 }).then(() => {
        setCategories(["salud", "gastronomia", "comercio", "educacion", "servicios", "turismo", "entretenimiento", "otro"]);
      }).catch(() => {});
    }
  }, [selectedTerritory]);

  // Load subcategories when category changes (global endpoint)
  useEffect(() => {
    setSubcategoryFilter([]);
    if (!categoryFilter) { setSubcategories([]); return; }
    const token = api.getToken();
    const params = new URLSearchParams({ category: categoryFilter });
    if (selectedTerritory) params.set("territory_id", selectedTerritory);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/stats/subcategories?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(data => {
      setSubcategories(data.map((d: any) => ({ subcategory: d.subcategory, count: d.count })));
    }).catch(() => setSubcategories([]));
  }, [categoryFilter, selectedTerritory]);

  // Load businesses
  const loadBusinesses = useCallback(async (pageNum: number, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const params: Record<string, string | number> = { page: pageNum, per_page: perPage };
      if (selectedTerritory) params.territory_id = Number(selectedTerritory);
      if (categoryFilter) params.category = categoryFilter;
      if (subcategoryFilter.length > 0) params.subcategory = subcategoryFilter.join(",");
      if (searchQuery) params.search = searchQuery;

      // Use with-profiles endpoint for single query
      const token = api.getToken();
      const queryStr = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/businesses/with-profiles?${queryStr}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      // Extract businesses and profiles
      const bizItems: Business[] = data.items.map((item: any) => ({
        id: item.id, territory_id: item.territory_id, name: item.name,
        category: item.category, subcategory: item.subcategory,
        lat: item.lat, lng: item.lng, address: item.address,
        phone: item.phone, website: item.website, email: item.email,
        source: item.source, osm_id: item.osm_id,
      }));
      const newProfileMap = append ? { ...profileMap } : {};
      for (const item of data.items) {
        if (item.profile) newProfileMap[item.id] = item.profile;
      }

      const newItems = append ? [...items, ...bizItems] : bizItems;
      setItems(newItems);
      setTotal(data.total);
      setHasMore(newItems.length < data.total);
      setProfileMap(newProfileMap);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setLoadingMore(false); }
  }, [selectedTerritory, categoryFilter, subcategoryFilter, searchQuery, items]);

  useEffect(() => {
    setPage(1);
    setItems([]);
    loadBusinesses(1, false);
  }, [selectedTerritory, categoryFilter, subcategoryFilter, searchQuery]);

  // Infinite scroll
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || loadingMore || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
      const next = page + 1;
      setPage(next);
      loadBusinesses(next, true);
    }
  }, [loadingMore, hasMore, page, loadBusinesses]);

  // Open detail modal
  const handleDoubleClick = async (biz: Business) => {
    setSelectedBiz(biz);
    setSelectedProfile(null);
    setLoadingProfile(true);
    try {
      const profile = await api.getBusinessProfile(biz.id);
      setSelectedProfile(profile);
    } catch {}
    setLoadingProfile(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header + Filters */}
      <div className="px-6 pt-6 pb-4 bg-surface-dim shrink-0 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-headline font-extrabold text-on-surface tracking-tight">Leads</h2>
            <ScoreExplainer />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                const params: Record<string, string | number> = {};
                if (selectedTerritory) params.territory_id = Number(selectedTerritory);
                if (categoryFilter) params.category = categoryFilter;
                const query = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
                try {
                  const token = api.getToken();
                  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/businesses/enrich/batch?${query}`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  const data = await res.json();
                  alert(`Enriquecimiento lanzado: ${data.pending} negocios pendientes`);
                } catch {}
              }}
              className="gradient-primary text-on-primary-fixed px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-primary-container/20"
            >
              <span className="material-symbols-outlined text-sm">auto_fix_high</span>
              Enriquecer Todos
            </button>
            <button
              onClick={async () => {
                try {
                  const params: Record<string, string | number> = {};
                  if (selectedTerritory) params.territory_id = Number(selectedTerritory);
                  if (categoryFilter) params.category = categoryFilter;
                  const blob = await api.exportCsv(params);
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `leads_export_${new Date().toISOString().slice(0, 10)}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                } catch { alert("Error al exportar CSV"); }
              }}
              className="bg-surface-container-highest text-on-surface-variant hover:text-on-surface px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border border-outline-variant/20"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              CSV
            </button>
            <button
              onClick={() => {
                const params: Record<string, string | number> = {};
                if (selectedTerritory) params.territory_id = Number(selectedTerritory);
                if (categoryFilter) params.category = categoryFilter;
                window.open(api.exportPdfUrl(params), "_blank");
              }}
              className="bg-surface-container-highest text-on-surface-variant hover:text-on-surface px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border border-outline-variant/20"
            >
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
              PDF
            </button>
            <span className="text-[10px] font-bold bg-surface-container-highest px-2 py-1 rounded text-primary tracking-widest">
              {total} RESULTADOS
            </span>
          </div>
        </div>

        {/* Row 1: Territory + Search */}
        <div className="flex gap-3">
          <div className="relative w-52">
            <select value={selectedTerritory} onChange={(e) => setSelectedTerritory(e.target.value)}
              className="w-full bg-surface-container-highest border-none rounded-lg py-2 pl-3 pr-8 text-xs font-medium focus:ring-1 focus:ring-primary/40 appearance-none text-on-surface">
              <option value="">Todos los Territorios</option>
              {territories.map(t => <option key={t.id} value={t.id}>Territorio {t.name}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-sm">map</span>
          </div>
          <div className="flex-1 flex gap-2">
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setSearchQuery(searchInput)}
              placeholder="Buscar negocio por nombre..."
              className="flex-1 px-3 py-2 bg-surface-container-highest border-none rounded-lg text-xs text-on-surface focus:ring-1 focus:ring-primary/40 outline-none placeholder:text-on-surface-variant/40" />
            <button onClick={() => setSearchQuery(searchInput)} className="px-2 py-2 bg-primary text-on-primary rounded-lg">
              <span className="material-symbols-outlined text-sm">search</span>
            </button>
            {searchQuery && (
              <button onClick={() => { setSearchInput(""); setSearchQuery(""); }} className="px-2 py-2 bg-surface-container-highest text-on-surface-variant rounded-lg">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Category + Subcategory */}
        <div className="flex gap-3 items-start">
          <div className="relative w-44">
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-surface-container-highest border-none rounded-lg py-2 pl-3 pr-8 text-xs font-medium focus:ring-1 focus:ring-primary/40 appearance-none text-on-surface">
              <option value="">Todas las Categorias</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-sm">expand_more</span>
          </div>
          {subcategories.length > 0 && (
            <div className="flex-1 flex flex-wrap gap-1.5">
              {subcategories.map(sc => {
                const sel = subcategoryFilter.includes(sc.subcategory);
                return (
                  <button key={sc.subcategory}
                    onClick={() => setSubcategoryFilter(sel ? subcategoryFilter.filter(s => s !== sc.subcategory) : [...subcategoryFilter, sc.subcategory])}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${sel ? "bg-primary text-on-primary" : "bg-surface-container-highest text-on-surface-variant hover:text-on-surface"}`}>
                    {sc.subcategory} ({sc.count})
                  </button>
                );
              })}
              {subcategoryFilter.length > 0 && (
                <button onClick={() => setSubcategoryFilter([])} className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-error/10 text-error">Limpiar</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-on-surface-variant text-sm">Cargando leads...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-on-surface-variant text-sm">{searchQuery ? `No se encontro "${searchQuery}"` : "No se encontraron negocios"}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-2">
              {items.map(biz => {
                const profile = profileMap[biz.id];
                const score = profile?.opportunity_score;
                const status = profile?.lead_status;
                const gmaps = (profile?.tech_stack as any)?.gmaps;
                const isEnriched = !!profile?.enriched_at;

                return (
                  <div key={biz.id} onDoubleClick={() => handleDoubleClick(biz)}
                    className={`p-4 rounded-xl hover:bg-surface-container-highest transition-all cursor-pointer group ${isEnriched ? "bg-surface-container-high ring-1 ring-primary/10" : "bg-surface-container-high"}`}>
                    {/* Header: name + score */}
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-headline font-bold text-sm text-on-surface group-hover:text-primary transition-colors truncate flex-1 mr-2">{biz.name}</h3>
                      {score != null && (
                        <div className="flex flex-col items-end shrink-0">
                          <span className={`font-black text-lg leading-none ${score >= 80 ? "text-tertiary" : score >= 50 ? "text-primary" : "text-on-surface-variant"}`}>{score}</span>
                          <span className="text-[7px] uppercase text-on-surface-variant tracking-wider">PTS</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-on-surface-variant truncate mb-2">{biz.address || "Ubicacion desconocida"}</p>

                    {/* GMaps rating */}
                    {gmaps?.rating && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="material-symbols-outlined text-yellow-400 text-xs" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                        <span className="text-xs font-bold text-on-surface">{gmaps.rating}</span>
                        {gmaps.reviews_count != null && <span className="text-[10px] text-on-surface-variant">({gmaps.reviews_count})</span>}
                      </div>
                    )}

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {status && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase ${
                          status === "hot" ? "bg-error/10 text-error border border-error/20" :
                          status === "warm" ? "bg-secondary/10 text-secondary border border-secondary/20" :
                          "bg-outline-variant/20 text-on-surface-variant border border-outline-variant/20"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status === "hot" ? "bg-error" : status === "warm" ? "bg-secondary" : "bg-outline-variant"}`} />
                          {status === "hot" ? "Caliente" : status === "warm" ? "Tibio" : "Frio"}
                        </span>
                      )}
                      {biz.category && <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant border border-outline-variant/10 uppercase">{biz.category}</span>}
                      {biz.subcategory && biz.subcategory !== biz.category && <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase">{biz.subcategory}</span>}
                      {biz.website && <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-tertiary-container/20 text-tertiary border border-tertiary/20 uppercase">web</span>}
                      {biz.phone && <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/20 uppercase">tel</span>}
                      {biz.source !== "osm" && <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-error/10 text-error border border-error/20 uppercase">{biz.source}</span>}
                      {isEnriched && <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-tertiary/10 text-tertiary border border-tertiary/20 uppercase">enriquecido</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            {loadingMore && <p className="text-center text-on-surface-variant text-xs py-4">Cargando mas...</p>}
            {!hasMore && items.length > 0 && <p className="text-center text-on-surface-variant/50 text-[10px] py-3">Mostrando {items.length} de {total}</p>}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedBiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedBiz(null)} />
          <div className="relative bg-surface-container-low rounded-3xl p-8 max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto custom-scrollbar shadow-2xl border border-outline-variant/10">
            {/* Close */}
            <button onClick={() => setSelectedBiz(null)} className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined">close</span>
            </button>

            {/* Header */}
            <div className="flex gap-4 mb-6">
              <div className="w-14 h-14 bg-surface-container-highest rounded-2xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: '"FILL" 1' }}>domain</span>
              </div>
              <div>
                <h2 className="text-xl font-headline font-extrabold text-on-surface tracking-tight">{selectedBiz.name}</h2>
                <p className="text-on-surface-variant text-sm">{selectedBiz.category}{selectedBiz.subcategory ? ` / ${selectedBiz.subcategory}` : ""}</p>
              </div>
            </div>

            {/* Mini Map */}
            {selectedBiz.lat && selectedBiz.lng && (
              <div className="h-48 rounded-xl overflow-hidden mb-6 border border-outline-variant/10">
                <MiniMap lat={selectedBiz.lat} lng={selectedBiz.lng} name={selectedBiz.name} />
              </div>
            )}

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <InfoRow icon="location_on" label="Direccion" value={selectedBiz.address} />
              <InfoRow icon="phone" label="Telefono" value={selectedBiz.phone} link={selectedBiz.phone ? `tel:${selectedBiz.phone}` : undefined} />
              <InfoRow icon="language" label="Sitio Web" value={selectedBiz.website} link={selectedBiz.website || undefined} />
              <InfoRow icon="mail" label="Email" value={selectedBiz.email} link={selectedBiz.email ? `mailto:${selectedBiz.email}` : undefined} />
              <InfoRow icon="pin_drop" label="Coordenadas" value={selectedBiz.lat && selectedBiz.lng ? `${selectedBiz.lat.toFixed(5)}, ${selectedBiz.lng.toFixed(5)}` : null} />
              <InfoRow icon="source" label="Fuente" value={selectedBiz.source} />
            </div>

            {/* Profile section */}
            {loadingProfile ? (
              <p className="text-on-surface-variant text-sm py-4">Cargando perfil...</p>
            ) : selectedProfile ? (
              <div className="space-y-5 border-t border-outline-variant/10 pt-6">
                {/* Score + Status */}
                <div className="flex items-center gap-6">
                  <div className="relative w-20 h-20 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#2d3449" strokeWidth="3" />
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#b4c5ff" strokeWidth="3"
                        strokeDasharray={`${(selectedProfile.opportunity_score || 0)}, 100`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-headline font-black text-on-surface">{selectedProfile.opportunity_score || 0}</span>
                      <span className="text-[8px] text-on-surface-variant uppercase">Puntaje</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      selectedProfile.lead_status === "hot" ? "bg-error-container/30 text-error" :
                      selectedProfile.lead_status === "warm" ? "bg-secondary/10 text-secondary" :
                      "bg-outline-variant/20 text-on-surface-variant"
                    }`}>
                      {selectedProfile.lead_status === "hot" ? "Caliente" : selectedProfile.lead_status === "warm" ? "Tibio" : "Frio"}
                    </span>
                    <ScoreExplainer />
                    </div>
                    {selectedProfile.enriched_at && (
                      <p className="text-[10px] text-on-surface-variant mt-2">
                        Enriquecido: {new Date(selectedProfile.enriched_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* GMaps Data */}
                {(() => {
                  const gmaps = (selectedProfile.tech_stack as any)?.gmaps;
                  if (!gmaps) return null;
                  return (
                    <div className="bg-surface-container-high/50 p-4 rounded-xl">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">map</span> Google Maps
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        {gmaps.rating && (
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <span className="text-lg font-bold text-on-surface">{gmaps.rating}</span>
                              <span className="material-symbols-outlined text-yellow-400 text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                            </div>
                            <p className="text-[9px] text-on-surface-variant uppercase">Rating</p>
                          </div>
                        )}
                        {gmaps.reviews_count != null && (
                          <div className="text-center">
                            <p className="text-lg font-bold text-on-surface">{gmaps.reviews_count}</p>
                            <p className="text-[9px] text-on-surface-variant uppercase">Reviews</p>
                          </div>
                        )}
                        {gmaps.gmaps_category && (
                          <div className="text-center">
                            <p className="text-xs font-medium text-on-surface truncate">{gmaps.gmaps_category}</p>
                            <p className="text-[9px] text-on-surface-variant uppercase">Categoria</p>
                          </div>
                        )}
                      </div>
                      {gmaps.hours && (
                        <p className="text-xs text-on-surface-variant mt-3 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">schedule</span> {gmaps.hours}
                        </p>
                      )}
                      {gmaps.gmaps_url && (
                        <a href={gmaps.gmaps_url} target="_blank" rel="noopener" className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">open_in_new</span> Ver en Google Maps
                        </a>
                      )}
                    </div>
                  );
                })()}

                {/* AI Summary */}
                {selectedProfile.ai_summary && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Resumen IA</h4>
                    <p className="text-on-surface-variant text-sm leading-relaxed">{selectedProfile.ai_summary}</p>
                  </div>
                )}

                {/* Tech Stack */}
                {selectedProfile.tech_stack && Array.isArray((selectedProfile.tech_stack as any).detected) && (selectedProfile.tech_stack as any).detected.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Tecnologia Detectada</h4>
                    <div className="flex flex-wrap gap-2">
                      {((selectedProfile.tech_stack as any).detected as string[]).map((t: string) => (
                        <span key={t} className="text-xs px-3 py-1 bg-surface-container-highest rounded-lg text-on-surface">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Signals */}
                <div className="grid grid-cols-4 gap-3">
                  <SignalBadge icon="calendar_month" label="Reservas" active={selectedProfile.has_online_booking} />
                  <SignalBadge icon="smart_toy" label="Chatbot" active={selectedProfile.has_chatbot} />
                  <SignalBadge icon="search" label="SEO" value={selectedProfile.seo_score ? `${selectedProfile.seo_score}` : undefined} active={!!selectedProfile.seo_score} />
                  <SignalBadge icon="verified" label="Enriquecido" active={!!selectedProfile.enriched_at} />
                </div>

                {/* Social */}
                {(selectedProfile.facebook_url || selectedProfile.instagram_url || selectedProfile.tiktok_url) && (
                  <div className="flex gap-3">
                    {selectedProfile.instagram_url && <a href={selectedProfile.instagram_url} target="_blank" rel="noopener" className="text-xs text-pink-400 hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-sm">photo_camera</span>Instagram</a>}
                    {selectedProfile.facebook_url && <a href={selectedProfile.facebook_url} target="_blank" rel="noopener" className="text-xs text-blue-400 hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-sm">thumb_up</span>Facebook</a>}
                    {selectedProfile.tiktok_url && <a href={selectedProfile.tiktok_url} target="_blank" rel="noopener" className="text-xs text-cyan-400 hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-sm">music_note</span>TikTok</a>}
                  </div>
                )}
              </div>
            ) : (
              <div className="border-t border-outline-variant/10 pt-6">
                <p className="text-on-surface-variant text-sm mb-3">Este negocio aun no ha sido enriquecido.</p>
                <button onClick={async () => {
                  try {
                    await api.enrichBusiness(selectedBiz.id);
                    // Poll for completion
                    const pollEnrich = setInterval(async () => {
                      try {
                        const p = await api.getBusinessProfile(selectedBiz.id);
                        if (p && p.enriched_at) {
                          clearInterval(pollEnrich);
                          setSelectedProfile(p);
                          setLoadingProfile(false);
                        }
                      } catch {}
                    }, 5000);
                    setLoadingProfile(true);
                    // Timeout after 3 min
                    setTimeout(() => { clearInterval(pollEnrich); setLoadingProfile(false); }, 180000);
                  } catch {}
                }} className="gradient-primary text-on-primary-fixed px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                  Enriquecer Negocio (GMaps + Web + IA)
                </button>
                <p className="text-[10px] text-on-surface-variant/50 mt-2">
                  Busca en Google Maps, scrapea el sitio web (si tiene) y genera resumen con IA.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value, link }: { icon: string; label: string; value: string | null | undefined; link?: string }) {
  if (!value) return (
    <div className="flex items-start gap-2">
      <span className="material-symbols-outlined text-on-surface-variant/30 text-sm mt-0.5">{icon}</span>
      <div><p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{label}</p><p className="text-xs text-on-surface-variant/40">—</p></div>
    </div>
  );
  return (
    <div className="flex items-start gap-2">
      <span className="material-symbols-outlined text-primary text-sm mt-0.5">{icon}</span>
      <div>
        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{label}</p>
        {link ? <a href={link} target="_blank" rel="noopener" className="text-xs text-primary hover:underline break-all">{value}</a> : <p className="text-xs text-on-surface break-all">{value}</p>}
      </div>
    </div>
  );
}

function SignalBadge({ icon, label, active, value }: { icon: string; label: string; active: boolean; value?: string }) {
  return (
    <div className={`p-3 rounded-xl text-center ${active ? "bg-surface-container-highest" : "bg-surface-container-high/30"}`}>
      <span className={`material-symbols-outlined text-lg ${active ? "text-tertiary" : "text-on-surface-variant/30"}`}>{icon}</span>
      <p className={`text-[10px] font-bold mt-1 ${active ? "text-on-surface" : "text-on-surface-variant/30"}`}>{value || (active ? "Si" : "No")}</p>
      <p className="text-[8px] text-on-surface-variant uppercase">{label}</p>
    </div>
  );
}

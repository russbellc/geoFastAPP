"use client";

import { useEffect, useState } from "react";
import { api, Competitor } from "@/lib/api";

export default function AnalyticsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [selected, setSelected] = useState<Competitor | null>(null);

  useEffect(() => {
    api.getCompetitors().then(setCompetitors).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleScan = async () => {
    setScanning(true);
    try {
      await api.scanCompetitors();
      // Poll for results after a delay
      setTimeout(async () => {
        const updated = await api.getCompetitors();
        setCompetitors(updated);
        setScanning(false);
      }, 5000);
    } catch (err) {
      console.error(err);
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-on-surface-variant text-sm">Cargando inteligencia competitiva...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Competitor List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-10 pt-8 pb-12 bg-surface-dim">
        {/* Header */}
        <div className="mb-8 flex justify-between items-end">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-container/30 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: '"FILL" 1' }}>
                monitoring
              </span>
            </div>
            <div>
              <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight mb-1">
                Radar Competitivo
              </h2>
              <p className="text-on-surface-variant font-body">
                Competidores SaaS de Salud en LATAM — posicionamiento de mercado y analisis de brechas.
              </p>
            </div>
          </div>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="gradient-primary text-on-primary-fixed px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary-container/20 disabled:opacity-50 transition-all"
          >
            <span className="material-symbols-outlined text-sm">
              {scanning ? "hourglass_empty" : "radar"}
            </span>
            {scanning ? "Escaneando..." : "Escanear Competidores"}
          </button>
        </div>

        {/* Competitor Grid */}
        {competitors.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center space-y-4">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">radar</span>
              <h3 className="font-headline font-bold text-on-surface text-lg">Sin competidores rastreados</h3>
              <p className="text-on-surface-variant text-sm max-w-md">
                Haz clic en &quot;Escanear Competidores&quot; para sembrar competidores SaaS de salud conocidos en LATAM y comenzar el seguimiento.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {competitors.map((comp) => (
              <div
                key={comp.id}
                onClick={() => setSelected(comp)}
                className={`bg-surface-container-low p-6 rounded-xl cursor-pointer transition-all hover:bg-surface-container/80 ${
                  selected?.id === comp.id ? "ring-1 ring-primary/40" : ""
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-headline font-bold text-on-surface">{comp.name}</h3>
                    <p className="text-xs text-on-surface-variant">
                      {comp.country || "Desconocido"} — {comp.type}
                    </p>
                  </div>
                  {comp.followers && (
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">
                      {comp.followers.toLocaleString()} seguidores
                    </span>
                  )}
                </div>

                {/* Markets */}
                {comp.markets && comp.markets.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {comp.markets.map((market) => (
                      <span
                        key={market}
                        className="text-[9px] font-bold px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant border border-outline-variant/10 uppercase"
                      >
                        {market}
                      </span>
                    ))}
                  </div>
                )}

                {/* Social Links */}
                <div className="flex gap-3 text-on-surface-variant">
                  {comp.website && (
                    <a href={comp.website} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}
                       className="material-symbols-outlined text-lg hover:text-primary transition-colors">language</a>
                  )}
                  {comp.instagram_url && (
                    <a href={comp.instagram_url} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}
                       className="material-symbols-outlined text-lg hover:text-pink-400 transition-colors">photo_camera</a>
                  )}
                  {comp.facebook_url && (
                    <a href={comp.facebook_url} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}
                       className="material-symbols-outlined text-lg hover:text-blue-400 transition-colors">thumb_up</a>
                  )}
                  {comp.linkedin_url && (
                    <a href={comp.linkedin_url} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}
                       className="material-symbols-outlined text-lg hover:text-sky-400 transition-colors">public</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selected && (
        <aside className="w-96 bg-surface-container-low border-l border-outline-variant/10 overflow-y-auto custom-scrollbar p-6 space-y-6 shrink-0">
          <div className="flex justify-between items-start">
            <h3 className="font-headline font-bold text-on-surface text-lg">{selected.name}</h3>
            <button
              onClick={() => setSelected(null)}
              className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors"
            >
              close
            </button>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Pais</span>
              <span className="text-on-surface font-medium">{selected.country || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Tipo</span>
              <span className="text-on-surface font-medium">{selected.type}</span>
            </div>
            {selected.website && (
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Sitio Web</span>
                <a href={selected.website} target="_blank" rel="noopener" className="text-primary hover:underline text-xs truncate max-w-[200px]">
                  {selected.website}
                </a>
              </div>
            )}
          </div>

          {/* Markets */}
          {selected.markets && selected.markets.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Mercados Objetivo</h4>
              <div className="flex flex-wrap gap-2">
                {selected.markets.map((m) => (
                  <span key={m} className="text-xs px-3 py-1 rounded-lg bg-surface-container-highest text-on-surface capitalize">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          {selected.ai_analysis && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Analisis IA</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">{selected.ai_analysis}</p>
            </div>
          )}

          {/* Gap vs LiaFlow */}
          {selected.gap_vs_liaflow && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-tertiary mb-3">Brechas vs LiaFlow</h4>
              <div className="space-y-2">
                {selected.gap_vs_liaflow.split(" | ").map((gap, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="material-symbols-outlined text-tertiary text-sm mt-0.5">check_circle</span>
                    <span className="text-on-surface-variant">{gap}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selected.last_scanned_at && (
            <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-wider">
              Ultimo escaneo: {new Date(selected.last_scanned_at).toLocaleDateString()}
            </p>
          )}
        </aside>
      )}
    </div>
  );
}

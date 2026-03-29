"use client";

import { useState, useEffect } from "react";
import { api, ScanJob, ScanRequest } from "@/lib/api";
import DrawMapWrapper from "@/components/map/DrawMapWrapper";

type ScanMode = "radio" | "polygon";

export default function ScanPage() {
  const [mode, setMode] = useState<ScanMode>("radio");
  const [form, setForm] = useState({
    name: "",
    city: "Lima",
    country: "Peru",
    lat: -12.0464,
    lng: -77.0428,
    radius_km: 1,
    nicho: "",
  });
  const [polygon, setPolygon] = useState<[number, number][] | null>(null);
  const [scanJob, setScanJob] = useState<ScanJob | null>(null);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<ScanJob[]>([]);

  useEffect(() => {
    api.getScanHistory().then(setHistory).catch(console.error);
  }, []);

  const canSubmit = mode === "radio" ? form.name.length > 0 : form.name.length > 0 && polygon !== null;

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const payload: ScanRequest = {
        name: form.name,
        city: form.city,
        country: form.country,
        nicho: form.nicho || undefined,
      };
      if (mode === "radio") {
        payload.lat = form.lat;
        payload.lng = form.lng;
        payload.radius_km = form.radius_km;
      } else if (polygon) {
        payload.polygon = polygon;
      }
      const job = await api.createScan(payload);
      setScanJob(job);
      pollStatus(job.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  const pollStatus = async (jobId: number) => {
    setPolling(true);
    const interval = setInterval(async () => {
      try {
        const status = await api.getScanStatus(jobId);
        setScanJob(status);
        if (status.status === "done" || status.status === "failed") {
          clearInterval(interval);
          setPolling(false);
          api.getScanHistory().then(setHistory).catch(console.error);
        }
      } catch {
        clearInterval(interval);
        setPolling(false);
      }
    }, 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-12 pt-8 pb-12 bg-surface-dim">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight mb-2">
            Iniciar Escaneo
          </h2>
          <p className="text-on-surface-variant font-body">
            Define un territorio y lanza un escaneo de inteligencia geoespacial.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => { setMode("radio"); setPolygon(null); }}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all ${
              mode === "radio"
                ? "gradient-primary text-on-primary-fixed shadow-lg shadow-primary-container/20"
                : "bg-surface-container-highest text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">radar</span>
              Escaneo por Radio
            </span>
          </button>
          <button
            onClick={() => setMode("polygon")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all ${
              mode === "polygon"
                ? "gradient-primary text-on-primary-fixed shadow-lg shadow-primary-container/20"
                : "bg-surface-container-highest text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">draw</span>
              Escaneo por Poligono
            </span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleScan} className="bg-surface-container-low rounded-3xl p-8 space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-6">
            {/* Common Fields */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-on-surface-variant text-xs font-bold uppercase tracking-widest block mb-2">
                  Nombre del Territorio
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl text-on-surface text-sm focus:ring-2 focus:ring-primary/30 outline-none placeholder:text-on-surface-variant/40 transition-all"
                  placeholder="e.g. Miraflores Norte"
                  required
                />
              </div>
              <div>
                <label className="text-on-surface-variant text-xs font-bold uppercase tracking-widest block mb-2">
                  Ciudad
                </label>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl text-on-surface text-sm focus:ring-2 focus:ring-primary/30 outline-none placeholder:text-on-surface-variant/40 transition-all"
                  required
                />
              </div>
            </div>

            {/* Radio Mode Fields */}
            {mode === "radio" && (
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="text-on-surface-variant text-xs font-bold uppercase tracking-widest block mb-2">
                    Latitud
                  </label>
                  <input
                    type="number" step="any" value={form.lat}
                    onChange={(e) => setForm({ ...form, lat: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl text-on-surface text-sm focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-on-surface-variant text-xs font-bold uppercase tracking-widest block mb-2">
                    Longitud
                  </label>
                  <input
                    type="number" step="any" value={form.lng}
                    onChange={(e) => setForm({ ...form, lng: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl text-on-surface text-sm focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-on-surface-variant text-xs font-bold uppercase tracking-widest block mb-2">
                    Radio (km)
                  </label>
                  <input
                    type="number" step="0.1" min="0.1" max="10" value={form.radius_km}
                    onChange={(e) => setForm({ ...form, radius_km: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl text-on-surface text-sm focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                    required
                  />
                </div>
              </div>
            )}

            {/* Polygon Mode */}
            {mode === "polygon" && (
              <div className="space-y-4">
                <p className="text-on-surface-variant text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">info</span>
                  Usa la herramienta de poligono en el mapa para definir el area de escaneo.
                </p>
                <div className="h-[400px] rounded-2xl overflow-hidden border border-outline-variant/10">
                  <DrawMapWrapper
                    onPolygonDrawn={(coords) => setPolygon(coords)}
                    onPolygonCleared={() => setPolygon(null)}
                  />
                </div>
                {polygon && (
                  <p className="text-tertiary text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Poligono definido con {polygon.length} vertices
                  </p>
                )}
              </div>
            )}

            {/* Niche */}
            <div>
              <label className="text-on-surface-variant text-xs font-bold uppercase tracking-widest block mb-2">
                Nicho (opcional)
              </label>
              <input
                value={form.nicho}
                onChange={(e) => setForm({ ...form, nicho: e.target.value })}
                className="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl text-on-surface text-sm focus:ring-2 focus:ring-primary/30 outline-none placeholder:text-on-surface-variant/40 transition-all"
                placeholder="e.g. salud, gastronomia, turismo"
              />
            </div>

            {error && (
              <div className="bg-error-container/20 text-error px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={polling || !canSubmit}
              className="w-full gradient-primary text-on-primary-fixed py-4 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-container/20 disabled:opacity-50 transition-all hover:opacity-90 active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-sm">
                {polling ? "hourglass_empty" : "rocket_launch"}
              </span>
              {polling ? "Escaneo en progreso..." : "Lanzar Escaneo"}
            </button>
          </div>
        </form>

        {/* Scan Status */}
        {scanJob && (
          <div className="bg-surface-container-low rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-tertiary/3 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <h3 className="font-headline font-bold text-on-surface mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">monitoring</span>
                Estado del Escaneo
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant text-sm">Estado</span>
                  <ScanStatusBadge status={scanJob.status} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant text-sm">Negocios Encontrados</span>
                  <span className="text-on-surface font-bold text-lg">{scanJob.total_found}</span>
                </div>
                {scanJob.status === "running" && (
                  <div className="mt-4">
                    <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "60%" }} />
                    </div>
                  </div>
                )}
                {scanJob.status === "done" && (
                  <div className="mt-4 bg-tertiary-container/20 text-tertiary px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Escaneo completado. {scanJob.total_found} negocios descubiertos.
                  </div>
                )}
                {scanJob.status === "failed" && (
                  <div className="mt-4 bg-error-container/20 text-error px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">error</span>
                    Escaneo fallido. Por favor intenta de nuevo.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scan History */}
        {history.length > 0 && (
          <div className="bg-surface-container-low rounded-3xl p-8">
            <h3 className="font-headline font-bold text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              Historial de Escaneos
            </h3>
            <div className="space-y-3">
              {history.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between bg-surface-container-high p-4 rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-lg">radar</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">
                        Territory #{job.territory_id}
                        {job.nicho && <span className="text-on-surface-variant font-normal"> — {job.nicho}</span>}
                      </p>
                      <p className="text-[11px] text-on-surface-variant">
                        {job.started_at ? new Date(job.started_at).toLocaleString() : "Pendiente"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-on-surface">{job.total_found}</p>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">encontrados</p>
                    </div>
                    <ScanStatusBadge status={job.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScanStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-secondary/10 text-secondary",
    running: "bg-primary/10 text-primary",
    done: "bg-tertiary-container/30 text-tertiary",
    failed: "bg-error-container/30 text-error",
  };
  return (
    <span className={`${styles[status] || styles.pending} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider`}>
      {status}
    </span>
  );
}

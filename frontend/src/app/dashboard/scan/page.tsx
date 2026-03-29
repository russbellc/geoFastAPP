"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { api, ScanJob, ScanRequest } from "@/lib/api";
import dynamic from "next/dynamic";

const ScanMap = dynamic(() => import("@/components/map/ScanMap"), { ssr: false, loading: () => <div className="h-full w-full bg-surface-container-lowest flex items-center justify-center"><p className="text-on-surface-variant text-sm">Cargando mapa...</p></div> });

export default function ScanPage() {
  const [form, setForm] = useState({ name: "", city: "", nicho: "" });
  const [lat, setLat] = useState(-12.0464);
  const [lng, setLng] = useState(-77.0428);
  const [radiusKm, setRadiusKm] = useState(1.0);
  const [searchQuery, setSearchQuery] = useState("");
  const [scanJob, setScanJob] = useState<ScanJob | null>(null);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<ScanJob[]>([]);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    api.getScanHistory().then(setHistory).catch(console.error);
  }, []);

  // Geolocate user + reverse geocode to get city name
  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        // Reverse geocode to get city name
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.county || data.address?.state || "Mi Ubicacion";
          setForm((f) => ({ ...f, city }));
        } catch {
          setForm((f) => ({ ...f, city: "Mi Ubicacion" }));
        }
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true }
    );
  };

  // Search city by name using Nominatim
  const handleSearchCity = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
      const data = await res.json();
      if (data.length > 0) {
        setLat(parseFloat(data[0].lat));
        setLng(parseFloat(data[0].lon));
        setForm((f) => ({ ...f, city: data[0].display_name.split(",")[0] }));
      }
    } catch {}
  };

  // Marker dragged
  const handleMarkerDrag = useCallback((newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const payload: ScanRequest = {
        name: form.name,
        city: form.city || "Auto",
        country: "Peru",
        lat, lng,
        radius_km: radiusKm,
        nicho: form.nicho || undefined,
      };
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
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel - Form */}
      <aside className="w-[420px] bg-surface-container-low flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-5">
          <div>
            <h2 className="text-2xl font-headline font-extrabold text-on-surface tracking-tight mb-1">
              Iniciar Escaneo
            </h2>
            <p className="text-on-surface-variant text-sm">
              Busca una ubicacion, arrastra el marcador y define el radio.
            </p>
          </div>

          {/* Search City */}
          <div>
            <label className="text-on-surface-variant text-xs font-bold uppercase tracking-widest block mb-2">
              Buscar Ubicacion
            </label>
            <div className="flex gap-2">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchCity()}
                className="flex-1 px-4 py-3 bg-surface-container-highest border-none rounded-xl text-on-surface text-sm focus:ring-2 focus:ring-primary/30 outline-none placeholder:text-on-surface-variant/40"
                placeholder="Cusco, Arequipa, Trujillo..."
              />
              <button onClick={handleSearchCity} className="px-3 py-3 bg-primary text-on-primary rounded-xl transition-all hover:opacity-90">
                <span className="material-symbols-outlined text-sm">search</span>
              </button>
              <button onClick={handleLocateMe} disabled={locating} className="px-3 py-3 bg-surface-container-highest text-tertiary rounded-xl transition-all hover:bg-surface-bright disabled:opacity-50">
                <span className="material-symbols-outlined text-sm">{locating ? "hourglass_empty" : "my_location"}</span>
              </button>
            </div>
          </div>

          {/* Coordinates display */}
          <div className="bg-surface-container-high/50 px-4 py-3 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-sm">location_on</span>
            <span className="text-on-surface text-sm font-mono">{lat.toFixed(5)}, {lng.toFixed(5)}</span>
          </div>

          {/* Radius Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Radio</label>
              <span className="text-primary font-bold text-sm">{radiusKm.toFixed(1)} km</span>
            </div>
            <input
              type="range" min="0.2" max="5" step="0.1" value={radiusKm}
              onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
              className="w-full h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
              <span>0.2 km</span><span>5 km</span>
            </div>
          </div>

          {/* Form fields */}
          <form onSubmit={handleScan} className="space-y-4">
            <div>
              <label className="text-on-surface-variant text-xs font-bold uppercase tracking-widest block mb-2">
                Nombre del Territorio
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl text-on-surface text-sm focus:ring-2 focus:ring-primary/30 outline-none placeholder:text-on-surface-variant/40"
                placeholder="ej. Wanchaq Centro"
                required
              />
            </div>

            <div>
              <label className="text-on-surface-variant text-xs font-bold uppercase tracking-widest block mb-2">
                Nicho (opcional)
              </label>
              <input
                value={form.nicho}
                onChange={(e) => setForm({ ...form, nicho: e.target.value })}
                className="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl text-on-surface text-sm focus:ring-2 focus:ring-primary/30 outline-none placeholder:text-on-surface-variant/40"
                placeholder="salud, gastronomia, turismo..."
              />
            </div>

            {error && (
              <div className="bg-error-container/20 text-error px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            {/* Scan status */}
            {scanJob && (
              <div className="bg-surface-container-high/50 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant text-sm">Estado</span>
                  <ScanStatusBadge status={scanJob.status} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant text-sm">Encontrados</span>
                  <span className="text-on-surface font-bold text-lg">{scanJob.total_found}</span>
                </div>
                {scanJob.status === "running" && (
                  <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "60%" }} />
                  </div>
                )}
                {scanJob.status === "done" && (
                  <div className="bg-tertiary-container/20 text-tertiary px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    {scanJob.total_found} negocios descubiertos
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={polling || !form.name}
              className="w-full gradient-primary text-on-primary-fixed py-4 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-container/20 disabled:opacity-50 transition-all hover:opacity-90"
            >
              <span className="material-symbols-outlined text-sm">
                {polling ? "hourglass_empty" : "rocket_launch"}
              </span>
              {polling ? "Escaneando..." : "Lanzar Escaneo"}
            </button>
          </form>

          {/* History */}
          {history.length > 0 && (
            <div>
              <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-3">
                Historial de Escaneos
              </h3>
              <div className="space-y-2">
                {history.slice(0, 8).map((job) => (
                  <div key={job.id} className="flex items-center justify-between bg-surface-container-high p-3 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-on-surface">
                        Territorio #{job.territory_id}
                        {job.nicho && <span className="text-on-surface-variant font-normal"> — {job.nicho}</span>}
                      </p>
                      <p className="text-[10px] text-on-surface-variant">
                        {job.started_at ? new Date(job.started_at).toLocaleString() : "Pendiente"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-on-surface">{job.total_found}</span>
                      <ScanStatusBadge status={job.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Right - Interactive Map */}
      <section className="flex-1 relative bg-surface-container-lowest">
        <ScanMap
          lat={lat}
          lng={lng}
          radiusKm={radiusKm}
          onMarkerDrag={handleMarkerDrag}
        />
      </section>
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

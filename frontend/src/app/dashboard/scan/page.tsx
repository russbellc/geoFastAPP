"use client";

import { useState } from "react";
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
        }
      } catch {
        clearInterval(interval);
        setPolling(false);
      }
    }, 3000);
  };

  const statusColor = {
    pending: "text-yellow-400",
    running: "text-blue-400",
    done: "text-green-400",
    failed: "text-red-400",
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Lanzar escaneo</h1>

      {/* Toggle modo */}
      <div className="flex gap-2">
        <button
          onClick={() => { setMode("radio"); setPolygon(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "radio" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Por radio
        </button>
        <button
          onClick={() => setMode("polygon")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "polygon" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Dibujar poligono
        </button>
      </div>

      <form onSubmit={handleScan} className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-4">
        {/* Campos comunes */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-sm block mb-1">Nombre del territorio</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Ej: Miraflores Norte"
              required
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">Ciudad</label>
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Modo radio */}
        {mode === "radio" && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-gray-400 text-sm block mb-1">Latitud</label>
              <input
                type="number" step="any" value={form.lat}
                onChange={(e) => setForm({ ...form, lat: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Longitud</label>
              <input
                type="number" step="any" value={form.lng}
                onChange={(e) => setForm({ ...form, lng: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Radio (km)</label>
              <input
                type="number" step="0.1" min="0.1" max="10" value={form.radius_km}
                onChange={(e) => setForm({ ...form, radius_km: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>
        )}

        {/* Modo poligono */}
        {mode === "polygon" && (
          <div className="space-y-3">
            <p className="text-gray-400 text-sm">
              Usa la herramienta de poligono (icono a la derecha del mapa) para dibujar la zona a escanear.
            </p>
            <div className="h-[400px] rounded-lg overflow-hidden border border-gray-700">
              <DrawMapWrapper
                onPolygonDrawn={(coords) => setPolygon(coords)}
                onPolygonCleared={() => setPolygon(null)}
              />
            </div>
            {polygon && (
              <p className="text-green-400 text-sm">
                Poligono dibujado con {polygon.length} puntos
              </p>
            )}
          </div>
        )}

        {/* Nicho */}
        <div>
          <label className="text-gray-400 text-sm block mb-1">Nicho (opcional)</label>
          <input
            value={form.nicho}
            onChange={(e) => setForm({ ...form, nicho: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Ej: salud, gastronomia"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={polling || !canSubmit}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
        >
          {polling ? "Escaneando..." : "Iniciar escaneo"}
        </button>
      </form>

      {/* Status */}
      {scanJob && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-white font-semibold mb-3">Estado del escaneo</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Estado</span>
              <span className={statusColor[scanJob.status as keyof typeof statusColor] || "text-gray-400"}>
                {scanJob.status.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Negocios encontrados</span>
              <span className="text-white">{scanJob.total_found}</span>
            </div>
            {scanJob.status === "running" && (
              <div className="mt-3">
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: "60%" }} />
                </div>
              </div>
            )}
            {scanJob.status === "done" && (
              <p className="text-green-400 mt-2">
                Escaneo completado. {scanJob.total_found} negocios encontrados.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

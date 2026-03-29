"use client";

import { useEffect, useState } from "react";
import { api, ApiKeyItem, WebhookItem } from "@/lib/api";

const WEBHOOK_EVENTS = ["lead.hot", "scan.completed", "competitor.new", "business.enriched"];

export default function SettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-10 pt-8 pb-12 bg-surface-dim">
      <div className="max-w-4xl mx-auto space-y-10">
        <div>
          <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight mb-2">
            Configuracion
          </h2>
          <p className="text-on-surface-variant font-body">
            Gestion de claves API, configuracion de webhooks y ajustes de integracion.
          </p>
        </div>

        <ApiKeysSection />
        <WebhooksSection />
      </div>
    </div>
  );
}

function ApiKeysSection() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getApiKeys().then(setKeys).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newKeyName) return;
    try {
      const result = await api.createApiKey(newKeyName, ["read", "scan", "export"]);
      setCreatedKey(result.key);
      setNewKeyName("");
      const updated = await api.getApiKeys();
      setKeys(updated);
    } catch (err) { console.error(err); }
  };

  const handleRevoke = async (id: number) => {
    try {
      await api.revokeApiKey(id);
      const updated = await api.getApiKeys();
      setKeys(updated);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="bg-surface-container-low rounded-3xl p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-primary">key</span>
          <h3 className="font-headline font-bold text-on-surface text-lg">Claves API</h3>
        </div>

        {/* Create new key */}
        <div className="flex gap-3 mb-6">
          <input
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Nombre de clave (ej. n8n-integracion)"
            className="flex-1 px-4 py-3 bg-surface-container-highest border-none rounded-xl text-on-surface text-sm focus:ring-2 focus:ring-primary/30 outline-none placeholder:text-on-surface-variant/40"
          />
          <button
            onClick={handleCreate}
            disabled={!newKeyName}
            className="gradient-primary text-on-primary-fixed px-5 py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Crear
          </button>
        </div>

        {/* Show created key (one time) */}
        {createdKey && (
          <div className="mb-6 bg-tertiary-container/20 text-tertiary p-4 rounded-xl text-sm">
            <p className="font-bold mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">warning</span>
              Guarda esta clave — no se mostrara de nuevo:
            </p>
            <code className="block bg-surface-container-lowest px-3 py-2 rounded-lg text-on-surface font-mono text-xs break-all">
              {createdKey}
            </code>
            <button onClick={() => setCreatedKey(null)} className="mt-2 text-xs text-tertiary hover:underline">
              Cerrar
            </button>
          </div>
        )}

        {/* Key list */}
        {loading ? (
          <p className="text-on-surface-variant text-sm">Cargando...</p>
        ) : keys.length === 0 ? (
          <p className="text-on-surface-variant text-sm">Aun no se han creado claves API.</p>
        ) : (
          <div className="space-y-3">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between bg-surface-container-high p-4 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${k.active ? "bg-tertiary" : "bg-outline-variant"}`} />
                  <div>
                    <p className="text-sm font-bold text-on-surface">{k.name}</p>
                    <p className="text-[11px] text-on-surface-variant font-mono">{k.key_prefix}...</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {k.permissions && (
                    <div className="flex gap-1">
                      {k.permissions.map((p) => (
                        <span key={p} className="text-[9px] font-bold px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant uppercase">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                  {k.active && (
                    <button
                      onClick={() => handleRevoke(k.id)}
                      className="text-error text-xs font-bold hover:underline"
                    >
                      Revocar
                    </button>
                  )}
                  {!k.active && (
                    <span className="text-outline text-xs">Revocada</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WebhooksSection() {
  const [hooks, setHooks] = useState<WebhookItem[]>([]);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWebhooks().then(setHooks).catch(console.error).finally(() => setLoading(false));
  }, []);

  const toggleEvent = (e: string) => {
    setEvents((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]);
  };

  const handleCreate = async () => {
    if (!url || events.length === 0) return;
    try {
      await api.createWebhook(url, events);
      setUrl("");
      setEvents([]);
      const updated = await api.getWebhooks();
      setHooks(updated);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteWebhook(id);
      setHooks((prev) => prev.filter((h) => h.id !== id));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="bg-surface-container-low rounded-3xl p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-tertiary/3 to-transparent pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-tertiary">webhook</span>
          <h3 className="font-headline font-bold text-on-surface text-lg">Webhooks</h3>
        </div>

        {/* Create */}
        <div className="space-y-4 mb-6">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-n8n.com/webhook/..."
            className="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl text-on-surface text-sm focus:ring-2 focus:ring-primary/30 outline-none placeholder:text-on-surface-variant/40"
          />
          <div className="flex flex-wrap gap-2">
            {WEBHOOK_EVENTS.map((evt) => (
              <button
                key={evt}
                onClick={() => toggleEvent(evt)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                  events.includes(evt)
                    ? "bg-tertiary text-on-tertiary"
                    : "bg-surface-container-highest text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {evt}
              </button>
            ))}
          </div>
          <button
            onClick={handleCreate}
            disabled={!url || events.length === 0}
            className="gradient-primary text-on-primary-fixed px-5 py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Registrar Webhook
          </button>
        </div>

        {/* List */}
        {loading ? (
          <p className="text-on-surface-variant text-sm">Cargando...</p>
        ) : hooks.length === 0 ? (
          <p className="text-on-surface-variant text-sm">No hay webhooks registrados. Conecta tu instancia de n8n para recibir eventos en tiempo real.</p>
        ) : (
          <div className="space-y-3">
            {hooks.map((h) => (
              <div key={h.id} className="flex items-center justify-between bg-surface-container-high p-4 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-on-surface truncate max-w-md">{h.url}</p>
                  <div className="flex gap-1.5 mt-1">
                    {h.events.map((evt) => (
                      <span key={evt} className="text-[9px] font-bold px-2 py-0.5 rounded bg-tertiary-container/20 text-tertiary uppercase">
                        {evt}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(h.id)}
                  className="text-error text-xs font-bold hover:underline"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

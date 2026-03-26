"use client";

export default function SettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-10 pt-8 pb-12 bg-surface-dim">
      <div className="mb-10">
        <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight mb-2">
          Settings
        </h2>
        <p className="text-on-surface-variant font-body">
          Configure your GeoIntel workspace and integrations.
        </p>
      </div>

      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-surface-container-low rounded-3xl flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">
              settings
            </span>
          </div>
          <h3 className="font-headline font-bold text-on-surface text-lg">Coming Soon</h3>
          <p className="text-on-surface-variant text-sm max-w-md">
            API key management, webhook configuration, n8n integration settings, and user preferences.
          </p>
        </div>
      </div>
    </div>
  );
}

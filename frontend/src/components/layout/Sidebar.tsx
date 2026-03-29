"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard/stats", icon: "insights", label: "Intelligence" },
  { href: "/dashboard", icon: "map", label: "Territories" },
  { href: "/dashboard/leads", icon: "person_add", label: "Leads" },
  { href: "/dashboard/health", icon: "local_hospital", label: "Health Niche" },
  { href: "/dashboard/analytics", icon: "bar_chart", label: "Analytics" },
  { href: "/dashboard/settings", icon: "settings", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside data-onboarding="sidebar" className="flex flex-col h-screen w-64 bg-surface-container-low p-4 space-y-8 font-headline tracking-tight font-bold shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2">
        <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
          <span
            className="material-symbols-outlined text-on-primary-fixed"
            style={{ fontVariationSettings: '"FILL" 1' }}
          >
            explore
          </span>
        </div>
        <div>
          <h1 className="text-xl font-black text-on-surface tracking-tighter">
            GeoIntel
          </h1>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-medium opacity-60">
            Intelligence Core
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
              isActive(item.href)
                ? "text-primary bg-surface-container-highest"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* New Scan Button */}
      <Link
        data-onboarding="new-scan"
        href="/dashboard/scan"
        className="w-full gradient-primary text-on-primary-fixed py-3 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-primary-container/20 flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined text-sm">add</span>
        New Scan
      </Link>

      {/* Footer */}
      <footer className="pt-4 border-t border-surface-container-highest space-y-1">
        <a
          href="#"
          className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface text-sm font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-lg">help</span>
          Support
        </a>
        <a
          href="#"
          className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface text-sm font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-lg">manage_accounts</span>
          Account
        </a>
      </footer>
    </aside>
  );
}

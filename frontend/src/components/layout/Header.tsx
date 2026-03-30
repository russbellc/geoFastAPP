"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/stores/auth";
import { useRouter } from "next/navigation";
import { api, Business } from "@/lib/api";

const TOP_TABS = [
  { href: "/dashboard/stats", label: "Panel" },
  { href: "/dashboard", label: "Reportes" },
  { href: "/dashboard/leads", label: "Archivo" },
];

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Business[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearchLoading(true);
    setShowResults(true);
    try {
      const data = await api.semanticSearch(q);
      setSearchResults(data.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="flex justify-between items-center h-16 px-8 bg-background/80 backdrop-blur-md shadow-sm shadow-blue-900/10 z-40 shrink-0">
      {/* Search */}
      <div className="flex items-center gap-8 flex-1 max-w-2xl">
        <div data-onboarding="search" ref={searchContainerRef} className="relative w-full group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary">
            search
          </span>
          <input
            className="w-full bg-surface-container-lowest border-none rounded-full py-2.5 pl-12 pr-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/40 transition-all outline-none"
            placeholder="Busqueda Semantica IA: 'Buscar clinicas en Lima sin sitio web...'"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
          />
          {searchLoading && (
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-primary animate-spin text-sm">progress_activity</span>
          )}

          {/* Search Results Dropdown */}
          {showResults && (searchLoading || searchResults.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-low border border-outline-variant/20 rounded-xl shadow-2xl z-[9999] max-h-80 overflow-y-auto custom-scrollbar">
              {searchLoading ? (
                <div className="p-4 text-center text-on-surface-variant text-sm">Buscando con IA...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-on-surface-variant text-sm">Sin resultados</div>
              ) : (
                searchResults.map((biz) => (
                  <button
                    key={biz.id}
                    className="w-full text-left px-4 py-3 hover:bg-surface-container-highest transition-colors flex items-start gap-3 border-b border-outline-variant/10 last:border-b-0"
                    onClick={() => {
                      setShowResults(false);
                      router.push("/dashboard/leads");
                    }}
                  >
                    <span className="material-symbols-outlined text-primary text-sm mt-0.5 shrink-0">storefront</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">{biz.name}</p>
                      <p className="text-[11px] text-on-surface-variant truncate">
                        {biz.category && <span className="uppercase mr-2">{biz.category}</span>}
                        {biz.address || "Sin direccion"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nav + Actions */}
      <nav className="flex items-center gap-8 ml-8">
        <div className="flex gap-6 font-body text-sm font-medium">
          {TOP_TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`transition-colors ${
                pathname === tab.href
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4 text-on-surface-variant">
          <button className="material-symbols-outlined hover:text-primary transition-colors relative">
            notifications
            <span className="absolute top-0 right-0 w-2 h-2 bg-tertiary rounded-full border-2 border-background" />
          </button>
          <button className="material-symbols-outlined hover:text-primary transition-colors">
            history
          </button>
          <button className="material-symbols-outlined hover:text-primary transition-colors">
            chat_bubble
          </button>

          <div className="h-8 w-[1px] bg-outline-variant/20 mx-2" />

          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-on-surface-variant font-medium">
                {user.full_name}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="w-9 h-9 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center hover:border-primary/50 transition-colors"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-lg">
                logout
              </span>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}

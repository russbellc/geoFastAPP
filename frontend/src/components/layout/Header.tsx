"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/stores/auth";
import { useRouter } from "next/navigation";

const TOP_TABS = [
  { href: "/dashboard/stats", label: "Dashboard" },
  { href: "/dashboard", label: "Reports" },
  { href: "/dashboard/leads", label: "Archive" },
];

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="flex justify-between items-center h-16 px-8 bg-background/80 backdrop-blur-md shadow-sm shadow-blue-900/10 z-40 shrink-0">
      {/* Search */}
      <div className="flex items-center gap-8 flex-1 max-w-2xl">
        <div data-onboarding="search" className="relative w-full group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary">
            search
          </span>
          <input
            className="w-full bg-surface-container-lowest border-none rounded-full py-2.5 pl-12 pr-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/40 transition-all outline-none"
            placeholder="AI Semantic Search: 'Find clinics in Lima with no website...'"
            type="text"
          />
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

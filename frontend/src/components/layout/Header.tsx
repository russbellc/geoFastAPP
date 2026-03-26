"use client";

import Link from "next/link";
import { useAuth } from "@/stores/auth";
import { useRouter } from "next/navigation";

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="text-white font-bold text-lg">
          GeoIntel
        </Link>
        <nav className="flex gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition-colors">
            Mapa
          </Link>
          <Link href="/dashboard/stats" className="text-gray-400 hover:text-white text-sm transition-colors">
            Dashboard
          </Link>
          <Link href="/dashboard/scan" className="text-gray-400 hover:text-white text-sm transition-colors">
            Scanner
          </Link>
          <Link href="/dashboard/leads" className="text-gray-400 hover:text-white text-sm transition-colors">
            Leads
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-gray-400 text-sm">{user?.full_name}</span>
        <button
          onClick={handleLogout}
          className="text-gray-500 hover:text-white text-sm transition-colors"
        >
          Salir
        </button>
      </div>
    </header>
  );
}

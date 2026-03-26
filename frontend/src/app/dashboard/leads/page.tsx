"use client";

import { useEffect, useState } from "react";
import { api, Business, BusinessProfile } from "@/lib/api";

interface LeadRow {
  business: Business;
  profile: BusinessProfile | null;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getBusinesses({ per_page: 100 });
        const rows: LeadRow[] = [];
        for (const biz of data.items) {
          let profile: BusinessProfile | null = null;
          try {
            profile = await api.getBusinessProfile(biz.id);
          } catch {}
          if (profile) {
            rows.push({ business: biz, profile });
          }
        }
        rows.sort((a, b) => (b.profile?.opportunity_score || 0) - (a.profile?.opportunity_score || 0));
        setLeads(rows);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="flex-1 flex items-center justify-center"><p className="text-gray-400">Cargando leads...</p></div>;

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      hot: "bg-red-500/20 text-red-400",
      warm: "bg-yellow-500/20 text-yellow-400",
      cold: "bg-gray-500/20 text-gray-400",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.cold}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold text-white">Leads ({leads.length})</h1>

      {leads.length === 0 ? (
        <p className="text-gray-500">Enriquece negocios para generar leads.</p>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 px-4 py-3 font-medium">Negocio</th>
                <th className="text-left text-gray-400 px-4 py-3 font-medium">Categoria</th>
                <th className="text-center text-gray-400 px-4 py-3 font-medium">Score</th>
                <th className="text-center text-gray-400 px-4 py-3 font-medium">Lead</th>
                <th className="text-center text-gray-400 px-4 py-3 font-medium">Web</th>
                <th className="text-right text-gray-400 px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(({ business, profile }) => (
                <tr key={business.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{business.name}</p>
                    {business.address && <p className="text-gray-500 text-xs">{business.address}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{business.category}/{business.subcategory}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-white font-semibold">{profile?.opportunity_score ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-center">{statusBadge(profile?.lead_status || "cold")}</td>
                  <td className="px-4 py-3 text-center">
                    {business.website ? (
                      <a href={business.website} target="_blank" rel="noopener" className="text-blue-400 hover:underline text-xs">
                        Ver
                      </a>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {business.phone && (
                      <a href={`tel:${business.phone}`} className="text-green-400 hover:underline text-xs">
                        Llamar
                      </a>
                    )}
                    {business.email && (
                      <button
                        onClick={() => navigator.clipboard.writeText(business.email!)}
                        className="text-cyan-400 hover:underline text-xs"
                      >
                        Email
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

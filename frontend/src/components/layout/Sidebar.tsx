"use client";

import { useMapStore } from "@/stores/map";
import { Business } from "@/lib/api";

const CATEGORY_COLORS: Record<string, string> = {
  salud: "bg-red-500",
  gastronomia: "bg-orange-500",
  comercio: "bg-blue-500",
  educacion: "bg-purple-500",
  servicios: "bg-cyan-500",
  turismo: "bg-emerald-500",
  entretenimiento: "bg-pink-500",
  otro: "bg-gray-500",
};

export default function Sidebar() {
  const { businesses, selectedBusiness, selectBusiness, categoryFilter, setCategoryFilter } =
    useMapStore();

  const categories = Array.from(new Set(businesses.map((b) => b.category || "otro"))).sort();

  const filtered = categoryFilter
    ? businesses.filter((b) => b.category === categoryFilter)
    : businesses;

  return (
    <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-white font-semibold">
          Negocios ({filtered.length})
        </h2>
        {/* Filtros */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <button
            onClick={() => setCategoryFilter(null)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              !categoryFilter
                ? "bg-white text-gray-900"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat === categoryFilter ? null : cat)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                cat === categoryFilter
                  ? "bg-white text-gray-900"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((b) => (
          <BusinessCard
            key={b.id}
            business={b}
            isSelected={selectedBusiness?.id === b.id}
            onClick={() => selectBusiness(b)}
          />
        ))}
      </div>
    </div>
  );
}

function BusinessCard({
  business,
  isSelected,
  onClick,
}: {
  business: Business;
  isSelected: boolean;
  onClick: () => void;
}) {
  const catColor = CATEGORY_COLORS[business.category || "otro"] || "bg-gray-500";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${
        isSelected ? "bg-gray-800" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${catColor}`} />
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{business.name}</p>
          <p className="text-gray-500 text-xs">
            {business.category}/{business.subcategory}
          </p>
          {business.address && (
            <p className="text-gray-600 text-xs truncate mt-0.5">{business.address}</p>
          )}
        </div>
      </div>
    </button>
  );
}

import { create } from "zustand";
import { Business } from "@/lib/api";

interface MapState {
  businesses: Business[];
  selectedBusiness: Business | null;
  categoryFilter: string | null;
  territoryId: number | null;
  setBusinesses: (businesses: Business[]) => void;
  selectBusiness: (business: Business | null) => void;
  setCategoryFilter: (category: string | null) => void;
  setTerritoryId: (id: number | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  businesses: [],
  selectedBusiness: null,
  categoryFilter: null,
  territoryId: null,
  setBusinesses: (businesses) => set({ businesses }),
  selectBusiness: (business) => set({ selectedBusiness: business }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),
  setTerritoryId: (id) => set({ territoryId: id }),
}));

import { create } from "zustand";
import { api } from "@/lib/api";

interface AuthState {
  user: { id: number; email: string; full_name: string } | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  login: async (email, password) => {
    const { access_token } = await api.login(email, password);
    api.setToken(access_token);
    const user = await api.getMe();
    set({ user, isAuthenticated: true });
  },

  register: async (email, password, fullName) => {
    await api.register(email, password, fullName);
    const { access_token } = await api.login(email, password);
    api.setToken(access_token);
    const user = await api.getMe();
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    api.clearToken();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      if (!api.getToken()) {
        set({ loading: false });
        return;
      }
      const user = await api.getMe();
      set({ user, isAuthenticated: true, loading: false });
    } catch {
      api.clearToken();
      set({ user: null, isAuthenticated: false, loading: false });
    }
  },
}));

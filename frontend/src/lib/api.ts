const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== "undefined") {
      this.token = localStorage.getItem("token");
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${path}`, { ...options, headers });

    if (res.status === 401) {
      this.clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Error desconocido" }));
      throw new Error(error.detail || `HTTP ${res.status}`);
    }

    return res.json();
  }

  // Auth
  login(email: string, password: string) {
    return this.request<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  register(email: string, password: string, full_name: string) {
    return this.request<{ id: number; email: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name }),
    });
  }

  getMe() {
    return this.request<{ id: number; email: string; full_name: string }>("/auth/me");
  }

  // Businesses
  getBusinesses(params: Record<string, string | number> = {}) {
    const query = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString();
    return this.request<{
      items: Business[];
      total: number;
      page: number;
      per_page: number;
    }>(`/businesses?${query}`);
  }

  getBusinessProfile(id: number) {
    return this.request<BusinessProfile>(`/businesses/${id}/profile`);
  }

  enrichBusiness(id: number) {
    return this.request<{ message: string }>(`/businesses/${id}/enrich`, { method: "POST" });
  }

  enrichTerritory(territoryId: number) {
    return this.request<{ message: string }>(`/businesses/enrich/territory/${territoryId}`, {
      method: "POST",
    });
  }

  // Scans
  createScan(data: ScanRequest) {
    return this.request<ScanJob>("/scans/territory", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getScanStatus(id: number) {
    return this.request<ScanJob>(`/scans/${id}/status`);
  }

  getScanHistory() {
    return this.request<ScanJob[]>("/scans/history");
  }

  // Stats
  getTerritoryStats(id: number) {
    return this.request<TerritoryStats>(`/stats/territory/${id}`);
  }

  // Health stats
  getHealthStats(territoryId?: number) {
    const params = territoryId ? `?territory_id=${territoryId}` : "";
    return this.request<HealthStats>(`/stats/health${params}`);
  }

  // Competitors
  getCompetitors() {
    return this.request<Competitor[]>("/competitors");
  }

  createCompetitor(data: CompetitorCreate) {
    return this.request<Competitor>("/competitors", { method: "POST", body: JSON.stringify(data) });
  }

  scanCompetitors() {
    return this.request<{ message: string }>("/competitors/scan", { method: "POST" });
  }

  // Webhooks
  getWebhooks() {
    return this.request<WebhookItem[]>("/webhooks");
  }

  createWebhook(url: string, events: string[]) {
    return this.request<WebhookItem>("/webhooks", { method: "POST", body: JSON.stringify({ url, events }) });
  }

  deleteWebhook(id: number) {
    return this.request<void>(`/webhooks/${id}`, { method: "DELETE" });
  }

  // API Keys
  getApiKeys() {
    return this.request<ApiKeyItem[]>("/api-keys");
  }

  createApiKey(name: string, permissions?: string[]) {
    return this.request<ApiKeyItem & { key: string }>("/api-keys", {
      method: "POST", body: JSON.stringify({ name, permissions }),
    });
  }

  revokeApiKey(id: number) {
    return this.request<void>(`/api-keys/${id}`, { method: "DELETE" });
  }

  // Search
  semanticSearch(query: string, limit = 10) {
    return this.request<{ query: string; results: Business[] }>("/search/semantic", {
      method: "POST",
      body: JSON.stringify({ query, limit }),
    });
  }

  // Export
  async exportCsv(params: Record<string, string | number> = {}) {
    const token = this.getToken();
    const query = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString();
    const res = await fetch(`${API_URL}/export/csv?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.blob();
  }

  exportPdfUrl(params: Record<string, string | number> = {}) {
    const query = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString();
    return `${API_URL}/export/pdf?${query}`;
  }
}

export const api = new ApiClient();

// Types
export interface Business {
  id: number;
  territory_id: number;
  name: string;
  category: string | null;
  subcategory: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  source: string;
  osm_id: string | null;
  created_at: string;
}

export interface BusinessProfile {
  id: number;
  business_id: number;
  services: string | null;
  tech_stack: { detected: string[] } | null;
  has_online_booking: boolean;
  has_chatbot: boolean;
  seo_score: number | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  opportunity_score: number | null;
  lead_status: string;
  ai_summary: string | null;
  enriched_at: string | null;
}

export interface ScanRequest {
  name: string;
  city: string;
  country: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  polygon?: [number, number][];
  nicho?: string;
}

export interface ScanJob {
  id: number;
  territory_id: number;
  nicho: string | null;
  status: string;
  total_found: number;
  total_enriched: number;
  started_at: string | null;
  finished_at: string | null;
}

export interface Competitor {
  id: number;
  name: string;
  type: string;
  country: string | null;
  markets: string[] | null;
  website: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  followers: number | null;
  engagement_rate: number | null;
  posting_frequency: string | null;
  content_strategy: Record<string, unknown> | null;
  target_markets: string[] | null;
  ai_analysis: string | null;
  gap_vs_liaflow: string | null;
  last_scanned_at: string | null;
}

export interface CompetitorCreate {
  name: string;
  type?: string;
  country?: string;
  markets?: string[];
  website?: string;
  instagram_url?: string;
  tiktok_url?: string;
  facebook_url?: string;
  linkedin_url?: string;
}

export interface WebhookItem {
  id: number;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
  created_at: string;
}

export interface ApiKeyItem {
  id: number;
  name: string;
  key_prefix: string;
  permissions: string[] | null;
  active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export interface HealthStats {
  total_health: number;
  total_enriched: number;
  subcategories: { subcategory: string; count: number }[];
  lead_distribution: { status: string; count: number }[];
  avg_opportunity_score: number | null;
  sources: { category: string; count: number }[];
}

export interface TerritoryStats {
  territory_id: number;
  territory_name: string;
  total_businesses: number;
  total_enriched: number;
  categories: { category: string; count: number }[];
  lead_distribution: { status: string; count: number }[];
  avg_opportunity_score: number | null;
}

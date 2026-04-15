/**
 * TerraTrail API Client
 * Matches documentation in API_DOCS.md
 * Base URL: http://localhost:8000/api/v1
 */

const BASE_URL = "http://localhost:8000/api/v1";

// ─── Interfaces ──────────────────────────────────────────────────

export interface DashboardStats {
  revenue: string;
  net_revenue: string;
  outstanding_balance: string;
  potential_revenue: string;
  commission_earned: string;
  commission_pending: string;
  commission_potential: string;
  active_subscriptions: number;
  total_customers: number;
  overdue_installments: number;
  pending_payments: number;
  filters: {
    date_from: string | null;
    date_to: string | null;
  };
}

export interface DateRange {
  from: string | null;
  to: string | null;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  title?: string;
  gender?: string;
  date_of_birth?: string;
  occupation?: string;
  address?: string;
  country?: string;
  state?: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

// ─── HTTP Helpers ────────────────────────────────────────────────

function getTokens() {
  const stored = localStorage.getItem("tt_auth");
  return stored ? JSON.parse(stored) : null;
}

function getWorkspaceSlug() {
  return localStorage.getItem("tt_workspace_slug") || "my-estate-company";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const tokens = getTokens();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Workspace": getWorkspaceSlug(),
    ...(options.headers as Record<string, string>),
  };

  if (tokens?.access) {
    headers["Authorization"] = `Bearer ${tokens.access}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
}

function buildParams(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.append(key, value);
    }
  });
  const str = searchParams.toString();
  return str ? `?${str}` : "";
}

// ─── API Methods ─────────────────────────────────────────────────

export const api = {
  dashboard: {
    getStats: (range: DateRange) =>
      request<DashboardStats>(`/notifications/dashboard/${buildParams({
        date_from: range.from,
        date_to: range.to
      })}`),

    getLeaderboard: (range: DateRange) =>
      request<any>(`/notifications/dashboard/leaderboard/${buildParams({
        date_from: range.from,
        date_to: range.to
      })}`),

    getRevenueBreakdown: (range: DateRange) =>
      request<any>(`/notifications/dashboard/revenue/${buildParams({
        date_from: range.from,
        date_to: range.to
      })}`),

    getProperties: (range: DateRange) =>
      request<any>(`/notifications/dashboard/properties/${buildParams({
        date_from: range.from,
        date_to: range.to
      })}`),

    getCustomers: (range: DateRange) =>
      request<any>(`/notifications/dashboard/customers/${buildParams({
        date_from: range.from,
        date_to: range.to
      })}`),
  },

  properties: {
    list: () => request<any[]>("/properties/"),
    get: (id: string) => request<any>(`/properties/${id}/`),
  },

  customers: {
    list: () => request<any[]>("/customers/"),
    get: (id: string) => request<any>(`/customers/${id}/`),
  },

  salesReps: {
    list: () => request<any[]>("/sales-reps/"),
    getStats: () => request<any>("/sales-reps/stats/"),
  },

  auth: {
    register: (data: any) => 
      request<any>("/auth/register/", { method: "POST", body: JSON.stringify(data) }),
    
    login: (data: any) => 
      request<AuthResponse>("/auth/login/", { method: "POST", body: JSON.stringify(data) }),
    
    refresh: (refresh: string) => 
      request<{ access: string }>("/auth/token/refresh/", { 
        method: "POST", 
        body: JSON.stringify({ refresh }) 
      }),

    me: () => request<User>("/auth/me/"),
    
    updateMe: (data: Partial<User>) => 
      request<User>("/auth/me/", { method: "PATCH", body: JSON.stringify(data) }),

    otpRequest: (data: { email?: string; phone?: string }) => 
      request<any>("/auth/otp/request/", { method: "POST", body: JSON.stringify(data) }),

    otpVerify: (data: { email?: string; phone?: string; code: string }) => 
      request<AuthResponse>("/auth/otp/verify/", { method: "POST", body: JSON.stringify(data) }),

    forgotPassword: (data: { email: string }) => 
      request<any>("/auth/otp/request/", { method: "POST", body: JSON.stringify(data) }),

    resetPassword: (data: any) => 
      request<any>("/auth/password/reset/", { method: "POST", body: JSON.stringify(data) }),

    listMembers: () => request<any[]>("/auth/members/"),
    
    addMember: (data: { email: string; role: string }) => 
      request<any>("/auth/members/add/", { method: "POST", body: JSON.stringify(data) }),
  }
};

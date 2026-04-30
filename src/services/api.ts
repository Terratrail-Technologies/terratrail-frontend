/**
 * TerraTrail API Client
 * Base URL: configurable via VITE_API_URL env var, defaults to localhost for dev.
 *
 * Security features:
 *  - Automatic JWT token refresh on 401
 *  - Dispatches "auth:logout" CustomEvent when refresh fails (session expired)
 *  - Clears all auth/workspace cache on forced logout
 *  - 403 responses surface as thrown errors (not silent)
 */

export const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000/api/v1";

// ─── One-time localStorage sanitisation ─────────────────────────────────────
["tt_auth", "tt_user", "tt_workspace_slug", "tt_workspace"].forEach((k) => {
  if (localStorage.getItem(k) === "undefined" || localStorage.getItem(k) === "null") {
    localStorage.removeItem(k);
  }
});

// ─── Interfaces ──────────────────────────────────────────────────────────────

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

// ─── Auth token helpers ──────────────────────────────────────────────────────

export function getTokens(): { access: string; refresh: string } | null {
  try {
    const stored = localStorage.getItem("tt_auth");
    if (!stored || stored === "undefined" || stored === "null") return null;
    const parsed = JSON.parse(stored);
    if (!parsed?.access) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveTokens(tokens: { access: string; refresh?: string }) {
  const current = getTokens();
  const merged = { ...current, ...tokens };
  localStorage.setItem("tt_auth", JSON.stringify(merged));
}

/** Wipes all session data and broadcasts the logout event. */
export function forceLogout(reason = "session_expired") {
  localStorage.removeItem("tt_auth");
  localStorage.removeItem("tt_user");
  localStorage.removeItem("tt_workspace");
  // Keep workspace_slug so the sign-in page can pre-fill the workspace
  window.dispatchEvent(new CustomEvent("auth:logout", { detail: { reason } }));
}

function getWorkspaceSlug() {
  return localStorage.getItem("tt_workspace_slug") ?? "";
}

// Paths that don't need (or can't use) X-Workspace-Slug / Authorization
const AUTH_PATHS = [
  "/auth/login/",
  "/auth/register/",
  "/auth/otp/",
  "/auth/token/",
  "/workspaces/mine/",
  "/workspaces/create/",
  "/workspaces/check-slug/",
];

// ─── Token refresh queue ─────────────────────────────────────────────────────
// Ensures only one refresh is in-flight at a time; queues parallel callers.

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const tokens = getTokens();
    if (!tokens?.refresh) throw new Error("no_refresh_token");

    const res = await fetch(`${BASE_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: tokens.refresh }),
    });

    if (!res.ok) throw new Error("refresh_failed");

    const json = await res.json();
    const newAccess: string =
      json?.data?.access ?? json?.access;
    if (!newAccess) throw new Error("refresh_no_access");

    saveTokens({ access: newAccess });
    return newAccess;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

// ─── Dev request logger ───────────────────────────────────────────────────────
const _isDev = import.meta.env.DEV;

function _logReq(method: string, path: string, status: number, ms: number) {
  if (!_isDev) return;
  const style =
    status >= 500 ? "color:#ef4444;font-weight:bold" :
    status >= 400 ? "color:#f97316;font-weight:bold" :
    status >= 300 ? "color:#eab308" :
    "color:#22c55e";
  console.groupCollapsed(
    `%c[API] ${method.padEnd(6)} ${status}  ${path}  (${ms}ms)`,
    style,
  );
  console.log("URL:", `${BASE_URL}${path}`);
  console.groupEnd();
}

// ─── Core HTTP helper ─────────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const tokens = getTokens();
  const isAuthPath = AUTH_PATHS.some((p) => path.startsWith(p)) ||
    /^\/workspaces\/invites\/[^/]/.test(path);
  const _t0 = Date.now();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (!isAuthPath) {
    headers["X-Workspace-Slug"] = getWorkspaceSlug();
  }

  if (tokens?.access) {
    headers["Authorization"] = `Bearer ${tokens.access}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  _logReq((options.method ?? "GET").toUpperCase(), path, response.status, Date.now() - _t0);

  // ── 401 Unauthorized → try token refresh once ────────────────────────────
  if (response.status === 401 && retry && !isAuthPath) {
    try {
      await refreshAccessToken();
      return request<T>(path, options, false /* no further retry */);
    } catch {
      // Refresh also failed — the session is truly expired
      forceLogout("token_expired");
      throw new Error("Session expired. Please sign in again.");
    }
  }

  // ── 403 Forbidden ────────────────────────────────────────────────────────
  if (response.status === 403) {
    throw new Error("You don't have permission to perform this action.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err = errorData as Record<string, any>;
    console.error(`[API ${response.status}] ${path}`, err);
    let message: string | undefined =
      err?.message ??
      err?.detail ??
      err?.non_field_errors?.[0] ??
      (Array.isArray(err?.errors) ? err.errors[0] : typeof err?.errors === "string" ? err.errors : undefined);
    if (!message) {
      const fieldKey = Object.keys(err).find(
        (k) => Array.isArray(err[k]) && err[k].length > 0
      );
      if (fieldKey) message = `${fieldKey}: ${err[fieldKey][0]}`;
    }
    throw new Error(message ?? `HTTP ${response.status}`);
  }

  const json = await response.json();
  // Unwrap standard envelope: { status, data: <payload> }
  return (json && typeof json === "object" && "data" in json ? json.data : json) as T;
}

// ─── Multipart (file upload) HTTP helper ─────────────────────────────────────
async function requestFile<T>(path: string, formData: FormData, method = "POST", retry = true): Promise<T> {
  const tokens = getTokens();
  const headers: Record<string, string> = {
    "X-Workspace-Slug": getWorkspaceSlug(),
  };
  if (tokens?.access) headers["Authorization"] = `Bearer ${tokens.access}`;
  const _t0 = Date.now();

  const response = await fetch(`${BASE_URL}${path}`, { method, body: formData, headers });
  _logReq(method.toUpperCase(), path, response.status, Date.now() - _t0);

  if (response.status === 401 && retry) {
    try {
      await refreshAccessToken();
      return requestFile<T>(path, formData, method, false);
    } catch {
      forceLogout("token_expired");
      throw new Error("Session expired. Please sign in again.");
    }
  }
  if (response.status === 403) throw new Error("You don't have permission to perform this action.");
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err = errorData as Record<string, any>;
    console.error(`[API ${response.status}] ${path}`, err);
    let message: string | undefined =
      err?.message ??
      err?.detail ??
      err?.non_field_errors?.[0] ??
      (Array.isArray(err?.errors) ? err.errors[0] : typeof err?.errors === "string" ? err.errors : undefined);
    if (!message) {
      const fieldKey = Object.keys(err).find(
        (k) => Array.isArray(err[k]) && err[k].length > 0
      );
      if (fieldKey) message = `${fieldKey}: ${err[fieldKey][0]}`;
    }
    throw new Error(message ?? `HTTP ${response.status}`);
  }
  const json = await response.json().catch(() => null);
  if (!json) return undefined as T;
  return (json?.data ?? json) as T;
}

// ─── Public (no-auth) request helper ─────────────────────────────────────────
async function publicRequest<T>(path: string): Promise<T> {
  const _t0 = Date.now();
  const response = await fetch(`${BASE_URL}${path}`);
  _logReq("GET", path, response.status, Date.now() - _t0);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json();
  return (json?.data ?? json) as T;
}

function buildParams(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.append(key, String(value));
    }
  });
  const str = searchParams.toString();
  return str ? `?${str}` : "";
}

// ─── Pagination helper ────────────────────────────────────────────────────────
function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as any).results))
    return (data as any).results as T[];
  return [];
}

// ─── API Methods ──────────────────────────────────────────────────────────────

export const api = {
  // ── Public estate listing (no auth) ─────────────────────────────────────
  public: {
    properties: (workspaceSlug: string) =>
      publicRequest<any[]>(`/public/${workspaceSlug}/properties/`),
    property: (workspaceSlug: string, id: string) =>
      publicRequest<any>(`/public/${workspaceSlug}/properties/${id}/`),
    inspectionConfig: (workspaceSlug: string, propertyId: string) =>
      publicRequest<any>(`/public/${workspaceSlug}/properties/${propertyId}/inspection-config/`),
    appreciations: (workspaceSlug: string, propertyId: string) =>
      publicRequest<any[]>(`/public/${workspaceSlug}/properties/${propertyId}/appreciations/`),
  },

  // ── Health ────────────────────────────────────────────────────────────────
  health: {
    ping: () =>
      fetch(`${BASE_URL}/health/`).then((r) => r.json()).catch(() => ({ status: "offline" })),
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: {
    getStats: (range: DateRange) =>
      request<DashboardStats>(
        `/notifications/dashboard/${buildParams({ date_from: range.from, date_to: range.to })}`
      ),
    getLeaderboard: (range: DateRange) =>
      request<any>(
        `/notifications/dashboard/leaderboard/${buildParams({ date_from: range.from, date_to: range.to })}`
      ),
    getRevenueBreakdown: (range: DateRange) =>
      request<any>(
        `/notifications/dashboard/revenue/${buildParams({ date_from: range.from, date_to: range.to })}`
      ),
    getProperties: (range: DateRange) =>
      request<any>(
        `/notifications/dashboard/properties/${buildParams({ date_from: range.from, date_to: range.to })}`
      ),
    getCustomers: (range: DateRange) =>
      request<any>(
        `/notifications/dashboard/customers/${buildParams({ date_from: range.from, date_to: range.to })}`
      ),
  },

  // ── Properties ────────────────────────────────────────────────────────────
  properties: {
    list: () => request<any>("/properties/").then(unwrapList),
    get: (id: string) => request<any>(`/properties/${id}/`),
    inspectionConfig: {
      get: (propertyId: string) => request<any>(`/properties/${propertyId}/inspection-config/`),
      save: (propertyId: string, data: any) =>
        request<any>(`/properties/${propertyId}/inspection-config/`, { method: "POST", body: JSON.stringify(data) }),
    },
    appreciations: {
      list: (propertyId: string) => request<any[]>(`/properties/${propertyId}/appreciations/`),
      create: (propertyId: string, data: any) =>
        request<any>(`/properties/${propertyId}/appreciations/`, { method: "POST", body: JSON.stringify(data) }),
      delete: (propertyId: string, appreciationId: string) =>
        request<void>(`/properties/${propertyId}/appreciations/${appreciationId}/`, { method: "DELETE" }),
    },
    create: (data: any) =>
      request<any>("/properties/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/properties/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/properties/${id}/`, { method: "DELETE" }),
    uploadFeaturedImage: (id: string, file: File) => {
      const fd = new FormData();
      fd.append("featured_image", file);
      return requestFile<any>(`/properties/${id}/`, fd, "PATCH");
    },
    uploadGalleryImage: (propertyId: string, file: File, order = 0) => {
      const fd = new FormData();
      fd.append("property", propertyId);
      fd.append("image", file);
      fd.append("order", String(order));
      return requestFile<any>("/properties/gallery/", fd, "POST");
    },
  },

  // ── Customers ─────────────────────────────────────────────────────────────
  customers: {
    list: () => request<any>("/customers/").then(unwrapList),
    get: (id: string) => request<any>(`/customers/${id}/`),
    create: (data: any) =>
      request<any>("/customers/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/customers/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  },

  // ── Site Inspections ─────────────────────────────────────────────────────
  siteInspections: {
    list: (status?: string) =>
      request<any>(`/customers/site-inspections/${status ? `?status=${status}` : ""}`).then(unwrapList),
    get: (id: string) => request<any>(`/customers/site-inspections/${id}/`),
    create: (data: any) =>
      request<any>("/customers/site-inspections/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/customers/site-inspections/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/customers/site-inspections/${id}/`, { method: "DELETE" }),
  },

  // ── Sales Reps / Commissions ──────────────────────────────────────────────
  salesReps: {
    list: () => request<any>("/commissions/reps/").then(unwrapList),
    get: (id: string) => request<any>(`/commissions/reps/${id}/`),
    create: (data: any) =>
      request<any>("/commissions/reps/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/commissions/reps/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/commissions/reps/${id}/`, { method: "DELETE" }),
    getStats: (range?: DateRange) =>
      request<any>(
        `/notifications/dashboard/leaderboard/${buildParams({
          date_from: range?.from,
          date_to: range?.to,
        })}`
      ),
  },

  // ── Commissions ────────────────────────────────────────────────────────────
  commissions: {
    list: (params?: { status?: string; sales_rep?: string }) =>
      request<any>(`/commissions/${buildParams(params ?? {})}`).then(unwrapList),
    markPaid: (id: string, notes = "") =>
      request<any>(`/commissions/${id}/mark-paid/`, { method: "POST", body: JSON.stringify({ notes }) }),
  },

  // ── Workspaces ────────────────────────────────────────────────────────────
  workspaces: {
    create: (data: {
      name: string;
      slug?: string;
      timezone?: string;
      region?: string;
      support_email?: string;
      support_whatsapp?: string;
    }) => request<any>("/workspaces/create/", { method: "POST", body: JSON.stringify(data) }),
    checkSlug: (slug: string) =>
      request<{ slug: string; available: boolean; suggestions: string[] }>(
        `/workspaces/check-slug/?slug=${encodeURIComponent(slug)}`
      ),
    detail: () => request<any>("/workspaces/detail/"),
    updateDetail: (data: any) =>
      request<any>("/workspaces/detail/", { method: "PATCH", body: JSON.stringify(data) }),
    getSettings: () => request<any>("/workspaces/settings/"),
    updateSettings: (data: any) =>
      request<any>("/workspaces/settings/", { method: "PATCH", body: JSON.stringify(data) }),
    listMembers: () => request<any>("/workspaces/members/").then(unwrapList),
    invite: (data: { email: string; role: string }) =>
      request<any>("/workspaces/invites/", { method: "POST", body: JSON.stringify(data) }),
    getInvite: (token: string) =>
      request<{ email: string; role: string; workspace_name: string; workspace_slug: string; is_expired: boolean; is_accepted: boolean }>(
        `/workspaces/invites/${token}/`
      ),
    acceptInvite: (token: string) =>
      request<{ detail: string; workspace_slug: string; workspace_name: string; role: string }>(
        `/workspaces/invites/${token}/accept/`,
        { method: "POST", body: JSON.stringify({}) }
      ),
    activity: (page = 1) => request<any>(`/workspaces/activity/${buildParams({ page })}`),
    events: () => request<{ events: any[]; count: number }>("/workspaces/events/"),
    billingPlans: () => request<{ plans: any[]; payment_details: any }>("/workspaces/billing/plans/"),
    billingUsage: () => request<any>("/workspaces/billing/usage/"),
    selectPlan: (data: { plan: string }) =>
      request<any>("/workspaces/billing/select/", { method: "POST", body: JSON.stringify(data) }),
    mine: () => request<any[]>("/workspaces/mine/"),
    myMembership: () =>
      request<{ role: string; is_active: boolean; workspace_id: string; workspace_name: string }>(
        "/workspaces/my-membership/"
      ),
  },

  // ── Banking / Account Verification (Paystack) ────────────────────────────
  banking: {
    verifyAccount: (accountNumber: string, bankCode: string) =>
      request<{ account_name: string; account_number: string }>(
        `/payments/verify-account/${buildParams({ account_number: accountNumber, bank_code: bankCode })}`
      ),
    /**
     * Fetches the Nigerian bank list directly from Paystack's public API.
     * Uses the public key — no backend proxy needed, avoids the 502 from
     * backend→Paystack network issues in dev environments.
     */
    listBanks: async (): Promise<{ banks: { name: string; code: string }[] }> => {
      const publicKey = (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined) ?? "";
      const res = await fetch(
        "https://api.paystack.co/bank?country=nigeria&perPage=100&use_cursor=false",
        publicKey ? { headers: { Authorization: `Bearer ${publicKey}` } } : {},
      );
      if (!res.ok) throw new Error(`Paystack banks: HTTP ${res.status}`);
      const json = await res.json();
      // Deduplicate by code — Paystack occasionally returns multiple entries
      // with the same bank code, which would cause React duplicate-key warnings.
      const seen = new Set<string>();
      const banks = (json?.data ?? [])
        .map((b: any) => ({ name: b.name as string, code: b.code as string }))
        .filter(({ code }: { code: string }) => {
          if (seen.has(code)) return false;
          seen.add(code);
          return true;
        });
      return { banks };
    },
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: {
    register: (data: any) =>
      request<any>("/auth/register/", { method: "POST", body: JSON.stringify(data) }),
    login: (data: any) =>
      request<AuthResponse>("/auth/login/", { method: "POST", body: JSON.stringify(data) }),
    refresh: (refresh: string) =>
      request<{ access: string }>("/auth/token/refresh/", {
        method: "POST",
        body: JSON.stringify({ refresh }),
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
      request<any>("/auth/otp/verify/", { method: "POST", body: JSON.stringify(data) }),
    listMembers: () => request<any[]>("/auth/members/"),
    addMember: (data: { email: string; role: string }) =>
      request<any>("/auth/members/add/", { method: "POST", body: JSON.stringify(data) }),
  },
};

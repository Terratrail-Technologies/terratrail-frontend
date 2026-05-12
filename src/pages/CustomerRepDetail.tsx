import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ArrowLeft, Users, Building2, TrendingUp, DollarSign,
  Phone, Mail, Calendar, Shield, Search,
  UserX, RefreshCw, Eye, AlertCircle, CheckCircle,
  Clock, XCircle, BarChart2, Activity,
} from "lucide-react";
import { api } from "../services/api";
import { useWorkspaceRole } from "../hooks/useWorkspaceRole";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RepMember {
  id: string;
  user: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  role: string;
  is_active: boolean;
  created_at: string;
  managed_customers_count: number;
  managed_subscriptions_count: number;
  active_subscriptions_count: number;
  properties_count: number;
  total_revenue_managed: number;
}

interface CustomerItem {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  primary_subscription: {
    id: string;
    property_name: string;
    land_size: string;
    plan_name: string;
    payment_type: string;
    locked_price: string;
    amount_paid: string;
    balance: string;
    status: string;
    next_due_date: string | null;
  } | null;
  active_subscriptions: number;
  completed_subscriptions: number;
  defaulting_subscriptions: number;
  assigned_rep?: string;
  created_at: string;
}

interface PropertyItem {
  id: string;
  name: string;
  property_type: string;
  city: string;
  state: string;
  customers_count?: number;
  active_subs?: number;
  revenue?: number;
}

interface ActivityItem {
  id: string;
  action_text: string;
  actor: string;
  actor_name?: string;
  category: string;
  created_at: string;
}

interface WorkspaceSettings {
  allow_reps_approve_bookings: boolean;
  allow_reps_manage_subscriptions: boolean;
  allow_reps_manage_sales_reps: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n >= 1_000_000
    ? `₦${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `₦${(n / 1_000).toFixed(0)}K`
    : `₦${n.toLocaleString("en-NG")}`;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

function SubStatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: React.ElementType; label: string }> = {
    ACTIVE:     { cls: "bg-[#d6e0f5] text-[#0E2C72]", icon: CheckCircle, label: "Active" },
    COMPLETED:  { cls: "bg-blue-100 text-blue-700",     icon: CheckCircle,  label: "Completed" },
    DEFAULTING: { cls: "bg-red-100 text-red-700",       icon: AlertCircle,  label: "Defaulting" },
    CANCELLED:  { cls: "bg-neutral-100 text-neutral-500", icon: XCircle,    label: "Cancelled" },
    PENDING:    { cls: "bg-amber-100 text-amber-700",   icon: Clock,        label: "Pending" },
  };
  const cfg = map[status] ?? map["PENDING"];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${cfg.cls}`}>
      <Icon className="size-3" /> {cfg.label}
    </span>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color, sub,
}: {
  label: string; value: string | number; icon: React.ElementType;
  color: "emerald" | "blue" | "violet" | "amber" | "red"; sub?: string;
}) {
  const c = {
    emerald: "bg-[#0E2C72]/6 text-[#0E2C72]",
    blue:    "bg-blue-50 text-blue-600",
    violet:  "bg-violet-50 text-violet-600",
    amber:   "bg-amber-50 text-amber-600",
    red:     "bg-red-50 text-red-600",
  }[color];
  return (
    <div className="bg-white rounded-xl border border-neutral-100 p-4 flex items-start gap-3 shadow-sm">
      <div className={`p-2.5 rounded-xl shrink-0 ${c}`}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">{label}</p>
        <p className="text-[20px] font-bold text-neutral-900 leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-neutral-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

const TABS = [
  { key: "overview",    label: "Overview",            icon: BarChart2 },
  { key: "properties",  label: "Assigned Properties", icon: Building2 },
  { key: "customers",   label: "Managed Customers",   icon: Users },
  { key: "activity",    label: "Activity Log",         icon: Activity },
  { key: "profile",     label: "Profile",             icon: Shield },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({
  rep, customers, settings,
}: {
  rep: RepMember;
  customers: CustomerItem[];
  settings: WorkspaceSettings | null;
}) {
  const completedSubs = customers.reduce((s, c) => s + c.completed_subscriptions, 0);
  const defaultingSubs = customers.reduce((s, c) => s + c.defaulting_subscriptions, 0);
  const outstanding = customers.reduce((c, cu) => {
    const b = parseFloat(cu.primary_subscription?.balance ?? "0");
    return c + (isNaN(b) ? 0 : b);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Rep info card */}
      <div className="bg-white rounded-xl border border-neutral-100 p-5 shadow-sm">
        <h3 className="text-[13px] font-bold text-neutral-700 mb-4">Rep Profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: Users,    label: "Full Name",   value: rep.user_name || "—" },
            { icon: Mail,     label: "Email",        value: rep.user_email || "—" },
            { icon: Phone,    label: "Phone",        value: rep.user_phone || "—" },
            { icon: Calendar, label: "Date Added",   value: fmtDate(rep.created_at) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-neutral-100 mt-0.5 shrink-0">
                <Icon className="size-3.5 text-neutral-500" />
              </div>
              <div>
                <p className="text-[11px] text-neutral-400 font-medium">{label}</p>
                <p className="text-[13px] font-semibold text-neutral-800 break-all">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance stats */}
      <div>
        <h3 className="text-[13px] font-bold text-neutral-700 mb-3">Performance Summary</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Properties"         value={rep.properties_count ?? 0}          icon={Building2}  color="blue"    />
          <StatCard label="Total Customers"     value={rep.managed_customers_count}         icon={Users}      color="violet"  />
          <StatCard label="Active Subs"         value={rep.active_subscriptions_count ?? 0} icon={TrendingUp} color="emerald" />
          <StatCard label="Completed Subs"      value={completedSubs}                       icon={CheckCircle} color="blue"  />
          <StatCard label="Defaulting Subs"     value={defaultingSubs}                      icon={AlertCircle} color="red"   />
          <StatCard label="Revenue Managed"     value={fmt(rep.total_revenue_managed ?? 0)} icon={DollarSign} color="emerald" />
          <StatCard label="Outstanding Balance" value={fmt(outstanding)}                    icon={AlertCircle} color="amber"  sub="across all customers" />
        </div>
      </div>

      {/* Permissions */}
      {settings && (
        <div className="bg-white rounded-xl border border-neutral-100 p-5 shadow-sm">
          <h3 className="text-[13px] font-bold text-neutral-700 mb-4">Permissions (Workspace-level)</h3>
          <div className="space-y-3">
            {[
              { label: "Can Approve / Reject Bookings",        value: settings.allow_reps_approve_bookings },
              { label: "Can Manage Subscriptions",             value: settings.allow_reps_manage_subscriptions },
              { label: "Can Manage Sales Reps & Commission",   value: settings.allow_reps_manage_sales_reps },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-neutral-50 last:border-0">
                <span className="text-[13px] text-neutral-700">{label}</span>
                <span className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full ${value ? "bg-[#d6e0f5] text-[#0E2C72]" : "bg-neutral-100 text-neutral-500"}`}>
                  {value ? "Yes" : "No"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Properties Tab ────────────────────────────────────────────────────────────

function PropertiesTab({ customers }: { customers: CustomerItem[] }) {
  // Derive unique properties from customer subscriptions
  const propMap = new Map<string, PropertyItem & { _revenue: number; _outstanding: number }>();
  customers.forEach((c) => {
    const sub = c.primary_subscription;
    if (!sub) return;
    const key = sub.property_name;
    if (!propMap.has(key)) {
      propMap.set(key, {
        id: key, name: sub.property_name, property_type: "", city: "", state: "",
        customers_count: 0, active_subs: 0, _revenue: 0, _outstanding: 0,
      });
    }
    const p = propMap.get(key)!;
    p.customers_count = (p.customers_count ?? 0) + 1;
    if (sub.status === "ACTIVE") p.active_subs = (p.active_subs ?? 0) + 1;
    p._revenue += parseFloat(sub.amount_paid || "0");
    p._outstanding += parseFloat(sub.balance || "0");
  });
  const properties = Array.from(propMap.values());

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
        <Building2 className="size-10 mb-3 opacity-40" />
        <p className="text-[14px] font-semibold">No properties assigned yet</p>
        <p className="text-[12px] mt-1">Properties appear here based on customer subscriptions</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {/* Mobile cards (< md) */}
      <div className="md:hidden space-y-3">
        {properties.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-neutral-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-blue-50">
                <Building2 className="size-3.5 text-blue-600" />
              </div>
              <span className="font-bold text-neutral-800 text-[14px]">{p.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Customers</p>
                <p className="text-[13px] font-bold text-neutral-700">{p.customers_count}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Active Subs</p>
                <p className="text-[13px] font-bold text-neutral-700">{p.active_subs}</p>
              </div>
              <div className="col-span-2 pt-2 border-t border-neutral-50 flex justify-between items-center">
                <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Total Revenue</p>
                <p className="text-[13px] font-bold text-[#0E2C72]">{fmt(p._revenue)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table (≥ md) */}
      <div className="hidden md:block bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Property</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Location</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Customers</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Active Subs</th>
                <th className="text-right px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Revenue Collected</th>
                <th className="text-right px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {properties.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-50">
                        <Building2 className="size-3.5 text-blue-600" />
                      </div>
                      <div>
                        <span className="font-semibold text-neutral-800">{p.name}</span>
                        {p.property_type && (
                          <p className="text-[11px] text-neutral-400 capitalize">{p.property_type.replace(/_/g," ").toLowerCase()}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 text-[12px]">
                    {[p.city, p.state].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-neutral-700">{p.customers_count}</td>
                  <td className="px-4 py-3 text-center font-semibold text-neutral-700">{p.active_subs}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#0E2C72]">{fmt(p._revenue)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-red-600">{fmt(p._outstanding ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Customers Tab ─────────────────────────────────────────────────────────────

function CustomersTab({ customers }: { customers: CustomerItem[] }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchQ = !q || c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    const matchS = statusFilter === "ALL" || c.primary_subscription?.status === statusFilter;
    return matchQ && matchS;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="w-full pl-9 pr-4 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3d8f] bg-white"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["ALL", "ACTIVE", "DEFAULTING", "COMPLETED", "CANCELLED"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-colors ${statusFilter === s ? "bg-[#0E2C72] text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:border-[#0E2C72]/40"}`}>
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile cards (< md) */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 text-[13px]">No customers found.</div>
        ) : filtered.map((c) => {
          const sub = c.primary_subscription;
          return (
            <div key={c.id} className="bg-white rounded-xl border border-neutral-100 p-4 shadow-sm" onClick={() => navigate(`/customers/${c.id}`)}>
              <div className="flex justify-between items-start mb-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-neutral-900 text-[14px] truncate">{c.full_name}</p>
                  <p className="text-[11px] text-neutral-400 truncate">{c.email}</p>
                </div>
                {sub && <SubStatusBadge status={sub.status} />}
              </div>
              <div className="grid grid-cols-2 gap-3 text-[12px] mb-3">
                <div>
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Property</p>
                  <p className="text-neutral-700 font-medium truncate">{sub?.property_name || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Balance</p>
                  <p className="text-red-600 font-bold">{sub ? fmt(parseFloat(sub.balance || "0")) : "—"}</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-neutral-50">
                <div className="text-[11px] text-neutral-500">Next Due: {sub?.next_due_date ? fmtDate(sub.next_due_date) : "—"}</div>
                <button className="p-1.5 rounded-lg bg-neutral-50 text-[#0E2C72]">
                  <Eye className="size-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table (≥ md) */}
      <div className="hidden md:block bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Phone</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Property</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Plan</th>
                <th className="text-right px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Locked Price</th>
                <th className="text-right px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Amount Paid</th>
                <th className="text-right px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Outstanding</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Next Due</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-neutral-400 text-[13px]">
                    {search || statusFilter !== "ALL" ? "No customers match your filters." : "No customers assigned to this rep."}
                  </td>
                </tr>
              ) : filtered.map((c) => {
                const sub = c.primary_subscription;
                return (
                  <tr key={c.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-neutral-800">{c.full_name}</p>
                        <p className="text-[11px] text-neutral-400">{c.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{c.phone || "—"}</td>
                    <td className="px-4 py-3 text-neutral-700">{sub?.property_name || "—"}</td>
                    <td className="px-4 py-3">
                      {sub ? (
                        <div>
                          <p className="font-medium text-neutral-800">{sub.plan_name}</p>
                          <p className="text-[11px] text-neutral-400">{sub.land_size ? `${sub.land_size} SQM` : ""}</p>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-neutral-800">
                      {sub ? fmt(parseFloat(sub.locked_price || "0")) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#0E2C72]">
                      {sub ? fmt(parseFloat(sub.amount_paid || "0")) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">
                      {sub ? fmt(parseFloat(sub.balance || "0")) : "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 text-[12px]">
                      {sub?.next_due_date ? fmtDate(sub.next_due_date) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {sub ? <SubStatusBadge status={sub.status} /> : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => navigate(`/customers/${c.id}`)}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700">
                        <Eye className="size-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-neutral-50 bg-neutral-50">
            <span className="text-[11px] text-neutral-400">{filtered.length} customer{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Activity Tab ──────────────────────────────────────────────────────────────

function ActivityTab({ repUserId, repName }: { repUserId: string; repName: string }) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.workspaces.activity()
      .then((data: any) => {
        const list: ActivityItem[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
          ? data.results
          : [];
        // Filter to activity by this rep (actor matches user id or name)
        setItems(list.filter((a) => a.actor === repUserId || a.actor_name === repName));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [repUserId, repName]);

  const categoryColors: Record<string, string> = {
    Workspace: "bg-blue-100 text-blue-700",
    Billing:   "bg-violet-100 text-violet-700",
    Customer:  "bg-[#d6e0f5] text-[#0E2C72]",
    Payment:   "bg-amber-100 text-amber-700",
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-xl border border-neutral-100 p-4 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-neutral-100 rounded w-3/4" />
              <div className="h-2 bg-neutral-100 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
        <Activity className="size-10 mb-3 opacity-40" />
        <p className="text-[14px] font-semibold">No activity logged yet</p>
        <p className="text-[12px] mt-1">Actions taken by this rep will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="bg-white rounded-xl border border-neutral-100 p-4 flex items-start gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-[#d6e0f5] flex items-center justify-center shrink-0">
            <Activity className="size-3.5 text-[#0E2C72]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-neutral-800">{item.action_text}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${categoryColors[item.category] ?? "bg-neutral-100 text-neutral-500"}`}>
                {item.category}
              </span>
              <span className="text-[11px] text-neutral-400">{fmtDate(item.created_at)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────

function ProfileTab({ rep }: { rep: RepMember }) {
  const fields = [
    { label: "Full Name",  value: rep.user_name  || "—" },
    { label: "Email",      value: rep.user_email || "—" },
    { label: "Phone",      value: rep.user_phone || "—" },
    { label: "Role",       value: rep.role.replace("_", " ") },
    { label: "Status",     value: rep.is_active ? "Active" : "Inactive" },
    { label: "Date Added", value: fmtDate(rep.created_at) },
  ];

  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
        <h3 className="text-[14px] font-bold text-neutral-800">Profile Details</h3>
      </div>
      <div className="divide-y divide-neutral-50">
        {fields.map(({ label, value }) => (
          <div key={label} className="px-5 py-3.5 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-neutral-500">{label}</span>
            <span className={`text-[13px] font-medium text-right ${label === "Status" ? (rep.is_active ? "text-[#0E2C72] font-bold" : "text-neutral-500") : "text-neutral-800"}`}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CustomerRepDetail() {
  const { id } = useParams<{ id: string }>();
  const { role, loading: roleLoading } = useWorkspaceRole();

  const [rep, setRep] = useState<RepMember | null>(null);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("overview");

  const isAdmin = role === "OWNER" || role === "ADMIN";

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [membersRaw, customersRaw, settingsRaw] = await Promise.allSettled([
        api.workspaces.listMembers(),
        api.customers.list(),
        api.workspaces.getSettings(),
      ]);

      if (membersRaw.status === "fulfilled") {
        const members = membersRaw.value as RepMember[];
        const found = members.find((m) => m.id === id);
        setRep(found ?? null);
      }
      if (customersRaw.status === "fulfilled") {
        const all = customersRaw.value as CustomerItem[];
        const repMember = membersRaw.status === "fulfilled"
          ? (membersRaw.value as RepMember[]).find((m) => m.id === id)
          : null;
        const repUserId = repMember?.user;
        setCustomers(repUserId ? all.filter((c: any) => c.assigned_rep === repUserId) : []);
      }
      if (settingsRaw.status === "fulfilled") {
        setSettings(settingsRaw.value as WorkspaceSettings);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!roleLoading) load();
  }, [roleLoading, load]);

  if (!roleLoading && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="size-8 text-red-400" />
        <p className="text-[14px] font-semibold text-neutral-700">Access Denied</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-neutral-100 rounded-lg w-64" />
        <div className="h-24 bg-neutral-100 rounded-xl" />
        <div className="h-64 bg-neutral-100 rounded-xl" />
      </div>
    );
  }

  if (!rep) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="size-8 text-red-400" />
        <p className="text-[14px] font-semibold text-neutral-700">Rep not found</p>
        <Link to="/customer-reps" className="text-[13px] text-[#0E2C72] hover:underline flex items-center gap-1">
          <ArrowLeft className="size-3.5" /> Back to list
        </Link>
      </div>
    );
  }

  const initials = rep.user_name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

  return (
    <div className="p-6 space-y-6">
      {/* Back + Header */}
      <div>
        <Link to="/customer-reps" className="inline-flex items-center gap-1.5 text-[12px] text-neutral-500 hover:text-neutral-800 mb-3 transition-colors">
          <ArrowLeft className="size-3.5" /> Customer Representatives
        </Link>
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2a52a8] to-[#0E2C72] flex items-center justify-center text-[18px] font-bold text-white shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] font-bold text-neutral-900">{rep.user_name}</h1>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${rep.is_active ? "bg-[#d6e0f5] text-[#0E2C72]" : "bg-neutral-100 text-neutral-500"}`}>
                  {rep.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-[13px] text-neutral-500">{rep.user_email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold text-neutral-700 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
              <RefreshCw className="size-3.5" /> Reassign Customers
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
              <UserX className="size-3.5" /> Deactivate
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-neutral-100 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold border-b-2 whitespace-nowrap transition-colors ${
              tab === key
                ? "border-[#0E2C72] text-[#0E2C72]"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === "overview"   && <OverviewTab    rep={rep} customers={customers} settings={settings} />}
        {tab === "properties" && <PropertiesTab  customers={customers} />}
        {tab === "customers"  && <CustomersTab   customers={customers} />}
        {tab === "activity"   && <ActivityTab    repUserId={rep.user} repName={rep.user_name} />}
        {tab === "profile"    && <ProfileTab     rep={rep} />}
      </div>
    </div>
  );
}



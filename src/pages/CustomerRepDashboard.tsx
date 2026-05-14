import { useState, useEffect } from "react";
import {
  Users, Calendar, ShoppingBag, Bell,
  LayoutDashboard, UserCircle, ClipboardList,
  ChevronRight, Loader2, Search, MapPin,
} from "lucide-react";
import { api } from "../services/api";
import { TablePagination } from "../components/ui/TablePagination";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACCENT = "#0E2C72";

function fmtDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-NG", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Sidebar nav items ────────────────────────────────────────────────────────

type NavKey = "overview" | "customers" | "inspections" | "subscriptions" | "profile";

const NAV_ITEMS: { key: NavKey; label: string; icon: React.ElementType }[] = [
  { key: "overview",       label: "Overview",       icon: LayoutDashboard },
  { key: "customers",      label: "My Customers",   icon: Users           },
  { key: "inspections",    label: "Inspections",    icon: Calendar        },
  { key: "subscriptions",  label: "Subscriptions",  icon: ShoppingBag     },
  { key: "profile",        label: "Profile",        icon: UserCircle      },
];

// ─── Priority summary card ────────────────────────────────────────────────────

function PriorityCard({
  label, value, icon: Icon, accent, sub,
}: {
  label: string; value: number | string;
  icon: React.ElementType; accent: string; sub?: string;
}) {
  return (
    <div
      className="relative bg-white rounded-xl border border-neutral-100 p-4 flex items-start gap-3 shadow-sm hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow duration-200 overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: accent }} />
      <div className="p-2.5 rounded-xl shrink-0" style={{ background: `${accent}12` }}>
        <Icon className="size-4" style={{ color: accent }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">{label}</p>
        <p className="text-[22px] font-bold text-neutral-900 leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-neutral-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function Empty({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="text-center py-12">
      <Icon className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
      <p className="text-[13px] text-neutral-400">{message}</p>
    </div>
  );
}

// ─── Overview panel ───────────────────────────────────────────────────────────

function OverviewPanel({
  customersCount, inspectionsCount, followUpsCount, subsCount, loading,
}: {
  customersCount: number; inspectionsCount: number;
  followUpsCount: number; subsCount: number; loading: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[15px] font-semibold text-neutral-900 mb-1">Your Dashboard</h2>
        <p className="text-[12.5px] text-neutral-500">
          A summary of your tasks and assigned customers.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-neutral-100 p-4 animate-pulse">
              <div className="h-3 w-24 bg-neutral-100 rounded mb-3" />
              <div className="h-7 w-12 bg-neutral-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <PriorityCard label="Upcoming Inspections" value={inspectionsCount} icon={Calendar}     accent="#0E2C72" sub="scheduled"        />
          <PriorityCard label="Pending Follow-Ups"   value={followUpsCount}   icon={Bell}         accent="#f97316" sub="require action"   />
          <PriorityCard label="Assigned Customers"   value={customersCount}   icon={Users}        accent="#3b82f6" sub="in your portfolio" />
          <PriorityCard label="Active Subscriptions" value={subsCount}        icon={ShoppingBag}  accent="#8b5cf6" sub="active plans"      />
        </div>
      )}

      <div className="bg-gradient-to-br from-[#eef2fb] via-white to-[#eef2fb] border border-[#0E2C72]/15 rounded-xl p-6">
        <h3 className="text-[14px] font-semibold text-[#071a45] mb-1">Quick Actions</h3>
        <p className="text-[12px] text-[#0E2C72]/60 mb-4">Shortcuts to your most common tasks.</p>
        <div className="flex flex-wrap gap-2.5">
          <button
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0E2C72] text-white rounded-lg text-[13px] font-medium hover:bg-[#0a2260] transition-colors shadow-sm"
            onClick={() => window.location.href = "/site-inspection"}
          >
            <Calendar className="w-3.5 h-3.5" /> Manage Inspections
          </button>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#8aaad8] text-[#0a2260] rounded-lg text-[13px] font-medium hover:bg-[#0E2C72]/6 transition-colors"
            onClick={() => window.location.href = "/customers"}
          >
            <Users className="w-3.5 h-3.5" /> View Customers
          </button>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-[13px] font-medium hover:bg-neutral-50 transition-colors"
            onClick={() => window.location.href = "/subscriptions"}
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Subscriptions
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Customers panel ──────────────────────────────────────────────────────────

function CustomersPanel({ customers, loading }: { customers: any[]; loading: boolean }) {
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
  });

  const pageCount = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[15px] font-semibold text-neutral-900 mb-1">My Customers</h2>
        <p className="text-[12.5px] text-neutral-500">All customers assigned to you.</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or email…"
          className="w-full pl-9 pr-4 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]/30 bg-white"
        />
      </div>

      <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Phone</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Subscriptions</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-3.5 bg-neutral-100 rounded w-32" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-neutral-100 rounded w-40" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-neutral-100 rounded w-24" /></td>
                    <td className="px-4 py-3 text-center"><div className="h-3 bg-neutral-100 rounded w-8 mx-auto" /></td>
                    <td className="px-4 py-3 text-center"><div className="h-3 bg-neutral-100 rounded w-20 mx-auto" /></td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-neutral-400 text-[13px]">
                    {search ? "No customers match your search." : "No customers assigned to you yet."}
                  </td>
                </tr>
              ) : (
                paginated.map((c) => {
                  const initials = (c.full_name ?? "?")
                    .split(" ").slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join("");
                  return (
                    <tr key={c.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                            style={{ background: `linear-gradient(135deg, #2a52a8, ${ACCENT})` }}
                          >
                            {initials}
                          </div>
                          <span className="font-semibold text-neutral-800 truncate max-w-[140px]">
                            {c.full_name ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-600 truncate max-w-[180px]">{c.email ?? "—"}</td>
                      <td className="px-4 py-3 text-neutral-500">{c.phone ?? "—"}</td>
                      <td className="px-4 py-3 text-center font-semibold text-neutral-700">
                        {c.subscriptions_count ?? 0}
                      </td>
                      <td className="px-4 py-3 text-center text-neutral-500">
                        {c.created_at ? fmtDate(c.created_at) : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <TablePagination
            page={page}
            pageCount={Math.max(1, pageCount)}
            total={filtered.length}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={(n) => { setPageSize(n); setPage(1); }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Inspections panel ────────────────────────────────────────────────────────

function InspectionsPanel({ inspections, loading }: { inspections: any[]; loading: boolean }) {
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const pageCount = Math.ceil(inspections.length / pageSize);
  const paginated = inspections.slice((page - 1) * pageSize, page * pageSize);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING:   "bg-amber-50 text-amber-700",
      CONFIRMED: "bg-[#d6e0f5] text-[#0E2C72]",
      COMPLETED: "bg-green-50 text-green-700",
      CANCELLED: "bg-neutral-100 text-neutral-500",
    };
    return map[status] ?? "bg-neutral-100 text-neutral-500";
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[15px] font-semibold text-neutral-900 mb-1">Inspections</h2>
        <p className="text-[12.5px] text-neutral-500">Upcoming inspection slots for your customers.</p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Property</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Date</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Guests</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-3.5 bg-neutral-100 rounded w-28" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-neutral-100 rounded w-36" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-neutral-100 rounded w-24" /></td>
                    <td className="px-4 py-3 text-center"><div className="h-3 bg-neutral-100 rounded w-8 mx-auto" /></td>
                    <td className="px-4 py-3 text-center"><div className="h-5 bg-neutral-100 rounded-full w-16 mx-auto" /></td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <Empty icon={Calendar} message="No upcoming inspections." />
                  </td>
                </tr>
              ) : (
                paginated.map((insp) => (
                  <tr key={insp.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-neutral-800 truncate max-w-[140px]">
                      {insp.customer_name ?? insp.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 truncate max-w-[160px]">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-3 text-neutral-400 shrink-0" />
                        {insp.property_name ?? insp.property?.name ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {insp.preferred_date ? fmtDate(insp.preferred_date) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-neutral-700 font-semibold">
                      {insp.number_of_guests ?? 1}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusBadge(insp.status)}`}>
                        {insp.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && inspections.length > 0 && (
          <TablePagination
            page={page}
            pageCount={Math.max(1, pageCount)}
            total={inspections.length}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={(n) => { setPageSize(n); setPage(1); }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Subscriptions panel ──────────────────────────────────────────────────────

function SubscriptionsPanel({ subscriptions, loading }: { subscriptions: any[]; loading: boolean }) {
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const pageCount = Math.ceil(subscriptions.length / pageSize);
  const paginated = subscriptions.slice((page - 1) * pageSize, page * pageSize);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE:     "bg-[#d6e0f5] text-[#0E2C72]",
      COMPLETED:  "bg-green-50 text-green-700",
      CANCELLED:  "bg-neutral-100 text-neutral-500",
      DEFAULTING: "bg-red-50 text-red-700",
    };
    return map[status] ?? "bg-neutral-100 text-neutral-500";
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[15px] font-semibold text-neutral-900 mb-1">Subscriptions</h2>
        <p className="text-[12.5px] text-neutral-500">Active and recent subscriptions for your customers.</p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Property</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Plan</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Status</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-3.5 bg-neutral-100 rounded w-28" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-neutral-100 rounded w-36" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-neutral-100 rounded w-24" /></td>
                    <td className="px-4 py-3 text-center"><div className="h-5 bg-neutral-100 rounded-full w-16 mx-auto" /></td>
                    <td className="px-4 py-3 text-center"><div className="h-3 bg-neutral-100 rounded w-20 mx-auto" /></td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <Empty icon={ShoppingBag} message="No subscriptions found." />
                  </td>
                </tr>
              ) : (
                paginated.map((sub) => (
                  <tr key={sub.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-neutral-800 truncate max-w-[140px]">
                      {sub.customer_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 truncate max-w-[160px]">
                      {sub.property_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{sub.plan_name ?? "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusBadge(sub.status)}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-neutral-500">
                      {sub.start_date ? fmtDate(sub.start_date) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && subscriptions.length > 0 && (
          <TablePagination
            page={page}
            pageCount={Math.max(1, pageCount)}
            total={subscriptions.length}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={(n) => { setPageSize(n); setPage(1); }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Profile panel ────────────────────────────────────────────────────────────

function ProfilePanel() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[15px] font-semibold text-neutral-900 mb-1">Profile</h2>
        <p className="text-[12.5px] text-neutral-500">Your account information.</p>
      </div>
      <div className="bg-white rounded-xl border border-neutral-100 p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-[22px] font-bold text-white shrink-0"
            style={{ background: `linear-gradient(135deg, #2a52a8, ${ACCENT})` }}
          >
            <UserCircle className="size-9 text-white" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-neutral-900">Customer Representative</p>
            <p className="text-[12px] text-neutral-400 mt-0.5">
              Visit <a href="/settings" className="text-[#0E2C72] hover:underline">Settings → Profile</a> to update your information.
            </p>
          </div>
        </div>
        <a
          href="/settings"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0E2C72] text-white rounded-lg text-[13px] font-medium hover:bg-[#0a2260] transition-colors"
        >
          Go to Settings <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export function CustomerRepDashboard() {
  const [activeNav, setActiveNav] = useState<NavKey>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [customers,     setCustomers]     = useState<any[]>([]);
  const [inspections,   setInspections]   = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      api.customers.list(),
      api.siteInspections.list(),
      api.subscriptions.list(),
    ]).then(([custRes, inspRes, subsRes]) => {
      if (custRes.status === "fulfilled") setCustomers(Array.isArray(custRes.value) ? custRes.value : []);
      if (inspRes.status === "fulfilled") setInspections(Array.isArray(inspRes.value) ? inspRes.value : []);
      if (subsRes.status === "fulfilled") setSubscriptions(Array.isArray(subsRes.value) ? subsRes.value : []);
    }).finally(() => setLoading(false));
  }, []);

  // Derived counts
  const upcomingInspections = inspections.filter(
    (i) => i.status === "PENDING" || i.status === "CONFIRMED"
  ).length;
  const activeSubscriptions = subscriptions.filter((s) => s.status === "ACTIVE").length;
  // Pending follow-ups: inspections that are pending (approximation for now)
  const pendingFollowUps = inspections.filter((i) => i.status === "PENDING").length;

  const renderPanel = () => {
    switch (activeNav) {
      case "overview":
        return (
          <OverviewPanel
            customersCount={customers.length}
            inspectionsCount={upcomingInspections}
            followUpsCount={pendingFollowUps}
            subsCount={activeSubscriptions}
            loading={loading}
          />
        );
      case "customers":
        return <CustomersPanel customers={customers} loading={loading} />;
      case "inspections":
        return <InspectionsPanel inspections={inspections} loading={loading} />;
      case "subscriptions":
        return <SubscriptionsPanel subscriptions={subscriptions} loading={loading} />;
      case "profile":
        return <ProfilePanel />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-60px)] w-full">
      {/* ── Sidebar overlay on mobile ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed top-[60px] left-0 z-40 h-[calc(100vh-60px)] w-56
          bg-white border-r border-neutral-100 flex flex-col
          transform transition-transform duration-200
          lg:static lg:translate-x-0 lg:shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="px-4 py-5 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${ACCENT}18` }}
            >
              <ClipboardList className="size-4" style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="text-[12.5px] font-semibold text-neutral-900">Customer Rep</p>
              <p className="text-[10.5px] text-neutral-400">Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const active = activeNav === key;
            return (
              <button
                key={key}
                onClick={() => { setActiveNav(key); setSidebarOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium
                  transition-all duration-150 text-left
                  ${active
                    ? "text-white shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  }
                `}
                style={active ? { background: ACCENT } : {}}
              >
                <Icon className="size-4 shrink-0" />
                {label}
                {active && <ChevronRight className="size-3 ml-auto opacity-60" />}
              </button>
            );
          })}
        </nav>

        {loading && (
          <div className="px-4 py-3 border-t border-neutral-100 flex items-center gap-2">
            <Loader2 className="size-3.5 animate-spin text-neutral-400" />
            <span className="text-[11px] text-neutral-400">Loading data…</span>
          </div>
        )}
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Sub-header */}
        <div className="bg-white border-b border-neutral-100 px-4 sm:px-6 py-3.5 flex items-center gap-3">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="lg:hidden p-1.5 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
          >
            <ClipboardList className="size-4" />
          </button>
          <div>
            <h1 className="text-[16px] font-semibold text-neutral-900">
              {NAV_ITEMS.find((n) => n.key === activeNav)?.label ?? "Dashboard"}
            </h1>
            <p className="text-[11.5px] text-neutral-400 mt-0.5 hidden sm:block">
              Customer Representative Portal
            </p>
          </div>
        </div>

        {/* Panel content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          {renderPanel()}
        </div>
      </main>
    </div>
  );
}

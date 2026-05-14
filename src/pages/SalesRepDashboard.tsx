import { useState, useEffect, useCallback } from "react";
import { usePageTitle } from "../hooks/usePageTitle";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { api } from "../services/api";
import {
  Loader2,
  LayoutDashboard,
  TrendingUp,
  Wallet,
  User,
  Copy,
  Check,
  Clock,
  BadgeCheck,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { TablePagination } from "../components/ui/TablePagination";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RepStats {
  rep_id: string;
  name: string;
  email: string;
  phone: string;
  tier: string;
  referral_code: string;
  commission_type: string;
  commission_rate: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  total_earned: string;
  total_pending: string;
  total_commissions: number;
  total_referrals: number;
}

interface Commission {
  id: string;
  property_name: string;
  amount: string;
  status: "PENDING" | "PAID" | "CANCELLED";
  paid_date: string | null;
  created_at: string;
}

interface CommissionsPage {
  count: number;
  page: number;
  page_size: number;
  page_count: number;
  results: Commission[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (val: string | number) => {
  const n = typeof val === "number" ? val : parseFloat(val);
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const TIER_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  STARTER: {
    label: "Starter",
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
  },
  SENIOR: {
    label: "Senior",
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
  LEGEND: {
    label: "Legend",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING: {
    label: "Pending",
    color: "text-amber-700",
    bg: "bg-amber-50",
    icon: <Clock className="w-3 h-3" />,
  },
  PAID: {
    label: "Paid",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    icon: <BadgeCheck className="w-3 h-3" />,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-neutral-500",
    bg: "bg-neutral-100",
    icon: null,
  },
};

type NavSection = "overview" | "commissions" | "profile";

// ─── Sidebar nav item ─────────────────────────────────────────────────────────

function NavItem({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all text-left ${
        active
          ? "bg-white/15 text-white shadow-sm"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      <span className={`w-4 h-4 shrink-0 ${active ? "text-white" : "text-white/60"}`}>
        {icon}
      </span>
      {label}
      {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/50" />}
    </button>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accentColor,
  iconBg,
  iconColor,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accentColor: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative bg-white rounded-xl border border-neutral-100 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.09)] transition-all duration-200 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentColor}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12px] font-medium text-neutral-400 mb-1.5 truncate">{label}</div>
          <div className="text-[26px] font-bold text-neutral-900 leading-none tracking-tight truncate">
            {value}
          </div>
          {sub && (
            <div className="text-[11.5px] text-neutral-400 mt-2">{sub}</div>
          )}
        </div>
        <div
          className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}
        >
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Overview section ─────────────────────────────────────────────────────────

function OverviewSection({ stats }: { stats: RepStats }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(stats.referral_code).then(() => {
      setCopied(true);
      toast.success("Referral code copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Referral code banner */}
      <div
        className="rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        style={{ background: "linear-gradient(135deg, #0E2C72 0%, #1a3d8f 60%, #0a2260 100%)" }}
      >
        <div>
          <p className="text-[11.5px] font-semibold text-white/60 uppercase tracking-wider mb-1">
            Your Referral Code
          </p>
          <p className="text-[28px] font-bold text-white tracking-widest leading-none">
            {stats.referral_code}
          </p>
          <p className="text-[12px] text-white/50 mt-1.5">
            Share this code with clients to earn commissions
          </p>
        </div>
        <button
          onClick={copyCode}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-[13px] font-medium transition-all border border-white/20 shrink-0"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-300" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          {copied ? "Copied!" : "Copy Code"}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Referrals"
          value={stats.total_referrals}
          sub="Subscriptions via your code"
          accentColor="bg-[#1a3d8f]"
          iconBg="bg-[#0E2C72]/6"
          iconColor="text-[#0E2C72]"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          label="Total Commissions"
          value={stats.total_commissions}
          sub="All time records"
          accentColor="bg-blue-500"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          icon={<LayoutDashboard className="w-5 h-5" />}
        />
        <StatCard
          label="Commissions Earned"
          value={fmt(stats.total_earned)}
          sub="Paid out"
          accentColor="bg-emerald-500"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          icon={<Wallet className="w-5 h-5" />}
        />
        <StatCard
          label="Pending Commissions"
          value={fmt(stats.total_pending)}
          sub="Awaiting disbursement"
          accentColor="bg-amber-500"
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          icon={<Clock className="w-5 h-5" />}
        />
      </div>
    </div>
  );
}

// ─── Commissions section ─────────────────────────────────────────────────────

function CommissionsSection() {
  const [data, setData] = useState<CommissionsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.commissions.myRepCommissions(page, pageSize);
      setData(res);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to load commissions.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePage = (p: number) => setPage(p);
  const handlePageSize = (n: number) => {
    setPageSize(n);
    setPage(1);
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
        <div>
          <h3 className="text-[14px] font-semibold text-neutral-900">My Commissions</h3>
          <p className="text-[12px] text-neutral-400 mt-0.5">
            {data ? `${data.count} record${data.count !== 1 ? "s" : ""}` : "Loading…"}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 transition-all text-[12px] font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-neutral-50 bg-neutral-50/70">
              <th className="px-5 py-3 text-left text-[11.5px] font-semibold text-neutral-400 uppercase tracking-wider">
                Property
              </th>
              <th className="px-5 py-3 text-left text-[11.5px] font-semibold text-neutral-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-5 py-3 text-left text-[11.5px] font-semibold text-neutral-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-5 py-3 text-left text-[11.5px] font-semibold text-neutral-400 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-neutral-50">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <td key={j} className="px-5 py-3.5">
                      <div className="h-4 bg-neutral-100 rounded animate-pulse" style={{ width: `${60 + j * 10}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : !data || data.results.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-[13px] text-neutral-400">
                  No commissions recorded yet.
                </td>
              </tr>
            ) : (
              data.results.map((c) => {
                const meta = STATUS_META[c.status] ?? STATUS_META.CANCELLED;
                return (
                  <tr
                    key={c.id}
                    className="border-b border-neutral-50 hover:bg-neutral-50/60 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-neutral-900">{c.property_name}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-neutral-800">{fmt(c.amount)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11.5px] font-medium ${meta.bg} ${meta.color}`}
                      >
                        {meta.icon}
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-neutral-500">
                      {new Date(c.created_at).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.count > 0 && (
        <TablePagination
          page={page}
          pageCount={data.page_count}
          total={data.count}
          pageSize={pageSize}
          onPage={handlePage}
          onPageSize={handlePageSize}
        />
      )}
    </div>
  );
}

// ─── Profile section ─────────────────────────────────────────────────────────

function ProfileSection({ stats }: { stats: RepStats }) {
  const { user } = useCurrentUser();

  const fields = [
    { label: "Full Name", value: stats.name },
    { label: "Email", value: stats.email },
    { label: "Phone", value: stats.phone || "—" },
    { label: "Tier", value: stats.tier },
    { label: "Commission Type", value: stats.commission_type === "PERCENT" ? "Percentage" : "Fixed Amount" },
    {
      label: "Commission Rate",
      value:
        stats.commission_type === "PERCENT"
          ? `${stats.commission_rate}%`
          : fmt(stats.commission_rate),
    },
  ];

  const bankFields = [
    { label: "Bank Name", value: stats.bank_name || "—" },
    { label: "Account Number", value: stats.bank_account_number || "—" },
    { label: "Account Name", value: stats.bank_account_name || "—" },
  ];

  const accountFields = [
    { label: "Login Email", value: user?.email || "—" },
    { label: "First Name", value: user?.first_name || "—" },
    { label: "Last Name", value: user?.last_name || "—" },
    { label: "Phone", value: user?.phone || "—" },
  ];

  return (
    <div className="space-y-6">
      {/* Rep profile */}
      <div className="bg-white rounded-xl border border-neutral-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h3 className="text-[14px] font-semibold text-neutral-900">Rep Profile</h3>
          <p className="text-[12px] text-neutral-400 mt-0.5">Your sales representative details</p>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.label}>
              <p className="text-[11.5px] font-medium text-neutral-400 mb-0.5">{f.label}</p>
              <p className="text-[13.5px] font-semibold text-neutral-900">{f.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payout details */}
      <div className="bg-white rounded-xl border border-neutral-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h3 className="text-[14px] font-semibold text-neutral-900">Payout Details</h3>
          <p className="text-[12px] text-neutral-400 mt-0.5">Bank account for commission disbursements</p>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {bankFields.map((f) => (
            <div key={f.label}>
              <p className="text-[11.5px] font-medium text-neutral-400 mb-0.5">{f.label}</p>
              <p className="text-[13.5px] font-semibold text-neutral-900">{f.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-xl border border-neutral-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h3 className="text-[14px] font-semibold text-neutral-900">Account Info</h3>
          <p className="text-[12px] text-neutral-400 mt-0.5">Your login account details</p>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {accountFields.map((f) => (
            <div key={f.label}>
              <p className="text-[11.5px] font-medium text-neutral-400 mb-0.5">{f.label}</p>
              <p className="text-[13.5px] font-semibold text-neutral-900">{f.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export function SalesRepDashboard() {
  usePageTitle("My Dashboard");

  const [activeSection, setActiveSection] = useState<NavSection>("overview");
  const [stats, setStats] = useState<RepStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    api.commissions
      .myRepStats()
      .then((data) => setStats(data))
      .catch((err: any) => {
        const msg = err?.message ?? "Failed to load your dashboard.";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  const tierMeta = stats ? (TIER_META[stats.tier] ?? TIER_META.STARTER) : null;

  const navItems: { key: NavSection; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: "commissions", label: "Commissions", icon: <Wallet className="w-4 h-4" /> },
    { key: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
  ];

  const sectionTitle: Record<NavSection, { title: string; sub: string }> = {
    overview: { title: "Overview", sub: "Your sales performance at a glance" },
    commissions: { title: "Commissions", sub: "All your commission records" },
    profile: { title: "Profile", sub: "Your rep and account details" },
  };

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-60px)] w-full bg-neutral-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#0E2C72] animate-spin" />
          <p className="text-[13px] text-neutral-500">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  // ── Error / not a rep state ───────────────────────────────────────────────
  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-60px)] w-full bg-neutral-50">
        <div className="max-w-sm text-center px-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0E2C72]/6 mb-4">
            <LayoutDashboard className="w-7 h-7 text-[#0E2C72]" />
          </div>
          <h2 className="text-[16px] font-semibold text-neutral-900 mb-1">Dashboard Unavailable</h2>
          <p className="text-[13px] text-neutral-500 leading-relaxed">
            {error ?? "Your sales rep profile could not be loaded. Please contact your workspace admin."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-60px)] w-full bg-neutral-50">
      {/* ── Mobile sidebar overlay ────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-30 lg:static lg:z-auto
          flex flex-col transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
        `}
        style={{ background: "linear-gradient(180deg, #0E2C72 0%, #0a2260 100%)" }}
      >
        {/* Rep identity */}
        <div className="px-5 pt-6 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-white truncate">{stats.name}</p>
              <p className="text-[11px] text-white/50 truncate">{stats.email}</p>
            </div>
          </div>
          {/* Tier badge */}
          {tierMeta && (
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11.5px] font-semibold border ${tierMeta.bg} ${tierMeta.color} ${tierMeta.border}`}
            >
              {tierMeta.label} Tier
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <NavItem
              key={item.key}
              active={activeSection === item.key}
              icon={item.icon}
              label={item.label}
              onClick={() => {
                setActiveSection(item.key);
                setSidebarOpen(false);
              }}
            />
          ))}
        </nav>

        {/* Referral code footer */}
        <div className="px-4 pb-5 pt-3 border-t border-white/10">
          <p className="text-[10.5px] text-white/40 uppercase tracking-wider mb-1">Referral Code</p>
          <p className="text-[14px] font-bold text-white tracking-widest">{stats.referral_code}</p>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Page header */}
        <div className="bg-white border-b border-neutral-100 px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden flex flex-col gap-1 p-1.5 rounded-md hover:bg-neutral-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="w-4 h-0.5 bg-neutral-600 rounded" />
            <span className="w-4 h-0.5 bg-neutral-600 rounded" />
            <span className="w-4 h-0.5 bg-neutral-600 rounded" />
          </button>

          <div className="min-w-0">
            <h1 className="text-[17px] font-semibold text-neutral-900 tracking-tight">
              {sectionTitle[activeSection].title}
            </h1>
            <p className="text-[12px] text-neutral-400 mt-0.5 hidden sm:block">
              {sectionTitle[activeSection].sub}
            </p>
          </div>
        </div>

        {/* Section content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          {activeSection === "overview" && <OverviewSection stats={stats} />}
          {activeSection === "commissions" && <CommissionsSection />}
          {activeSection === "profile" && <ProfileSection stats={stats} />}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router";
import { usePolling } from "../hooks/usePolling";
import { usePageTitle } from "../hooks/usePageTitle";
import { useWorkspaceRole } from "../hooks/useWorkspaceRole";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Pencil,
  Users as UsersIcon,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { api } from "../services/api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { motion } from "motion/react";
import { EmptyState } from "../components/ui/empty-state";
import { toast } from "sonner";

// ─── Animation variants ────────────────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
} as const;
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 26 } },
} as const;

// ─── Avatar helpers ────────────────────────────────────────────────────────────
const avatarColors = [
  ["bg-emerald-100", "text-emerald-700"],
  ["bg-blue-100",    "text-blue-700"],
  ["bg-violet-100",  "text-violet-700"],
  ["bg-amber-100",   "text-amber-700"],
  ["bg-rose-100",    "text-rose-700"],
  ["bg-cyan-100",    "text-cyan-700"],
];
const avatarColor = (name: string) =>
  avatarColors[name.charCodeAt(0) % avatarColors.length];

// ─── Subscription status config ────────────────────────────────────────────────
type SubStatus = "ACTIVE" | "COMPLETED" | "DEFAULTING" | "CANCELLED";

const STATUS_CONFIG: Record<SubStatus, { label: string; cls: string; dot?: string; icon?: React.ReactNode }> = {
  ACTIVE:     { label: "Active",     cls: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  COMPLETED:  { label: "Completed",  cls: "bg-blue-50 text-blue-700 border-blue-100" },
  DEFAULTING: { label: "Defaulting", cls: "bg-red-50 text-red-600 border-red-100" },
  CANCELLED:  { label: "Cancelled",  cls: "bg-neutral-100 text-neutral-500 border-neutral-200" },
};

function subStatusConfig(val?: string | null) {
  if (!val) return null;
  return STATUS_CONFIG[val.toUpperCase() as SubStatus] ?? null;
}

// ─── Purchase status config (kept for AddCustomerModal) ────────────────────────
const PURCHASE_STATUSES = [
  { value: "BOOKED",            label: "Booked",            cls: "bg-amber-50 text-amber-700 border-amber-100" },
  { value: "SOLD",              label: "Sold",              cls: "bg-blue-50 text-blue-700 border-blue-100" },
  { value: "PAYMENT_COMPLETED", label: "Payment Completed", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
];

// ─── Filter options ────────────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { value: "ALL",        label: "All" },
  { value: "ACTIVE",     label: "Active" },
  { value: "COMPLETED",  label: "Completed" },
  { value: "DEFAULTING", label: "Defaulting" },
  { value: "CANCELLED",  label: "Cancelled" },
];

// ─── Currency formatter ────────────────────────────────────────────────────────
const fmt = (n: number | string | null | undefined) =>
  n == null || n === "" ? "—" : `₦${Number(n).toLocaleString("en-NG")}`;

// ─── Dash helper ──────────────────────────────────────────────────────────────
const dash = (v: string | number | null | undefined) =>
  v == null || v === "" ? "—" : String(v);

// ─── Add Customer Modal ───────────────────────────────────────────────────────
interface AddCustomerModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function AddCustomerModal({ onClose, onCreated }: AddCustomerModalProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    purchase_status: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())  e.name  = "Full name is required.";
    if (!form.email.trim()) e.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email address.";
    if (!form.phone.trim()) e.phone = "Phone number is required.";
    return e;
  };

  const set = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const payload: any = {
        full_name: form.name.trim(),
        email:     form.email.trim().toLowerCase(),
        phone:     form.phone.trim(),
      };
      if (form.purchase_status) payload.purchase_status = form.purchase_status;

      await api.customers.create(payload);
      toast.success(`Customer "${form.name}" added successfully.`);
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to add customer. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-[15px] font-semibold text-neutral-900">Add Customer</h3>
            <p className="text-[12px] text-neutral-400 mt-0.5">Fill in the customer details below.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-[12.5px] font-medium text-neutral-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. John Adebayo"
              className={`w-full px-3 py-2 border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors ${
                errors.name ? "border-red-400 bg-red-50" : "border-neutral-300 bg-white"
              }`}
            />
            {errors.name && (
              <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-[12.5px] font-medium text-neutral-700 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="e.g. john@example.com"
              className={`w-full px-3 py-2 border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors ${
                errors.email ? "border-red-400 bg-red-50" : "border-neutral-300 bg-white"
              }`}
            />
            {errors.email && (
              <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[12.5px] font-medium text-neutral-700 mb-1.5">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="e.g. 08012345678"
              className={`w-full px-3 py-2 border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors ${
                errors.phone ? "border-red-400 bg-red-50" : "border-neutral-300 bg-white"
              }`}
            />
            {errors.phone && (
              <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.phone}
              </p>
            )}
          </div>

          {/* Purchase Status */}
          <div>
            <label className="block text-[12.5px] font-medium text-neutral-700 mb-1.5">
              Purchase Status{" "}
              <span className="text-neutral-400 text-[11px]">(optional)</span>
            </label>
            <select
              value={form.purchase_status}
              onChange={(e) => set("purchase_status", e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 bg-white rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
            >
              <option value="">— None —</option>
              {PURCHASE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-neutral-200 text-neutral-700 rounded-lg text-[13px] font-medium hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-[13px] font-medium hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
              </>
            ) : (
              <>Add Customer</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────
interface SummaryCardProps {
  label: string;
  value: number | string;
  sub: string;
  loading: boolean;
  icon?: React.ElementType;
  accentBg?: string;
  iconBg?: string;
  iconColor?: string;
}

function SummaryCard({ label, value, sub, loading, icon: Icon, accentBg, iconBg, iconColor }: SummaryCardProps) {
  if (loading) {
    return (
      <div className="relative bg-white rounded-xl border border-neutral-100 p-4 shadow-sm overflow-hidden">
        {accentBg && <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentBg}`} />}
        <Skeleton className="h-3 w-24 rounded bg-neutral-100 mb-3" />
        <Skeleton className="h-7 w-16 rounded bg-neutral-100 mb-2" />
        <Skeleton className="h-3 w-32 rounded bg-neutral-100" />
      </div>
    );
  }
  return (
    <div className="relative bg-white rounded-xl border border-neutral-100 p-4 shadow-sm overflow-hidden hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow duration-200">
      {accentBg && <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentBg}`} />}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold mb-1">{label}</p>
          <p className="text-2xl font-bold text-neutral-900">{value}</p>
          <p className="text-[11px] text-neutral-400 mt-1">{sub}</p>
        </div>
        {Icon && iconBg && iconColor && (
          <div className={`p-2 rounded-xl shrink-0 ${iconBg}`}>
            <Icon className={`size-4 ${iconColor}`} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function Customers() {
  usePageTitle("Customers");
  const navigate = useNavigate();
  const { role } = useWorkspaceRole();

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showAdd, setShowAdd]     = useState(false);

  // ── Role guard ────────────────────────────────────────────────────────────
  if (role === "SALES_REP" || role === "CUSTOMER") {
    return (
      <div className="p-8 text-center text-neutral-500 text-sm">
        You don't have permission to access this page.
      </div>
    );
  }

  const fetchCustomers = async () => {
    setLoading((prev) => prev || customers.length === 0);
    try {
      const data = await api.customers.list();
      setCustomers(data);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  };

  usePolling(fetchCustomers, 30_000);

  // ── Summary card values ───────────────────────────────────────────────────
  const totalCustomers    = customers.length;
  const totalActive       = customers.reduce((s, c) => s + (c.active_subscriptions ?? 0), 0);
  const totalCompleted    = customers.reduce((s, c) => s + (c.completed_subscriptions ?? 0), 0);
  const totalDefaulting   = customers.reduce((s, c) => s + (c.defaulting_subscriptions ?? 0), 0);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (c.full_name ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.phone ?? "").toLowerCase().includes(q);

    const subStatus = c.primary_subscription?.status?.toUpperCase() ?? "";
    const matchesStatus =
      statusFilter === "ALL" || subStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const isInitialLoad = loading && customers.length === 0;

  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)] w-full">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-neutral-100 px-4 sm:px-6 lg:px-8 py-4 md:py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div>
              <h1 className="text-[17px] font-semibold text-neutral-900 tracking-tight">
                Customers
              </h1>
              <p className="text-[12px] text-neutral-400 mt-0.5 hidden sm:block">
                Customer and subscription management
              </p>
            </div>
            {loading && !isInitialLoad && (
              <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
            )}
          </div>
          <Button
            onClick={() => setShowAdd(true)}
            className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-medium rounded-lg px-3 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Customer</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="p-4 sm:p-6 lg:p-8 space-y-5 flex-1"
      >
        {/* ── Summary cards ──────────────────────────────────────────────── */}
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            label="Total Customers"
            value={totalCustomers}
            sub="All registered customers"
            loading={isInitialLoad}
            icon={UsersIcon}
            accentBg="bg-blue-500"
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <SummaryCard
            label="Active Subscriptions"
            value={totalActive}
            sub="Currently active plans"
            loading={isInitialLoad}
            icon={CheckCircle2}
            accentBg="bg-emerald-500"
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <SummaryCard
            label="Completed Subscriptions"
            value={totalCompleted}
            sub="Fully paid off plans"
            loading={isInitialLoad}
            icon={CheckCircle2}
            accentBg="bg-violet-500"
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
          />
          <SummaryCard
            label="Defaulting Subscriptions"
            value={totalDefaulting}
            sub="Overdue or missed payments"
            loading={isInitialLoad}
            icon={AlertTriangle}
            accentBg="bg-red-500"
            iconBg="bg-red-50"
            iconColor="text-red-600"
          />
        </motion.div>

        {isInitialLoad ? (
          /* ── Loading skeleton ─────────────────────────────────────────── */
          <>
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <Skeleton className="h-9 w-full sm:w-80 rounded-lg bg-neutral-100" />
              <Skeleton className="h-9 w-28 rounded-lg bg-neutral-100" />
              <Skeleton className="h-9 w-44 rounded-lg bg-neutral-100" />
            </div>
            <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="bg-neutral-50/70 border-b border-neutral-100 px-5 py-3 flex gap-4">
                {[120, 100, 140, 80, 70, 90, 80, 80, 90, 80, 60].map((w, i) => (
                  <Skeleton
                    key={i}
                    className="h-3 rounded bg-neutral-200"
                    style={{ width: w }}
                  />
                ))}
              </div>
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="px-5 py-3.5 flex items-center gap-4 border-b border-neutral-50 last:border-0"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-[140px]">
                    <Skeleton className="h-8 w-8 rounded-full bg-neutral-100 shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-28 bg-neutral-100" />
                      <Skeleton className="h-3 w-20 bg-neutral-100" />
                    </div>
                  </div>
                  <Skeleton className="h-3.5 w-20 bg-neutral-100 hidden sm:block" />
                  <Skeleton className="h-3.5 w-24 bg-neutral-100 hidden sm:block" />
                  <Skeleton className="h-3.5 w-20 bg-neutral-100 hidden md:block" />
                  <Skeleton className="h-3.5 w-14 bg-neutral-100 hidden md:block" />
                  <Skeleton className="h-3.5 w-24 bg-neutral-100 hidden lg:block" />
                  <Skeleton className="h-3.5 w-20 bg-neutral-100 hidden lg:block" />
                  <Skeleton className="h-3.5 w-20 bg-neutral-100 hidden lg:block" />
                  <Skeleton className="h-3.5 w-20 bg-neutral-100 hidden xl:block" />
                  <Skeleton className="h-5 w-16 rounded-full bg-neutral-100" />
                  <Skeleton className="h-7 w-16 rounded-lg bg-neutral-100 ml-auto" />
                </div>
              ))}
            </div>
          </>
        ) : filtered.length === 0 ? (
          /* ── Empty state ─────────────────────────────────────────────── */
          <motion.div variants={item}>
            <EmptyState
              icon={UsersIcon}
              title={search || statusFilter !== "ALL" ? "No matching customers" : "No customers yet"}
              description={
                search || statusFilter !== "ALL"
                  ? "Adjust your search or filter to find what you're looking for."
                  : "Add your first customer to start tracking subscriptions and revenue."
              }
              action={
                <Button
                  onClick={() => {
                    if (search || statusFilter !== "ALL") {
                      setSearch("");
                      setStatusFilter("ALL");
                    } else {
                      setShowAdd(true);
                    }
                  }}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                  {search || statusFilter !== "ALL" ? "Clear Filters" : "Add New Customer"}
                </Button>
              }
            />
          </motion.div>
        ) : (
          <>
            {/* ── Search + filter bar ──────────────────────────────────── */}
            <motion.div
              variants={item}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 flex-wrap"
            >
              {/* Search */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                <Input
                  placeholder="Search by name, email, phone…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-9 text-[13px] bg-white border-neutral-200 focus-visible:ring-1 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-400 rounded-lg"
                />
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <Filter className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <div className="flex items-center gap-1">
                  {STATUS_FILTERS.map((sf) => (
                    <button
                      key={sf.value}
                      onClick={() => setStatusFilter(sf.value)}
                      className={`px-2.5 py-1 rounded-full text-[11.5px] font-medium transition-colors border whitespace-nowrap ${
                        statusFilter === sf.value
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-50"
                      }`}
                    >
                      {sf.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ── Mobile card list (< md) ──────────────────────────────── */}
            <motion.div variants={item} className="md:hidden space-y-3">
              {filtered.map((customer) => {
                const name = customer.full_name ?? customer.name ?? "Unknown";
                const [bgCls, txtCls] = avatarColor(name);
                const ps = customer.primary_subscription;
                const statusCfg = subStatusConfig(ps?.status);
                return (
                  <div
                    key={customer.id}
                    className="bg-white rounded-xl border border-neutral-100 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-9 w-9 rounded-full ${bgCls} ${txtCls} flex items-center justify-center text-[12px] font-bold uppercase shrink-0`}>
                          {name.substring(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-semibold text-neutral-900 truncate">{name}</div>
                          <div className="text-[11.5px] text-neutral-400 truncate">{customer.phone ?? "—"}</div>
                        </div>
                      </div>
                      {statusCfg ? (
                        <Badge className={`text-[11px] border gap-1 shrink-0 ${statusCfg.cls}`}>
                          {statusCfg.dot && <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} inline-block`} />}
                          {statusCfg.label}
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-neutral-300 shrink-0">—</span>
                      )}
                    </div>

                    {/* Detail grid */}
                    {ps && (
                      <div className="grid grid-cols-2 gap-2 mb-3 text-[12px]">
                        {ps.property_name && (
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Property</span>
                            <div className="text-neutral-700 font-medium truncate">{ps.property_name}</div>
                          </div>
                        )}
                        {ps.plan_name && (
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Plan</span>
                            <div className="text-neutral-700 font-medium truncate">{ps.plan_name}</div>
                          </div>
                        )}
                        {ps.amount_paid != null && (
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Paid</span>
                            <div className="text-emerald-700 font-semibold">{fmt(ps.amount_paid)}</div>
                          </div>
                        )}
                        {ps.balance != null && (
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Balance</span>
                            <div className={`font-semibold ${ps.balance > 0 ? "text-red-600" : "text-neutral-700"}`}>{fmt(ps.balance)}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-neutral-50">
                      <button
                        onClick={() => navigate(`/customers/${customer.id}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-neutral-200 text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button
                        onClick={() => navigate(`/customers/${customer.id}/edit`)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-blue-100 bg-blue-50/50 text-[12px] font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                    </div>
                  </div>
                );
              })}
              <p className="text-[11px] text-neutral-400 text-center py-1">
                {filtered.length} of {customers.length} customer{customers.length !== 1 ? "s" : ""}
              </p>
            </motion.div>

            {/* ── Desktop table (≥ md) ─────────────────────────────────── */}
            <motion.div
              variants={item}
              className="hidden md:block bg-white rounded-xl border border-neutral-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50/70">
                      <th className="px-5 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap">Customer Name</th>
                      <th className="px-5 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap">Phone</th>
                      <th className="px-5 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap">Email</th>
                      <th className="px-5 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap hidden lg:table-cell">Property</th>
                      <th className="px-5 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap hidden lg:table-cell">Land Size</th>
                      <th className="px-5 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap hidden xl:table-cell">Plan</th>
                      <th className="px-5 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap hidden xl:table-cell">Amount Paid</th>
                      <th className="px-5 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap hidden xl:table-cell">Balance</th>
                      <th className="px-5 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap">Status</th>
                      <th className="px-5 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {filtered.map((customer) => {
                      const name = customer.full_name ?? customer.name ?? "Unknown";
                      const [bgCls, txtCls] = avatarColor(name);
                      const ps = customer.primary_subscription;
                      const statusCfg = subStatusConfig(ps?.status);

                      return (
                        <tr key={customer.id} className="hover:bg-neutral-50/60 transition-colors group">
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-full ${bgCls} ${txtCls} flex items-center justify-center text-[11px] font-bold uppercase shrink-0`}>
                                {name.substring(0, 2)}
                              </div>
                              <div className="text-[13px] font-semibold text-neutral-900">{name}</div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="text-[12.5px] text-neutral-700">{dash(customer.phone)}</span>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="text-[12.5px] text-neutral-700">{dash(customer.email)}</span>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap hidden lg:table-cell">
                            <span className="text-[12.5px] text-neutral-700">{dash(ps?.property_name)}</span>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap hidden lg:table-cell">
                            <span className="text-[12.5px] text-neutral-700">{dash(ps?.land_size)}</span>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap hidden xl:table-cell">
                            <span className="text-[12.5px] text-neutral-700">{dash(ps?.plan_name)}</span>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap hidden xl:table-cell">
                            <span className="text-[12.5px] font-medium text-emerald-700">{fmt(ps?.amount_paid)}</span>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap hidden xl:table-cell">
                            <span className={`text-[12.5px] font-medium ${ps?.balance > 0 ? "text-red-600" : "text-neutral-700"}`}>{fmt(ps?.balance)}</span>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {statusCfg ? (
                              <Badge className={`text-[11px] border gap-1.5 ${statusCfg.cls}`}>
                                {statusCfg.dot && <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} inline-block`} />}
                                {ps?.status === "COMPLETED" && <CheckCircle2 className="w-3 h-3" />}
                                {ps?.status === "DEFAULTING" && <AlertTriangle className="w-3 h-3" />}
                                {ps?.status === "CANCELLED" && <XCircle className="w-3 h-3" />}
                                {statusCfg.label}
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-neutral-300">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => navigate(`/customers/${customer.id}`)} title="View customer"
                                className="h-7 w-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors">
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => navigate(`/customers/${customer.id}/edit`)} title="Edit customer"
                                className="h-7 w-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-blue-700 hover:bg-blue-50 transition-colors">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-2.5 border-t border-neutral-50 bg-neutral-50/40">
                <p className="text-[11px] text-neutral-400">
                  Showing {filtered.length} of {customers.length} customer{customers.length !== 1 ? "s" : ""}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </motion.div>

      {/* ── Add Customer Modal ─────────────────────────────────────────────── */}
      {showAdd && (
        <AddCustomerModal
          onClose={() => setShowAdd(false)}
          onCreated={fetchCustomers}
        />
      )}
    </div>
  );
}

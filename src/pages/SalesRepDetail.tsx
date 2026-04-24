import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, Users, TrendingUp, DollarSign,
  Phone, Mail, Calendar, Search, Eye, Check,
  Copy, Pencil, UserX, UserCheck, Loader2, X,
} from "lucide-react";
import { api } from "../services/api";
import { useWorkspaceRole } from "../hooks/useWorkspaceRole";
import { usePageTitle } from "../hooks/usePageTitle";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { cn } from "../components/ui/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

// ── Types ─────────────────────────────────────────────────────────────────────
const TIERS = ["STARTER", "SENIOR", "LEGEND"] as const;
type Tier = typeof TIERS[number];

interface SalesRep {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: Tier;
  referral_code: string;
  commission_type: string;
  commission_rate: string;
  is_active: boolean;
  total_earned: string;
  total_pending: string;
  total_potential?: string;
  total_referrals?: number;
  active_subscriptions?: number;
  completed_subscriptions?: number;
  defaulting_subscriptions?: number;
  cancelled_subscriptions?: number;
  created_at: string;
  added_by?: string;
}

interface Commission {
  id: string;
  customer_name?: string;
  customer?: string;
  property_name?: string;
  property?: string;
  payment_amount: string;
  commission_amount: string;
  commission_type: string;
  status: "PENDING" | "PAID";
  paid_date?: string;
  created_at: string;
}

interface ReferredCustomer {
  id: string;
  full_name?: string;
  customer_name?: string;
  property_name?: string;
  land_size?: string;
  plan_name?: string;
  locked_price?: string;
  amount_paid?: string;
  balance?: string;
  commission_earned?: string;
  commission_pending?: string;
  subscription_status?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const TIER_LABELS: Record<Tier, string> = {
  STARTER: "Realtor",
  SENIOR: "Senior Realtor",
  LEGEND: "Principal Realtor",
};

const TIER_COLORS: Record<Tier, string> = {
  LEGEND: "bg-purple-100 text-purple-700 border-purple-200",
  SENIOR: "bg-blue-100 text-blue-700 border-blue-200",
  STARTER: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

const fmt = (v?: string | number | null) =>
  v == null || v === "" ? "—" : `₦${Number(v).toLocaleString("en-NG")}`;

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—";

// ── Mark Paid Modal ───────────────────────────────────────────────────────────
function MarkPaidModal({
  selected,
  onClose,
  onSuccess,
}: {
  selected: Commission[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await Promise.all(selected.map((c) => api.commissions.markPaid(c.id, notes)));
      toast.success(`${selected.length} commission${selected.length > 1 ? "s" : ""} marked as paid.`);
      onSuccess();
      onClose();
    } catch {
      toast.error("Failed to mark commissions as paid.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-neutral-100"
      >
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-900">Mark Commission as Paid</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-neutral-100 transition-colors">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-[13px] text-neutral-600">
            Marking <span className="font-semibold text-neutral-900">{selected.length}</span> commission{selected.length > 1 ? "s" : ""} as paid.
          </p>
          <div>
            <label className="text-[12px] font-medium text-neutral-600 block mb-1.5">Notes (optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid via bank transfer, ref: TXN123"
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-[13px] resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-400"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2.5 p-5 border-t border-neutral-100">
          <Button variant="outline" onClick={onClose} className="text-[13px] h-9">Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] h-9">
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Saving…</> : "Confirm Payment"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Edit Rep Modal ────────────────────────────────────────────────────────────
function EditRepModal({
  rep,
  onClose,
  onSaved,
}: {
  rep: SalesRep;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: rep.name ?? "",
    email: rep.email ?? "",
    phone: rep.phone ?? "",
    tier: rep.tier ?? "STARTER",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Name is required."); return; }
    setSaving(true);
    try {
      await api.salesReps.update(rep.id, form);
      toast.success("Rep updated.");
      onSaved();
      onClose();
    } catch {
      toast.error("Failed to update rep.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-neutral-100"
      >
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-900">Edit Realtor</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-neutral-100 transition-colors">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {(["name", "email", "phone"] as const).map((field) => (
            <div key={field}>
              <label className="text-[12px] font-medium text-neutral-600 block mb-1.5 capitalize">{field}</label>
              <input
                type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                value={form[field]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-neutral-200 text-[13px] focus:outline-none focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-400"
              />
            </div>
          ))}
          <div>
            <label className="text-[12px] font-medium text-neutral-600 block mb-1.5">Tier</label>
            <select
              value={form.tier}
              onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value as Tier }))}
              className="w-full h-9 px-3 rounded-lg border border-neutral-200 text-[13px] focus:outline-none focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-400"
            >
              {TIERS.map((t) => <option key={t} value={t}>{TIER_LABELS[t]}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2.5 p-5 border-t border-neutral-100">
          <Button variant="outline" onClick={onClose} className="text-[13px] h-9">Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] h-9">
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Saving…</> : "Save Changes"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Sub status badge ──────────────────────────────────────────────────────────
function SubStatusBadge({ status }: { status?: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    ACTIVE:     { cls: "bg-emerald-100 text-emerald-700", label: "Active" },
    COMPLETED:  { cls: "bg-blue-100 text-blue-700",       label: "Completed" },
    DEFAULTING: { cls: "bg-red-100 text-red-700",         label: "Defaulting" },
    CANCELLED:  { cls: "bg-neutral-100 text-neutral-500", label: "Cancelled" },
  };
  const cfg = map[(status ?? "").toUpperCase()];
  if (!cfg) return <span className="text-neutral-300 text-[11px]">—</span>;
  return <Badge className={cn("text-[11px] border-0", cfg.cls)}>{cfg.label}</Badge>;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function SalesRepDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useWorkspaceRole();

  const [rep, setRep]               = useState<SalesRep | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [customers, setCustomers]   = useState<ReferredCustomer[]>([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState<"overview" | "customers" | "commissions" | "profile">("overview");

  const [copied, setCopied]         = useState(false);
  const [showEdit, setShowEdit]     = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);

  // Commission tab state
  const [selectedComms, setSelectedComms] = useState<string[]>([]);
  const [showMarkPaid, setShowMarkPaid]   = useState(false);
  const [commStatusFilter, setCommStatusFilter] = useState<"ALL" | "PENDING" | "PAID">("ALL");
  const [custSearch, setCustSearch] = useState("");
  const [custStatusFilter, setCustStatusFilter] = useState("ALL");

  usePageTitle(rep ? `${rep.name} — Sales Rep` : "Sales Rep");

  const isAdmin = role === "OWNER" || role === "ADMIN";

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [allReps, comms, allCustomers] = await Promise.all([
        api.salesReps.list(),
        api.commissions.list({ sales_rep: id }).catch(() => [] as Commission[]),
        api.customers.list().catch(() => []),
      ]);
      const found = (allReps as SalesRep[]).find((r) => r.id === id);
      if (!found) { navigate("/sales-reps"); return; }
      setRep(found);
      setCommissions(comms as Commission[]);

      // Derive referred customers from commissions (unique by customer)
      const seen = new Set<string>();
      const derived: ReferredCustomer[] = [];
      for (const c of comms as Commission[]) {
        const key = c.customer ?? c.customer_name ?? "";
        if (!seen.has(key) && key) {
          seen.add(key);
          const match = (allCustomers as any[]).find(
            (cu) => cu.id === c.customer || cu.full_name === c.customer_name
          );
          derived.push({
            id: c.customer ?? c.id,
            full_name: c.customer_name ?? match?.full_name ?? "—",
            customer_name: c.customer_name,
            property_name: c.property_name,
            land_size: match?.primary_subscription?.land_size,
            plan_name: match?.primary_subscription?.plan_name,
            locked_price: match?.primary_subscription?.locked_price,
            amount_paid: match?.primary_subscription?.amount_paid,
            balance: match?.primary_subscription?.balance,
            commission_earned: String(
              (comms as Commission[])
                .filter((x) => (x.customer ?? x.customer_name) === key)
                .reduce((s, x) => s + Number(x.commission_amount || 0), 0)
            ),
            commission_pending: String(
              (comms as Commission[])
                .filter((x) => (x.customer ?? x.customer_name) === key && x.status === "PENDING")
                .reduce((s, x) => s + Number(x.commission_amount || 0), 0)
            ),
            subscription_status: match?.primary_subscription?.status,
          });
        }
      }
      setCustomers(derived);
    } catch {
      toast.error("Failed to load rep data.");
      navigate("/sales-reps");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleToggleActive = async () => {
    if (!rep) return;
    setTogglingActive(true);
    try {
      await api.salesReps.update(rep.id, { is_active: !rep.is_active });
      setRep((r) => r ? { ...r, is_active: !r.is_active } : r);
      toast.success(rep.is_active ? "Rep deactivated." : "Rep activated.");
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setTogglingActive(false);
    }
  };

  const copyCode = () => {
    if (!rep?.referral_code) return;
    navigator.clipboard.writeText(rep.referral_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // ── Computed ──────────────────────────────────────────────────────────────
  const pendingComms   = commissions.filter((c) => c.status === "PENDING");
  const totalTriggered = commissions.reduce((s, c) => s + Number(c.commission_amount || 0), 0);
  const totalPaid      = commissions.filter((c) => c.status === "PAID").reduce((s, c) => s + Number(c.commission_amount || 0), 0);
  const totalPending   = pendingComms.reduce((s, c) => s + Number(c.commission_amount || 0), 0);

  const filteredComms = commissions.filter((c) => {
    if (commStatusFilter !== "ALL" && c.status !== commStatusFilter) return false;
    return true;
  });

  const filteredCusts = customers.filter((c) => {
    const name = (c.full_name ?? c.customer_name ?? "").toLowerCase();
    if (custSearch && !name.includes(custSearch.toLowerCase())) return false;
    if (custStatusFilter !== "ALL" && c.subscription_status !== custStatusFilter) return false;
    return true;
  });

  const selectedCommObjects = commissions.filter((c) => selectedComms.includes(c.id));

  const toggleSelectComm = (id: string) =>
    setSelectedComms((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleSelectAll = () => {
    const pendingIds = filteredComms.filter((c) => c.status === "PENDING").map((c) => c.id);
    if (pendingIds.every((id) => selectedComms.includes(id))) {
      setSelectedComms((prev) => prev.filter((id) => !pendingIds.includes(id)));
    } else {
      setSelectedComms((prev) => [...new Set([...prev, ...pendingIds])]);
    }
  };

  // ── Role guard ────────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-60px)] items-center justify-center p-8">
        <div className="text-center max-w-xs">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-neutral-100 mb-4">
            <Users className="w-7 h-7 text-neutral-400" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">Access Restricted</h2>
          <p className="text-sm text-neutral-500">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!rep) return null;

  const TABS = [
    { id: "overview",     label: "Overview" },
    { id: "customers",    label: "Referred Customers" },
    { id: "commissions",  label: "Commission History" },
    { id: "profile",      label: "Profile" },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/sales-reps")}
            className="w-9 h-9 rounded-lg border border-neutral-200 bg-white flex items-center justify-center hover:bg-neutral-50 transition-colors shadow-sm">
            <ArrowLeft className="w-4 h-4 text-neutral-600" />
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-[14px] font-bold shadow-sm shrink-0">
              {rep.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-neutral-900">{rep.name}</h1>
                <Badge className={cn("text-[11px] border", TIER_COLORS[rep.tier])}>
                  {TIER_LABELS[rep.tier]}
                </Badge>
                <Badge className={rep.is_active
                  ? "bg-emerald-100 text-emerald-700 border-0 gap-1 text-[11px]"
                  : "bg-neutral-100 text-neutral-600 border-0 gap-1 text-[11px]"
                }>
                  <span className={cn("w-1.5 h-1.5 rounded-full inline-block", rep.is_active ? "bg-emerald-500" : "bg-neutral-400")} />
                  {rep.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-[12px] text-neutral-500 mt-0.5">Ref: {rep.referral_code}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)} className="text-[12px] h-8 gap-1.5">
            <Pencil className="w-3.5 h-3.5" /> Edit Realtor
          </Button>
          {pendingComms.length > 0 && (
            <Button size="sm" onClick={() => { setSelectedComms(pendingComms.map((c) => c.id)); setShowMarkPaid(true); }}
              className="text-[12px] h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Check className="w-3.5 h-3.5" /> Mark Commission as Paid
            </Button>
          )}
          <Button
            variant="outline" size="sm"
            onClick={handleToggleActive}
            disabled={togglingActive}
            className={cn("text-[12px] h-8 gap-1.5", rep.is_active ? "text-red-600 hover:bg-red-50 border-red-200" : "text-emerald-700 hover:bg-emerald-50 border-emerald-200")}
          >
            {togglingActive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : rep.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
            {rep.is_active ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-neutral-100/70 rounded-xl p-1 w-fit flex-wrap">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={cn(
              "px-4 py-2 rounded-lg text-[12.5px] font-semibold transition-all duration-150",
              tab === t.id ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ TAB CONTENT ══════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

          {/* ── Overview ──────────────────────────────────────────────────── */}
          {tab === "overview" && (
            <div className="space-y-5">
              {/* Rep profile card */}
              <div className="bg-white rounded-xl border border-neutral-100 p-5 shadow-sm">
                <h3 className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-4">Realtor Profile</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: "Full Name",      value: rep.name,         icon: Users },
                    { label: "Email",          value: rep.email,        icon: Mail },
                    { label: "Phone",          value: rep.phone || "—", icon: Phone },
                    { label: "Tier",           value: TIER_LABELS[rep.tier], icon: TrendingUp },
                    { label: "Referral Code",  value: rep.referral_code, icon: Copy, copy: true },
                    { label: "Date Added",     value: fmtDate(rep.created_at), icon: Calendar },
                  ].map(({ label, value, icon: Icon, copy: canCopy }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-neutral-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10.5px] text-neutral-400 uppercase tracking-wider font-semibold">{label}</p>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[13px] font-medium text-neutral-800 truncate">{value}</p>
                          {canCopy && (
                            <button onClick={copyCode} className="shrink-0 w-5 h-5 rounded flex items-center justify-center hover:bg-neutral-100 transition-colors">
                              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commission summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Pending to Earn",    value: fmt(rep.total_pending),   color: "amber"   as const },
                  { label: "Total Earned",        value: fmt(rep.total_earned),    color: "emerald" as const },
                  { label: "Total Triggered",     value: fmt(totalTriggered),      color: "blue"    as const },
                  { label: "Commission Rate",     value: rep.commission_type === "PERCENTAGE" ? `${rep.commission_rate}%` : fmt(rep.commission_rate), color: "violet" as const },
                ].map(({ label, value, color }) => {
                  const bg = { emerald: "bg-emerald-500", amber: "bg-amber-500", blue: "bg-blue-500", violet: "bg-violet-500" }[color];
                  return (
                    <div key={label} className="relative bg-white rounded-xl border border-neutral-100 p-4 shadow-sm overflow-hidden">
                      <div className={`absolute top-0 left-0 right-0 h-0.5 ${bg}`} />
                      <p className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">{label}</p>
                      <p className="text-[20px] font-bold text-neutral-900 leading-tight">{value}</p>
                    </div>
                  );
                })}
              </div>

              {/* Performance summary */}
              <div className="bg-white rounded-xl border border-neutral-100 p-5 shadow-sm">
                <h3 className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-4">Performance Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[
                    { label: "Total Referrals",          value: rep.total_referrals          ?? customers.length },
                    { label: "Active Subscriptions",     value: rep.active_subscriptions     ?? commissions.filter((c) => c.status === "PENDING").length },
                    { label: "Completed Subscriptions",  value: rep.completed_subscriptions  ?? "—" },
                    { label: "Defaulting Subscriptions", value: rep.defaulting_subscriptions ?? "—" },
                    { label: "Cancelled Subscriptions",  value: rep.cancelled_subscriptions  ?? "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center p-3 bg-neutral-50 rounded-lg">
                      <p className="text-[22px] font-bold text-neutral-900">{value}</p>
                      <p className="text-[10.5px] text-neutral-500 mt-0.5 leading-tight">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Referred Customers ──────────────────────────────────────────── */}
          {tab === "customers" && (
            <div className="space-y-4">
              {/* Search + filter */}
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                  <input
                    value={custSearch}
                    onChange={(e) => setCustSearch(e.target.value)}
                    placeholder="Search by customer name…"
                    className="w-full pl-8 pr-3 h-9 border border-neutral-200 bg-white rounded-lg text-[12.5px] focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                  />
                </div>
                <select
                  value={custStatusFilter}
                  onChange={(e) => setCustStatusFilter(e.target.value)}
                  className="h-9 px-3 border border-neutral-200 bg-white rounded-lg text-[12.5px] focus:outline-none"
                >
                  {["ALL","ACTIVE","COMPLETED","DEFAULTING","CANCELLED"].map((s) => (
                    <option key={s} value={s}>{s === "ALL" ? "All Statuses" : s.charAt(0) + s.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>

              {filteredCusts.length === 0 ? (
                <div className="bg-white rounded-xl border border-neutral-100 py-16 text-center">
                  <Users className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
                  <p className="text-[13px] text-neutral-500">No referred customers found.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-neutral-100 bg-neutral-50/70">
                          {["Customer Name","Property","Land Size","Plan","Locked Price","Amount Paid","Outstanding","Commission Earned","Commission Pending","Status","Actions"].map((h) => (
                            <th key={h} className="px-4 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-50">
                        {filteredCusts.map((c) => (
                          <tr key={c.id} className="hover:bg-neutral-50/60 transition-colors">
                            <td className="px-4 py-3.5 whitespace-nowrap font-semibold text-[13px] text-neutral-900">{c.full_name ?? c.customer_name ?? "—"}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-[12.5px] text-neutral-700">{c.property_name ?? "—"}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-[12.5px] text-neutral-700">{c.land_size ? `${c.land_size} sqm` : "—"}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-[12.5px] text-neutral-700">{c.plan_name ?? "—"}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-[12.5px] font-medium text-neutral-800">{fmt(c.locked_price)}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-[12.5px] font-medium text-emerald-700">{fmt(c.amount_paid)}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-[12.5px] font-medium text-red-600">{fmt(c.balance)}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-[12.5px] font-medium text-emerald-700">{fmt(c.commission_earned)}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-[12.5px] font-medium text-amber-600">{fmt(c.commission_pending)}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap"><SubStatusBadge status={c.subscription_status} /></td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <button onClick={() => navigate(`/customers/${c.id}`)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md transition-colors">
                                <Eye className="w-3 h-3" /> View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-2 border-t border-neutral-50 bg-neutral-50/40">
                    <p className="text-[11px] text-neutral-400">Showing {filteredCusts.length} of {customers.length} customers</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Commission History ───────────────────────────────────────────── */}
          {tab === "commissions" && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total Triggered", value: fmt(totalTriggered), color: "bg-blue-500" },
                  { label: "Total Paid Out",   value: fmt(totalPaid),     color: "bg-emerald-500" },
                  { label: "Total Pending",    value: fmt(totalPending),  color: "bg-amber-500" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="relative bg-white rounded-xl border border-neutral-100 p-4 shadow-sm overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-0.5 ${color}`} />
                    <p className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-[18px] font-bold text-neutral-900">{value}</p>
                  </div>
                ))}
              </div>

              {/* Toolbar */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex gap-1.5">
                  {(["ALL","PENDING","PAID"] as const).map((s) => (
                    <button key={s} onClick={() => setCommStatusFilter(s)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors",
                        commStatusFilter === s ? "bg-emerald-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      )}>
                      {s === "ALL" ? "All" : s === "PENDING" ? "Pending" : "Paid"}
                    </button>
                  ))}
                </div>
                {selectedComms.length > 0 && (
                  <Button size="sm" onClick={() => setShowMarkPaid(true)}
                    className="text-[12px] h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Check className="w-3.5 h-3.5" /> Mark {selectedComms.length} as Paid
                  </Button>
                )}
              </div>

              {filteredComms.length === 0 ? (
                <div className="bg-white rounded-xl border border-neutral-100 py-16 text-center">
                  <DollarSign className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
                  <p className="text-[13px] text-neutral-500">No commission records found.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-neutral-100 bg-neutral-50/70">
                          <th className="px-4 py-3 w-8">
                            <input type="checkbox"
                              checked={filteredComms.filter((c) => c.status === "PENDING").every((c) => selectedComms.includes(c.id))}
                              onChange={toggleSelectAll}
                              className="rounded border-neutral-300"
                            />
                          </th>
                          {["Date","Customer","Property","Payment Amount","Commission Amount","Type","Status","Paid Date","Actions"].map((h) => (
                            <th key={h} className="px-4 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-50">
                        {filteredComms.map((c) => (
                          <tr key={c.id} className="hover:bg-neutral-50/60 transition-colors">
                            <td className="px-4 py-3.5">
                              {c.status === "PENDING" && (
                                <input type="checkbox"
                                  checked={selectedComms.includes(c.id)}
                                  onChange={() => toggleSelectComm(c.id)}
                                  className="rounded border-neutral-300"
                                />
                              )}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-[12.5px] text-neutral-700">{fmtDate(c.created_at)}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-[12.5px] font-medium text-neutral-900">{c.customer_name ?? c.customer ?? "—"}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-[12.5px] text-neutral-700">{c.property_name ?? c.property ?? "—"}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-[12.5px] font-medium text-neutral-800">{fmt(c.payment_amount)}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-[12.5px] font-semibold text-emerald-700">{fmt(c.commission_amount)}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-[12px] text-neutral-500">{c.commission_type === "PERCENTAGE" ? "%" : "Fixed"}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <Badge className={cn("text-[11px] border-0", c.status === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                                {c.status === "PAID" ? "Paid" : "Pending"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-[12.5px] text-neutral-500">{fmtDate(c.paid_date)}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              {c.status === "PENDING" && (
                                <button
                                  onClick={() => { setSelectedComms([c.id]); setShowMarkPaid(true); }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11.5px] font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md transition-colors"
                                >
                                  <Check className="w-3 h-3" /> Mark Paid
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-2 border-t border-neutral-50 bg-neutral-50/40">
                    <p className="text-[11px] text-neutral-400">Showing {filteredComms.length} records</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Profile ─────────────────────────────────────────────────────── */}
          {tab === "profile" && (
            <div className="bg-white rounded-xl border border-neutral-100 p-6 shadow-sm max-w-lg space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-neutral-900">Realtor Profile</h3>
                <Button variant="outline" size="sm" onClick={() => setShowEdit(true)} className="text-[12px] h-8 gap-1.5">
                  <Pencil className="w-3.5 h-3.5" /> Edit Profile
                </Button>
              </div>
              <div className="space-y-4 divide-y divide-neutral-50">
                {[
                  { label: "Full Name",      value: rep.name },
                  { label: "Email",          value: rep.email },
                  { label: "Phone",          value: rep.phone || "—" },
                  { label: "Tier",           value: TIER_LABELS[rep.tier] },
                  { label: "Referral Code",  value: rep.referral_code, copy: true },
                  { label: "Date Added",     value: fmtDate(rep.created_at) },
                  { label: "Added By",       value: rep.added_by ?? "Admin" },
                  { label: "Status",         value: rep.is_active ? "Active" : "Inactive" },
                ].map(({ label, value, copy: canCopy }) => (
                  <div key={label} className="flex items-center justify-between pt-4 first:pt-0">
                    <span className="text-[12px] text-neutral-500 font-medium">{label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold text-neutral-800">{value}</span>
                      {canCopy && (
                        <button onClick={copyCode} className="w-6 h-6 rounded flex items-center justify-center hover:bg-neutral-100 transition-colors">
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showEdit && rep && (
          <EditRepModal rep={rep} onClose={() => setShowEdit(false)} onSaved={() => { fetchAll(); setShowEdit(false); }} />
        )}
        {showMarkPaid && (
          <MarkPaidModal
            selected={selectedCommObjects}
            onClose={() => { setShowMarkPaid(false); setSelectedComms([]); }}
            onSuccess={fetchAll}
          />
        )}
      </AnimatePresence>

      <div className="pb-8" />
    </div>
  );
}

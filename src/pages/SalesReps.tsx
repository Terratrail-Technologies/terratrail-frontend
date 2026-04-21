import { useState } from "react";
import { useNavigate } from "react-router";
import { usePolling } from "../hooks/usePolling";
import { usePageTitle } from "../hooks/usePageTitle";
import { useWorkspaceRole } from "../hooks/useWorkspaceRole";
import {
  Search, Plus, X, AlertCircle, Copy, Check,
  Loader2, MoreVertical, Eye, ChevronDown,
  Users, TrendingUp, Wallet, Banknote,
} from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { api } from "../services/api";
import { toast } from "sonner";
import { motion } from "motion/react";

// ─── Types ────────────────────────────────────────────────────────────────────
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
  created_at: string;
  updated_at: string;
}

interface RepStats {
  total_referrals?: number;
  active_subscriptions?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TIER_LABELS: Record<Tier, string> = {
  STARTER: "Realtor",
  SENIOR: "Senior Realtor",
  LEGEND: "Principal Realtor",
};

const TIER_COLORS: Record<Tier, string> = {
  LEGEND: "bg-purple-100 text-purple-700",
  SENIOR: "bg-blue-100 text-blue-700",
  STARTER: "bg-neutral-100 text-neutral-600",
};

// ─── Animation variants ───────────────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
} as const;
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 26 } },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number | string) =>
  `₦${Number(v).toLocaleString("en-NG")}`;

// ─── Access Denied ────────────────────────────────────────────────────────────
function AccessDenied() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)] w-full">
      <div className="bg-white border-b border-neutral-100 px-6 lg:px-8 py-4">
        <h1 className="text-[18px] font-semibold text-neutral-900">Sales Representatives</h1>
        <p className="text-[12px] text-neutral-400 mt-0.5">Manage your realtors and track their commissions</p>
      </div>
      <div className="p-6 lg:p-8 flex-1 flex items-center justify-center">
        <div className="max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-neutral-100 mb-4">
            <Users className="w-7 h-7 text-neutral-400" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">Access Restricted</h2>
          <p className="text-sm text-neutral-500">
            You don't have permission to view this page. Contact your workspace admin for access.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Add Rep Modal ────────────────────────────────────────────────────────────
interface AddRepModalProps {
  onClose: () => void;
  onSaved: () => void;
}

function AddRepModal({ onClose, onSaved }: AddRepModalProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    tier: "STARTER" as Tier,
    referral_code: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const f =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const handle = async () => {
    setError("");
    if (!form.name.trim()) return setError("Full name is required.");
    if (!form.email.trim()) return setError("Email is required.");
    if (!form.phone.trim()) return setError("Phone number is required.");
    if (!form.referral_code.trim()) return setError("Referral code is required.");

    setSaving(true);
    try {
      await api.salesReps.create(form);

      // Send workspace invite — don't block rep creation on failure
      try {
        await api.workspaces.invite({ email: form.email, role: "SALES_REP" });
        toast.success(`Sales rep added. Invite sent to ${form.email}.`);
      } catch {
        toast.success("Sales rep added. (Invite email could not be sent — send manually via workspace invite.)");
      }

      onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Failed to add rep. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 bg-white transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="font-semibold text-neutral-900">Add Sales Rep</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={f("name")}
                placeholder="e.g. John Doe"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                value={form.phone}
                onChange={f("phone")}
                placeholder="+234..."
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={f("email")}
              placeholder="rep@example.com"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Tier</label>
              <select value={form.tier} onChange={f("tier")} className={inputCls}>
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    {TIER_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Referral Code <span className="text-red-500">*</span>
              </label>
              <input
                value={form.referral_code}
                onChange={f("referral_code")}
                placeholder="e.g. JOHN2024"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handle}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Add Rep
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Row Actions Dropdown ─────────────────────────────────────────────────────
interface RowActionsProps {
  rep: SalesRep;
  onEdit: () => void;
  onDeactivate: () => void;
}

function RowActions({ rep, onEdit, onDeactivate }: RowActionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-1.5 hover:bg-neutral-100 rounded-md transition-colors"
      >
        <ChevronDown className="w-4 h-4 text-neutral-500" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-8 z-20 w-36 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 text-sm">
            <button
              onClick={() => { setOpen(false); onEdit(); }}
              className="w-full px-3 py-2 text-left text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => { setOpen(false); onDeactivate(); }}
              className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
            >
              {rep.is_active ? "Deactivate" : "Activate"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Edit Rep Modal (re-uses same structure as Add) ───────────────────────────
interface EditRepModalProps {
  rep: SalesRep;
  onClose: () => void;
  onSaved: () => void;
}

function EditRepModal({ rep, onClose, onSaved }: EditRepModalProps) {
  const [form, setForm] = useState({
    name: rep.name,
    email: rep.email,
    phone: rep.phone,
    tier: rep.tier,
    referral_code: rep.referral_code,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const f =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const handle = async () => {
    setError("");
    if (!form.name.trim()) return setError("Full name is required.");
    if (!form.email.trim()) return setError("Email is required.");
    if (!form.phone.trim()) return setError("Phone number is required.");
    if (!form.referral_code.trim()) return setError("Referral code is required.");

    setSaving(true);
    try {
      await api.salesReps.update(rep.id, form);
      toast.success("Sales rep updated.");
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Failed to update rep. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 bg-white transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="font-semibold text-neutral-900">Edit Sales Rep</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input value={form.name} onChange={f("name")} placeholder="e.g. John Doe" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input value={form.phone} onChange={f("phone")} placeholder="+234..." className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input type="email" value={form.email} onChange={f("email")} placeholder="rep@example.com" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Tier</label>
              <select value={form.tier} onChange={f("tier")} className={inputCls}>
                {TIERS.map((t) => (
                  <option key={t} value={t}>{TIER_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Referral Code <span className="text-red-500">*</span>
              </label>
              <input value={form.referral_code} onChange={f("referral_code")} placeholder="e.g. JOHN2024" className={inputCls} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handle}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function SalesReps() {
  usePageTitle("Sales Representatives");
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useWorkspaceRole();

  const [reps, setReps] = useState<SalesRep[]>([]);
  const [repStats, setRepStats] = useState<Record<string, RepStats>>({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editRep, setEditRep] = useState<SalesRep | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<"ALL" | Tier>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL");

  // Referral code copy state
  const [copied, setCopied] = useState<string | null>(null);

  // Deactivate in-progress
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listResult, statsResult] = await Promise.allSettled([
        api.salesReps.list(),
        api.salesReps.getStats(),
      ]);

      if (listResult.status === "fulfilled") {
        setReps(listResult.value as SalesRep[]);
      }
      if (statsResult.status === "fulfilled") {
        // getStats may return an array of per-rep stats keyed by id, or an object
        const statsData = statsResult.value;
        if (Array.isArray(statsData)) {
          const map: Record<string, RepStats> = {};
          statsData.forEach((s: any) => {
            if (s.id) map[s.id] = s;
          });
          setRepStats(map);
        } else if (statsData && typeof statsData === "object") {
          setRepStats(statsData as Record<string, RepStats>);
        }
      }
    } catch (err) {
      console.error("Failed to load sales reps:", err);
    } finally {
      setLoading(false);
    }
  };

  usePolling(fetchData, 30_000);

  // ── Copy referral code ──────────────────────────────────────────────────────
  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  // ── Toggle active/inactive ─────────────────────────────────────────────────
  async function handleToggleActive(rep: SalesRep) {
    const action = rep.is_active ? "Deactivate" : "Activate";
    if (!confirm(`${action} ${rep.name}?`)) return;
    setTogglingId(rep.id);
    try {
      await api.salesReps.update(rep.id, { is_active: !rep.is_active });
      toast.success(`${rep.name} ${rep.is_active ? "deactivated" : "activated"}.`);
      fetchData();
    } catch (e: any) {
      toast.error(e?.message ?? `Failed to ${action.toLowerCase()} rep.`);
    } finally {
      setTogglingId(null);
    }
  }

  // ── Derived summary values ─────────────────────────────────────────────────
  const totalPending = reps.reduce((sum, r) => sum + Number(r.total_pending ?? 0), 0);
  const totalEarned = reps.reduce((sum, r) => sum + Number(r.total_earned ?? 0), 0);
  const totalPotential = totalEarned + totalPending;

  // ── Filtered reps ──────────────────────────────────────────────────────────
  const filtered = reps.filter((rep) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      rep.name.toLowerCase().includes(q) ||
      rep.email.toLowerCase().includes(q) ||
      (rep.referral_code ?? "").toLowerCase().includes(q);

    const matchTier = tierFilter === "ALL" || rep.tier === tierFilter;

    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "Active" && rep.is_active) ||
      (statusFilter === "Inactive" && !rep.is_active);

    return matchSearch && matchTier && matchStatus;
  });

  // ── Role guard ─────────────────────────────────────────────────────────────
  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-60px)]">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (role === "SALES_REP" || role === "CUSTOMER") {
    return <AccessDenied />;
  }

  // ── Skeleton loading state ─────────────────────────────────────────────────
  if (loading && reps.length === 0) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-60px)] w-full">
        {/* Header skeleton */}
        <div className="bg-white border-b border-neutral-100 px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-52 bg-neutral-100" />
              <Skeleton className="h-3.5 w-72 bg-neutral-100" />
            </div>
            <Skeleton className="h-9 w-28 rounded-lg bg-neutral-100" />
          </div>
        </div>
        <div className="p-6 lg:p-8 space-y-6">
          {/* Summary cards skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-neutral-100 p-4 shadow-sm space-y-2">
                <Skeleton className="h-3 w-24 bg-neutral-100" />
                <Skeleton className="h-7 w-32 bg-neutral-100" />
              </div>
            ))}
          </div>
          {/* Table skeleton */}
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-neutral-100">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-36 bg-neutral-100" />
                    <Skeleton className="h-3 w-24 bg-neutral-100" />
                  </div>
                  <Skeleton className="h-5 w-24 rounded-full bg-neutral-100" />
                  <Skeleton className="h-4 w-20 bg-neutral-100" />
                  <Skeleton className="h-4 w-16 bg-neutral-100" />
                  <Skeleton className="h-4 w-16 bg-neutral-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modals */}
      {showAdd && <AddRepModal onClose={() => setShowAdd(false)} onSaved={fetchData} />}
      {editRep && (
        <EditRepModal
          rep={editRep}
          onClose={() => setEditRep(null)}
          onSaved={fetchData}
        />
      )}

      <div className="flex flex-col min-h-[calc(100vh-60px)] w-full">
        {/* Page header */}
        <div className="bg-white border-b border-neutral-100 px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[18px] font-semibold text-neutral-900">
                Sales Representatives
              </h1>
              <p className="text-[12px] text-neutral-400 mt-0.5">
                Manage your realtors and track their commissions
              </p>
            </div>
            <div className="flex items-center gap-2">
              {loading && (
                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin mr-1" />
              )}
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Rep
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 lg:p-8 flex-1">
          {/* ── Summary cards ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Realtors */}
            <div className="bg-white rounded-xl border border-neutral-100 p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold mb-1">
                    Total Realtors
                  </p>
                  <p className="text-2xl font-bold text-neutral-900">{reps.length}</p>
                </div>
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
            </div>

            {/* Pending to Earn */}
            <div className="bg-white rounded-xl border border-neutral-100 p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold mb-1">
                    Pending to Earn
                  </p>
                  <p className="text-2xl font-bold text-neutral-900">{fmt(totalPending)}</p>
                </div>
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4 text-amber-600" />
                </div>
              </div>
            </div>

            {/* Total Earned */}
            <div className="bg-white rounded-xl border border-neutral-100 p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold mb-1">
                    Total Earned
                  </p>
                  <p className="text-2xl font-bold text-neutral-900">{fmt(totalEarned)}</p>
                </div>
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Total Earning Potential */}
            <div className="bg-white rounded-xl border border-neutral-100 p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold mb-1">
                    Earning Potential
                  </p>
                  <p className="text-2xl font-bold text-neutral-900">{fmt(totalPotential)}</p>
                </div>
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                  <Banknote className="w-4 h-4 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Filters ───────────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or referral code…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 bg-white transition-colors"
              />
            </div>

            {/* Tier filter */}
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as typeof tierFilter)}
              className="px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 bg-white transition-colors"
            >
              <option value="ALL">All Tiers</option>
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {TIER_LABELS[t]}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 bg-white transition-colors"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* ── Table ─────────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100">
              <p className="text-sm font-medium text-neutral-700">
                All Sales Representatives
              </p>
              <span className="text-xs text-neutral-400">
                {filtered.length} of {reps.length} reps
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50/70 border-b border-neutral-100">
                  <tr>
                    {[
                      "Realtor Name",
                      "Tier",
                      "Referral Code",
                      "Total Referrals",
                      "Active Subscriptions",
                      "Total Earned",
                      "Pending Payout",
                      "Status",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className={`px-5 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider whitespace-nowrap ${
                          h === "Actions" ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                {filtered.length > 0 ? (
                  <motion.tbody
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="divide-y divide-neutral-50"
                  >
                    {filtered.map((rep) => {
                      const stats = repStats[rep.id];
                      return (
                        <motion.tr
                          key={rep.id}
                          variants={item}
                          className="hover:bg-neutral-50/60 transition-colors group"
                        >
                          {/* Realtor Name */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="font-medium text-sm text-neutral-900 group-hover:text-emerald-700 transition-colors">
                              {rep.name}
                            </div>
                            <div className="text-xs text-neutral-400 mt-0.5">{rep.email}</div>
                          </td>

                          {/* Tier */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                TIER_COLORS[rep.tier] ?? "bg-neutral-100 text-neutral-600"
                              }`}
                            >
                              {TIER_LABELS[rep.tier] ?? rep.tier}
                            </span>
                          </td>

                          {/* Referral Code */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                                {rep.referral_code ?? "—"}
                              </span>
                              {rep.referral_code && (
                                <button
                                  onClick={() => copyCode(rep.referral_code)}
                                  className="p-1 hover:bg-neutral-100 rounded transition-colors"
                                  title="Copy referral code"
                                >
                                  {copied === rep.referral_code ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 text-neutral-400" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Total Referrals */}
                          <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700">
                            {stats?.total_referrals != null
                              ? stats.total_referrals.toLocaleString()
                              : "—"}
                          </td>

                          {/* Active Subscriptions */}
                          <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700">
                            {stats?.active_subscriptions != null
                              ? stats.active_subscriptions.toLocaleString()
                              : "—"}
                          </td>

                          {/* Total Earned */}
                          <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-neutral-900">
                            {fmt(rep.total_earned ?? 0)}
                          </td>

                          {/* Pending Payout */}
                          <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-amber-600">
                            {fmt(rep.total_pending ?? 0)}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            {rep.is_active ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-500">
                                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 inline-block" />
                                Inactive
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {/* View button */}
                              <button
                                onClick={() => navigate(`/sales-reps/${rep.id}`)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View
                              </button>

                              {/* Dropdown: Edit · Deactivate */}
                              {togglingId === rep.id ? (
                                <div className="p-1.5">
                                  <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                                </div>
                              ) : (
                                <RowActions
                                  rep={rep}
                                  onEdit={() => setEditRep(rep)}
                                  onDeactivate={() => handleToggleActive(rep)}
                                />
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </motion.tbody>
                ) : (
                  <tbody>
                    <tr>
                      <td colSpan={9} className="px-6 py-16 text-center">
                        {reps.length === 0 ? (
                          <div className="space-y-3">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-neutral-100 mb-2">
                              <Users className="w-6 h-6 text-neutral-400" />
                            </div>
                            <p className="text-sm text-neutral-500">No sales representatives yet.</p>
                            <button
                              onClick={() => setShowAdd(true)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              Add First Rep
                            </button>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-neutral-500 mb-1">No reps match your filters.</p>
                            <button
                              onClick={() => {
                                setSearch("");
                                setTierFilter("ALL");
                                setStatusFilter("ALL");
                              }}
                              className="text-sm text-emerald-600 hover:underline"
                            >
                              Clear filters
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

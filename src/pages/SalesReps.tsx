import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { usePolling } from "../hooks/usePolling";
import { usePageTitle } from "../hooks/usePageTitle";
import { useWorkspaceRole } from "../hooks/useWorkspaceRole";
import {
  Search, Plus, X, AlertCircle, Copy, Check,
  Loader2, Eye, ChevronDown, Pencil, Settings,
  Users, TrendingUp, Wallet, Banknote, Trash2,
} from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { api } from "../services/api";
import { toast } from "sonner";
import { motion } from "motion/react";
import { TablePagination } from "../components/ui/TablePagination";

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
  address: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
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

// ─── Commission Settings Modal ────────────────────────────────────────────────
interface CommissionSettingsModalProps {
  onClose: () => void;
}

function CommissionSettingsModal({ onClose }: CommissionSettingsModalProps) {
  const [rates, setRates] = useState({
    commission_starter_pct: "",
    commission_senior_pct: "",
    commission_legend_pct: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.workspaces.getSettings()
      .then((s: any) => {
        setRates({
          commission_starter_pct: s?.commission_starter_pct ?? "",
          commission_senior_pct: s?.commission_senior_pct ?? "",
          commission_legend_pct: s?.commission_legend_pct ?? "",
        });
      })
      .catch(() => setError("Failed to load settings."))
      .finally(() => setLoading(false));
  }, []);

  const f = (k: keyof typeof rates) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setRates((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    setError("");
    const starter = parseFloat(rates.commission_starter_pct as string);
    const senior  = parseFloat(rates.commission_senior_pct as string);
    const legend  = parseFloat(rates.commission_legend_pct as string);
    if ([starter, senior, legend].some((v) => isNaN(v) || v < 0 || v > 100)) {
      return setError("All rates must be valid numbers between 0 and 100.");
    }
    setSaving(true);
    try {
      await api.workspaces.updateSettings({
        commission_starter_pct: starter,
        commission_senior_pct: senior,
        commission_legend_pct: legend,
      });
      toast.success("Commission rates saved.");
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]/30 focus:border-[#2a52a8] bg-white transition-colors text-right";

  const rows: { label: string; key: keyof typeof rates }[] = [
    { label: "Realtor",           key: "commission_starter_pct" },
    { label: "Senior Realtor",    key: "commission_senior_pct" },
    { label: "Principal Realtor", key: "commission_legend_pct" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-md my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div>
            <h2 className="font-semibold text-neutral-900">Commission Settings</h2>
            <p className="text-[12px] text-neutral-400 mt-0.5">Set commission rates per realtor tier</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-md transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="text-left py-2 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Tier</th>
                  <th className="text-right py-2 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider w-36">% Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {rows.map(({ label, key }) => (
                  <tr key={key}>
                    <td className="py-3 font-medium text-neutral-700">{label}</td>
                    <td className="py-3 pl-6">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={rates[key]}
                          onChange={f(key)}
                          className={inputCls}
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs pointer-events-none">%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving || loading}
            className="px-4 py-2 text-sm font-medium bg-[#0E2C72] text-white rounded-lg hover:bg-[#0a2260] disabled:opacity-50 transition-colors inline-flex items-center gap-2">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Invite Link Modal ────────────────────────────────────────────────────────
interface InviteLinkModalProps {
  token: string;
  email: string;
  onClose: () => void;
}

function InviteLinkModal({ token, email, onClose }: InviteLinkModalProps) {
  const [copied, setCopied] = useState(false);
  const inviteLink = `${window.location.origin}/accept-invite/${token}`;

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <div>
            <h3 className="text-[15px] font-bold text-neutral-900">Invitation Sent</h3>
            <p className="text-[12px] text-neutral-500 mt-0.5">Share the link if the email doesn't arrive</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0E2C72]/6 border border-[#0E2C72]/15">
            <Check className="w-4 h-4 text-[#0E2C72] shrink-0" />
            <p className="text-[12px] text-[#0a2260] font-medium">
              Invitation sent to <strong>{email}</strong>
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-neutral-500 mb-1.5">Invite link</p>
            <div className="flex items-center gap-2">
              <input readOnly value={inviteLink}
                className="flex-1 px-3 py-2 text-[11px] border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-600 truncate" />
              <button onClick={copyLink}
                className="shrink-0 px-3 py-2 bg-[#0E2C72] text-white text-[12px] font-semibold rounded-lg hover:bg-[#0a2260] transition-colors flex items-center gap-1.5">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <button onClick={onClose}
            className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[13px] font-semibold rounded-lg transition-colors">
            Done
          </button>
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
    address: "",
    bank_name: "",
    bank_account_number: "",
    bank_account_name: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [inviteToken, setInviteToken] = useState<string | null>(null);

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
      onSaved();

      // Send workspace invite — capture token to show copy-link modal
      try {
        const inviteRes = await api.workspaces.invite({ email: form.email, role: "SALES_REP" });
        if (inviteRes?.token) {
          setInviteToken(inviteRes.token);
        } else {
          toast.success(`Sales rep added. Invite sent to ${form.email}.`);
          onClose();
        }
      } catch {
        toast.success("Sales rep added. (Invite email could not be sent — send manually via workspace invite.)");
        onClose();
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to add rep. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Show invite link modal after successful invite
  if (inviteToken) {
    return (
      <InviteLinkModal
        token={inviteToken}
        email={form.email}
        onClose={onClose}
      />
    );
  }

  const inputCls =
    "w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]/30 focus:border-[#2a52a8] bg-white transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <form
        onSubmit={(e) => { e.preventDefault(); handle(); }}
        className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-lg my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="font-semibold text-neutral-900">Add Sales Rep</h2>
          <button
            type="button"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="border-t border-neutral-100 pt-4">
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-3">Account Details (optional)</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Address</label>
                <input value={form.address} onChange={f("address")} placeholder="e.g. 12 Victoria Island, Lagos" className={inputCls} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Bank Name</label>
                  <input value={form.bank_name} onChange={f("bank_name")} placeholder="e.g. GTBank" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Account Number</label>
                  <input value={form.bank_account_number} onChange={f("bank_account_number")} placeholder="0123456789" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Account Name</label>
                <input value={form.bank_account_name} onChange={f("bank_account_name")} placeholder="As on bank records" className={inputCls} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-[#0E2C72] text-white rounded-lg hover:bg-[#0a2260] disabled:opacity-50 transition-colors inline-flex items-center gap-2"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Add Rep
          </button>
        </div>
      </form>
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
    address: rep.address ?? "",
    bank_name: rep.bank_name ?? "",
    bank_account_number: rep.bank_account_number ?? "",
    bank_account_name: rep.bank_account_name ?? "",
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
    "w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]/30 focus:border-[#2a52a8] bg-white transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <form
        onSubmit={(e) => { e.preventDefault(); handle(); }}
        className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-lg my-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="font-semibold text-neutral-900">Edit Sales Rep</h2>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-md transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="border-t border-neutral-100 pt-4">
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-3">Account Details (optional)</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Address</label>
                <input value={form.address} onChange={f("address")} placeholder="e.g. 12 Victoria Island, Lagos" className={inputCls} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Bank Name</label>
                  <input value={form.bank_name} onChange={f("bank_name")} placeholder="e.g. GTBank" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Account Number</label>
                  <input value={form.bank_account_number} onChange={f("bank_account_number")} placeholder="0123456789" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Account Name</label>
                <input value={form.bank_account_name} onChange={f("bank_account_name")} placeholder="As on bank records" className={inputCls} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-[#0E2C72] text-white rounded-lg hover:bg-[#0a2260] disabled:opacity-50 transition-colors inline-flex items-center gap-2">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save Changes
          </button>
        </div>
      </form>
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
  const [showCommissionSettings, setShowCommissionSettings] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<"ALL" | Tier>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL");

  // Referral code copy state
  const [copied, setCopied] = useState<string | null>(null);

  // Deactivate in-progress
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

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

  // ── Bulk selection helpers ─────────────────────────────────────────────────
  const toggleRow = (id: string) => {
    setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const exportCSV = () => {
    const rows = reps.filter((r) => selected.has(r.id));
    const headers = ["#", "Name", "Email", "Phone", "Tier", "Referral Code"];
    const lines = rows.map((r, i) => [
      i + 1,
      `"${(r.name ?? "").replace(/"/g, '""')}"`,
      `"${(r.email ?? "").replace(/"/g, '""')}"`,
      `"${(r.phone ?? "").replace(/"/g, '""')}"`,
      `"${(r.tier ?? "").replace(/"/g, '""')}"`,
      `"${(r.referral_code ?? "").replace(/"/g, '""')}"`,
    ].join(","));
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "sales-reps.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    const ids = Array.from(selected);
    const results = await Promise.allSettled(ids.map((id) => api.salesReps.delete(id)));
    const succeeded = ids.filter((_, i) => results[i].status === "fulfilled");
    const failCount = ids.length - succeeded.length;
    setReps((prev) => prev.filter((r) => !succeeded.includes(r.id)));
    setSelected(new Set());
    setConfirmBulkDelete(false);
    setBulkDeleting(false);
    if (failCount === 0) {
      toast.success(`${succeeded.length} rep${succeeded.length !== 1 ? "s" : ""} deleted.`);
    } else {
      toast.warning(`${succeeded.length} deleted, ${failCount} failed.`);
    }
  };

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

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const allPageSelected = paginated.length > 0 && paginated.every((r) => selected.has(r.id));
  const somePageSelected = paginated.some((r) => selected.has(r.id));

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelected((prev) => { const next = new Set(prev); paginated.forEach((r) => next.delete(r.id)); return next; });
    } else {
      setSelected((prev) => { const next = new Set(prev); paginated.forEach((r) => next.add(r.id)); return next; });
    }
  };

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
      {showCommissionSettings && (
        <CommissionSettingsModal onClose={() => setShowCommissionSettings(false)} />
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
                <Loader2 className="w-4 h-4 text-[#1a3d8f] animate-spin mr-1" />
              )}
              <button
                onClick={() => setShowCommissionSettings(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors shadow-sm"
              >
                <Settings className="w-4 h-4" />
                Commission Settings
              </button>
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0E2C72] text-white text-sm font-medium rounded-lg hover:bg-[#0a2260] transition-colors shadow-sm"
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
                <div className="w-8 h-8 bg-[#0E2C72]/6 rounded-lg flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-[#0E2C72]" />
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
                  <p className="text-[11px] text-neutral-400 mt-1">From unpaid referral commissions</p>
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
                  <p className="text-[11px] text-neutral-400 mt-1">From paid commission payouts</p>
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
                  <p className="text-[11px] text-neutral-400 mt-1">If all referrals complete payment</p>
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
                onChange={(e) => { setSearch(e.target.value); setSelected(new Set()); }}
                placeholder="Search by name, email, or referral code…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]/30 focus:border-[#2a52a8] bg-white transition-colors"
              />
            </div>

            {/* Tier filter */}
            <select
              value={tierFilter}
              onChange={(e) => { setTierFilter(e.target.value as typeof tierFilter); setSelected(new Set()); }}
              className="px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]/30 focus:border-[#2a52a8] bg-white transition-colors"
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
              onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setSelected(new Set()); }}
              className="px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]/30 focus:border-[#2a52a8] bg-white transition-colors"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* ── Mobile cards (< md) ───────────────────────────────────────────── */}
          {filtered.length > 0 && (
            <div className="md:hidden space-y-3">
              {filtered.map((rep) => {
                const stats = repStats[rep.id];
                return (
                  <motion.div key={rep.id} variants={item}
                    className="bg-white rounded-xl border border-neutral-100 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-semibold text-neutral-900 truncate">{rep.name}</div>
                        <div className="text-[11.5px] text-neutral-400 truncate">{rep.email}</div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${TIER_COLORS[rep.tier] ?? "bg-neutral-100 text-neutral-600"}`}>
                            {TIER_LABELS[rep.tier] ?? rep.tier}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${rep.is_active ? "bg-[#0E2C72]/6 text-[#0E2C72]" : "bg-neutral-100 text-neutral-500"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full inline-block ${rep.is_active ? "bg-[#1a3d8f]" : "bg-neutral-400"}`} />
                            {rep.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Referral Code</div>
                        <div className="font-mono text-[12px] text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">{rep.referral_code ?? "—"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Total Earned</div>
                        <div className="text-[13px] font-bold text-neutral-900">{fmt(rep.total_earned ?? 0)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Pending Payout</div>
                        <div className="text-[13px] font-bold text-amber-600">{fmt(rep.total_pending ?? 0)}</div>
                      </div>
                      {stats?.total_referrals != null && (
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Referrals</div>
                          <div className="text-[13px] font-bold text-neutral-900">{stats.total_referrals}</div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-neutral-50">
                      <button onClick={() => navigate(`/sales-reps/${rep.id}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-neutral-200 text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button onClick={() => setEditRep(rep)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-blue-100 bg-blue-50/50 text-[12px] font-medium text-blue-700 hover:bg-blue-100 transition-colors">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                    </div>
                  </motion.div>
                );
              })}
              <p className="text-[11px] text-neutral-400 text-center py-1">
                {filtered.length} of {reps.length} rep{reps.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}

          {/* ── Desktop table (≥ md) ───────────────────────────────────────────── */}
          <div className="hidden md:block bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100">
              <p className="text-sm font-medium text-neutral-700">
                All Sales Representatives
              </p>
              <span className="text-xs text-neutral-400">
                {filtered.length} of {reps.length} reps
              </span>
            </div>

            {/* Bulk action bar */}
            {selected.size > 0 && (
              <div className="bg-[#0E2C72]/5 border-b border-[#0E2C72]/20 px-4 py-2.5 flex items-center gap-3 text-sm">
                <span className="text-[#0E2C72] font-semibold text-[12px]">{selected.size} selected</span>
                <button
                  onClick={exportCSV}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#0E2C72]/20 text-[#0E2C72] text-[12px] font-medium hover:bg-[#0E2C72]/5 transition-colors"
                >
                  Export CSV
                </button>
                {!confirmBulkDelete ? (
                  <button
                    onClick={() => setConfirmBulkDelete(true)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-600 text-[12px] font-medium hover:bg-red-50 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Selected
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-red-600 font-medium">Are you sure?</span>
                    <button
                      onClick={handleBulkDelete}
                      disabled={bulkDeleting}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-[12px] font-medium hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center gap-1.5"
                    >
                      {bulkDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmBulkDelete(false)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-neutral-200 text-neutral-600 text-[12px] font-medium hover:bg-neutral-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <button
                  onClick={() => { setSelected(new Set()); setConfirmBulkDelete(false); }}
                  className="ml-auto p-1 rounded-lg hover:bg-[#0E2C72]/10 text-[#0E2C72] transition-colors"
                  title="Clear selection"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50/70 border-b border-neutral-100">
                  <tr>
                    <th className="px-4 py-3 w-8">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-neutral-300 text-[#0E2C72] accent-[#0E2C72]"
                        checked={allPageSelected}
                        ref={(el) => { if (el) el.indeterminate = !allPageSelected && somePageSelected; }}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide w-10">#</th>
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
                    {paginated.map((rep, index) => {
                      const stats = repStats[rep.id];
                      return (
                        <motion.tr
                          key={rep.id}
                          variants={item}
                          className="hover:bg-neutral-50/60 transition-colors group"
                        >
                          <td className="px-4 py-3 w-8">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-neutral-300 text-[#0E2C72] accent-[#0E2C72]"
                              checked={selected.has(rep.id)}
                              onChange={() => toggleRow(rep.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-4 py-3 text-[12px] text-neutral-400 font-mono">{(page-1)*pageSize + index + 1}</td>
                          {/* Realtor Name */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="font-medium text-sm text-neutral-900 group-hover:text-[#0a2260] transition-colors">
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
                                    <Check className="w-3.5 h-3.5 text-[#0E2C72]" />
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
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0E2C72]/6 text-[#0E2C72]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#1a3d8f] inline-block" />
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
                      <td colSpan={11} className="px-6 py-16 text-center">
                        {reps.length === 0 ? (
                          <div className="space-y-3">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-neutral-100 mb-2">
                              <Users className="w-6 h-6 text-neutral-400" />
                            </div>
                            <p className="text-sm text-neutral-500">No sales representatives yet.</p>
                            <button
                              onClick={() => setShowAdd(true)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0E2C72] text-white text-sm font-medium rounded-lg hover:bg-[#0a2260] transition-colors"
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
                              className="text-sm text-[#0E2C72] hover:underline"
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
            {filtered.length > 0 && (
              <TablePagination
                page={page}
                pageCount={pageCount}
                total={filtered.length}
                pageSize={pageSize}
                onPage={(n) => { setPage(n); setSelected(new Set()); }}
                onPageSize={(n) => { setPageSize(n); setPage(1); setSelected(new Set()); }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}




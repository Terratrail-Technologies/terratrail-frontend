import { useState, useEffect } from "react";
import { usePolling } from "../hooks/usePolling";
import { usePageTitle } from "../hooks/usePageTitle";
import { Link2, Settings, TrendingUp, Loader2, Plus, X, AlertCircle, Copy, Check, Trash2 } from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { api } from "../services/api";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
const TIERS = ["STARTER", "SENIOR", "LEGEND"] as const;
type Tier = typeof TIERS[number];

const TIER_COLORS: Record<string, string> = {
  LEGEND: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  SENIOR: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  STARTER: "bg-neutral-100 text-neutral-700 hover:bg-neutral-100",
};

const blank = { name: "", email: "", phone: "", tier: "STARTER" as Tier, referral_code: "", commission_type: "PERCENT", commission_rate: "5.00" };

// ─── Add / Edit Sales Rep Modal ───────────────────────────────────────────────
function RepModal({ rep, onClose, onSaved }: { rep?: any; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!rep;
  const [form, setForm] = useState({
    name: rep?.name ?? "",
    email: rep?.email ?? "",
    phone: rep?.phone ?? "",
    tier: rep?.tier ?? "STARTER",
    referral_code: rep?.referral_code ?? "",
    commission_type: rep?.commission_type ?? "PERCENT",
    commission_rate: rep?.commission_rate ?? "5.00",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handle = async () => {
    setError("");
    if (!form.name.trim()) return setError("Name is required.");
    if (!form.email.trim()) return setError("Email is required.");
    if (!form.phone.trim()) return setError("Phone is required.");
    if (!form.referral_code.trim()) return setError("Referral code is required.");
    setSaving(true);
    try {
      if (isEdit) {
        await api.salesReps.update(rep.id, form);
        toast.success("Sales rep updated.");
      } else {
        await api.salesReps.create(form);
        toast.success("Sales rep added.");
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="font-semibold text-neutral-900">{isEdit ? "Edit Sales Rep" : "Add Sales Rep"}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-md"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name *</label>
              <input value={form.name} onChange={f("name")} placeholder="e.g. John Doe" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Phone *</label>
              <input value={form.phone} onChange={f("phone")} placeholder="+234..." className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={f("email")} placeholder="rep@example.com" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Tier</label>
              <select value={form.tier} onChange={f("tier")} className={inputCls}>
                {TIERS.map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Referral Code *</label>
              <input value={form.referral_code} onChange={f("referral_code")} placeholder="e.g. JOHN2024" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Commission Type</label>
              <select value={form.commission_type} onChange={f("commission_type")} className={inputCls}>
                <option value="PERCENT">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₦)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Rate {form.commission_type === "PERCENT" ? "(%)" : "(₦)"}
              </label>
              <input type="number" value={form.commission_rate} onChange={f("commission_rate")} min="0" step="0.01" className={inputCls} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors">Cancel</button>
          <button onClick={handle} disabled={saving} className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEdit ? "Save Changes" : "Add Rep"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Commission Settings Modal ────────────────────────────────────────────────
function CommissionSettingsModal({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ commission_starter_pct: "5.00", commission_senior_pct: "7.50", commission_legend_pct: "10.00" });

  const load = async () => {
    try {
      const s = await api.workspaces.getSettings();
      setSettings(s);
      setForm({
        commission_starter_pct: s.commission_starter_pct ?? "5.00",
        commission_senior_pct: s.commission_senior_pct ?? "7.50",
        commission_legend_pct: s.commission_legend_pct ?? "10.00",
      });
    } catch { /* use defaults */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.workspaces.updateSettings(form);
      toast.success("Commission settings saved.");
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save settings.");
    } finally { setSaving(false); }
  };

  const inputCls = "w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="font-semibold text-neutral-900">Commission Settings</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-md"><X className="w-4 h-4" /></button>
        </div>
        {loading ? (
          <div className="px-6 py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>
        ) : (
          <div className="px-6 py-5 space-y-5">
            <p className="text-sm text-neutral-500">Set the default commission percentage for each sales rep tier. These apply to all properties unless overridden per-property.</p>
            {[
              { key: "commission_starter_pct", label: "Starter Tier", badge: "bg-neutral-100 text-neutral-700" },
              { key: "commission_senior_pct",  label: "Senior Tier",  badge: "bg-blue-100 text-blue-700" },
              { key: "commission_legend_pct",  label: "Legend Tier",  badge: "bg-purple-100 text-purple-700" },
            ].map(({ key, label, badge }) => (
              <div key={key} className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge} w-28 text-center`}>{label}</span>
                <div className="flex-1 relative">
                  <input
                    type="number" min="0" max="100" step="0.01"
                    value={(form as any)[key]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    className={inputCls + " pr-8"}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">%</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors">Cancel</button>
          <button onClick={save} disabled={saving || loading} className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Invite Links Modal ───────────────────────────────────────────────────────
function InviteLinksModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("SALES_REP");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ token: string; email: string } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const inviteLink = sent ? `${window.location.origin}/auth/sign-up?invite=${sent.token}` : "";

  const send = async () => {
    setError("");
    if (!email.trim()) return setError("Email is required.");
    setSending(true);
    try {
      const result = await api.workspaces.invite({ email, role });
      setSent({ token: result.token, email });
      toast.success(`Invite sent to ${email}`);
    } catch (e: any) {
      setError(e.message ?? "Failed to send invite.");
    } finally { setSending(false); }
  };

  const copy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputCls = "w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="font-semibold text-neutral-900">Send Invite Link</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-md"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
          {sent ? (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-sm text-emerald-700">
                Invite sent to <strong>{sent.email}</strong>. Share the link below:
              </div>
              <div className="flex items-center gap-2 p-3 bg-neutral-50 border border-neutral-200 rounded-md">
                <span className="text-xs font-mono text-neutral-600 flex-1 truncate">{inviteLink}</span>
                <button onClick={copy} className="p-1.5 hover:bg-neutral-200 rounded transition-colors shrink-0">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-neutral-500" />}
                </button>
              </div>
              <button onClick={() => { setSent(null); setEmail(""); }} className="text-sm text-emerald-600 hover:underline">Send another invite</button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Email Address *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="colleague@example.com" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Role</label>
                <select value={role} onChange={e => setRole(e.target.value)} className={inputCls}>
                  <option value="SALES_REP">Sales Rep</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <p className="text-xs text-neutral-400">The invitee will receive an email with a link to join your workspace. The invite expires in 7 days.</p>
            </>
          )}
        </div>
        {!sent && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors">Cancel</button>
            <button onClick={send} disabled={sending} className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">
              {sending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <Link2 className="w-3.5 h-3.5" />Send Invite
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function SalesReps() {
  usePageTitle("Sales Representatives");
  const [reps, setReps] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editRep, setEditRep] = useState<any | null>(null);
  const [showCommission, setShowCommission] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [list, performance] = await Promise.all([
        api.salesReps.list(),
        api.salesReps.getStats(),
      ]);
      setReps(list);
      setStats(performance);
    } catch (err) {
      console.error("Failed to load sales reps:", err);
    } finally {
      setLoading(false);
    }
  };

  usePolling(fetchData, 30_000);

  const handleDelete = async (rep: any) => {
    if (!confirm(`Delete ${rep.name}? This cannot be undone.`)) return;
    setDeletingId(rep.id);
    try {
      await api.salesReps.delete(rep.id);
      toast.success("Sales rep deleted.");
      fetchData();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to delete.");
    } finally {
      setDeletingId(null);
    }
  };

  const fmt = (v: number | string) => `₦${Number(v).toLocaleString("en-NG")}`;
  const safeStats = stats || {};

  return (
    <div className="min-h-screen bg-neutral-50">
      {showAdd && <RepModal onClose={() => setShowAdd(false)} onSaved={fetchData} />}
      {editRep && <RepModal rep={editRep} onClose={() => setEditRep(null)} onSaved={fetchData} />}
      {showCommission && <CommissionSettingsModal onClose={() => setShowCommission(false)} />}
      {showInvite && <InviteLinksModal onClose={() => setShowInvite(false)} />}

      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Sales Representatives</h1>
              <p className="text-sm text-neutral-500 mt-1">Sales agent and commission tracking</p>
            </div>
            {loading && <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowInvite(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 transition-colors shadow-sm text-sm font-medium">
              <Link2 className="w-4 h-4" />Invite via Link
            </button>
            <button onClick={() => setShowCommission(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 transition-colors shadow-sm text-sm font-medium">
              <Settings className="w-4 h-4" />Commission Settings
            </button>
            <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors shadow-sm text-sm font-medium">
              <Plus className="w-4 h-4" />Add Rep
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {loading && reps.length === 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[0,1,2].map(i => (
                <div key={i} className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm">
                  <div className="space-y-2"><Skeleton className="h-3.5 w-28 bg-neutral-100" /><Skeleton className="h-8 w-36 bg-neutral-100" /></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm">
              <div className="divide-y divide-neutral-200">
                {[0,1,2,3,4].map(i => (
                  <div key={i} className="px-6 py-4 flex items-center gap-4">
                    <div className="space-y-1.5 flex-1"><Skeleton className="h-4 w-36 bg-neutral-100" /><Skeleton className="h-3 w-24 bg-neutral-100" /></div>
                    <Skeleton className="h-5 w-16 rounded-full bg-neutral-100" />
                    <Skeleton className="h-4 w-20 bg-neutral-100" />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                { label: "Pending to Earn", value: fmt(safeStats.pending_payout ?? safeStats.pendingPayouts ?? 0), sub: "From unpaid referral payments", color: "amber" },
                { label: "Total Earned", value: fmt((safeStats.total_paid ?? safeStats.payouts ?? 0)), sub: "Paid commissions", color: "emerald" },
                { label: "Earning Potential", value: fmt(safeStats.total_potential ?? safeStats.potentialReferralPayments ?? 0), sub: "If all referral payments made", color: "blue" },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-neutral-500 mb-1">{label}</div>
                      <div className="text-3xl font-semibold text-neutral-900">{value}</div>
                      <div className={`text-xs text-${color}-600 mt-2`}>{sub}</div>
                    </div>
                    <div className={`w-10 h-10 bg-${color}-50 rounded-lg flex items-center justify-center`}>
                      <TrendingUp className={`w-5 h-5 text-${color}-600`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sales Reps Table */}
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
                <h3 className="font-medium text-neutral-900">All Sales Representatives</h3>
                <span className="text-xs text-neutral-400 font-medium">{reps.length} reps</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      {["Sales Rep", "Tier", "Referral Code", "Commission", "Total Earned", "Pending", "Actions"].map(h => (
                        <th key={h} className={`px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider ${h === "Actions" ? "text-right" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {reps.map(rep => (
                      <tr key={rep.id} className="hover:bg-neutral-50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-neutral-900 group-hover:text-emerald-600 transition-colors">{rep.name}</div>
                          <div className="text-sm text-neutral-500">{rep.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={TIER_COLORS[rep.tier] ?? "bg-neutral-100 text-neutral-700 hover:bg-neutral-100"}>{rep.tier}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded">{rep.referral_code ?? "N/A"}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                          {rep.commission_rate}{rep.commission_type === "PERCENT" ? "%" : " ₦"} {rep.commission_type === "PERCENT" ? "" : "fixed"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-neutral-900">{fmt(rep.total_earned ?? 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-amber-600">{fmt(rep.total_pending ?? 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setEditRep(rep)} className="p-2 hover:bg-neutral-100 rounded-md transition-colors" title="Edit">
                              <Settings className="w-4 h-4 text-neutral-500" />
                            </button>
                            <button
                              onClick={() => handleDelete(rep)}
                              disabled={deletingId === rep.id}
                              className="p-2 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingId === rep.id ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4 text-red-400" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {reps.length === 0 && !loading && (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center">
                          <div className="text-neutral-400 text-sm mb-3">No sales representatives yet.</div>
                          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 transition-colors">
                            <Plus className="w-4 h-4" />Add First Rep
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tier Cards */}
            <div className="mt-8 bg-white rounded-lg border border-neutral-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-neutral-900">Sales Rep Tiers</h3>
                <button onClick={() => setShowCommission(true)} className="text-sm text-emerald-600 hover:underline">Edit commission rates →</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { tier: "STARTER", badge: "bg-neutral-100 text-neutral-700", desc: "Entry-level sales representatives" },
                  { tier: "SENIOR",  badge: "bg-blue-100 text-blue-700",     desc: "Experienced sales representatives" },
                  { tier: "LEGEND",  badge: "bg-purple-100 text-purple-700", desc: "Top-tier sales representatives" },
                ].map(({ tier, badge, desc }) => (
                  <div key={tier} className="p-4 border border-neutral-200 rounded-md hover:border-neutral-300 transition-colors">
                    <Badge className={`${badge} mb-2`}>{tier.charAt(0) + tier.slice(1).toLowerCase()}</Badge>
                    <p className="text-sm text-neutral-600">{desc}</p>
                    <div className="mt-3">
                      <button onClick={() => setShowInvite(true)} className="text-xs text-emerald-600 hover:underline flex items-center gap-1">
                        <Link2 className="w-3 h-3" />Send invite link
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

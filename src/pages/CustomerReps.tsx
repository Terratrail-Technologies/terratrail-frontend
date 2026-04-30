import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Users, ShoppingBag, AlertCircle, Search,
  Copy, Check, UserPlus, X, TrendingUp, Building2, Eye,
  UserX, MoreHorizontal,
} from "lucide-react";
import { api } from "../services/api";
import { useWorkspaceRole } from "../hooks/useWorkspaceRole";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Member {
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n >= 1_000_000
    ? `₦${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `₦${(n / 1_000).toFixed(0)}K`
    : `₦${n.toLocaleString("en-NG")}`;

// ── Summary Card ──────────────────────────────────────────────────────────────

function SummaryCard({
  label, value, icon: Icon, color, sub,
}: {
  label: string; value: number | string; icon: React.ElementType;
  color: "emerald" | "blue" | "violet" | "amber"; sub?: string;
}) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue:    "bg-blue-50 text-blue-600",
    violet:  "bg-violet-50 text-violet-600",
    amber:   "bg-amber-50 text-amber-600",
  };
  const accents = {
    emerald: "bg-emerald-500",
    blue:    "bg-blue-500",
    violet:  "bg-violet-500",
    amber:   "bg-amber-500",
  };
  return (
    <div className="relative bg-white rounded-xl border border-neutral-100 p-4 flex items-start gap-3 shadow-sm hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow duration-200 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accents[color]}`} />
      <div className={`p-2.5 rounded-xl shrink-0 ${colors[color]}`}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">{label}</p>
        <p className="text-[22px] font-bold text-neutral-900 leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-neutral-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Invite Modal ──────────────────────────────────────────────────────────────

function InviteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.workspaces.invite({ email, role: "SALES_REP" });
      if (res?.token) {
        setInviteLink(`${window.location.origin}/accept-invite/${res.token}`);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message ?? "Failed to send invite");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <div>
            <h3 className="text-[15px] font-bold text-neutral-900">Invite Customer Rep</h3>
            <p className="text-[12px] text-neutral-500 mt-0.5">
              {inviteLink ? "Invitation sent" : "Send an invitation email"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400">
            <X className="size-4" />
          </button>
        </div>

        {inviteLink ? (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
              <Check className="size-4 text-emerald-600 shrink-0" />
              <p className="text-[12px] text-emerald-800 font-medium">
                Invitation sent to <strong>{email}</strong>
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-neutral-500 mb-1.5">Invite link (share if email doesn't arrive)</p>
              <div className="flex items-center gap-2">
                <input readOnly value={inviteLink}
                  className="flex-1 px-3 py-2 text-[11px] border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-600 truncate" />
                <button onClick={copyLink}
                  className="shrink-0 px-3 py-2 bg-emerald-600 text-white text-[12px] font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5">
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <button onClick={onClose}
              className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[13px] font-semibold rounded-lg transition-colors">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Email Address *</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="rep@example.com"
                className="w-full px-3 py-2.5 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {error && <p className="text-[12px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[13px] font-semibold rounded-lg transition-colors">
              {loading ? "Sending…" : "Send Invitation"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Row Actions Menu ──────────────────────────────────────────────────────────

function RowActions({ onView }: { member?: Member; onView: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)}
        className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700">
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-7 z-20 w-40 bg-white rounded-xl shadow-lg border border-neutral-100 py-1 text-[13px]">
            <button onClick={() => { setOpen(false); onView(); }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 text-neutral-700">
              <Eye className="size-3.5" /> View Profile
            </button>
            <button onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600">
              <UserX className="size-3.5" /> Deactivate
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CustomerReps() {
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useWorkspaceRole();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const isAdmin = role === "OWNER" || role === "ADMIN";

  const loadMembers = () => {
    setLoading(true);
    api.workspaces.listMembers()
      .then((data) => {
        const list = (Array.isArray(data) ? data : []) as Member[];
        setMembers(list.filter((m) => m.role === "SALES_REP"));
      })
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!roleLoading && isAdmin) loadMembers();
    else if (!roleLoading) setLoading(false);
  }, [roleLoading, isAdmin]);

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email).then(() => {
      setCopied(email);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  // Summary stats
  const totalReps      = members.length;
  const activeReps     = members.filter((m) => m.is_active).length;
  const totalCustomers = members.reduce((s, m) => s + m.managed_customers_count, 0);
  const totalProps     = members.reduce((s, m) => s + (m.properties_count || 0), 0);

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.user_name.toLowerCase().includes(q) || m.user_email.toLowerCase().includes(q);
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && m.is_active) ||
      (statusFilter === "INACTIVE" && !m.is_active);
    return matchSearch && matchStatus;
  });

  if (!roleLoading && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="size-8 text-red-400" />
        <p className="text-[14px] font-semibold text-neutral-700">Access Denied</p>
        <p className="text-[13px] text-neutral-400">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)] w-full">
      {showInvite && (
        <InviteModal onClose={() => setShowInvite(false)} onSuccess={loadMembers} />
      )}

      {/* Page header */}
      <div className="bg-white border-b border-neutral-100 px-4 sm:px-6 lg:px-8 py-4 md:py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[17px] font-semibold text-neutral-900 tracking-tight">Customer Reps</h1>
            <p className="text-[12px] text-neutral-400 mt-0.5 hidden sm:block">Manage your team and their assigned properties</p>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold rounded-lg transition-colors shadow-sm"
          >
            <UserPlus className="size-3.5" />
            <span className="hidden sm:inline">Invite Rep</span>
            <span className="sm:hidden">Invite</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-5 flex-1">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label="Total Reps"          value={totalReps}    icon={Users}      color="emerald" sub={`${activeReps} active`} />
          <SummaryCard label="Properties Managed"  value={totalProps}   icon={Building2}  color="blue"    />
          <SummaryCard label="Customers Managed"   value={totalCustomers} icon={ShoppingBag} color="violet" />
          <SummaryCard label="Active Subscriptions"
            value={members.reduce((s, m) => s + (m.active_subscriptions_count || 0), 0)}
            icon={TrendingUp} color="amber" />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 bg-white"
            />
          </div>
          <div className="flex gap-1">
            {(["ALL", "ACTIVE", "INACTIVE"] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 text-[12px] font-semibold rounded-lg transition-colors ${statusFilter === s ? "bg-emerald-600 text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:border-emerald-300"}`}>
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

      {/* Mobile cards (< md) */}
      {!loading && filtered.length > 0 && (
        <div className="md:hidden space-y-3">
          {filtered.map((m) => {
            const initials = m.user_name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
            return (
              <div key={m.id} className="bg-white rounded-xl border border-neutral-100 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[12px] font-bold text-white shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold text-neutral-900 truncate">{m.user_name}</div>
                    <div className="text-[11.5px] text-neutral-400 truncate">{m.user_email}</div>
                  </div>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${m.is_active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>
                    {m.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3 text-[12px]">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Properties</div>
                    <div className="text-neutral-800 font-semibold">{m.properties_count ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Customers</div>
                    <div className="text-neutral-800 font-semibold">{m.managed_customers_count}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Active Subs</div>
                    <div className="text-neutral-800 font-semibold">{m.active_subscriptions_count ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Revenue</div>
                    <div className="text-emerald-700 font-semibold">{fmt(m.total_revenue_managed ?? 0)}</div>
                  </div>
                </div>
                <div className="flex gap-2 pt-3 border-t border-neutral-50">
                  <button onClick={() => navigate(`/customer-reps/${m.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-neutral-200 text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
                    <Eye className="size-3.5" /> View Profile
                  </button>
                </div>
              </div>
            );
          })}
          <p className="text-[11px] text-neutral-400 text-center py-1">
            {filtered.length} rep{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Desktop table (≥ md) */}
      <div className="hidden md:block bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Phone</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Properties</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Customers</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Active Subs</th>
                <th className="text-right px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Revenue</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-neutral-100" /><div className="h-3.5 bg-neutral-100 rounded w-28" /></div></td>
                    <td className="px-4 py-3"><div className="h-3 bg-neutral-100 rounded w-36" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-neutral-100 rounded w-24" /></td>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-4 py-3 text-center"><div className="h-3 bg-neutral-100 rounded w-8 mx-auto" /></td>
                    ))}
                    <td className="px-4 py-3 text-center"><div className="h-5 bg-neutral-100 rounded-full w-14 mx-auto" /></td>
                    <td className="px-4 py-3" />
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-neutral-400 text-[13px]">
                    {search || statusFilter !== "ALL" ? "No reps match your filters." : "No customer representatives yet. Invite your first rep."}
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const initials = m.user_name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
                  return (
                    <tr key={m.id} className="hover:bg-neutral-50 transition-colors">
                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                            {initials}
                          </div>
                          <button
                            onClick={() => navigate(`/customer-reps/${m.id}`)}
                            className="font-semibold text-neutral-800 hover:text-emerald-700 truncate max-w-[140px] text-left transition-colors">
                            {m.user_name}
                          </button>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-neutral-600 truncate max-w-[160px]">{m.user_email}</span>
                          <button onClick={() => copyEmail(m.user_email)}
                            className="p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 shrink-0">
                            {copied === m.user_email ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                          </button>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3 text-neutral-500">{m.user_phone || "—"}</td>

                      {/* Properties */}
                      <td className="px-4 py-3 text-center font-semibold text-neutral-700">{m.properties_count ?? 0}</td>

                      {/* Customers */}
                      <td className="px-4 py-3 text-center font-semibold text-neutral-700">{m.managed_customers_count}</td>

                      {/* Active subs */}
                      <td className="px-4 py-3 text-center font-semibold text-neutral-700">{m.active_subscriptions_count ?? 0}</td>

                      {/* Revenue */}
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                        {fmt(m.total_revenue_managed ?? 0)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${m.is_active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>
                          {m.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <RowActions member={m} onView={() => navigate(`/customer-reps/${m.id}`)} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t border-neutral-50 bg-neutral-50">
            <span className="text-[11px] text-neutral-400">{filtered.length} rep{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}


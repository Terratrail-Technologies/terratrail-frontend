import { useState, useEffect } from "react";
import { Users, UserCheck, ShoppingBag, AlertCircle, Search, Mail, Phone, Copy, Check, MoreHorizontal, UserPlus, X } from "lucide-react";
import { api } from "../services/api";
import { useWorkspaceRole } from "../hooks/useWorkspaceRole";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Member {
  id: string;
  user: string;
  user_name: string;
  user_email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  managed_customers_count: number;
  managed_subscriptions_count: number;
}

// ── Summary Card ──────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: "emerald" | "blue" | "violet" | "amber";
  sub?: string;
}) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue:    "bg-blue-50 text-blue-600",
    violet:  "bg-violet-50 text-violet-600",
    amber:   "bg-amber-50 text-amber-600",
  };
  return (
    <div className="bg-white rounded-xl border border-neutral-100 p-4 flex items-start gap-3 shadow-sm">
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.workspaces.invite({ email, role: "SALES_REP" });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Failed to send invite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <div>
            <h3 className="text-[15px] font-bold text-neutral-900">Invite Sales Rep</h3>
            <p className="text-[12px] text-neutral-500 mt-0.5">Send an invitation email</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400">
            <X className="size-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Email Address *</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="rep@example.com"
              className="w-full px-3 py-2.5 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          {error && (
            <p className="text-[12px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[13px] font-semibold rounded-lg transition-colors">
            {loading ? "Sending…" : "Send Invitation"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CustomerReps() {
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
        const list = Array.isArray(data) ? data : [];
        // Filter to sales reps only
        setMembers(list.filter((m: Member) => m.role === "SALES_REP"));
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
  const totalReps = members.length;
  const activeReps = members.filter((m) => m.is_active).length;
  const totalCustomers = members.reduce((s, m) => s + m.managed_customers_count, 0);
  const totalSubscriptions = members.reduce((s, m) => s + m.managed_subscriptions_count, 0);

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
    <div className="p-6 space-y-6">
      {showInvite && (
        <InviteModal onClose={() => setShowInvite(false)} onSuccess={loadMembers} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-neutral-900">Customer Representatives</h1>
          <p className="text-[13px] text-neutral-500 mt-0.5">Manage your sales reps and their assigned customers</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold rounded-lg transition-colors shadow-sm"
        >
          <UserPlus className="size-3.5" />
          Invite Rep
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Reps"          value={totalReps}          icon={Users}      color="emerald" />
        <SummaryCard label="Active"               value={activeReps}         icon={UserCheck}  color="blue"    sub={`${totalReps - activeReps} inactive`} />
        <SummaryCard label="Customers Managed"    value={totalCustomers}     icon={ShoppingBag} color="violet" />
        <SummaryCard label="Subscriptions Managed" value={totalSubscriptions} icon={UserCheck}  color="amber"  />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Email</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Customers</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Subscriptions</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Status</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-neutral-100" /><div className="h-3.5 bg-neutral-100 rounded w-28" /></div></td>
                    <td className="px-4 py-3"><div className="h-3 bg-neutral-100 rounded w-36" /></td>
                    <td className="px-4 py-3 text-center"><div className="h-3 bg-neutral-100 rounded w-8 mx-auto" /></td>
                    <td className="px-4 py-3 text-center"><div className="h-3 bg-neutral-100 rounded w-8 mx-auto" /></td>
                    <td className="px-4 py-3 text-center"><div className="h-5 bg-neutral-100 rounded-full w-14 mx-auto" /></td>
                    <td className="px-4 py-3 text-center"><div className="h-3 bg-neutral-100 rounded w-16 mx-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-neutral-400 text-[13px]">
                    {search || statusFilter !== "ALL" ? "No reps match your filters." : "No customer representatives yet. Invite your first rep."}
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const initials = m.user_name
                    .split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
                  const joined = new Date(m.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

                  return (
                    <tr key={m.id} className="hover:bg-neutral-50 transition-colors">
                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                            {initials}
                          </div>
                          <span className="font-semibold text-neutral-800 truncate max-w-[140px]">{m.user_name}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-neutral-600 truncate max-w-[180px]">{m.user_email}</span>
                          <button onClick={() => copyEmail(m.user_email)}
                            className="p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 shrink-0">
                            {copied === m.user_email ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                          </button>
                        </div>
                      </td>

                      {/* Customers */}
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-neutral-700">{m.managed_customers_count}</span>
                      </td>

                      {/* Subscriptions */}
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-neutral-700">{m.managed_subscriptions_count}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${m.is_active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>
                          {m.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3 text-center text-neutral-500">{joined}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t border-neutral-50 bg-neutral-50 flex items-center justify-between">
            <span className="text-[11px] text-neutral-400">{filtered.length} rep{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>
    </div>
  );
}

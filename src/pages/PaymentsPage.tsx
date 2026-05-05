import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  DollarSign, Clock, XCircle, TrendingUp, Search, CheckCircle2,
  ExternalLink, Loader2, ChevronLeft, ChevronRight,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { api } from "../services/api";
import { usePolling } from "../hooks/usePolling";
import { usePageTitle } from "../hooks/usePageTitle";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";

const fmt = (v: any) => `₦${Number(v).toLocaleString("en-NG")}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: "emerald" | "amber" | "red" | "violet";
}) {
  const c = {
    emerald: { bg: "bg-emerald-500", icon: "bg-emerald-50 text-emerald-600" },
    amber:   { bg: "bg-amber-500",   icon: "bg-amber-50 text-amber-600" },
    red:     { bg: "bg-red-500",     icon: "bg-red-50 text-red-600" },
    violet:  { bg: "bg-violet-500",  icon: "bg-violet-50 text-violet-600" },
  }[color];
  return (
    <div className="relative bg-white rounded-xl border border-neutral-100 p-4 shadow-sm overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${c.bg}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold mb-1">{label}</p>
          <p className="text-2xl font-bold text-neutral-900">{value}</p>
          {sub && <p className="text-[11px] text-neutral-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-2 rounded-xl ${c.icon}`}><Icon className="size-4" /></div>
      </div>
    </div>
  );
}

function BarChart({ payments }: { payments: any[] }) {
  const now = new Date();
  const months: { label: string; approved: number; month: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const approved = payments
      .filter((p) => p.status === "APPROVED" && (p.created_at ?? "").startsWith(key))
      .reduce((s, p) => s + parseFloat(p.amount || "0"), 0);
    months.push({ label: MONTH_NAMES[d.getMonth()], approved, month: key });
  }
  const maxVal = Math.max(...months.map((m) => m.approved), 1);
  const w = 100 / 6;

  return (
    <div className="bg-white rounded-xl border border-neutral-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[13px] font-semibold text-neutral-800">Monthly Revenue</p>
          <p className="text-[11px] text-neutral-400">Last 6 months — approved payments</p>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-emerald-500 inline-block" />Approved</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-t-2 border-dashed border-amber-400 inline-block" />Projected</span>
        </div>
      </div>
      <svg viewBox="0 0 600 180" className="w-full" style={{ height: 180 }}>
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <g key={pct}>
            <line x1="40" y1={160 - pct * 140} x2="580" y2={160 - pct * 140}
              stroke="#f3f4f6" strokeWidth="1" />
            <text x="36" y={163 - pct * 140} textAnchor="end" fontSize="9" fill="#9ca3af">
              {pct === 0 ? "0" : `₦${((maxVal * pct) / 1e6).toFixed(1)}M`}
            </text>
          </g>
        ))}
        {months.map((m, i) => {
          const cx = 40 + (i + 0.5) * (540 / 6);
          const barH = (m.approved / maxVal) * 140;
          const projH = i === months.length - 1 ? Math.min(barH * 1.1, 140) : null;
          return (
            <g key={m.month}>
              <rect x={cx - 14} y={160 - barH} width="28" height={barH}
                rx="3" fill="#10b981" opacity="0.85" />
              {projH && (
                <rect x={cx - 14} y={160 - projH} width="28" height={projH - barH}
                  rx="3" fill="#f59e0b" opacity="0.3" />
              )}
              <text x={cx} y="175" textAnchor="middle" fontSize="10" fill="#6b7280">{m.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function PayStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING:  "bg-amber-100 text-amber-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold ${map[status] ?? "bg-neutral-100 text-neutral-500"}`}>
      {status}
    </span>
  );
}

const PER_PAGE = 20;

export function PaymentsPage() {
  usePageTitle("Payments");
  const navigate = useNavigate();
  const [payments, setPayments]         = useState<any[]>([]);
  const [commissions, setCommissions]   = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [filterTab, setFilterTab]       = useState<"ALL"|"PENDING"|"APPROVED"|"REJECTED">("ALL");
  const [page, setPage]                 = useState(1);
  const [rejectId, setRejectId]         = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [acting, setActing]             = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([api.payments.list(), api.commissions.list()]);
      setPayments(p);
      setCommissions(c);
    } catch { toast.error("Failed to load payments."); }
    finally { setLoading(false); }
  }, []);

  usePolling(load, 60_000);

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (p.customer_name ?? "").toLowerCase().includes(q) ||
      (p.transaction_reference ?? "").toLowerCase().includes(q);
    const matchTab = filterTab === "ALL" || p.status === filterTab;
    return matchSearch && matchTab;
  });

  const pageCount = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleApprove = async (id: string) => {
    setActing(id);
    try {
      await api.payments.approve(id);
      toast.success("Payment approved.");
      load();
    } catch (err: any) { toast.error(err.message ?? "Failed to approve."); }
    finally { setActing(null); }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) { toast.error("Provide a rejection reason."); return; }
    setActing(id);
    try {
      await api.payments.reject(id, rejectReason);
      toast.success("Payment rejected.");
      setRejectId(null); setRejectReason(""); load();
    } catch (err: any) { toast.error(err.message ?? "Failed to reject."); }
    finally { setActing(null); }
  };

  const totalRevenue = payments.filter((p) => p.status === "APPROVED").reduce((s, p) => s + parseFloat(p.amount || "0"), 0);
  const pendingCount = payments.filter((p) => p.status === "PENDING").length;
  const rejectedCount = payments.filter((p) => p.status === "REJECTED").length;
  const commPaid = commissions.filter((c) => c.status === "PAID").reduce((s, c) => s + parseFloat(c.amount || "0"), 0);

  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)]">
      <div className="bg-white border-b border-neutral-100 px-4 sm:px-6 lg:px-8 py-4 md:py-5">
        <h1 className="text-[17px] font-semibold text-neutral-900">Payments</h1>
        <p className="text-[12px] text-neutral-400 mt-0.5">Financial overview and payment approvals</p>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-5 flex-1">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Revenue"     value={fmt(totalRevenue)} sub="Approved payments"    icon={DollarSign}  color="emerald" />
              <StatCard label="Pending Approvals" value={pendingCount}      sub="Awaiting review"      icon={Clock}       color="amber" />
              <StatCard label="Rejected"          value={rejectedCount}     sub="Declined payments"    icon={XCircle}     color="red" />
              <StatCard label="Commission Paid"   value={fmt(commPaid)}     sub="Paid to sales reps"   icon={TrendingUp}  color="violet" />
            </div>

            <BarChart payments={payments} />

            <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-neutral-50 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
                  {(["ALL","PENDING","APPROVED","REJECTED"] as const).map((f) => (
                    <button key={f} onClick={() => { setFilterTab(f); setPage(1); }}
                      className={`px-3 py-1 rounded-md text-[11.5px] font-semibold transition-all ${filterTab === f ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}>
                      {f === "ALL" ? `All (${payments.length})` : f}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                  <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search customer…"
                    className="h-9 pl-9 pr-3 border border-neutral-200 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-400 w-56" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-50 bg-neutral-50/60">
                      {["Date","Customer","Installment","Amount","Status","Receipt","Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((p) => (
                      <>
                        <tr key={p.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                          <td className="px-4 py-3 text-[12.5px] text-neutral-600 whitespace-nowrap">{fmtDate(p.created_at ?? p.payment_date)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className="text-[12.5px] font-semibold text-neutral-800">{p.customer_name ?? "—"}</p>
                          </td>
                          <td className="px-4 py-3 text-[12px] text-neutral-500 whitespace-nowrap">#{p.installment_number ?? "—"}</td>
                          <td className="px-4 py-3 text-[13px] font-semibold text-neutral-800 whitespace-nowrap">{fmt(p.amount)}</td>
                          <td className="px-4 py-3 whitespace-nowrap"><PayStatusBadge status={p.status} /></td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {(p.receipt_url || p.receipt_file) ? (
                              <a href={p.receipt_url || p.receipt_file} target="_blank" rel="noopener noreferrer"
                                className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-[12px]">
                                <ExternalLink className="size-3.5" /> View
                              </a>
                            ) : <span className="text-neutral-300 text-[12px]">—</span>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {p.status === "PENDING" && (
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => handleApprove(p.id)} disabled={acting === p.id}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11.5px] font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-50">
                                  {acting === p.id ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />} Approve
                                </button>
                                <button onClick={() => setRejectId(rejectId === p.id ? null : p.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-[11.5px] font-semibold hover:bg-red-100 transition-colors">
                                  <XCircle className="size-3" /> Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                        {rejectId === p.id && (
                          <tr key={`${p.id}-reject`} className="bg-red-50/40">
                            <td colSpan={7} className="px-4 py-3">
                              <div className="flex items-end gap-2">
                                <div className="flex-1">
                                  <p className="text-[11.5px] font-medium text-red-700 mb-1">Rejection reason</p>
                                  <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={2}
                                    className="w-full border border-red-200 rounded-lg px-3 py-2 text-[12.5px] focus:outline-none focus:ring-1 focus:ring-red-400 resize-none bg-white"
                                    placeholder="Enter reason for rejection…" />
                                </div>
                                <button onClick={() => handleReject(p.id)} disabled={acting === p.id}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 text-white text-[12px] font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 mb-0.5">
                                  {acting === p.id ? <Loader2 className="size-3.5 animate-spin" /> : null} Confirm Reject
                                </button>
                                <button onClick={() => { setRejectId(null); setRejectReason(""); }}
                                  className="px-3 py-2 rounded-lg border border-neutral-200 text-[12px] text-neutral-600 hover:bg-neutral-50 mb-0.5">
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                    {paginated.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-10 text-center text-[13px] text-neutral-400">No payments found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {pageCount > 1 && (
                <div className="px-5 py-3 border-t border-neutral-50 flex items-center justify-between">
                  <p className="text-[11px] text-neutral-400">{filtered.length} payments · page {page} of {pageCount}</p>
                  <div className="flex items-center gap-1">
                    <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40">
                      <ChevronLeft className="size-3.5" />
                    </button>
                    <button disabled={page === pageCount} onClick={() => setPage((p) => p + 1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40">
                      <ChevronRight className="size-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

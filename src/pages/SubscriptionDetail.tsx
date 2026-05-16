import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ArrowLeft,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Upload,
  ExternalLink,
  X,
  User,
  Calendar,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { api } from "../services/api";
import { usePageTitle } from "../hooks/usePageTitle";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number | string | null | undefined) =>
  n == null || n === "" ? "—" : `₦${Number(n).toLocaleString("en-NG")}`;

const fmtDate = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
    : "—";

// ─── Status badge helpers ──────────────────────────────────────────────────────

function SubStatusBadge({ status }: { status?: string }) {
  const upper = (status ?? "").toUpperCase();
  const map: Record<string, { cls: string; label: string }> = {
    ACTIVE:     { cls: "bg-green-50 text-green-700 border border-green-100",    label: "Active" },
    PENDING:    { cls: "bg-neutral-100 text-neutral-500 border border-neutral-200", label: "Pending" },
    COMPLETED:  { cls: "bg-blue-50 text-blue-700 border border-blue-100",       label: "Completed" },
    CANCELLED:  { cls: "bg-red-50 text-red-600 border border-red-100",          label: "Cancelled" },
    DEFAULTED:  { cls: "bg-orange-50 text-orange-600 border border-orange-100", label: "Defaulted" },
    DEFAULTING: { cls: "bg-amber-50 text-amber-600 border border-amber-100",    label: "Defaulting" },
  };
  const cfg = map[upper] ?? { cls: "bg-neutral-100 text-neutral-500 border border-neutral-200", label: upper || "—" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function InstStatusBadge({ status }: { status?: string }) {
  const upper = (status ?? "").toUpperCase();
  const map: Record<string, { cls: string; label: string }> = {
    PAID:           { cls: "bg-green-100 text-green-700",    label: "Paid" },
    PARTIALLY_PAID: { cls: "bg-orange-100 text-orange-700",  label: "Partially Paid" },
    OVERDUE:        { cls: "bg-red-100 text-red-700",        label: "Overdue" },
    PENDING:        { cls: "bg-neutral-100 text-neutral-500",label: "Pending" },
    UPCOMING:       { cls: "bg-neutral-100 text-neutral-500",label: "Upcoming" },
    DUE:            { cls: "bg-neutral-100 text-neutral-500",label: "Due" },
  };
  const cfg = map[upper] ?? { cls: "bg-neutral-100 text-neutral-500", label: upper || "—" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ─── Summary Info Card ────────────────────────────────────────────────────────

function InfoCard({ label, value, highlight = false }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${highlight ? "bg-[#0E2C72]/5 border-[#0E2C72]/15" : "bg-white border-neutral-100"} shadow-sm`}>
      <p className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wide">{label}</p>
      <div className={`text-[15px] font-bold mt-0.5 ${highlight ? "text-[#0E2C72]" : "text-neutral-900"}`}>{value}</div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct ?? 0));
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] text-neutral-500">Payment Progress</span>
        <span className="text-[12px] font-semibold text-[#0E2C72]">{Math.round(clamped)}%</span>
      </div>
      <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full bg-[#1a3d8f] rounded-full"
        />
      </div>
    </div>
  );
}

// ─── Upload Receipt Modal ──────────────────────────────────────────────────────

interface UploadReceiptModalProps {
  installment: any;
  mode: "upload" | "balance";
  onClose: () => void;
  onRecorded: () => void;
}

function UploadReceiptModal({ installment, mode, onClose, onRecorded }: UploadReceiptModalProps) {
  const [amount, setAmount]   = useState(
    mode === "balance"
      ? String(Number(installment.amount ?? 0) - Number(installment.amount_paid ?? 0))
      : String(installment.amount ?? "")
  );
  const [date, setDate]       = useState(new Date().toISOString().split("T")[0]);
  const [file, setFile]       = useState<File | null>(null);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!amount || Number(amount) <= 0) { setError("Enter a valid amount."); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("installment_id", installment.id);
      fd.append("amount", amount);
      fd.append("payment_date", date);
      if (file) fd.append("receipt_file", file);
      await api.payments.record(fd);
      toast.success("Payment recorded — pending approval.");
      onRecorded();
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Failed to record payment.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-neutral-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]/30 focus:border-[#2a52a8] bg-white transition-colors";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl max-w-sm w-full shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <h3 className="text-[15px] font-semibold text-neutral-900">
              {mode === "balance" ? "Upload Balance Receipt" : "Upload Receipt"}
            </h3>
            <p className="text-[12px] text-neutral-400 mt-0.5">
              Installment #{installment.installment_number} · {fmtDate(installment.due_date)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-[12px]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{error}
            </div>
          )}
          <div>
            <label className="block text-[12px] font-medium text-neutral-700 mb-1.5">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 50000"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-neutral-700 mb-1.5">Payment Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-neutral-700 mb-1.5">
              Receipt File <span className="text-neutral-400 text-[11px] font-normal">(optional)</span>
            </label>
            <label className="block w-full border-2 border-dashed border-neutral-200 rounded-lg p-4 text-center cursor-pointer hover:border-[#2a52a8] transition-colors">
              <Upload className="w-4 h-4 mx-auto mb-1 text-neutral-400" />
              <span className="text-[12px] text-neutral-500">
                {file ? file.name : "Click to upload image or PDF"}
              </span>
              <input type="file" className="hidden" accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </div>
        <div className="flex gap-2.5 px-6 pb-6 pt-4 border-t border-neutral-100">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-neutral-200 text-neutral-700 rounded-lg text-[13px] font-medium hover:bg-neutral-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 px-4 py-2.5 bg-[#0E2C72] text-white rounded-lg text-[13px] font-medium hover:bg-[#0a2260] disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : "Submit Payment"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Installment Table Row ────────────────────────────────────────────────────

function InstallmentRow({ inst, index, payments }: {
  inst: any;
  index: number;
  payments: any[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [uploadModal, setUploadModal] = useState<"upload" | "balance" | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const upper = (inst.status ?? "").toUpperCase();
  const isPaid = upper === "PAID";
  const isPartiallyPaid = upper === "PARTIALLY_PAID";
  const isActionable = ["PENDING", "OVERDUE", "DUE", "UPCOMING"].includes(upper);

  // Find associated payments for this installment
  const instPayments = payments.filter((p) => p.installment === inst.id || String(p.installment_number) === String(inst.installment_number));

  return (
    <>
      <tr className="border-b border-neutral-50 hover:bg-neutral-50/40 transition-colors">
        {/* S/N */}
        <td className="px-4 py-3 text-[12px] text-neutral-400 font-mono">{index + 1}</td>
        {/* Due Date */}
        <td className="px-4 py-3 text-[12.5px] text-neutral-600 whitespace-nowrap">{fmtDate(inst.due_date)}</td>
        {/* Scheduled Amount */}
        <td className="px-4 py-3 text-[12.5px] font-semibold text-neutral-800 whitespace-nowrap">{fmt(inst.amount)}</td>
        {/* Amount Paid */}
        <td className="px-4 py-3 text-[12.5px] font-semibold text-[#0E2C72] whitespace-nowrap">
          {fmt(inst.amount_paid ?? 0)}
        </td>
        {/* Status */}
        <td className="px-4 py-3">
          <InstStatusBadge status={inst.status} />
        </td>
        {/* Paid Date */}
        <td className="px-4 py-3 text-[12px] text-neutral-500 whitespace-nowrap">
          {inst.paid_date ? fmtDate(inst.paid_date) : "—"}
        </td>
        {/* Action */}
        <td className="px-4 py-3 whitespace-nowrap">
          {isActionable && (
            <button
              onClick={() => setUploadModal("upload")}
              className="px-2.5 py-1.5 rounded-lg border border-[#0E2C72]/30 text-[#0E2C72] text-[11.5px] font-medium hover:bg-[#0E2C72]/6 transition-colors flex items-center gap-1"
            >
              <Upload className="w-3 h-3" /> Upload Receipt
            </button>
          )}
          {isPartiallyPaid && (
            <button
              onClick={() => setUploadModal("balance")}
              className="px-2.5 py-1.5 rounded-lg border border-amber-300 text-amber-700 text-[11.5px] font-medium hover:bg-amber-50 transition-colors flex items-center gap-1"
            >
              <Upload className="w-3 h-3" /> Upload Balance
            </button>
          )}
          {isPaid && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 transition-colors"
              title={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </td>
      </tr>

      {/* Expanded panel for PAID installments */}
      {isPaid && expanded && (
        <tr className="bg-[#0E2C72]/3 border-b border-neutral-100">
          <td colSpan={7} className="px-6 py-4">
            <div className="bg-white rounded-xl border border-neutral-100 p-4 shadow-sm">
              <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide mb-3">Payment Details</p>
              {instPayments.length === 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[10.5px] text-neutral-400 font-semibold uppercase tracking-wide">Amount Processed</p>
                    <p className="text-[13px] font-semibold text-neutral-800 mt-0.5">{fmt(inst.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[10.5px] text-neutral-400 font-semibold uppercase tracking-wide">Amount Paid</p>
                    <p className="text-[13px] font-semibold text-[#0E2C72] mt-0.5">{fmt(inst.amount_paid ?? inst.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[10.5px] text-neutral-400 font-semibold uppercase tracking-wide">Payment Date</p>
                    <p className="text-[13px] font-semibold text-neutral-800 mt-0.5">{fmtDate(inst.paid_date)}</p>
                  </div>
                  <div>
                    <p className="text-[10.5px] text-neutral-400 font-semibold uppercase tracking-wide">Actions</p>
                    <button className="mt-0.5 text-[12px] text-[#0E2C72] font-medium hover:text-[#0a2260] flex items-center gap-1 transition-colors">
                      <ExternalLink className="w-3 h-3" /> View Payment Receipt
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {instPayments.map((pay) => (
                    <div key={pay.id} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <p className="text-[10.5px] text-neutral-400 font-semibold uppercase tracking-wide">Amount Processed</p>
                        <p className="text-[13px] font-semibold text-neutral-800 mt-0.5">{fmt(inst.amount)}</p>
                      </div>
                      <div>
                        <p className="text-[10.5px] text-neutral-400 font-semibold uppercase tracking-wide">Amount Paid</p>
                        <p className="text-[13px] font-semibold text-[#0E2C72] mt-0.5">{fmt(pay.amount)}</p>
                      </div>
                      <div>
                        <p className="text-[10.5px] text-neutral-400 font-semibold uppercase tracking-wide">Payment Date</p>
                        <p className="text-[13px] font-semibold text-neutral-800 mt-0.5">{fmtDate(pay.payment_date)}</p>
                      </div>
                      <div>
                        <p className="text-[10.5px] text-neutral-400 font-semibold uppercase tracking-wide">Approved Date</p>
                        <p className="text-[13px] font-semibold text-neutral-800 mt-0.5">{fmtDate(pay.created_at)}</p>
                      </div>
                      <div className="col-span-2 sm:col-span-4 flex items-center gap-3 flex-wrap">
                        {(pay.receipt_url || pay.receipt_file) && (
                          <a
                            href={pay.receipt_url ?? pay.receipt_file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[12px] text-[#0E2C72] font-medium hover:text-[#0a2260] flex items-center gap-1 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" /> View Transaction Receipt
                          </a>
                        )}
                        <button className="text-[12px] text-neutral-500 font-medium hover:text-neutral-700 flex items-center gap-1 transition-colors border border-neutral-200 rounded-lg px-2.5 py-1 hover:bg-neutral-50">
                          <ExternalLink className="w-3 h-3" /> View Payment Receipt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}

      {/* Upload Receipt Modal */}
      {uploadModal && (
        <UploadReceiptModal
          installment={inst}
          mode={uploadModal}
          onClose={() => setUploadModal(null)}
          onRecorded={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SubscriptionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  usePageTitle("Subscription Detail");

  const [sub, setSub]                 = useState<any>(null);
  const [installments, setInstallments] = useState<any[]>([]);
  const [payments, setPayments]       = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [payRefresh, setPayRefresh]   = useState(0);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Fetch subscription detail (includes installments if nested)
      const subData = await api.subscriptions.get(id);
      setSub(subData);

      // Use nested installments if available, else fetch separately
      if (Array.isArray(subData.installments) && subData.installments.length > 0) {
        setInstallments(subData.installments);
      } else {
        const instData = await api.installments.list({ subscription: id });
        setInstallments(instData);
      }

      // Fetch payments
      const payData = await api.payments.list({ property: subData.property });
      setPayments(payData);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load subscription.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData, payRefresh]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-60px)] w-full">
        <div className="bg-white border-b border-neutral-100 px-4 sm:px-6 lg:px-8 py-4">
          <Skeleton className="h-5 w-40 bg-neutral-100" />
        </div>
        <div className="p-4 sm:p-6 lg:p-8 space-y-5">
          <Skeleton className="h-48 w-full rounded-xl bg-neutral-100" />
          <Skeleton className="h-24 w-full rounded-xl bg-neutral-100" />
          <Skeleton className="h-64 w-full rounded-xl bg-neutral-100" />
        </div>
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-60px)] p-8 text-center">
        <AlertCircle className="w-12 h-12 text-neutral-200 mb-4" />
        <h3 className="text-[15px] font-semibold text-neutral-700">Subscription not found</h3>
        <p className="text-[13px] text-neutral-400 mt-1.5">
          This subscription may have been deleted or doesn't exist.
        </p>
        <button
          onClick={() => navigate("/subscriptions")}
          className="mt-4 px-4 py-2 rounded-lg bg-[#0E2C72] text-white text-[13px] font-medium hover:bg-[#0a2260] transition-colors"
        >
          Back to Subscriptions
        </button>
      </div>
    );
  }

  const pct = sub.payment_completion_pct ?? 0;

  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)] w-full">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-neutral-100 px-4 sm:px-6 lg:px-8 py-4 md:py-5">
        <div className="flex items-center gap-3">
          <Link
            to="/subscriptions"
            className="flex items-center gap-1.5 text-[12.5px] text-neutral-500 hover:text-[#0E2C72] font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Subscriptions
          </Link>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* ── Overview Card ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.14 }}
          className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-neutral-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left — Customer */}
              <div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0E2C72]/10 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-[#0E2C72]" />
                  </div>
                  <div>
                    <h2 className="text-[18px] font-bold text-neutral-900">{sub.customer_name ?? "—"}</h2>
                    {sub.customer_email && (
                      <p className="text-[12.5px] text-neutral-500 mt-0.5">{sub.customer_email}</p>
                    )}
                    {sub.customer_phone && (
                      <p className="text-[12.5px] text-neutral-500">{sub.customer_phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right — Property + Status */}
              <div className="flex flex-col gap-1.5">
                <div>
                  <p className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wide">Property</p>
                  <p className="text-[15px] font-bold text-neutral-900 mt-0.5">{sub.property_name ?? "—"}</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div>
                    <p className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wide">Pricing Plan</p>
                    <p className="text-[13px] font-semibold text-neutral-700 mt-0.5">
                      {sub.pricing_plan_name ?? sub.plan_name ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wide">Status</p>
                    <div className="mt-0.5">
                      <SubStatusBadge status={sub.status} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4-column summary row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-y lg:divide-y-0 divide-neutral-100">
            <div className="px-5 py-4">
              <p className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wide">Total Price</p>
              <p className="text-[17px] font-bold text-neutral-900 mt-0.5">{fmt(sub.total_price)}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wide">Amount Paid</p>
              <p className="text-[17px] font-bold text-[#0E2C72] mt-0.5">{fmt(sub.amount_paid)}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wide">Balance</p>
              <p className="text-[17px] font-bold text-amber-600 mt-0.5">{fmt(sub.balance)}</p>
            </div>
            <div className="px-5 py-4">
              <ProgressBar pct={pct} />
            </div>
          </div>

          {/* Additional details row */}
          <div className="border-t border-neutral-100 px-5 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wide flex items-center gap-1">
                  <User className="w-3 h-3" /> Sales Rep
                </p>
                <p className="text-[13px] font-semibold text-neutral-700 mt-0.5">
                  {sub.assigned_rep_name ?? "Unassigned"}
                </p>
              </div>
              <div>
                <p className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Start Date
                </p>
                <p className="text-[13px] font-semibold text-neutral-700 mt-0.5">{fmtDate(sub.start_date)}</p>
              </div>
              <div>
                <p className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Est. End Date
                </p>
                <p className="text-[13px] font-semibold text-neutral-700 mt-0.5">
                  {fmtDate(sub.estimated_end_date)}
                </p>
              </div>
              <div>
                <p className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Next Due Date
                </p>
                <p className="text-[13px] font-semibold text-neutral-700 mt-0.5">
                  {fmtDate(sub.next_due_date)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Installment Schedule ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.14, delay: 0.05 }}
          className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-neutral-100">
            <h3 className="text-[14px] font-semibold text-neutral-900">Installment Schedule</h3>
            <p className="text-[12px] text-neutral-400 mt-0.5">
              {installments.length} installment{installments.length !== 1 ? "s" : ""} in this subscription
            </p>
          </div>
          {installments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <DollarSign className="w-10 h-10 opacity-20 mb-3" />
              <p className="text-[14px] font-semibold text-neutral-500">No installments yet</p>
              <p className="text-[12px] mt-1">Installments will appear here once generated.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/70">
                    {["S/N", "Due Date", "Scheduled Amount", "Amount Paid", "Status", "Paid Date", "Action"].map((h) => (
                      <th key={h} className="px-4 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {installments.map((inst, idx) => (
                    <InstallmentRow
                      key={inst.id}
                      inst={inst}
                      index={idx}
                      payments={payments}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

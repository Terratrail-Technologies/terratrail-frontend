import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ArrowLeft, ExternalLink, Pencil, LayoutGrid, Users, CreditCard,
  ClipboardList, TrendingUp, DollarSign, Wallet, CheckCircle2,
  XCircle, Clock, Plus, Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  X, Loader2, Upload, Eye, Building2, MapPin, BarChart3, Receipt,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api, BASE_URL } from "../services/api";
import { usePageTitle } from "../hooks/usePageTitle";
import { useWorkspace } from "../hooks/useWorkspace";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Property {
  id: string; name: string; property_type: string; description: string;
  total_sqms: number; available_units: number; unit_measurement: string;
  status: string; featured_image: string | null;
  location: { address: string; city: string; state: string; country: string; latitude: string | null; longitude: string | null } | null;
  pricing_plans: PricingPlan[];
  bank_accounts: BankAccount[];
  gallery_images: { id: string; image: string; caption: string }[];
  amenities: { id: string; name: string; status: string }[];
  land_sizes: { id: string; land_size: string; total_slots: number; description: string }[];
}

interface PricingPlan {
  id: string; plan_name: string; land_size: string; total_price: string;
  payment_type: "OUTRIGHT" | "INSTALLMENT"; initial_payment: string;
  duration_months: number; monthly_installment: string; is_active: boolean;
}

interface BankAccount {
  id: string; bank_name: string; account_name: string; account_number: string; is_active: boolean;
}

interface Subscription {
  id: string; customer: string; customer_name: string;
  customer_email: string; customer_phone: string;
  property: string; property_name: string;
  land_size: string; plan_name: string; payment_type: string; monthly_installment: string;
  total_price: string; amount_paid: string; balance: string; payment_completion_pct: number;
  status: string; start_date: string | null; estimated_end_date: string | null;
  next_due_date: string | null; next_due_amount: string | null; next_due_installment_id: string | null;
  assigned_rep: string | null; assigned_rep_name: string | null;
  plot_number: string | null; allocation_date: string | null;
  allocation_letter: string | null; allocation_notes: string;
  notes: string;
  created_at: string;
}

interface FullInstallment {
  id: string; installment_number: number; due_date: string;
  amount: string; status: string; paid_date: string | null;
}

interface Payment {
  id: string; installment: string; installment_number: number;
  customer_name: string; land_size: string; property_id: string; property_name: string;
  amount: string; payment_date: string;
  status: string; recorded_by: string | null; recorded_by_email: string | null; recorded_by_name: string | null;
  approved_by: string | null; approved_by_email: string | null;
  receipt_url: string; receipt_file: string | null;
  transaction_reference: string; notes: string;
  created_at: string;
}

interface Inspection {
  id: string; name: string; email: string; phone: string;
  linked_property: string | null; property_name: string; property_display: string;
  inspection_date: string; inspection_time: string | null;
  inspection_type: string; category: string; persons: number;
  status: string; attended: boolean; notes: string;
  assigned_rep: string | null; assigned_rep_name: string | null;
  converted_customer: string | null; converted_customer_name: string | null;
  is_converted: boolean;
}

interface Customer { id: string; full_name: string; email: string; phone: string; }

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (v?: string | number | null) =>
  v == null || v === "" ? "—" : `₦${Number(v).toLocaleString("en-NG")}`;

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—";

function imgSrc(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${BASE_URL.replace("/api/v1", "")}${url}`;
}

const inputCls = "w-full h-9 px-3 rounded-lg border border-neutral-200 text-[13px] focus:outline-none focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-400 bg-white";
const labelCls = "text-[12px] font-medium text-neutral-600 block mb-1.5";

// ── Status Badges ─────────────────────────────────────────────────────────────

function SubStatusBadge({ status }: { status?: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    ACTIVE:     { cls: "bg-emerald-100 text-emerald-700", label: "Active" },
    COMPLETED:  { cls: "bg-blue-100 text-blue-700",       label: "Completed" },
    DEFAULTING: { cls: "bg-red-100 text-red-700",         label: "Defaulting" },
    DEFAULTED:  { cls: "bg-red-100 text-red-700",         label: "Defaulting" },
    CANCELLED:  { cls: "bg-neutral-100 text-neutral-500", label: "Cancelled" },
    PENDING:    { cls: "bg-amber-100 text-amber-700",     label: "Pending" },
  };
  const cfg = map[(status ?? "").toUpperCase()] ?? map["PENDING"];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${cfg.cls}`}>{cfg.label}</span>;
}

function PayStatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    PENDING:  { cls: "bg-amber-100 text-amber-700",     label: "Pending" },
    APPROVED: { cls: "bg-emerald-100 text-emerald-700", label: "Approved" },
    REJECTED: { cls: "bg-red-100 text-red-700",          label: "Rejected" },
  };
  const cfg = map[status] ?? map["PENDING"];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${cfg.cls}`}>{cfg.label}</span>;
}

function InspectionStatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    PENDING:   { cls: "bg-amber-100 text-amber-700",     label: "Pending" },
    ATTENDED:  { cls: "bg-emerald-100 text-emerald-700", label: "Attended" },
    CANCELLED: { cls: "bg-neutral-100 text-neutral-500", label: "No-Show" },
  };
  const cfg = map[status] ?? map["PENDING"];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${cfg.cls}`}>{cfg.label}</span>;
}

// ── Metric Card ───────────────────────────────────────────────────────────────

function MetricCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: React.ElementType;
  color: "emerald" | "blue" | "violet" | "amber" | "red"; sub?: string;
}) {
  const c = { emerald: "bg-emerald-50 text-emerald-600", blue: "bg-blue-50 text-blue-600", violet: "bg-violet-50 text-violet-600", amber: "bg-amber-50 text-amber-600", red: "bg-red-50 text-red-600" }[color];
  const bar = { emerald: "bg-emerald-500", blue: "bg-blue-500", violet: "bg-violet-500", amber: "bg-amber-500", red: "bg-red-500" }[color];
  return (
    <div className="relative bg-white rounded-xl border border-neutral-100 p-4 flex items-start gap-3 shadow-sm overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${bar}`} />
      <div className={`p-2.5 rounded-xl shrink-0 ${c}`}><Icon className="size-4" /></div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">{label}</p>
        <p className="text-[20px] font-bold text-neutral-900 leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-neutral-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Mini Progress Bar ─────────────────────────────────────────────────────────

function MiniProgress({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <span className="text-[11px] text-neutral-500 w-8 text-right">{Math.round(pct)}%</span>
    </div>
  );
}

// ── Slide-over Wrapper ────────────────────────────────────────────────────────

function SlideOver({ open, onClose, title, children, width = "max-w-lg" }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className={`relative bg-white rounded-2xl shadow-2xl flex flex-col w-full ${width} max-h-[90vh]`}>
            <div className="flex items-center justify-between p-5 border-b border-neutral-100 shrink-0">
              <h2 className="font-semibold text-neutral-900">{title}</h2>
              <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-neutral-100">
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Customer Search Widget ────────────────────────────────────────────────────

function CustomerSearch({ onSelect, label = "Search Customer" }: {
  onSelect: (c: Customer) => void; label?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!query.trim() || selected) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const all: any[] = await api.customers.list();
        const q = query.toLowerCase();
        setResults(all.filter((c: any) =>
          c.full_name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.includes(q)
        ).slice(0, 8));
      } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, selected]);

  const pick = (c: Customer) => {
    setSelected(c); setQuery(c.full_name); setResults([]); onSelect(c);
  };
  const clear = () => { setSelected(null); setQuery(""); setResults([]); };

  return (
    <div className="relative">
      <label className={labelCls}>{label}</label>
      <div className="relative">
        <input value={query} onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
          placeholder="Name, phone or email…" className={`${inputCls} pr-8`} />
        {loading && <Loader2 className="absolute right-2 top-2.5 size-3.5 text-neutral-400 animate-spin" />}
        {selected && !loading && (
          <button onClick={clear} className="absolute right-2 top-2.5"><X className="size-3.5 text-neutral-400" /></button>
        )}
      </div>
      {results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
          {results.map((c) => (
            <button key={c.id} onClick={() => pick(c)} className="w-full text-left px-3 py-2 hover:bg-neutral-50 flex flex-col">
              <span className="text-[13px] font-medium text-neutral-800">{c.full_name}</span>
              <span className="text-[11px] text-neutral-400">{c.phone} · {c.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Payment Tab Context (gives PaymentHistoryTab access to property) ──────────

const PaymentTabCtx = createContext<{ property: Property | null }>({ property: null });
const usePaymentTabCtx = () => useContext(PaymentTabCtx);

// ── Pricing Plan Price History Row ───────────────────────────────────────────

function PlanHistoryRow({ plan }: { plan: PricingPlan }) {
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [fetched, setFetched]   = useState(false);

  const toggle = async () => {
    if (fetched) { setExpanded((v) => !v); return; }
    setExpanded(true);
    setLoading(true);
    try {
      const data = await api.properties.planHistory(plan.id);
      setHistory(data);
      setFetched(true);
    } catch { setHistory([]); setFetched(true); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden shadow-sm">
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-neutral-800 truncate">{plan.plan_name}</p>
          <p className="text-[11px] text-neutral-400">{plan.land_size} SQM · {plan.payment_type === "OUTRIGHT" ? "Outright" : "Installment"}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <p className="text-[14px] font-bold text-emerald-700">{fmt(plan.total_price)}</p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${plan.is_active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>
            {plan.is_active ? "Active" : "Inactive"}
          </span>
          <button onClick={toggle} className="flex items-center gap-1 text-[11.5px] text-neutral-400 hover:text-emerald-600 transition-colors">
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            History
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-neutral-50 px-4 py-3 bg-neutral-50/40">
          {loading ? (
            <p className="text-[12px] text-neutral-400 flex items-center gap-1.5"><Loader2 className="size-3 animate-spin" /> Loading…</p>
          ) : history.length === 0 ? (
            <p className="text-[12px] text-neutral-400 italic">No price changes recorded yet.</p>
          ) : (
            <div className="space-y-1.5">
              {history.map((h: any) => (
                <div key={h.id} className="flex items-center gap-3 text-[12px]">
                  <span className="text-neutral-400 shrink-0">{fmtDate(h.created_at)}</span>
                  <span className="text-red-500 line-through">{fmt(h.old_price)}</span>
                  <span className="text-neutral-400">→</span>
                  <span className="text-emerald-700 font-semibold">{fmt(h.new_price)}</span>
                  {h.changed_by_name && <span className="text-neutral-400">by {h.changed_by_name}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 1 — Overview
// ═══════════════════════════════════════════════════════════════════════════════

function OverviewTab({ property, subscriptions, payments, commissions }: {
  property: Property; subscriptions: Subscription[]; payments: Payment[]; commissions: any[];
}) {
  const activeSubs    = subscriptions.filter((s) => s.status === "ACTIVE").length;
  const completedSubs = subscriptions.filter((s) => s.status === "COMPLETED").length;

  const totalRevenue = payments
    .filter((p) => p.status === "APPROVED")
    .reduce((acc, p) => acc + parseFloat(p.amount || "0"), 0);
  const outstanding = subscriptions.reduce((acc, s) => acc + parseFloat(s.balance || "0"), 0);

  const totalSold  = subscriptions.filter((s) => ["ACTIVE", "COMPLETED"].includes(s.status)).length;
  const totalUnits = property.available_units || 0;
  const soldPct    = totalUnits > 0 ? (totalSold / totalUnits) * 100 : 0;

  // Per-land-size sold breakdown
  const landSizeMap: Record<string, { sold: number; total: number }> = {};
  property.land_sizes.forEach((ls) => {
    landSizeMap[ls.land_size] = { sold: 0, total: ls.total_slots };
  });
  subscriptions
    .filter((s) => ["ACTIVE", "COMPLETED"].includes(s.status))
    .forEach((s) => {
      if (!s.land_size) return;
      if (!landSizeMap[s.land_size]) landSizeMap[s.land_size] = { sold: 0, total: 0 };
      landSizeMap[s.land_size].sold++;
    });

  const heroImg = imgSrc(property.featured_image)
    ?? (property.gallery_images?.[0] ? imgSrc(property.gallery_images[0].image) : undefined);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative w-full h-52 rounded-2xl overflow-hidden bg-neutral-100">
        {heroImg ? (
          <img src={heroImg} alt={property.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300">
            <Building2 className="size-16" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <h2 className="text-xl font-bold">{property.name}</h2>
          {property.location && (
            <p className="text-sm opacity-90 flex items-center gap-1 mt-0.5">
              <MapPin className="size-3.5" />
              {[property.location.city, property.location.state].filter(Boolean).join(", ")}
            </p>
          )}
          {property.total_sqms > 0 && (
            <p className="text-xs opacity-75 mt-0.5">
              {property.total_sqms.toLocaleString()} {property.unit_measurement ?? "SQM"} total area
            </p>
          )}
        </div>
      </div>

      {/* Sales Progress */}
      <div className="bg-white rounded-xl border border-neutral-100 p-5 shadow-sm">
        <h3 className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-4">Sales Progress</h3>
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[13px] font-semibold text-neutral-700">{totalSold} of {totalUnits} units sold</span>
            <span className="text-[12px] text-neutral-500">{Math.round(soldPct)}%</span>
          </div>
          <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${soldPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
        </div>
        {Object.keys(landSizeMap).length > 0 && (
          <div className="space-y-2.5 mt-4 pt-4 border-t border-neutral-50">
            {Object.entries(landSizeMap).map(([ls, { sold, total }]) => (
              <div key={ls} className="flex items-center gap-3">
                <span className="text-[12px] text-neutral-600 w-24 shrink-0">{ls} SQM</span>
                <div className="flex-1"><MiniProgress pct={total > 0 ? (sold / total) * 100 : 0} /></div>
                <span className="text-[11px] text-neutral-400 w-20 text-right shrink-0">{sold} of {total}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Revenue */}
      <div>
        <h3 className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">Revenue</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <MetricCard label="Total Revenue"      value={fmt(totalRevenue)} icon={DollarSign} color="emerald" sub="Approved payments" />
          <MetricCard label="Outstanding Balance" value={fmt(outstanding)}  icon={Wallet}     color="amber"   sub="Unpaid balance" />
          <MetricCard label="Pending Payments"    value={payments.filter((p) => p.status === "PENDING").length} icon={Clock} color="violet" sub="Awaiting approval" />
        </div>
      </div>

      {/* Subscriptions */}
      <div>
        <h3 className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">Subscriptions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="Active"           value={activeSubs}                    icon={CheckCircle2} color="emerald" />
          <MetricCard label="Completed"        value={completedSubs}                 icon={TrendingUp}   color="blue"    />
          <MetricCard label="Plot Allocations" value={totalSold}                     icon={BarChart3}    color="violet"  sub="Active + completed" />
          <MetricCard label="Cancelled"        value={subscriptions.filter((s) => s.status === "CANCELLED").length} icon={XCircle} color="red" />
        </div>
      </div>

      {/* Income Summary */}
      <div>
        <h3 className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">Income Summary</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(() => {
            const totalContractValue = subscriptions
              .filter((s) => ["ACTIVE","COMPLETED"].includes(s.status))
              .reduce((acc, s) => acc + parseFloat(s.total_price || "0"), 0);
            const netIncome = totalRevenue;
            const projected = totalContractValue - totalRevenue;

            // Potential Revenue: remaining slots × average plan price per land size
            const potentialRevenue = property.land_sizes.reduce((acc, ls) => {
              const remaining = Math.max(0, ls.total_slots - (landSizeMap[ls.land_size]?.sold ?? 0));
              const plansForSize = property.pricing_plans.filter(
                (p) => p.land_size === ls.land_size && p.is_active
              );
              const avgPrice = plansForSize.length > 0
                ? plansForSize.reduce((a, p) => a + parseFloat(p.total_price || "0"), 0) / plansForSize.length
                : 0;
              return acc + remaining * avgPrice;
            }, 0);

            return (
              <>
                <MetricCard label="Net Income"        value={fmt(netIncome)}          icon={DollarSign} color="emerald" sub="Approved collections" />
                <MetricCard label="Contract Value"    value={fmt(totalContractValue)} icon={Receipt}    color="blue"    sub="Active + completed subs" />
                <MetricCard label="Projected Inflow"  value={fmt(projected)}          icon={TrendingUp} color="violet"  sub="Remaining to collect" />
                <MetricCard label="Potential Revenue" value={fmt(potentialRevenue)}   icon={BarChart3}  color="amber"   sub="If all slots sold" />
              </>
            );
          })()}
        </div>
      </div>

      {/* Commissions */}
      <div>
        <h3 className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">Commissions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {(() => {
            const earned   = commissions.filter((c) => c.status === "PAID").reduce((a, c) => a + parseFloat(c.amount || "0"), 0);
            const pending  = commissions.filter((c) => c.status === "PENDING").reduce((a, c) => a + parseFloat(c.amount || "0"), 0);
            const total    = earned + pending;
            return (
              <>
                <MetricCard label="Commission Earned"  value={fmt(earned)}  icon={CheckCircle2} color="emerald" sub="Paid out to reps" />
                <MetricCard label="Commission Pending" value={fmt(pending)} icon={Clock}        color="amber"   sub="Awaiting payout" />
                <MetricCard label="Total Commission"   value={fmt(total)}   icon={TrendingUp}   color="violet"  sub="Earned + pending" />
              </>
            );
          })()}
        </div>
      </div>

      {/* Pricing Plans */}
      {property.pricing_plans.length > 0 && (
        <div>
          <h3 className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">Pricing Plans</h3>
          <div className="space-y-2">
            {property.pricing_plans.map((plan) => (
              <PlanHistoryRow key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Add Subscription Slide-over — 3-step wizard
// ═══════════════════════════════════════════════════════════════════════════════

function AddSubscriptionSlideOver({ open, onClose, property, onCreated }: {
  open: boolean; onClose: () => void; property: Property; onCreated: () => void;
}) {
  const [step, setStep]               = useState<1 | 2 | 3>(1);
  const [customer, setCustomer]       = useState<Customer | null>(null);
  const [selectedLS, setSelectedLS]   = useState("");
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [saving, setSaving]           = useState(false);

  const activePlans    = property.pricing_plans.filter((p) => p.is_active);
  const uniqueSizes    = Array.from(new Set(activePlans.map((p) => p.land_size)));
  const plansForSize   = activePlans.filter((p) => p.land_size === selectedLS);
  const slotsMap: Record<string, number> = {};
  property.land_sizes.forEach((ls) => { slotsMap[ls.land_size] = ls.total_slots; });

  const reset = () => { setStep(1); setCustomer(null); setSelectedLS(""); setSelectedPlan(null); onClose(); };

  const handleCreate = async () => {
    if (!customer || !selectedPlan) return;
    setSaving(true);
    try {
      await api.subscriptions.create({ customer_id: customer.id, pricing_plan_id: selectedPlan.id, property_id: property.id });
      toast.success("Subscription created.");
      onCreated(); reset();
    } catch (err: any) { toast.error(err.message ?? "Failed to create subscription."); }
    finally { setSaving(false); }
  };

  return (
    <SlideOver open={open} onClose={reset} title="Add New Subscription">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {([1, 2, 3] as const).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${step >= s ? "bg-emerald-600 text-white" : "bg-neutral-100 text-neutral-400"}`}>{s}</div>
            {s < 3 && <div className={`h-px w-8 ${step > s ? "bg-emerald-400" : "bg-neutral-200"}`} />}
          </div>
        ))}
        <span className="ml-2 text-[12px] text-neutral-500">
          {step === 1 ? "Select Customer" : step === 2 ? "Land Size" : "Payment Plan"}
        </span>
      </div>

      {/* Step 1 — Customer */}
      {step === 1 && (
        <div className="space-y-4">
          <CustomerSearch onSelect={setCustomer} label="Search by name, phone or email" />
          {customer && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-[13px] font-semibold text-emerald-800">{customer.full_name}</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">{customer.phone} · {customer.email}</p>
            </div>
          )}
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={!customer} onClick={() => setStep(2)}>
            Continue
          </Button>
          <p className="text-center text-[12px] text-neutral-400">
            Customer not found?{" "}
            <Link to="/customers" className="text-emerald-600 underline underline-offset-2">Add New Customer</Link>
          </p>
        </div>
      )}

      {/* Step 2 — Land Size */}
      {step === 2 && (
        <div className="space-y-4">
          <label className={labelCls}>Select Land Size</label>
          <div className="space-y-2">
            {uniqueSizes.map((ls) => {
              const slots = slotsMap[ls] ?? 0;
              const isFull = slots === 0;
              return (
                <button key={ls} disabled={isFull} onClick={() => setSelectedLS(ls)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-[13px] font-medium transition-all ${selectedLS === ls ? "border-emerald-500 bg-emerald-50 text-emerald-800" : isFull ? "border-neutral-100 bg-neutral-50 text-neutral-300 cursor-not-allowed" : "border-neutral-200 hover:border-emerald-300"}`}>
                  <div className="flex items-center justify-between">
                    <span>{ls} SQM</span>
                    {isFull
                      ? <span className="text-[11px] text-neutral-300 font-normal">Fully Subscribed</span>
                      : <span className="text-[11px] text-neutral-500 font-normal">{slots} slots remaining</span>}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={!selectedLS} onClick={() => setStep(3)}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 — Plan + summary */}
      {step === 3 && (
        <div className="space-y-4">
          <label className={labelCls}>Select Payment Plan</label>
          <div className="space-y-2">
            {plansForSize.map((plan) => (
              <button key={plan.id} onClick={() => setSelectedPlan(plan)}
                className={`w-full text-left px-4 py-3 rounded-lg border text-[13px] transition-all ${selectedPlan?.id === plan.id ? "border-emerald-500 bg-emerald-50" : "border-neutral-200 hover:border-emerald-300"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-neutral-800">{plan.plan_name}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                    {plan.payment_type === "OUTRIGHT" ? "Outright" : "Installment"}
                  </span>
                </div>
                <p className="text-[14px] font-bold text-emerald-700">{fmt(plan.total_price)}</p>
                {plan.payment_type === "INSTALLMENT" && (
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    {fmt(plan.initial_payment)} initial · {fmt(plan.monthly_installment)}/mo · {plan.duration_months} months
                  </p>
                )}
              </button>
            ))}
          </div>
          {selectedPlan && (
            <div className="bg-neutral-50 rounded-lg p-4 space-y-2 text-[12px]">
              {[
                ["Customer",   customer?.full_name ?? ""],
                ["Land Size",  `${selectedLS} SQM`],
                ["Plan",       selectedPlan.plan_name],
                ["Total Price", fmt(selectedPlan.total_price)],
                ...(selectedPlan.payment_type === "INSTALLMENT"
                  ? [["Initial Payment", fmt(selectedPlan.initial_payment)], ["Monthly", `${fmt(selectedPlan.monthly_installment)} × ${selectedPlan.duration_months} mo`]]
                  : []),
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-neutral-500">{k}</span>
                  <span className="font-semibold">{v}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              disabled={!selectedPlan || saving} onClick={handleCreate}>
              {saving ? <><Loader2 className="size-3.5 animate-spin" />Creating…</> : "Confirm & Create"}
            </Button>
          </div>
        </div>
      )}
    </SlideOver>
  );
}

// ── Subscription Detail Modal ───────────────────────────────────────────────

const instStatusCls: Record<string, string> = {
  PAID:     "bg-emerald-100 text-emerald-700",
  OVERDUE:  "bg-red-100 text-red-700",
  DUE:      "bg-amber-100 text-amber-700",
  UPCOMING: "bg-neutral-100 text-neutral-500",
};

function SubscriptionDetailModal({ sub, onClose, onRefresh }: {
  sub: Subscription; onClose: () => void; onRefresh: () => void;
}) {
  const [installments, setInstallments] = useState<FullInstallment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [view, setView]                 = useState<"detail" | "cancel">("detail");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling]     = useState(false);
  const [deleting, setDeleting]         = useState(false);

  useEffect(() => {
    setLoading(true);
    api.installments.list({ subscription: sub.id })
      .then((rows: any[]) => setInstallments(rows))
      .catch(() => setInstallments([]))
      .finally(() => setLoading(false));
  }, [sub.id]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.subscriptions.cancel(sub.id, cancelReason);
      toast.success("Subscription cancelled.");
      onRefresh(); onClose();
    } catch (err: any) { toast.error(err.message ?? "Failed to cancel."); }
    finally { setCancelling(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete this subscription for ${sub.customer_name}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.subscriptions.delete(sub.id);
      toast.success("Subscription deleted.");
      onRefresh(); onClose();
    } catch (err: any) { toast.error(err.message ?? "Failed to delete."); }
    finally { setDeleting(false); }
  };

  const isCancellable = ["PENDING", "ACTIVE", "DEFAULTING", "DEFAULTED"].includes(sub.status);
  const isDeletable   = ["PENDING", "ACTIVE", "DEFAULTING"].includes(sub.status);

  return (
    <SlideOver open onClose={onClose} title="Subscription Detail" width="max-w-2xl">
      {view === "cancel" ? (
        <div className="space-y-4">
          <p className="text-[13px] text-neutral-600">
            Cancelling subscription for <strong>{sub.customer_name}</strong> — {sub.land_size} SQM · {sub.plan_name}
          </p>
          <div>
            <label className={labelCls}>Reason (optional)</label>
            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3}
              placeholder="Add a reason for cancellation…"
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-[13px] focus:outline-none focus:ring-1 focus:ring-emerald-500/40 resize-none" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setView("detail")}>Back</Button>
            <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-1.5" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? <><Loader2 className="size-3.5 animate-spin" />Cancelling…</> : "Confirm Cancel"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-2.5">
            {([
              ["Customer",   sub.customer_name],
              ["Status",     <SubStatusBadge status={sub.status} />],
              ["Land Size",  sub.land_size ? `${sub.land_size} SQM` : "—"],
              ["Plan",       sub.plan_name || "—"],
              ["Total Price", fmt(sub.total_price)],
              ["Amount Paid", fmt(sub.amount_paid)],
              ["Balance",    fmt(sub.balance)],
              ["Start Date", fmtDate(sub.start_date)],
            ] as [string, React.ReactNode][]).map(([k, v]) => (
              <div key={k} className="bg-neutral-50 rounded-lg px-3 py-2.5">
                <p className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wide">{k}</p>
                <div className="text-[13px] font-semibold text-neutral-800 mt-0.5">{v}</div>
              </div>
            ))}
          </div>

          {sub.plot_number && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
              <p className="text-[10.5px] font-semibold text-emerald-600 uppercase tracking-wide">Plot Allocation</p>
              <p className="text-[13px] font-semibold text-emerald-800 mt-0.5">Plot #{sub.plot_number}</p>
              {sub.allocation_date && (
                <p className="text-[11px] text-emerald-600 mt-0.5">Allocated on {fmtDate(sub.allocation_date)}</p>
              )}
              {sub.allocation_notes && (
                <p className="text-[11px] text-emerald-600 mt-0.5">{sub.allocation_notes}</p>
              )}
            </div>
          )}

          {/* Installment Schedule */}
          <div>
            <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Installment Schedule
            </h3>
            {loading ? (
              <div className="space-y-1.5">
                {[1,2,3].map((i) => <Skeleton key={i} className="h-9 rounded-lg" />)}
              </div>
            ) : installments.length === 0 ? (
              <p className="text-[12px] text-neutral-400 italic py-4 text-center">No installments generated yet.</p>
            ) : (
              <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-neutral-100 bg-neutral-50">
                        {["#", "Due Date", "Amount", "Status", "Paid Date"].map((h) => (
                          <th key={h} className="px-3 py-2 text-left text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {installments.map((inst) => (
                        <tr key={inst.id} className="border-b border-neutral-50 last:border-0">
                          <td className="px-3 py-2 text-neutral-500">#{inst.installment_number}</td>
                          <td className="px-3 py-2 text-neutral-600 whitespace-nowrap">{fmtDate(inst.due_date)}</td>
                          <td className="px-3 py-2 font-semibold text-neutral-800">{fmt(inst.amount)}</td>
                          <td className="px-3 py-2">
                            <span className={`text-[10.5px] font-bold px-1.5 py-0.5 rounded-full ${instStatusCls[inst.status] ?? "bg-neutral-100 text-neutral-500"}`}>
                              {inst.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-neutral-400 whitespace-nowrap">
                            {inst.paid_date ? fmtDate(inst.paid_date) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {(isCancellable || isDeletable) && (
            <div className="flex gap-2 pt-1 border-t border-neutral-100">
              {isCancellable && (
                <Button variant="outline"
                  className="text-amber-600 border-amber-200 hover:bg-amber-50 text-[12px] h-8 gap-1.5"
                  onClick={() => setView("cancel")}>
                  <XCircle className="size-3.5" /> Cancel Subscription
                </Button>
              )}
              {isDeletable && (
                <Button variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 text-[12px] h-8 gap-1.5"
                  onClick={handleDelete} disabled={deleting}>
                  {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </SlideOver>
  );
}

// ── Allocate Plot Slide-over ────────────────────────────────────────────────

function AllocateSlideOver({ sub, onClose, onRefresh }: {
  sub: Subscription; onClose: () => void; onRefresh: () => void;
}) {
  const [plotNum, setPlotNum]       = useState("");
  const [allocDate, setAllocDate]   = useState("");
  const [allocNotes, setAllocNotes] = useState("");
  const [allocLetter, setAllocLetter] = useState<File | null>(null);
  const [saving, setSaving]         = useState(false);

  const handleSubmit = async () => {
    if (!plotNum.trim()) { toast.error("Plot number is required."); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("plot_number", plotNum.trim());
      if (allocDate)   fd.append("allocation_date", allocDate);
      if (allocNotes)  fd.append("allocation_notes", allocNotes);
      if (allocLetter) fd.append("allocation_letter", allocLetter);
      await api.subscriptions.allocate(sub.id, fd);
      toast.success("Plot allocated successfully.");
      onRefresh(); onClose();
    } catch (err: any) { toast.error(err.message ?? "Failed to allocate plot."); }
    finally { setSaving(false); }
  };

  return (
    <SlideOver open onClose={onClose} title="Allocate Plot">
      <div className="space-y-4">
        <div className="bg-neutral-50 rounded-lg px-3 py-2.5 text-[12px]">
          <p className="font-semibold text-neutral-700">{sub.customer_name}</p>
          <p className="text-neutral-500 mt-0.5">{sub.land_size} SQM · {sub.plan_name}</p>
        </div>
        <div>
          <label className={labelCls}>Plot Number <span className="text-red-500">*</span></label>
          <input value={plotNum} onChange={(e) => setPlotNum(e.target.value)} className={inputCls} placeholder="e.g. A-24" />
        </div>
        <div>
          <label className={labelCls}>Allocation Date</label>
          <input type="date" value={allocDate} onChange={(e) => setAllocDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Notes</label>
          <textarea value={allocNotes} onChange={(e) => setAllocNotes(e.target.value)} rows={2}
            className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-[13px] focus:outline-none focus:ring-1 focus:ring-emerald-500/40 resize-none" />
        </div>
        <div>
          <label className={labelCls}>Allocation Letter (optional)</label>
          <label className="block w-full border-2 border-dashed border-neutral-200 rounded-lg p-4 text-center cursor-pointer hover:border-emerald-400 transition-colors">
            <Upload className="size-5 mx-auto mb-1 text-neutral-400" />
            <span className="text-[12px] text-neutral-500">
              {allocLetter ? allocLetter.name : "Click to upload image or PDF"}
            </span>
            <input type="file" className="hidden" accept="image/*,.pdf"
              onChange={(e) => setAllocLetter(e.target.files?.[0] ?? null)} />
          </label>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            onClick={handleSubmit} disabled={!plotNum.trim() || saving}>
            {saving ? <><Loader2 className="size-3.5 animate-spin" />Allocating…</> : "Confirm Allocation"}
          </Button>
        </div>
      </div>
    </SlideOver>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 2 — Subscriptions
// ═══════════════════════════════════════════════════════════════════════════════

function SubscriptionsTab({ property, subscriptions, loading, onRefresh, onViewCustomer }: {
  property: Property; subscriptions: Subscription[]; loading: boolean;
  onRefresh: () => void; onViewCustomer: (id: string) => void;
}) {
  const [showAdd, setShowAdd]           = useState(false);
  const [viewSub, setViewSub]           = useState<Subscription | null>(null);
  const [allocateSub, setAllocateSub]   = useState<Subscription | null>(null);
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLS, setFilterLS]         = useState("");
  const [filterRep, setFilterRep]       = useState("");
  const [page, setPage]                 = useState(1);
  const PER_PAGE = 20;

  const filtered = subscriptions.filter((s) => {
    const q = search.toLowerCase();
    const matchQ = !q || s.customer_name?.toLowerCase().includes(q) || s.customer_phone?.includes(q) || s.customer_email?.toLowerCase().includes(q);
    const matchRep = !filterRep || s.assigned_rep_name === filterRep;
    return matchQ && (!filterStatus || s.status === filterStatus) && (!filterLS || s.land_size === filterLS) && matchRep;
  });
  const pageCount = Math.ceil(filtered.length / PER_PAGE);
  const paged     = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const uniqueSizes = Array.from(new Set(subscriptions.map((s) => s.land_size).filter(Boolean)));
  const uniqueReps  = Array.from(new Set(subscriptions.map((s) => s.assigned_rep_name).filter(Boolean))) as string[];

  if (loading) return <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>;

  const totalPaid        = subscriptions.reduce((a, s) => a + parseFloat(s.amount_paid || "0"), 0);
  const totalOutstanding = subscriptions.filter((s) => !["CANCELLED","COMPLETED"].includes(s.status))
    .reduce((a, s) => a + parseFloat(s.balance || "0"), 0);
  const totalLocked      = subscriptions.filter((s) => ["ACTIVE","PENDING","COMPLETED"].includes(s.status))
    .reduce((a, s) => a + parseFloat(s.total_price || "0"), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-[16px] font-semibold text-neutral-800">Subscriptions</h2>
        <Button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-[12px] gap-1.5">
          <Plus className="size-3.5" /> Add New Subscription
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-neutral-100 px-4 py-3 shadow-sm">
          <p className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wide">Amount Paid</p>
          <p className="text-[18px] font-bold text-emerald-700 mt-0.5">{fmt(totalPaid)}</p>
          <p className="text-[10.5px] text-neutral-400 mt-0.5">Across all subscriptions</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-100 px-4 py-3 shadow-sm">
          <p className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wide">Outstanding</p>
          <p className="text-[18px] font-bold text-amber-600 mt-0.5">{fmt(totalOutstanding)}</p>
          <p className="text-[10.5px] text-neutral-400 mt-0.5">Active + defaulting subs</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-100 px-4 py-3 shadow-sm">
          <p className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wide">Locked Price</p>
          <p className="text-[18px] font-bold text-violet-700 mt-0.5">{fmt(totalLocked)}</p>
          <p className="text-[10.5px] text-neutral-400 mt-0.5">Contract value at purchase</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-neutral-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search customer…"
            className="w-full h-9 pl-8 pr-3 rounded-lg border border-neutral-200 text-[13px] focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white" />
        </div>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-lg border border-neutral-200 text-[13px] bg-white focus:outline-none">
          <option value="">All Status</option>
          {["ACTIVE","PENDING","COMPLETED","CANCELLED","DEFAULTING"].map((s) => (
            <option key={s} value={s}>{s[0] + s.slice(1).toLowerCase()}</option>
          ))}
        </select>
        <select value={filterLS} onChange={(e) => { setFilterLS(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-lg border border-neutral-200 text-[13px] bg-white focus:outline-none">
          <option value="">All Sizes</option>
          {uniqueSizes.map((ls) => <option key={ls} value={ls}>{ls} SQM</option>)}
        </select>
        {uniqueReps.length > 0 && (
          <select value={filterRep} onChange={(e) => { setFilterRep(e.target.value); setPage(1); }}
            className="h-9 px-3 rounded-lg border border-neutral-200 text-[13px] bg-white focus:outline-none">
            <option value="">All Sales Reps</option>
            {uniqueReps.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        )}
      </div>

      {paged.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
          <Users className="size-10 mb-3 opacity-40" />
          <p className="text-[14px] font-semibold">{subscriptions.length === 0 ? "No subscriptions yet" : "No results found"}</p>
          <p className="text-[12px] mt-1">{subscriptions.length === 0 ? "Add the first subscription." : "Try adjusting your filters."}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  {["Customer", "Phone / Email", "Sales Rep", "Land Size", "Payment %", "Status", "Next Due", "Action"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((s) => (
                  <tr key={s.id} className="border-b border-neutral-50 hover:bg-neutral-50/50">
                    <td className="px-4 py-3 font-medium text-neutral-800 whitespace-nowrap">{s.customer_name}</td>
                    <td className="px-4 py-3 text-neutral-500 text-[12px]">
                      <div>{s.customer_phone}</div>
                      <div className="text-neutral-400">{s.customer_email}</div>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-neutral-500 whitespace-nowrap">{s.assigned_rep_name ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{s.land_size ? `${s.land_size} SQM` : "—"}</td>
                    <td className="px-4 py-3 min-w-[130px]"><MiniProgress pct={s.payment_completion_pct ?? 0} /></td>
                    <td className="px-4 py-3"><SubStatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-500 text-[12px]">{fmtDate(s.next_due_date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setViewSub(s)}
                          className="text-emerald-600 hover:text-emerald-700 font-medium text-[12px] flex items-center gap-1">
                          <Eye className="size-3.5" /> View
                        </button>
                        {s.status === "COMPLETED" && !s.plot_number && (
                          <button onClick={() => setAllocateSub(s)}
                            className="text-blue-600 hover:text-blue-700 font-medium text-[12px] flex items-center gap-1 ml-1">
                            <MapPin className="size-3.5" /> Allocate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pageCount > 1 && <Pagination page={page} pageCount={pageCount} total={filtered.length} onPage={setPage} />}
        </div>
      )}

      <AddSubscriptionSlideOver open={showAdd} onClose={() => setShowAdd(false)} property={property}
        onCreated={() => { onRefresh(); setShowAdd(false); }} />

      {viewSub && (
        <SubscriptionDetailModal
          sub={viewSub}
          onClose={() => setViewSub(null)}
          onRefresh={() => { setViewSub(null); onRefresh(); }}
        />
      )}

      {allocateSub && (
        <AllocateSlideOver
          sub={allocateSub}
          onClose={() => setAllocateSub(null)}
          onRefresh={() => { setAllocateSub(null); onRefresh(); }}
        />
      )}
    </div>
  );
}

// ─── Pagination strip ─────────────────────────────────────────────────────────
function Pagination({ page, pageCount, total, onPage }: { page: number; pageCount: number; total: number; onPage: (p: number) => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100">
      <span className="text-[12px] text-neutral-400">{total} results · page {page} of {pageCount}</span>
      <div className="flex gap-1">
        <button disabled={page === 1} onClick={() => onPage(page - 1)}
          className="w-7 h-7 rounded-lg border border-neutral-200 flex items-center justify-center disabled:opacity-40">
          <ChevronLeft className="size-3.5" />
        </button>
        <button disabled={page === pageCount} onClick={() => onPage(page + 1)}
          className="w-7 h-7 rounded-lg border border-neutral-200 flex items-center justify-center disabled:opacity-40">
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Record Payment Slide-over
// ═══════════════════════════════════════════════════════════════════════════════

interface InstallmentRow { id: string; installment_number: number; due_date: string; amount: string; status: string; }

function RecordPaymentSlideOver({ open, onClose, property, onRecorded }: {
  open: boolean; onClose: () => void; property: Property; onRecorded: () => void;
}) {
  const [customer, setCustomer]               = useState<Customer | null>(null);
  const [custSubs, setCustSubs]               = useState<Subscription[]>([]);
  const [selectedSub, setSelectedSub]         = useState<Subscription | null>(null);
  const [installments, setInstallments]       = useState<InstallmentRow[]>([]);
  const [selectedInst, setSelectedInst]       = useState<InstallmentRow | null>(null);
  const [amount, setAmount]                   = useState("");
  const [reference, setReference]             = useState("");
  const [receipt, setReceipt]                 = useState<File | null>(null);
  const [loadingSubs, setLoadingSubs]         = useState(false);
  const [loadingInst, setLoadingInst]         = useState(false);
  const [saving, setSaving]                   = useState(false);

  const activeBanks = property.bank_accounts.filter((b) => b.is_active);

  // Load subscriptions when customer changes
  useEffect(() => {
    if (!customer) { setCustSubs([]); setSelectedSub(null); setInstallments([]); setSelectedInst(null); return; }
    setLoadingSubs(true);
    api.subscriptions.list({ customer: customer.id, property: property.id })
      .then((subs: any[]) => {
        const forProp = subs.filter((s) => s.property === property.id && ["ACTIVE", "PENDING"].includes(s.status));
        setCustSubs(forProp);
        if (forProp.length === 1) setSelectedSub(forProp[0]);
      })
      .catch(() => setCustSubs([]))
      .finally(() => setLoadingSubs(false));
  }, [customer, property.id]);

  // Load installments when subscription changes
  useEffect(() => {
    if (!selectedSub) { setInstallments([]); setSelectedInst(null); return; }
    setLoadingInst(true);
    api.installments.list({ subscription: selectedSub.id })
      .then((rows: any[]) => {
        const payable = rows.filter((r) => ["UPCOMING", "DUE", "OVERDUE"].includes(r.status));
        setInstallments(payable);
        if (payable.length > 0) {
          // Auto-select the first overdue/due, else first upcoming
          const first = payable.find((r) => r.status === "OVERDUE") ?? payable.find((r) => r.status === "DUE") ?? payable[0];
          setSelectedInst(first);
          setAmount(first.amount);
        }
      })
      .catch(() => setInstallments([]))
      .finally(() => setLoadingInst(false));
  }, [selectedSub]);

  const reset = () => {
    setCustomer(null); setCustSubs([]); setSelectedSub(null);
    setInstallments([]); setSelectedInst(null);
    setAmount(""); setReference(""); setReceipt(null); onClose();
  };

  const handleSubmit = async () => {
    if (!selectedInst) { toast.error("Select an installment to record payment against."); return; }
    if (!amount || Number(amount) <= 0) { toast.error("Enter a valid amount."); return; }
    if (!receipt) { toast.error("Receipt upload is required."); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("installment_id", selectedInst.id);
      fd.append("amount", amount);
      fd.append("receipt_file", receipt);
      if (reference) fd.append("notes", reference);
      await api.payments.record(fd);
      toast.success("Payment recorded — pending approval.");
      onRecorded(); reset();
    } catch (err: any) { toast.error(err.message ?? "Failed to record payment."); }
    finally { setSaving(false); }
  };

  const instStatusCls: Record<string, string> = {
    OVERDUE: "text-red-600 font-semibold", DUE: "text-amber-600 font-semibold", UPCOMING: "text-neutral-500",
  };

  return (
    <SlideOver open={open} onClose={reset} title="Record Payment">
      <div className="space-y-5">
        <CustomerSearch onSelect={(c) => { setCustomer(c); setSelectedSub(null); setCustSubs([]); setInstallments([]); setSelectedInst(null); }} />

        {customer && loadingSubs && (
          <div className="flex items-center gap-2 text-[13px] text-neutral-500">
            <Loader2 className="size-3.5 animate-spin" /> Loading subscriptions…
          </div>
        )}
        {customer && !loadingSubs && custSubs.length === 0 && (
          <p className="text-[13px] text-neutral-400 bg-neutral-50 rounded-lg p-3">No active subscription for this property.</p>
        )}
        {customer && !loadingSubs && custSubs.length > 0 && (
          <div>
            <label className={labelCls}>Subscription</label>
            {custSubs.map((s) => (
              <button key={s.id} onClick={() => { setSelectedSub(s); setInstallments([]); setSelectedInst(null); }}
                className={`w-full text-left p-3 rounded-lg border mb-2 transition-all ${selectedSub?.id === s.id ? "border-emerald-500 bg-emerald-50" : "border-neutral-200 hover:border-emerald-300"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold">{s.land_size} SQM · {s.plan_name}</span>
                  <SubStatusBadge status={s.status} />
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">Balance: {fmt(s.balance)} · {Number(s.payment_completion_pct ?? 0).toFixed(0)}% paid</p>
              </button>
            ))}
          </div>
        )}

        {selectedSub && loadingInst && (
          <div className="flex items-center gap-2 text-[13px] text-neutral-500">
            <Loader2 className="size-3.5 animate-spin" /> Loading installments…
          </div>
        )}
        {selectedSub && !loadingInst && installments.length === 0 && (
          <p className="text-[13px] text-amber-600 bg-amber-50 rounded-lg p-3">No payable installments found. All may already be paid or pending approval.</p>
        )}
        {selectedSub && !loadingInst && installments.length > 0 && (
          <div>
            <label className={labelCls}>Installment <span className="text-red-500">*</span></label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {installments.map((inst) => (
                <button key={inst.id} onClick={() => { setSelectedInst(inst); setAmount(inst.amount); }}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-all ${selectedInst?.id === inst.id ? "border-emerald-500 bg-emerald-50" : "border-neutral-200 hover:border-emerald-300"}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[12.5px] font-semibold text-neutral-800">#{inst.installment_number} · {fmt(inst.amount)}</span>
                    <span className={`text-[11px] ${instStatusCls[inst.status] ?? ""}`}>{inst.status}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Due: {fmtDate(inst.due_date)}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedInst && (
          <>
            <div>
              <label className={labelCls}>Amount Paid</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                className={inputCls} placeholder={`Expected: ${fmt(selectedInst.amount)}`} />
            </div>
            {activeBanks.length > 0 && (
              <div>
                <label className={labelCls}>Bank Account (optional)</label>
                <select onChange={() => {}} className={inputCls}>
                  <option value="">Select bank account…</option>
                  {activeBanks.map((b) => (
                    <option key={b.id} value={b.id}>{b.bank_name} · {b.account_number} ({b.account_name})</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className={labelCls}>Transaction Reference (optional)</label>
              <input value={reference} onChange={(e) => setReference(e.target.value)} className={inputCls} placeholder="e.g. TRX1234567" />
            </div>
            <div>
              <label className={labelCls}>Receipt <span className="text-red-500">*</span></label>
              <label className="block w-full border-2 border-dashed border-neutral-200 rounded-lg p-4 text-center cursor-pointer hover:border-emerald-400 transition-colors">
                <Upload className="size-5 mx-auto mb-1 text-neutral-400" />
                <span className="text-[12px] text-neutral-500">
                  {receipt ? receipt.name : "Click to upload image or PDF (max 5MB)"}
                </span>
                <input type="file" className="hidden" accept="image/*,.pdf"
                  onChange={(e) => setReceipt(e.target.files?.[0] ?? null)} />
              </label>
            </div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              disabled={!receipt || !amount || saving} onClick={handleSubmit}>
              {saving ? <><Loader2 className="size-3.5 animate-spin" />Submitting…</> : "Submit Payment"}
            </Button>
          </>
        )}
      </div>
    </SlideOver>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 3 — Payment History
// ═══════════════════════════════════════════════════════════════════════════════

function PaymentHistoryTab({ payments, loading, onRefresh }: {
  payments: Payment[]; loading: boolean; onRefresh: () => void;
}) {
  const { property } = usePaymentTabCtx();
  const [showRecord, setShowRecord]   = useState(false);
  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [page, setPage]               = useState(1);
  const PER_PAGE = 20;

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase();
    const matchQ = !q || p.customer_name?.toLowerCase().includes(q) || p.transaction_reference?.toLowerCase().includes(q);
    return matchQ && (!filterStatus || p.status === filterStatus);
  });
  const pageCount = Math.ceil(filtered.length / PER_PAGE);
  const paged     = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleApprove = async (id: string) => {
    try { await api.payments.approve(id); toast.success("Payment approved."); onRefresh(); }
    catch (err: any) { toast.error(err.message ?? "Failed to approve."); }
  };
  const handleReject = async (id: string) => {
    try { await api.payments.reject(id); toast.success("Payment rejected."); onRefresh(); }
    catch (err: any) { toast.error(err.message ?? "Failed to reject."); }
  };

  if (loading) return <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-[16px] font-semibold text-neutral-800">Payment History</h2>
        <Button onClick={() => setShowRecord(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-[12px] gap-1.5">
          <Receipt className="size-3.5" /> Record Payment
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-neutral-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search customer or ref…"
            className="w-full h-9 pl-8 pr-3 rounded-lg border border-neutral-200 text-[13px] focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white" />
        </div>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-lg border border-neutral-200 text-[13px] bg-white focus:outline-none">
          <option value="">All Status</option>
          {["PENDING","APPROVED","REJECTED"].map((s) => <option key={s} value={s}>{s[0] + s.slice(1).toLowerCase()}</option>)}
        </select>
      </div>

      {paged.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
          <CreditCard className="size-10 mb-3 opacity-40" />
          <p className="text-[14px] font-semibold">No payments yet</p>
          <p className="text-[12px] mt-1">Record the first payment for this property.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  {["Customer", "Land Size", "Amount", "Date", "Reference", "Status", "Recorded By", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((p) => (
                  <>
                    <tr key={p.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                      <td className="px-4 py-3 font-medium text-neutral-800 whitespace-nowrap">{p.customer_name}</td>
                      <td className="px-4 py-3 text-neutral-500">{p.land_size ? `${p.land_size} SQM` : "—"}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-700 whitespace-nowrap">{fmt(p.amount)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-neutral-500 text-[12px]">{fmtDate(p.payment_date)}</td>
                      <td className="px-4 py-3 text-neutral-400 font-mono text-[11px]">{p.transaction_reference || "—"}</td>
                      <td className="px-4 py-3"><PayStatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 text-neutral-500 whitespace-nowrap text-[12px]">{p.recorded_by_name ?? p.recorded_by_email ?? "—"}</td>
                      <td className="px-4 py-3">
                        {p.status === "PENDING" && (
                          <div className="flex gap-1">
                            <button onClick={(e) => { e.stopPropagation(); handleApprove(p.id); }}
                              className="text-[11px] px-2 py-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-medium">
                              Approve
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleReject(p.id); }}
                              className="text-[11px] px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 font-medium">
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {expandedId === p.id && (
                      <tr key={`${p.id}-exp`} className="bg-neutral-50/80">
                        <td colSpan={8} className="px-4 py-3 text-[12px] text-neutral-600">
                          <div className="flex flex-wrap gap-4">
                            {p.notes && <span><span className="font-medium">Notes:</span> {p.notes}</span>}
                            {p.approved_by_email && <span><span className="font-medium">Approved by:</span> {p.approved_by_email}</span>}
                            {(p.receipt_url || p.receipt_file) && (
                              <a href={imgSrc((p.receipt_url || p.receipt_file) ?? undefined)} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1 text-emerald-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                                <Receipt className="size-3" /> View Receipt
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          {pageCount > 1 && <Pagination page={page} pageCount={pageCount} total={filtered.length} onPage={setPage} />}
        </div>
      )}

      {property && (
        <RecordPaymentSlideOver open={showRecord} onClose={() => setShowRecord(false)}
          property={property} onRecorded={() => { onRefresh(); setShowRecord(false); }} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Log Inspection Slide-over
// ═══════════════════════════════════════════════════════════════════════════════

function LogInspectionSlideOver({ open, onClose, property, onLogged }: {
  open: boolean; onClose: () => void; property: Property; onLogged: () => void;
}) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", inspection_date: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.inspection_date) { toast.error("Name, phone, and date are required."); return; }
    setSaving(true);
    try {
      await api.siteInspections.create({
        name: form.name, phone: form.phone, email: form.email,
        inspection_date: form.inspection_date, notes: form.notes,
        linked_property: property.id, property_name: property.name,
      });
      toast.success("Inspection logged.");
      onLogged();
      setForm({ name: "", phone: "", email: "", inspection_date: "", notes: "" });
      onClose();
    } catch (err: any) { toast.error(err.message ?? "Failed to log inspection."); }
    finally { setSaving(false); }
  };

  return (
    <SlideOver open={open} onClose={onClose} title="Log Site Inspection">
      <div className="space-y-4">
        <div><label className={labelCls}>Prospect Name <span className="text-red-500">*</span></label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="Full name" /></div>
        <div><label className={labelCls}>Phone <span className="text-red-500">*</span></label>
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} placeholder="08012345678" /></div>
        <div><label className={labelCls}>Email</label>
          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} placeholder="email@example.com" /></div>
        <div><label className={labelCls}>Inspection Date <span className="text-red-500">*</span></label>
          <input type="date" value={form.inspection_date} onChange={(e) => set("inspection_date", e.target.value)} className={inputCls} /></div>
        <div><label className={labelCls}>Notes</label>
          <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3}
            className={`${inputCls} h-auto py-2`} placeholder="Additional notes…" /></div>
        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" disabled={saving} onClick={handleSubmit}>
          {saving ? <><Loader2 className="size-3.5 animate-spin" />Logging…</> : "Log Inspection"}
        </Button>
      </div>
    </SlideOver>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 4 — Site Inspections
// ═══════════════════════════════════════════════════════════════════════════════

function SiteInspectionsTab({ property, inspections, loading, onRefresh }: {
  property: Property; inspections: Inspection[]; loading: boolean; onRefresh: () => void;
}) {
  const navigate = useNavigate();
  const [showLog, setShowLog]         = useState(false);
  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage]               = useState(1);
  const PER_PAGE = 20;

  const filtered = inspections.filter((i) => {
    const q = search.toLowerCase();
    const matchQ = !q || i.name?.toLowerCase().includes(q) || i.phone?.includes(q);
    return matchQ && (!filterStatus || i.status === filterStatus);
  });
  const pageCount = Math.ceil(filtered.length / PER_PAGE);
  const paged     = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const updateStatus = async (id: string, status: string) => {
    try { await api.siteInspections.update(id, { status }); toast.success("Status updated."); onRefresh(); }
    catch (err: any) { toast.error(err.message ?? "Failed to update."); }
  };

  if (loading) return <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-[16px] font-semibold text-neutral-800">Site Inspections</h2>
        <Button onClick={() => setShowLog(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-[12px] gap-1.5">
          <Plus className="size-3.5" /> Log Inspection
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-neutral-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search prospect…"
            className="w-full h-9 pl-8 pr-3 rounded-lg border border-neutral-200 text-[13px] focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white" />
        </div>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-lg border border-neutral-200 text-[13px] bg-white focus:outline-none">
          <option value="">All Status</option>
          {["PENDING","ATTENDED","CANCELLED"].map((s) => <option key={s} value={s}>{s[0] + s.slice(1).toLowerCase()}</option>)}
        </select>
      </div>

      {paged.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
          <ClipboardList className="size-10 mb-3 opacity-40" />
          <p className="text-[14px] font-semibold">No inspections yet</p>
          <p className="text-[12px] mt-1">Log the first site inspection for this property.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  {["Prospect", "Phone", "Date", "Sales Rep", "Attendance", "Converted", "Action"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((ins) => (
                  <tr key={ins.id} className="border-b border-neutral-50 hover:bg-neutral-50/50">
                    <td className="px-4 py-3 font-medium text-neutral-800">
                      <div>{ins.name}</div>
                      <div className="text-[11px] text-neutral-400">{ins.email}</div>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{ins.phone}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-500 text-[12px]">{fmtDate(ins.inspection_date)}</td>
                    <td className="px-4 py-3 text-[12px] text-neutral-500 whitespace-nowrap">{ins.assigned_rep_name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <InspectionStatusBadge status={ins.status} />
                      {ins.status === "PENDING" && (
                        <div className="flex gap-1 mt-1">
                          <button onClick={() => updateStatus(ins.id, "ATTENDED")}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-medium">
                            Attended
                          </button>
                          <button onClick={() => updateStatus(ins.id, "CANCELLED")}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 hover:bg-neutral-200 font-medium">
                            No-Show
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {ins.is_converted ? (
                        <button onClick={() => navigate(`/customers/${ins.converted_customer}`)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700">
                          <CheckCircle2 className="size-3" /> Yes
                        </button>
                      ) : (
                        <span className="text-[11px] text-neutral-400">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => navigate(`/customers?search=${encodeURIComponent(ins.email)}`)}
                        className="text-emerald-600 hover:text-emerald-700 font-medium text-[12px] flex items-center gap-1 whitespace-nowrap">
                        <Eye className="size-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pageCount > 1 && <Pagination page={page} pageCount={pageCount} total={filtered.length} onPage={setPage} />}
        </div>
      )}

      <LogInspectionSlideOver open={showLog} onClose={() => setShowLog(false)}
        property={property} onLogged={() => { onRefresh(); setShowLog(false); }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 5 — Allocation
// ═══════════════════════════════════════════════════════════════════════════════

function AllocationPropertyTab({ subscriptions, loading, onRefresh }: {
  subscriptions: Subscription[]; loading: boolean; onRefresh: () => void;
}) {
  const [allocating, setAllocating] = useState<Subscription | null>(null);
  const [plotNumber, setPlotNumber] = useState("");
  const [allocDate, setAllocDate]   = useState(new Date().toISOString().slice(0, 10));
  const [letter, setLetter]         = useState<File | null>(null);
  const [notes, setNotes]           = useState("");
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState<string | null>(null);

  const completed = subscriptions.filter((s) => s.status === "COMPLETED");

  const handleAllocate = async () => {
    if (!allocating) return;
    if (!plotNumber.trim()) { toast.error("Plot number is required."); return; }
    if (!allocDate) { toast.error("Allocation date is required."); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("plot_number", plotNumber);
      fd.append("allocation_date", allocDate);
      fd.append("allocation_notes", notes);
      if (letter) fd.append("allocation_letter", letter);
      await api.subscriptions.allocate(allocating.id, fd);
      toast.success(`Plot ${plotNumber} allocated to ${allocating.customer_name}.`);
      setAllocating(null); setPlotNumber(""); setAllocDate(new Date().toISOString().slice(0, 10));
      setLetter(null); setNotes(""); onRefresh();
    } catch (err: any) { toast.error(err.message ?? "Allocation failed."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (sub: Subscription) => {
    if (!["PENDING", "ACTIVE", "DEFAULTING", "DEFAULTED"].includes(sub.status)) {
      toast.error("Only pending, active, or defaulting subscriptions can be deleted.");
      return;
    }
    setDeleting(sub.id);
    try {
      await api.subscriptions.delete(sub.id);
      toast.success("Subscription deleted.");
      onRefresh();
    } catch (err: any) { toast.error(err.message ?? "Failed to delete."); }
    finally { setDeleting(null); }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="size-5 animate-spin text-neutral-300" /></div>;

  const awaiting  = completed.filter((s) => !s.plot_number);
  const allocated = completed.filter((s) => !!s.plot_number);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Awaiting Allocation" value={awaiting.length}  icon={Clock}        color="amber"   sub="Completed, no plot" />
        <MetricCard label="Allocated"            value={allocated.length} icon={CheckCircle2} color="emerald" sub="Plot numbers assigned" />
        <MetricCard label="Total Completed"      value={completed.length} icon={MapPin}       color="blue"    sub="Fully paid subscriptions" />
      </div>

      <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-neutral-50">
          <p className="text-[12.5px] font-semibold text-neutral-700">Completed Subscriptions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-50 bg-neutral-50/60">
                {["Customer","Land Size","Allocation Status","Plot Name","Letter","Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {completed.map((s) => (
                <tr key={s.id} className="border-b border-neutral-50 hover:bg-neutral-50/40 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-[12.5px] font-semibold text-neutral-800">{s.customer_name}</p>
                    <p className="text-[11px] text-neutral-400">{s.customer_email}</p>
                  </td>
                  <td className="px-4 py-3 text-[12.5px] text-neutral-700 whitespace-nowrap">{s.land_size} SQM</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {s.plot_number ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="size-3" /> Allocated
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-700">
                        <Clock className="size-3" /> Awaiting
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[12.5px] text-neutral-700 whitespace-nowrap">{s.plot_number || <span className="text-neutral-300">—</span>}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {(s as any).allocation_letter ? (
                      <a href={(s as any).allocation_letter} target="_blank" rel="noopener noreferrer"
                        className="text-[12px] text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                        <Eye className="size-3" /> Download
                      </a>
                    ) : <span className="text-neutral-300 text-[12px]">—</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button disabled={!!s.plot_number} onClick={() => { setAllocating(s); setPlotNumber(""); }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11.5px] font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      Allocate
                    </button>
                  </td>
                </tr>
              ))}
              {completed.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[13px] text-neutral-400">No completed subscriptions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {allocating && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setAllocating(null)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-neutral-100">
                <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
                  <h2 className="text-[14px] font-semibold text-neutral-900">Allocate Plot</h2>
                  <button onClick={() => setAllocating(null)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-neutral-100">
                    <X className="w-4 h-4 text-neutral-500" /></button>
                </div>
                <div className="px-5 py-3 bg-emerald-50/50 border-b border-emerald-100">
                  <p className="text-[12.5px] font-semibold text-neutral-800">{allocating.customer_name}</p>
                  <p className="text-[11.5px] text-neutral-500">{allocating.land_size} SQM · {allocating.plan_name}</p>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className={labelCls}>Plot Number <span className="text-red-500">*</span></label>
                    <input value={plotNumber} onChange={(e) => setPlotNumber(e.target.value)} className={inputCls} placeholder="e.g. A-12, Block C Lot 4" />
                  </div>
                  <div>
                    <label className={labelCls}>Allocation Date <span className="text-red-500">*</span></label>
                    <input type="date" value={allocDate} onChange={(e) => setAllocDate(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Allocation Letter <span className="text-[11px] text-neutral-400">(PDF — recommended)</span></label>
                    <label className="block w-full border-2 border-dashed border-neutral-200 rounded-lg p-3 text-center cursor-pointer hover:border-emerald-400 transition-colors">
                      <Upload className="size-4 mx-auto mb-1 text-neutral-400" />
                      <span className="text-[11.5px] text-neutral-500">{letter ? letter.name : "Click to upload PDF"}</span>
                      <input type="file" accept=".pdf" className="hidden" onChange={(e) => setLetter(e.target.files?.[0] ?? null)} />
                    </label>
                  </div>
                  <div>
                    <label className={labelCls}>Notes <span className="text-[11px] text-neutral-400">(optional)</span></label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-[13px] focus:outline-none focus:ring-1 focus:ring-emerald-500/40 resize-none bg-white" />
                  </div>
                </div>
                <div className="px-5 py-4 border-t border-neutral-100 flex gap-2.5">
                  <Button onClick={handleAllocate} disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                    {saving ? <><Loader2 className="size-3.5 animate-spin" />Allocating…</> : "Confirm Allocation"}
                  </Button>
                  <Button variant="outline" onClick={() => setAllocating(null)}>Cancel</Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const TABS = [
  { key: "overview",      label: "Overview",         icon: LayoutGrid },
  { key: "subscriptions", label: "Subscriptions",    icon: Users },
  { key: "payments",      label: "Payment History",  icon: CreditCard },
  { key: "inspections",   label: "Site Inspections", icon: ClipboardList },
  { key: "allocation",    label: "Allocation",       icon: MapPin },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const workspace = useWorkspace();

  const [property, setProperty]           = useState<Property | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments]           = useState<Payment[]>([]);
  const [inspections, setInspections]     = useState<Inspection[]>([]);
  const [commissions, setCommissions]     = useState<any[]>([]);
  const [loadingProp, setLoadingProp]     = useState(true);
  const [loadingSubs, setLoadingSubs]     = useState(false);
  const [loadingPay, setLoadingPay]       = useState(false);
  const [loadingIns, setLoadingIns]       = useState(false);
  const [tab, setTab]                     = useState<TabKey>("overview");

  usePageTitle(property ? property.name : "Property");

  const loadProperty = useCallback(async () => {
    if (!id) return;
    setLoadingProp(true);
    try { setProperty(await api.properties.get(id)); }
    catch { toast.error("Failed to load property."); navigate("/properties"); }
    finally { setLoadingProp(false); }
  }, [id, navigate]);

  const loadSubs = useCallback(async () => {
    if (!id) return;
    setLoadingSubs(true);
    try {
      const all: any[] = await api.subscriptions.list({ property: id });
      setSubscriptions(all.filter((s) => s.property === id));
    } catch { setSubscriptions([]); }
    finally { setLoadingSubs(false); }
  }, [id]);

  const loadPay = useCallback(async () => {
    if (!id) return;
    setLoadingPay(true);
    try {
      const all: any[] = await api.payments.list({ property: id });
      setPayments(all.filter((p) => p.property_id === id));
    } catch { setPayments([]); }
    finally { setLoadingPay(false); }
  }, [id]);

  const loadIns = useCallback(async () => {
    if (!id) return;
    setLoadingIns(true);
    try {
      const all: any[] = await api.siteInspections.list();
      setInspections(all.filter((i: any) => i.linked_property === id));
    } catch { setInspections([]); }
    finally { setLoadingIns(false); }
  }, [id]);

  const loadComm = useCallback(async () => {
    if (!id) return;
    try {
      const all: any[] = await api.commissions.list({ property: id });
      setCommissions(all);
    } catch { setCommissions([]); }
  }, [id]);

  useEffect(() => { loadProperty(); }, [loadProperty]);
  useEffect(() => {
    if (!loadingProp && id) { loadSubs(); loadPay(); loadIns(); loadComm(); }
  }, [loadingProp, id, loadSubs, loadPay, loadIns, loadComm]);

  const workspaceSlug = workspace?.slug ?? localStorage.getItem("tt_workspace_slug") ?? "";

  if (loadingProp) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-52 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      </div>
    );
  }
  if (!property) return null;

  return (
    <PaymentTabCtx.Provider value={{ property }}>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/properties")}
              className="w-9 h-9 rounded-lg border border-neutral-200 bg-white flex items-center justify-center hover:bg-neutral-50 shadow-sm">
              <ArrowLeft className="w-4 h-4 text-neutral-600" />
            </button>
            <div>
              <nav className="flex items-center gap-1.5 text-[12px] text-neutral-400 mb-0.5">
                <Link to="/properties" className="hover:text-neutral-600">Properties</Link>
                <span>›</span>
                <span className="text-neutral-600 font-medium">{property.name}</span>
              </nav>
              <h1 className="text-xl font-bold text-neutral-900">{property.name}</h1>
              {property.location && (
                <p className="text-[12px] text-neutral-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="size-3" />
                  {[property.location.city, property.location.state].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {property.status === "PUBLISHED" && workspaceSlug && (
              <Button variant="outline" size="sm" className="text-[12px] h-8 gap-1.5"
                onClick={() => window.open(`/estates/${workspaceSlug}/${property.id}`, "_blank")}>
                <ExternalLink className="w-3.5 h-3.5" /> View Estate Page
              </Button>
            )}
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-8 gap-1.5"
              onClick={() => navigate(`/properties/${id}/edit`)}>
              <Pencil className="w-3.5 h-3.5" /> Edit Property
            </Button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-neutral-100/70 rounded-xl p-1 w-fit flex-wrap">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12.5px] font-semibold transition-all ${tab === key ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}>
              <Icon className="size-3.5" />{label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            {tab === "overview"      && <OverviewTab property={property} subscriptions={subscriptions} payments={payments} commissions={commissions} />}
            {tab === "subscriptions" && <SubscriptionsTab property={property} subscriptions={subscriptions} loading={loadingSubs} onRefresh={loadSubs} onViewCustomer={(cid) => navigate(`/customers/${cid}`)} />}
            {tab === "payments"      && <PaymentHistoryTab payments={payments} loading={loadingPay} onRefresh={loadPay} />}
            {tab === "inspections"   && <SiteInspectionsTab property={property} inspections={inspections} loading={loadingIns} onRefresh={loadIns} />}
            {tab === "allocation"    && <AllocationPropertyTab subscriptions={subscriptions} loading={loadingSubs} onRefresh={loadSubs} />}
          </motion.div>
        </AnimatePresence>

        <div className="pb-8" />
      </div>
    </PaymentTabCtx.Provider>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, User, Phone, Mail, MapPin, Calendar,
  Building2, TrendingUp, DollarSign, AlertTriangle,
  CheckCircle2, Clock, XCircle, Pencil, Loader2,
  AlertCircle, ClipboardList, X, Save, Search, UserCheck,
} from "lucide-react";
import { api } from "../services/api";
import { useWorkspaceRole } from "../hooks/useWorkspaceRole";
import { usePageTitle } from "../hooks/usePageTitle";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Subscription {
  id: string;
  property_name: string;
  land_size: string;
  plan_name: string;
  payment_type: string;
  locked_price: string;
  amount_paid: string;
  balance: string;
  status: string;
  next_due_date: string | null;
  start_date?: string;
  monthly_installment?: string;
  duration_months?: number;
}

interface SiteInspection {
  id: string;
  property_name: string;
  inspection_date: string;
  inspection_time: string | null;
  inspection_type: string;
  status: string;
  persons: number;
  notes: string;
}

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address?: string;
  next_of_kin_name?: string;
  next_of_kin_phone?: string;
  next_of_kin_relationship?: string;
  referral_source?: string;
  referral_code?: string;
  primary_subscription: Subscription | null;
  subscriptions?: Subscription[];
  active_subscriptions: number;
  completed_subscriptions: number;
  defaulting_subscriptions: number;
  cancelled_subscriptions?: number;
  assigned_rep?: string;
  assigned_rep_name?: string;
  sales_rep_name?: string;
  customer_rep_name?: string;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (v?: string | number | null) =>
  v == null || v === "" ? "—" : `₦${Number(v).toLocaleString("en-NG")}`;

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—";

const avatarColors = [
  ["bg-[#d6e0f5]", "text-[#0E2C72]"],
  ["bg-blue-100", "text-blue-700"],
  ["bg-violet-100", "text-violet-700"],
  ["bg-amber-100", "text-amber-700"],
  ["bg-rose-100", "text-rose-700"],
];
const avatarColor = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length];

// ── Status badge ──────────────────────────────────────────────────────────────

function SubStatusBadge({ status }: { status?: string }) {
  const map: Record<string, { cls: string; icon: React.ElementType; label: string }> = {
    ACTIVE:     { cls: "bg-[#d6e0f5] text-[#0E2C72]", icon: CheckCircle2, label: "Active" },
    COMPLETED:  { cls: "bg-blue-100 text-blue-700",       icon: CheckCircle2, label: "Completed" },
    DEFAULTING: { cls: "bg-red-100 text-red-700",         icon: AlertTriangle, label: "Defaulting" },
    CANCELLED:  { cls: "bg-neutral-100 text-neutral-500", icon: XCircle, label: "Cancelled" },
    PENDING:    { cls: "bg-amber-100 text-amber-700",     icon: Clock, label: "Pending" },
  };
  const key = (status ?? "").toUpperCase();
  const cfg = map[key] ?? map["PENDING"];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${cfg.cls}`}>
      <Icon className="size-3" /> {cfg.label}
    </span>
  );
}

function InspectionStatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    PENDING:   { cls: "bg-amber-100 text-amber-700",   label: "Pending" },
    ATTENDED:  { cls: "bg-[#d6e0f5] text-[#0E2C72]", label: "Attended" },
    CANCELLED: { cls: "bg-red-100 text-red-600",        label: "Cancelled" },
  };
  const cfg = map[status] ?? map["PENDING"];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color, sub,
}: {
  label: string; value: string | number; icon: React.ElementType;
  color: "emerald" | "blue" | "violet" | "amber" | "red"; sub?: string;
}) {
  const c = {
    emerald: "bg-[#0E2C72]/6 text-[#0E2C72]",
    blue:    "bg-blue-50 text-blue-600",
    violet:  "bg-violet-50 text-violet-600",
    amber:   "bg-amber-50 text-amber-600",
    red:     "bg-red-50 text-red-600",
  }[color];
  const accent = {
    emerald: "bg-[#1a3d8f]",
    blue:    "bg-blue-500",
    violet:  "bg-violet-500",
    amber:   "bg-amber-500",
    red:     "bg-red-500",
  }[color];
  return (
    <div className="relative bg-white rounded-xl border border-neutral-100 p-4 flex items-start gap-3 shadow-sm overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent}`} />
      <div className={`p-2.5 rounded-xl shrink-0 ${c}`}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">{label}</p>
        <p className="text-[20px] font-bold text-neutral-900 leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-neutral-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditCustomerModal({
  customer,
  onClose,
  onSaved,
}: {
  customer: Customer;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    full_name:              customer.full_name ?? "",
    email:                  customer.email ?? "",
    phone:                  customer.phone ?? "",
    address:                customer.address ?? "",
    next_of_kin_name:       customer.next_of_kin_name ?? "",
    next_of_kin_phone:      customer.next_of_kin_phone ?? "",
    next_of_kin_relationship: customer.next_of_kin_relationship ?? "",
    referral_source:        customer.referral_source ?? "",
    referral_code:          customer.referral_code ?? "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.full_name.trim()) { toast.error("Name is required."); return; }
    setSaving(true);
    try {
      await api.customers.update(customer.id, form);
      toast.success("Customer updated.");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update customer.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full h-9 px-3 rounded-lg border border-neutral-200 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#1a3d8f]/40 focus:border-[#2a52a8]";
  const labelCls = "text-[12px] font-medium text-neutral-600 block mb-1.5";
  const sectionCls = "text-[11px] font-semibold text-neutral-400 uppercase tracking-wider pb-2 border-b border-neutral-100 mb-3";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-neutral-100 flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 shrink-0">
          <h2 className="font-semibold text-neutral-900">Edit Customer</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-neutral-100">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {/* Section 1: Personal Info */}
          <div>
            <p className={sectionCls}>Personal Information</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className={inputCls} placeholder="e.g. Adebayo Okafor" />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} placeholder="email@example.com" />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} placeholder="+234..." />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Address</label>
                <input type="text" value={form.address} onChange={(e) => set("address", e.target.value)} className={inputCls} placeholder="Street, city, state" />
              </div>
            </div>
          </div>

          {/* Section 2: Next of Kin */}
          <div>
            <p className={sectionCls}>Next of Kin</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Full Name</label>
                <input type="text" value={form.next_of_kin_name} onChange={(e) => set("next_of_kin_name", e.target.value)} className={inputCls} placeholder="Next of kin name" />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input type="tel" value={form.next_of_kin_phone} onChange={(e) => set("next_of_kin_phone", e.target.value)} className={inputCls} placeholder="+234..." />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Relationship</label>
                <select value={form.next_of_kin_relationship} onChange={(e) => set("next_of_kin_relationship", e.target.value)} className={inputCls}>
                  <option value="">Select relationship</option>
                  {["Spouse", "Parent", "Sibling", "Child", "Friend", "Other"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Referral */}
          <div>
            <p className={sectionCls}>Referral</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Referral Source</label>
                <select value={form.referral_source} onChange={(e) => set("referral_source", e.target.value)} className={inputCls}>
                  <option value="">Select source</option>
                  {["Social Media", "Friend / Family", "Sales Rep", "Event", "Website", "Other"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Referral Code</label>
                <input type="text" value={form.referral_code} onChange={(e) => set("referral_code", e.target.value)} className={inputCls} placeholder="e.g. REF-0012" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-neutral-100 shrink-0">
          <Button variant="outline" onClick={onClose} className="text-[13px] h-9">Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-[#0E2C72] hover:bg-[#0a2260] text-white text-[13px] h-9 gap-1.5">
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</> : <><Save className="w-3.5 h-3.5" />Save Changes</>}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Assign Sales Rep Modal ────────────────────────────────────────────────────

const inputClsCD = "w-full h-9 px-3 rounded-lg border border-neutral-200 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#1a3d8f]/40 focus:border-[#2a52a8]";
const labelClsCD = "text-[12px] font-medium text-neutral-600 block mb-1.5";

function AssignSalesRepModal({
  customer,
  onClose,
  onAssigned,
}: {
  customer: Customer;
  onClose: () => void;
  onAssigned: (repId: string | null, repName: string | null) => void;
}) {
  const [reps, setReps]             = useState<any[]>([]);
  const [loadingReps, setLoadingReps] = useState(true);
  const [search, setSearch]         = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    api.salesReps.list()
      .then((all: any[]) => setReps(all))
      .catch(() => setReps([]))
      .finally(() => setLoadingReps(false));
  }, []);

  const filtered = reps.filter((r) => {
    const q = search.toLowerCase();
    return !q ||
      (r.name ?? "").toLowerCase().includes(q) ||
      (r.referral_code ?? "").toLowerCase().includes(q);
  });

  const handleAssign = async () => {
    setSaving(true);
    try {
      await api.customers.update(customer.id, { assigned_rep: selectedId });
      const rep = reps.find((r) => r.id === selectedId);
      const repName = rep ? rep.name : null;
      toast.success(selectedId ? "Sales rep assigned." : "Sales rep unassigned.");
      onAssigned(selectedId, repName);
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to assign sales rep.");
    } finally {
      setSaving(false);
    }
  };

  const currentRepName = customer.sales_rep_name ?? customer.assigned_rep_name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-neutral-100 flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 shrink-0">
          <h2 className="font-semibold text-neutral-900">Assign Sales Rep</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-neutral-100">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {currentRepName && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#0E2C72]/6 rounded-lg border border-[#8aaad8]">
              <UserCheck className="w-3.5 h-3.5 text-[#0E2C72] shrink-0" />
              <span className="text-[12px] text-[#0E2C72]">
                Currently assigned: <span className="font-semibold">{currentRepName}</span>
              </span>
            </div>
          )}

          <div>
            <label className={labelClsCD}>Search Sales Reps</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name or referral code…"
                className={`${inputClsCD} pl-8`}
              />
            </div>
          </div>

          {loadingReps ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-[12px] text-neutral-400 text-center py-4">No sales reps found.</p>
          ) : (
            <div className="space-y-1 max-h-52 overflow-y-auto">
              {filtered.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(selectedId === r.id ? null : r.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                    selectedId === r.id
                      ? "border-[#0E2C72] bg-[#0E2C72]/6"
                      : "border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  <p className="text-[13px] font-medium text-neutral-800">{r.name}</p>
                  {r.referral_code && (
                    <p className="text-[11px] text-neutral-400">Code: {r.referral_code}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-neutral-100 shrink-0">
          <Button variant="outline" onClick={onClose} className="text-[13px] h-9">Cancel</Button>
          {customer.assigned_rep && (
            <Button
              variant="outline"
              onClick={async () => {
                setSaving(true);
                try {
                  await api.customers.update(customer.id, { assigned_rep: null });
                  toast.success("Sales rep unassigned.");
                  onAssigned(null, null);
                  onClose();
                } catch (err: any) {
                  toast.error(err.message ?? "Failed to unassign.");
                } finally { setSaving(false); }
              }}
              disabled={saving}
              className="text-[13px] h-9 text-red-600 border-red-200 hover:bg-red-50"
            >
              Unassign
            </Button>
          )}
          <Button
            onClick={handleAssign}
            disabled={saving || !selectedId}
            className="bg-[#0E2C72] hover:bg-[#0a2260] text-white text-[13px] h-9 gap-1.5"
          >
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</> : "Assign"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ customer, isAdmin, onAssignRep }: { customer: Customer; isAdmin?: boolean; onAssignRep?: () => void }) {
  const sub = customer.primary_subscription;
  const salesRepValue = customer.sales_rep_name ?? customer.assigned_rep_name ?? null;

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="bg-white rounded-xl border border-neutral-100 p-5 shadow-sm">
        <h3 className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-4">Customer Profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: User,     label: "Full Name",   value: customer.full_name },
            { icon: Mail,     label: "Email",       value: customer.email },
            { icon: Phone,    label: "Phone",       value: customer.phone || "—" },
            { icon: MapPin,   label: "Address",     value: customer.address || "—" },
            { icon: Calendar, label: "Date Added",  value: fmtDate(customer.created_at) },
            ...(customer.next_of_kin_name ? [
              { icon: User,  label: "Next of Kin",  value: `${customer.next_of_kin_name}${customer.next_of_kin_relationship ? ` (${customer.next_of_kin_relationship})` : ""}` },
              { icon: Phone, label: "Kin Phone",    value: customer.next_of_kin_phone || "—" },
            ] : []),
            ...(customer.referral_source ? [{ icon: User, label: "Referred Via", value: customer.referral_source }] : []),
            ...(customer.referral_code   ? [{ icon: User, label: "Referral Code", value: customer.referral_code }]   : []),
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-neutral-100 mt-0.5 shrink-0">
                <Icon className="size-3.5 text-neutral-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-neutral-400 font-medium">{label}</p>
                <p className="text-[13px] font-semibold text-neutral-800 break-all">{value}</p>
              </div>
            </div>
          ))}

          {/* Sales Rep row with assign button */}
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-neutral-100 mt-0.5 shrink-0">
              <User className="size-3.5 text-neutral-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-neutral-400 font-medium">Sales Rep</p>
              <div className="flex items-center gap-2">
                <p className={`text-[13px] font-semibold ${salesRepValue ? "text-neutral-800" : "text-neutral-400 italic"}`}>
                  {salesRepValue ?? "Unassigned"}
                </p>
                {isAdmin && onAssignRep && (
                  <button
                    onClick={onAssignRep}
                    className="shrink-0 w-5 h-5 rounded flex items-center justify-center hover:bg-neutral-200 transition-colors"
                    title="Assign sales rep"
                  >
                    <Pencil className="w-3 h-3 text-neutral-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription summary stats */}
      <div>
        <h3 className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">Subscription Overview</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Active"     value={customer.active_subscriptions}     icon={CheckCircle2}  color="emerald" />
          <StatCard label="Completed"  value={customer.completed_subscriptions}  icon={TrendingUp}    color="blue"    />
          <StatCard label="Defaulting" value={customer.defaulting_subscriptions} icon={AlertTriangle} color="red"     />
          <StatCard label="Cancelled"  value={customer.cancelled_subscriptions ?? 0} icon={XCircle}  color="violet"  />
        </div>
      </div>

      {/* Primary subscription details */}
      {sub && (
        <div className="bg-white rounded-xl border border-neutral-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider">Primary Subscription</h3>
            <SubStatusBadge status={sub.status} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Property",        value: sub.property_name || "—" },
              { label: "Land Size",       value: sub.land_size ? `${sub.land_size} sqm` : "—" },
              { label: "Plan",            value: sub.plan_name || "—" },
              { label: "Payment Type",    value: sub.payment_type === "INSTALLMENT" ? "Installment" : "Outright" },
              { label: "Locked Price",    value: fmt(sub.locked_price), highlight: false },
              { label: "Amount Paid",     value: fmt(sub.amount_paid), highlight: "emerald" as const },
              { label: "Balance",         value: fmt(sub.balance),     highlight: parseFloat(sub.balance || "0") > 0 ? "red" as const : false },
              { label: "Next Due Date",   value: fmtDate(sub.next_due_date) },
              ...(sub.monthly_installment ? [{ label: "Monthly Installment", value: fmt(sub.monthly_installment), highlight: false as const }] : []),
              ...(sub.duration_months ? [{ label: "Duration", value: `${sub.duration_months} months`, highlight: false as const }] : []),
            ].map(({ label, value, highlight }) => (
              <div key={label}>
                <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wide">{label}</p>
                <p className={`text-[13px] font-semibold mt-0.5 ${
                  highlight === "emerald" ? "text-[#0E2C72]" :
                  highlight === "red"     ? "text-red-600" :
                  "text-neutral-800"
                }`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Subscriptions Tab ─────────────────────────────────────────────────────────

function SubscriptionsTab({ customer }: { customer: Customer }) {
  const subs: Subscription[] = customer.subscriptions?.length
    ? customer.subscriptions
    : customer.primary_subscription
    ? [customer.primary_subscription]
    : [];

  if (subs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
        <Building2 className="size-10 mb-3 opacity-40" />
        <p className="text-[14px] font-semibold">No subscriptions yet</p>
        <p className="text-[12px] mt-1">This customer has no property subscriptions</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {subs.map((sub, i) => (
        <div key={sub.id ?? i} className="bg-white rounded-xl border border-neutral-100 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-50">
                <Building2 className="size-4 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-neutral-900 text-[14px]">{sub.property_name || "—"}</p>
                <p className="text-[11.5px] text-neutral-400">{sub.plan_name} · {sub.land_size ? `${sub.land_size} sqm` : "—"}</p>
              </div>
            </div>
            <SubStatusBadge status={sub.status} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-0.5">Locked Price</p>
              <p className="text-[13px] font-semibold text-neutral-800">{fmt(sub.locked_price)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-0.5">Amount Paid</p>
              <p className="text-[13px] font-semibold text-[#0E2C72]">{fmt(sub.amount_paid)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-0.5">Balance</p>
              <p className={`text-[13px] font-semibold ${parseFloat(sub.balance || "0") > 0 ? "text-red-600" : "text-neutral-700"}`}>{fmt(sub.balance)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-0.5">Next Due</p>
              <p className="text-[13px] font-semibold text-neutral-700">{fmtDate(sub.next_due_date)}</p>
            </div>
          </div>
          {sub.payment_type === "INSTALLMENT" && sub.monthly_installment && (
            <div className="mt-3 pt-3 border-t border-neutral-50 flex items-center justify-between">
              <span className="text-[12px] text-neutral-500">Monthly installment: <span className="font-semibold text-neutral-800">{fmt(sub.monthly_installment)}</span></span>
              {sub.duration_months && (
                <span className="text-[12px] text-neutral-500">{sub.duration_months} months</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Site Inspections Tab ──────────────────────────────────────────────────────

function InspectionsTab({ customer }: { customer: Customer }) {
  const [inspections, setInspections] = useState<SiteInspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.siteInspections.list()
      .then((all: any[]) => {
        const mine = all.filter(
          (i: any) =>
            i.email?.toLowerCase() === customer.email?.toLowerCase() ||
            i.name?.toLowerCase() === customer.full_name?.toLowerCase()
        );
        setInspections(mine);
      })
      .catch(() => setInspections([]))
      .finally(() => setLoading(false));
  }, [customer.email, customer.full_name]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-white rounded-xl border border-neutral-100 p-4 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-neutral-100 rounded w-3/4" />
              <div className="h-2 bg-neutral-100 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (inspections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
        <ClipboardList className="size-10 mb-3 opacity-40" />
        <p className="text-[14px] font-semibold">No site inspections</p>
        <p className="text-[12px] mt-1">Inspections linked to this customer will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {inspections.map((ins) => (
        <div key={ins.id} className="bg-white rounded-xl border border-neutral-100 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-50">
                <ClipboardList className="size-3.5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-neutral-900 text-[13px]">{ins.property_name || "—"}</p>
                <p className="text-[11.5px] text-neutral-400">
                  {ins.inspection_type === "PHYSICAL" ? "Physical" : "Virtual"} · {ins.persons} person{ins.persons !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <InspectionStatusBadge status={ins.status} />
          </div>
          <div className="flex items-center gap-4 mt-2 text-[12px] text-neutral-500">
            <span className="flex items-center gap-1">
              <Calendar className="size-3" /> {fmtDate(ins.inspection_date)}
            </span>
            {ins.inspection_time && (
              <span className="flex items-center gap-1">
                <Clock className="size-3" /> {ins.inspection_time}
              </span>
            )}
          </div>
          {ins.notes && (
            <p className="mt-2 text-[12px] text-neutral-500 italic">{ins.notes}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const TABS = [
  { key: "overview",      label: "Overview",        icon: User },
  { key: "subscriptions", label: "Subscriptions",   icon: Building2 },
  { key: "inspections",   label: "Site Inspections",icon: ClipboardList },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useWorkspaceRole();

  const [customer, setCustomer]   = useState<Customer | null>(null);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<TabKey>("overview");
  const [showEdit, setShowEdit]   = useState(false);
  const [showAssignRep, setShowAssignRep] = useState(false);

  const isAdmin = role === "OWNER" || role === "ADMIN";

  usePageTitle(customer ? customer.full_name : "Customer");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.customers.get(id);
      setCustomer(data);
    } catch {
      toast.error("Failed to load customer details.");
      navigate("/customers");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!roleLoading) load();
  }, [roleLoading, load]);

  if (!roleLoading && role === "SALES_REP") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="size-8 text-red-400" />
        <p className="text-[14px] font-semibold text-neutral-700">Access Denied</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!customer) return null;

  const [bgCls, txtCls] = avatarColor(customer.full_name);
  const initials = customer.full_name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  const sub = customer.primary_subscription;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

      {/* Back + Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/customers")}
            className="w-9 h-9 rounded-lg border border-neutral-200 bg-white flex items-center justify-center hover:bg-neutral-50 transition-colors shadow-sm">
            <ArrowLeft className="w-4 h-4 text-neutral-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${bgCls} ${txtCls} flex items-center justify-center text-[15px] font-bold shrink-0`}>
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-neutral-900">{customer.full_name}</h1>
                {sub && <SubStatusBadge status={sub.status} />}
              </div>
              <p className="text-[12px] text-neutral-500 mt-0.5">{customer.email}</p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowAssignRep(true)} className="text-[12px] h-8 gap-1.5">
              <UserCheck className="w-3.5 h-3.5" /> Assign Sales Rep
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowEdit(true)} className="text-[12px] h-8 gap-1.5">
              <Pencil className="w-3.5 h-3.5" /> Edit Customer
            </Button>
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Active Subs"     value={customer.active_subscriptions}     icon={CheckCircle2}  color="emerald" />
        <StatCard label="Completed"       value={customer.completed_subscriptions}  icon={TrendingUp}    color="blue"    />
        <StatCard label="Defaulting"      value={customer.defaulting_subscriptions} icon={AlertTriangle} color="red"     />
        <StatCard
          label="Amount Paid"
          value={sub ? fmt(sub.amount_paid) : "—"}
          icon={DollarSign}
          color="violet"
          sub={sub ? `Balance: ${fmt(sub.balance)}` : undefined}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100/70 rounded-xl p-1 w-fit flex-wrap">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12.5px] font-semibold transition-all ${
              tab === key ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
            }`}>
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
          {tab === "overview"      && <OverviewTab      customer={customer} isAdmin={isAdmin} onAssignRep={() => setShowAssignRep(true)} />}
          {tab === "subscriptions" && <SubscriptionsTab customer={customer} />}
          {tab === "inspections"   && <InspectionsTab   customer={customer} />}
        </motion.div>
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {showEdit && (
          <EditCustomerModal
            customer={customer}
            onClose={() => setShowEdit(false)}
            onSaved={() => { load(); setShowEdit(false); }}
          />
        )}
      </AnimatePresence>

      {/* Assign Sales Rep modal */}
      <AnimatePresence>
        {showAssignRep && (
          <AssignSalesRepModal
            customer={customer}
            onClose={() => setShowAssignRep(false)}
            onAssigned={(repId, repName) => {
              setCustomer((c) => c ? { ...c, assigned_rep: repId ?? undefined, assigned_rep_name: repName ?? undefined, sales_rep_name: repName ?? undefined } : c);
            }}
          />
        )}
      </AnimatePresence>

      <div className="pb-8" />
    </div>
  );
}



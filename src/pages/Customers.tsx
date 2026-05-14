import { useState, useEffect, useCallback, Fragment } from "react";
import { useNavigate } from "react-router";
import { usePolling } from "../hooks/usePolling";
import { usePageTitle } from "../hooks/usePageTitle";
import { useWorkspaceRole } from "../hooks/useWorkspaceRole";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Users as UsersIcon,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Building2,
  CalendarPlus,
  Trash2,
} from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { api } from "../services/api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { motion } from "motion/react";
import { EmptyState } from "../components/ui/empty-state";
import { toast } from "sonner";
import { TablePagination } from "../components/ui/TablePagination";

// ─── Animation variants ────────────────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
} as const;
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 26 } },
} as const;

// ─── Avatar helpers ────────────────────────────────────────────────────────────
const avatarColors = [
  ["bg-[#d6e0f5]", "text-[#0E2C72]"],
  ["bg-blue-100",    "text-blue-700"],
  ["bg-violet-100",  "text-violet-700"],
  ["bg-amber-100",   "text-amber-700"],
  ["bg-rose-100",    "text-rose-700"],
  ["bg-cyan-100",    "text-cyan-700"],
];
const avatarColor = (name: string) =>
  avatarColors[name.charCodeAt(0) % avatarColors.length];

// ─── Subscription status config ────────────────────────────────────────────────
type SubStatus = "ACTIVE" | "COMPLETED" | "DEFAULTING" | "CANCELLED";

const STATUS_CONFIG: Record<SubStatus, { label: string; cls: string; dot?: string; icon?: React.ReactNode }> = {
  ACTIVE:     { label: "Active",     cls: "bg-[#0E2C72]/6 text-[#0E2C72] border-[#0E2C72]/15", dot: "bg-[#1a3d8f]" },
  COMPLETED:  { label: "Completed",  cls: "bg-blue-50 text-blue-700 border-blue-100" },
  DEFAULTING: { label: "Defaulting", cls: "bg-red-50 text-red-600 border-red-100" },
  CANCELLED:  { label: "Cancelled",  cls: "bg-neutral-100 text-neutral-500 border-neutral-200" },
};

function subStatusConfig(val?: string | null) {
  if (!val) return null;
  return STATUS_CONFIG[val.toUpperCase() as SubStatus] ?? null;
}


// ─── Filter options ────────────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { value: "ALL",        label: "All" },
  { value: "ACTIVE",     label: "Active" },
  { value: "COMPLETED",  label: "Completed" },
  { value: "DEFAULTING", label: "Defaulting" },
  { value: "CANCELLED",  label: "Cancelled" },
];

// ─── Currency formatter ────────────────────────────────────────────────────────
const fmt = (n: number | string | null | undefined) =>
  n == null || n === "" ? "—" : `₦${Number(n).toLocaleString("en-NG")}`;

// ─── Dash helper ──────────────────────────────────────────────────────────────
const dash = (v: string | number | null | undefined) =>
  v == null || v === "" ? "—" : String(v);

// ─── Date formatter ───────────────────────────────────────────────────────────
const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—";

// ─── Add Customer Modal ───────────────────────────────────────────────────────
interface AddCustomerModalProps {
  onClose: () => void;
  onCreated: () => void;
}


const REFERRAL_SOURCES = [
  { value: "WALK_IN",      label: "Walk-in" },
  { value: "REFERRAL",     label: "Referral" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "WEBSITE",      label: "Website" },
  { value: "AGENT",        label: "Agent" },
  { value: "OTHER",        label: "Other" },
];

const NOK_RELATIONSHIPS = ["Spouse", "Parent", "Child", "Sibling", "Friend", "Colleague", "Other"];

function AddCustomerModal({ onClose, onCreated }: AddCustomerModalProps) {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", address: "",
    next_of_kin_name: "", next_of_kin_phone: "", next_of_kin_relationship: "",
    referral_source: "WALK_IN", referral_code: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required.";
    if (!form.email.trim()) e.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (!form.phone.trim()) e.phone = "Phone number is required.";
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const payload: any = {
        full_name:   form.full_name.trim(),
        email:       form.email.trim().toLowerCase(),
        phone:       form.phone.trim(),
      };
      if (form.address.trim())                 payload.address = form.address.trim();
      if (form.next_of_kin_name.trim())        payload.next_of_kin_name = form.next_of_kin_name.trim();
      if (form.next_of_kin_phone.trim())       payload.next_of_kin_phone = form.next_of_kin_phone.trim();
      if (form.next_of_kin_relationship.trim()) payload.next_of_kin_relationship = form.next_of_kin_relationship.trim();
      if (form.referral_source.trim())         payload.referral_source = form.referral_source.trim();
      if (form.referral_code.trim())           payload.referral_code = form.referral_code.trim();

      await api.customers.create(payload);
      toast.success(`Customer "${form.full_name}" added successfully.`);
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to add customer. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = (hasError?: boolean) =>
    `w-full px-3 py-2 border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]/30 focus:border-[#2a52a8] transition-colors ${
      hasError ? "border-red-400 bg-red-50" : "border-neutral-300 bg-white"
    }`;

  const lbl = "block text-[12px] font-medium text-neutral-700 mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <h3 className="text-[15px] font-semibold text-neutral-900">Add Customer</h3>
            <p className="text-[12px] text-neutral-400 mt-0.5">Fill in the customer's details across all three sections.</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">

          {/* ── Section 1: Personal Information ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#0E2C72] text-white text-[10px] font-bold flex items-center justify-center shrink-0">1</div>
              <p className="text-[12px] font-bold text-neutral-700 uppercase tracking-wider">Personal Information</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-7">
              <div className="sm:col-span-2">
                <label className={lbl}>Full Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.full_name} onChange={(e) => set("full_name", e.target.value)}
                  placeholder="e.g. John Adebayo" className={inputCls(!!errors.full_name)} />
                {errors.full_name && <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.full_name}</p>}
              </div>
              <div>
                <label className={lbl}>Email <span className="text-red-500">*</span></label>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                  placeholder="john@example.com" className={inputCls(!!errors.email)} />
                {errors.email && <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.email}</p>}
              </div>
              <div>
                <label className={lbl}>Phone <span className="text-red-500">*</span></label>
                <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                  placeholder="08012345678" className={inputCls(!!errors.phone)} />
                {errors.phone && <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.phone}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={lbl}>Address <span className="text-neutral-400 text-[11px] font-normal">(optional)</span></label>
                <input type="text" value={form.address} onChange={(e) => set("address", e.target.value)}
                  placeholder="e.g. 12 Allen Ave, Ikeja" className={inputCls()} />
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-100" />

          {/* ── Section 2: Next of Kin ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#0E2C72] text-white text-[10px] font-bold flex items-center justify-center shrink-0">2</div>
              <p className="text-[12px] font-bold text-neutral-700 uppercase tracking-wider">Next of Kin <span className="normal-case text-neutral-400 font-normal text-[11px]">(optional)</span></p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-7">
              <div>
                <label className={lbl}>Full Name</label>
                <input type="text" value={form.next_of_kin_name} onChange={(e) => set("next_of_kin_name", e.target.value)}
                  placeholder="e.g. Jane Adebayo" className={inputCls()} />
              </div>
              <div>
                <label className={lbl}>Phone Number</label>
                <input type="tel" value={form.next_of_kin_phone} onChange={(e) => set("next_of_kin_phone", e.target.value)}
                  placeholder="08011112222" className={inputCls()} />
              </div>
              <div>
                <label className={lbl}>Relationship</label>
                <select value={form.next_of_kin_relationship} onChange={(e) => set("next_of_kin_relationship", e.target.value)}
                  className={inputCls()}>
                  <option value="">Select…</option>
                  {NOK_RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-100" />

          {/* ── Section 3: Referral Information ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#0E2C72] text-white text-[10px] font-bold flex items-center justify-center shrink-0">3</div>
              <p className="text-[12px] font-bold text-neutral-700 uppercase tracking-wider">Referral Information</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-7">
              <div>
                <label className={lbl}>How did they hear about us?</label>
                <select value={form.referral_source} onChange={(e) => set("referral_source", e.target.value)}
                  className={inputCls()}>
                  {REFERRAL_SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Referral Code <span className="text-neutral-400 text-[11px] font-normal">(if any)</span></label>
                <input type="text" value={form.referral_code} onChange={(e) => set("referral_code", e.target.value)}
                  placeholder="e.g. REF-AGENT-001" className={inputCls()} />
              </div>
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="flex gap-2.5 px-6 pb-6 pt-4 border-t border-neutral-100">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-neutral-200 text-neutral-700 rounded-lg text-[13px] font-medium hover:bg-neutral-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 px-4 py-2.5 bg-[#0E2C72] text-white rounded-lg text-[13px] font-medium hover:bg-[#0a2260] disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : "Add Customer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Subscription Modal ───────────────────────────────────────────────────
interface AddSubscriptionModalProps {
  customerId: string;
  customerName: string;
  onClose: () => void;
  onCreated: () => void;
}

function AddSubscriptionModal({ customerId, customerName, onClose, onCreated }: AddSubscriptionModalProps) {
  const [properties, setProperties]           = useState<any[]>([]);
  const [loadingProps, setLoadingProps]       = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [pricingPlans, setPricingPlans]       = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans]       = useState(false);
  const [selectedPlanId, setSelectedPlanId]   = useState("");
  const [notes, setNotes]                     = useState("");
  const [saving, setSaving]                   = useState(false);
  const [error, setError]                     = useState("");

  useEffect(() => {
    api.properties.list()
      .then((data: any[]) => setProperties(data))
      .catch(() => {})
      .finally(() => setLoadingProps(false));
  }, []);

  const handlePropertyChange = async (propId: string) => {
    setSelectedPropertyId(propId);
    setSelectedPlanId("");
    setPricingPlans([]);
    if (!propId) return;
    setLoadingPlans(true);
    try {
      const prop = await api.properties.get(propId);
      setPricingPlans(prop.pricing_plans ?? []);
    } catch { /* silent */ }
    finally { setLoadingPlans(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!selectedPropertyId) { setError("Please select a property."); return; }
    if (!selectedPlanId) { setError("Please select a pricing plan."); return; }
    setSaving(true);
    try {
      await api.subscriptions.create({
        customer_id: customerId,
        property_id: selectedPropertyId,
        pricing_plan_id: selectedPlanId,
        notes,
      });
      toast.success(`Subscription added for ${customerName}.`);
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Failed to create subscription.");
    } finally {
      setSaving(false);
    }
  };

  const selectCls = "w-full px-3 py-2 border border-neutral-300 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]/30 focus:border-[#2a52a8] bg-white transition-colors disabled:opacity-50";
  const lbl = "block text-[12px] font-medium text-neutral-700 mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <h3 className="text-[15px] font-semibold text-neutral-900">Add Subscription</h3>
            <p className="text-[12px] text-neutral-400 mt-0.5">For: <span className="font-medium text-neutral-700">{customerName}</span></p>
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
            <label className={lbl}>Property <span className="text-red-500">*</span></label>
            {loadingProps ? (
              <div className="h-9 bg-neutral-100 rounded-lg animate-pulse" />
            ) : (
              <select value={selectedPropertyId} onChange={(e) => handlePropertyChange(e.target.value)} className={selectCls}>
                <option value="">Select a property…</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className={lbl}>Pricing Plan <span className="text-red-500">*</span></label>
            {loadingPlans ? (
              <div className="h-9 bg-neutral-100 rounded-lg animate-pulse" />
            ) : (
              <select value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}
                className={selectCls} disabled={!selectedPropertyId}>
                <option value="">{selectedPropertyId ? "Select a plan…" : "Select a property first"}</option>
                {pricingPlans.filter((p) => p.is_active !== false).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.plan_name}
                    {p.land_size ? ` — ${p.land_size} SQM` : ""}
                    {p.payment_type ? ` · ${p.payment_type}` : ""}
                    {p.total_price ? ` · ₦${Number(p.total_price).toLocaleString("en-NG")}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className={lbl}>Notes <span className="text-neutral-400 text-[11px] font-normal">(optional)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={3} placeholder="Any notes about this subscription…"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]/30 focus:border-[#2a52a8] resize-none transition-colors" />
          </div>
        </div>
        <div className="flex gap-2.5 px-6 pb-6 pt-4 border-t border-neutral-100">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-neutral-200 text-neutral-700 rounded-lg text-[13px] font-medium hover:bg-neutral-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving || loadingProps}
            className="flex-1 px-4 py-2.5 bg-[#0E2C72] text-white rounded-lg text-[13px] font-medium hover:bg-[#0a2260] disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : "Add Subscription"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Log Inspection Modal ─────────────────────────────────────────────────────
interface LogInspectionModalProps {
  customer: { id: string; full_name?: string; name?: string; email?: string; phone?: string };
  onClose: () => void;
  onCreated: () => void;
}

function LogInspectionModal({ customer, onClose, onCreated }: LogInspectionModalProps) {
  const customerName = customer.full_name ?? customer.name ?? "";
  const [form, setForm] = useState({
    name: customerName,
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    property_name: "",
    inspection_date: "",
    inspection_time: "",
    inspection_type: "PHYSICAL",
    category: "RESIDENTIAL",
    persons: "1",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (!form.inspection_date) { setError("Inspection date is required."); return; }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        inspection_date: form.inspection_date,
        inspection_type: form.inspection_type,
        category: form.category,
        persons: parseInt(form.persons) || 1,
      };
      if (form.inspection_time) payload.inspection_time = form.inspection_time;
      if (form.property_name.trim()) payload.property_name = form.property_name.trim();
      if (form.notes.trim()) payload.notes = form.notes.trim();

      await api.siteInspections.create(payload);
      toast.success(`Inspection logged for ${customerName}.`);
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Failed to add inspection request.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-neutral-300 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]/30 focus:border-[#2a52a8] bg-white transition-colors";
  const lbl = "block text-[12px] font-medium text-neutral-700 mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl max-w-lg w-full shadow-xl my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <h3 className="text-[15px] font-semibold text-neutral-900">Log Site Inspection</h3>
            <p className="text-[12px] text-neutral-400 mt-0.5">For: <span className="font-medium text-neutral-700">{customerName}</span></p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-[12px]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={lbl}>Full Name <span className="text-red-500">*</span></label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="Customer name" />
            </div>
            <div>
              <label className={lbl}>Email</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} placeholder="customer@email.com" />
            </div>
            <div>
              <label className={lbl}>Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} placeholder="08012345678" />
            </div>
          </div>
          <div>
            <label className={lbl}>Property Name <span className="text-neutral-400 text-[11px] font-normal">(optional)</span></label>
            <input value={form.property_name} onChange={(e) => set("property_name", e.target.value)} className={inputCls} placeholder="e.g. Green Valley Estate" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Inspection Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.inspection_date} onChange={(e) => set("inspection_date", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={lbl}>Time <span className="text-neutral-400 text-[11px] font-normal">(optional)</span></label>
              <input type="time" value={form.inspection_time} onChange={(e) => set("inspection_time", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={lbl}>Type</label>
              <select value={form.inspection_type} onChange={(e) => set("inspection_type", e.target.value)} className={inputCls}>
                <option value="PHYSICAL">Physical</option>
                <option value="VIRTUAL">Virtual</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Category</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
                <option value="RESIDENTIAL">Residential</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="FARM_LAND">Farm Land</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Persons</label>
              <input type="number" min="1" value={form.persons} onChange={(e) => set("persons", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={lbl}>Notes <span className="text-neutral-400 text-[11px] font-normal">(optional)</span></label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
              rows={2} placeholder="Any notes about this inspection…"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]/30 focus:border-[#2a52a8] resize-none transition-colors" />
          </div>
        </div>
        <div className="flex gap-2.5 px-6 pb-6 pt-4 border-t border-neutral-100">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-neutral-200 text-neutral-700 rounded-lg text-[13px] font-medium hover:bg-neutral-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 px-4 py-2.5 bg-[#0E2C72] text-white rounded-lg text-[13px] font-medium hover:bg-[#0a2260] disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : "Add Inspection Request"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────
interface SummaryCardProps {
  label: string;
  value: number | string;
  sub: string;
  loading: boolean;
  icon?: React.ElementType;
  accentBg?: string;
  iconBg?: string;
  iconColor?: string;
}

function SummaryCard({ label, value, sub, loading, icon: Icon, accentBg, iconBg, iconColor }: SummaryCardProps) {
  if (loading) {
    return (
      <div className="relative bg-white rounded-xl border border-neutral-100 p-4 shadow-sm overflow-hidden">
        {accentBg && <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentBg}`} />}
        <Skeleton className="h-3 w-24 rounded bg-neutral-100 mb-3" />
        <Skeleton className="h-7 w-16 rounded bg-neutral-100 mb-2" />
        <Skeleton className="h-3 w-32 rounded bg-neutral-100" />
      </div>
    );
  }
  return (
    <div className="relative bg-white rounded-xl border border-neutral-100 p-4 shadow-sm overflow-hidden hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow duration-200">
      {accentBg && <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentBg}`} />}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold mb-1">{label}</p>
          <p className="text-2xl font-bold text-neutral-900">{value}</p>
          <p className="text-[11px] text-neutral-400 mt-1">{sub}</p>
        </div>
        {Icon && iconBg && iconColor && (
          <div className={`p-2 rounded-xl shrink-0 ${iconBg}`}>
            <Icon className={`size-4 ${iconColor}`} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function Customers() {
  usePageTitle("Customers");
  const navigate = useNavigate();
  const { role } = useWorkspaceRole();

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter]       = useState("ALL");
  const [propertyFilter, setPropertyFilter]   = useState("ALL");
  const [landSizeFilter, setLandSizeFilter]   = useState("ALL");
  const [salesRepFilter, setSalesRepFilter]   = useState("ALL");
  const [custRepFilter, setCustRepFilter]     = useState("ALL");
  const [showAdd, setShowAdd]     = useState(false);
  const [addSubTarget, setAddSubTarget]   = useState<{ id: string; name: string } | null>(null);
  const [logInspTarget, setLogInspTarget] = useState<any | null>(null);
  const [expandedIds, setExpandedIds]     = useState<Set<string>>(new Set());
  const [subCache, setSubCache]           = useState<Record<string, any[]>>({});
  const [loadingExpand, setLoadingExpand] = useState<Set<string>>(new Set());
  const [page, setPage]       = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // ── Role guard ────────────────────────────────────────────────────────────
  if (role === "SALES_REP" || role === "CUSTOMER") {
    return (
      <div className="p-8 text-center text-neutral-500 text-sm">
        You don't have permission to access this page.
      </div>
    );
  }

  const fetchCustomers = async () => {
    setLoading((prev) => prev || customers.length === 0);
    try {
      const data = await api.customers.list();
      setCustomers(data);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  };

  usePolling(fetchCustomers, 300_000);

  // ── Summary card values ───────────────────────────────────────────────────
  const totalCustomers    = customers.length;
  const totalActive       = customers.reduce((s, c) => s + (c.active_subscriptions ?? 0), 0);
  const totalCompleted    = customers.reduce((s, c) => s + (c.completed_subscriptions ?? 0), 0);
  const totalDefaulting   = customers.reduce((s, c) => s + (c.defaulting_subscriptions ?? 0), 0);

  // ── Derived filter options ────────────────────────────────────────────────
  const propertyOptions = Array.from(
    new Set(customers.map((c) => c.primary_subscription?.property_name).filter(Boolean))
  ).sort() as string[];

  const landSizeOptions = Array.from(
    new Set(customers.map((c) => c.primary_subscription?.land_size).filter(Boolean))
  ).sort((a, b) => Number(a) - Number(b)) as string[];

  const salesRepOptions = Array.from(
    new Set(customers.map((c) => c.primary_subscription?.sales_rep_name ?? c.sales_rep_name).filter(Boolean))
  ).sort() as string[];

  const custRepOptions = Array.from(
    new Set(customers.map((c) => c.assigned_rep_name ?? c.customer_rep_name).filter(Boolean))
  ).sort() as string[];

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (c.full_name ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.phone ?? "").toLowerCase().includes(q);

    const ps = c.primary_subscription;
    const subStatus = ps?.status?.toUpperCase() ?? "";
    const matchesStatus   = statusFilter   === "ALL" || subStatus === statusFilter;
    const matchesProperty = propertyFilter === "ALL" || ps?.property_name === propertyFilter;
    const matchesLandSize = landSizeFilter === "ALL" || String(ps?.land_size) === landSizeFilter;
    const matchesSalesRep = salesRepFilter === "ALL" ||
      (ps?.sales_rep_name ?? c.sales_rep_name) === salesRepFilter;
    const matchesCustRep  = custRepFilter  === "ALL" ||
      (c.assigned_rep_name ?? c.customer_rep_name) === custRepFilter;

    return matchesSearch && matchesStatus && matchesProperty && matchesLandSize && matchesSalesRep && matchesCustRep;
  });

  const hasFilters = search || statusFilter !== "ALL" || propertyFilter !== "ALL" || landSizeFilter !== "ALL" || salesRepFilter !== "ALL" || custRepFilter !== "ALL";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setPropertyFilter("ALL");
    setLandSizeFilter("ALL");
    setSalesRepFilter("ALL");
    setCustRepFilter("ALL");
    setPage(1);
    setSelected(new Set());
  };

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // ── Bulk selection helpers ─────────────────────────────────────────────────
  const allPageSelected = paginated.length > 0 && paginated.every((c) => selected.has(c.id));
  const somePageSelected = paginated.some((c) => selected.has(c.id));

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        paginated.forEach((c) => next.delete(c.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        paginated.forEach((c) => next.add(c.id));
        return next;
      });
    }
  };

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const exportCSV = () => {
    const rows = customers.filter((c) => selected.has(c.id));
    const headers = ["#", "Name", "Email", "Phone", "Status", "Created"];
    const lines = rows.map((c, i) => [
      i + 1,
      `"${(c.full_name ?? c.name ?? "").replace(/"/g, '""')}"`,
      `"${(c.email ?? "").replace(/"/g, '""')}"`,
      `"${(c.phone ?? "").replace(/"/g, '""')}"`,
      `"${(c.primary_subscription?.status ?? "").replace(/"/g, '""')}"`,
      `"${c.created_at ? new Date(c.created_at).toLocaleDateString("en-NG") : ""}"`,
    ].join(","));
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "customers.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    const ids = Array.from(selected);
    const results = await Promise.allSettled(ids.map((id) => api.customers.delete(id)));
    const succeeded = ids.filter((_, i) => results[i].status === "fulfilled");
    const failCount = ids.length - succeeded.length;
    setCustomers((prev) => prev.filter((c) => !succeeded.includes(c.id)));
    setSelected(new Set());
    setConfirmBulkDelete(false);
    setBulkDeleting(false);
    if (failCount === 0) {
      toast.success(`${succeeded.length} customer${succeeded.length !== 1 ? "s" : ""} deleted.`);
    } else {
      toast.warning(`${succeeded.length} deleted, ${failCount} failed.`);
    }
  };

  const toggleExpand = useCallback(async (customerId: string) => {
    const isOpen = expandedIds.has(customerId);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(customerId)) next.delete(customerId);
      else next.add(customerId);
      return next;
    });
    if (!isOpen && !subCache[customerId]) {
      setLoadingExpand((prev) => new Set([...prev, customerId]));
      try {
        const detail = await api.customers.get(customerId);
        setSubCache((prev) => ({ ...prev, [customerId]: detail.subscriptions ?? [] }));
      } catch { /* silent */ }
      finally {
        setLoadingExpand((prev) => { const n = new Set(prev); n.delete(customerId); return n; });
      }
    }
  }, [expandedIds, subCache]);

  const isInitialLoad = loading && customers.length === 0;

  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)] w-full">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-neutral-100 px-4 sm:px-6 lg:px-8 py-4 md:py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div>
              <h1 className="text-[17px] font-semibold text-neutral-900 tracking-tight">
                Customers
              </h1>
              <p className="text-[12px] text-neutral-400 mt-0.5 hidden sm:block">
                Customer and subscription management
              </p>
            </div>
            {loading && !isInitialLoad && (
              <Loader2 className="w-3.5 h-3.5 text-[#1a3d8f] animate-spin" />
            )}
          </div>
          <Button
            onClick={() => setShowAdd(true)}
            className="h-8 gap-1.5 bg-[#0E2C72] hover:bg-[#0a2260] text-white text-[12px] font-medium rounded-lg px-3 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Customer</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="p-4 sm:p-6 lg:p-8 space-y-5 flex-1"
      >
        {/* ── Summary cards ──────────────────────────────────────────────── */}
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            label="Total Customers"
            value={totalCustomers}
            sub="All registered customers"
            loading={isInitialLoad}
            icon={UsersIcon}
            accentBg="bg-blue-500"
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <SummaryCard
            label="Active Subscriptions"
            value={totalActive}
            sub="Currently active plans"
            loading={isInitialLoad}
            icon={CheckCircle2}
            accentBg="bg-[#1a3d8f]"
            iconBg="bg-[#0E2C72]/6"
            iconColor="text-[#0E2C72]"
          />
          <SummaryCard
            label="Completed Subscriptions"
            value={totalCompleted}
            sub="Fully paid off plans"
            loading={isInitialLoad}
            icon={CheckCircle2}
            accentBg="bg-violet-500"
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
          />
          <SummaryCard
            label="Defaulting Subscriptions"
            value={totalDefaulting}
            sub="Overdue or missed payments"
            loading={isInitialLoad}
            icon={AlertTriangle}
            accentBg="bg-red-500"
            iconBg="bg-red-50"
            iconColor="text-red-600"
          />
        </motion.div>

        {/* ── Search + filter bar (always visible once customers are loaded) ── */}
        {!isInitialLoad && customers.length > 0 && (
          <motion.div
            variants={item}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 flex-wrap"
          >
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <Input
                placeholder="Search by name, email, phone…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelected(new Set()); }}
                className="h-9 pl-9 text-[13px] bg-white border-neutral-200 focus-visible:ring-1 focus-visible:ring-[#1a3d8f]/30 focus-visible:border-[#2a52a8] rounded-lg"
              />
            </div>

            {/* Status filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <Filter className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <div className="flex items-center gap-1">
                {STATUS_FILTERS.map((sf) => (
                  <button
                    key={sf.value}
                    onClick={() => { setStatusFilter(sf.value); setSelected(new Set()); }}
                    className={`px-2.5 py-1 rounded-full text-[11.5px] font-medium transition-colors border whitespace-nowrap ${
                      statusFilter === sf.value
                        ? "bg-[#0E2C72] text-white border-[#0E2C72]"
                        : "bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    {sf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional dropdown filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {propertyOptions.length > 0 && (
                <select
                  value={propertyFilter}
                  onChange={(e) => { setPropertyFilter(e.target.value); setSelected(new Set()); }}
                  className="h-9 px-2.5 border border-neutral-200 bg-white rounded-lg text-[12px] text-neutral-700 focus:outline-none focus:ring-1 focus:ring-[#1a3d8f]/30"
                >
                  <option value="ALL">All Properties</option>
                  {propertyOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              )}
              {landSizeOptions.length > 0 && (
                <select
                  value={landSizeFilter}
                  onChange={(e) => { setLandSizeFilter(e.target.value); setSelected(new Set()); }}
                  className="h-9 px-2.5 border border-neutral-200 bg-white rounded-lg text-[12px] text-neutral-700 focus:outline-none focus:ring-1 focus:ring-[#1a3d8f]/30"
                >
                  <option value="ALL">All Land Sizes</option>
                  {landSizeOptions.map((ls) => <option key={ls} value={ls}>{ls} sqm</option>)}
                </select>
              )}
              {salesRepOptions.length > 0 && (
                <select
                  value={salesRepFilter}
                  onChange={(e) => { setSalesRepFilter(e.target.value); setSelected(new Set()); }}
                  className="h-9 px-2.5 border border-neutral-200 bg-white rounded-lg text-[12px] text-neutral-700 focus:outline-none focus:ring-1 focus:ring-[#1a3d8f]/30"
                >
                  <option value="ALL">All Sales Reps</option>
                  {salesRepOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              )}
              {custRepOptions.length > 0 && (
                <select
                  value={custRepFilter}
                  onChange={(e) => { setCustRepFilter(e.target.value); setSelected(new Set()); }}
                  className="h-9 px-2.5 border border-neutral-200 bg-white rounded-lg text-[12px] text-neutral-700 focus:outline-none focus:ring-1 focus:ring-[#1a3d8f]/30"
                >
                  <option value="ALL">All Customer Reps</option>
                  {custRepOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              )}
              {hasFilters && (
                <button onClick={clearFilters}
                  className="h-9 px-2.5 flex items-center gap-1 border border-neutral-200 bg-white rounded-lg text-[12px] text-neutral-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors">
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </motion.div>
        )}

        {isInitialLoad ? (
          /* ── Loading skeleton ─────────────────────────────────────────── */
          <>
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <Skeleton className="h-9 w-full sm:w-80 rounded-lg bg-neutral-100" />
              <Skeleton className="h-9 w-28 rounded-lg bg-neutral-100" />
              <Skeleton className="h-9 w-44 rounded-lg bg-neutral-100" />
            </div>
            <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="bg-neutral-50/70 border-b border-neutral-100 px-5 py-3 flex gap-4">
                {[120, 100, 140, 80, 70, 90, 80, 80, 90, 80, 60].map((w, i) => (
                  <Skeleton
                    key={i}
                    className="h-3 rounded bg-neutral-200"
                    style={{ width: w }}
                  />
                ))}
              </div>
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="px-5 py-3.5 flex items-center gap-4 border-b border-neutral-50 last:border-0"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-[140px]">
                    <Skeleton className="h-8 w-8 rounded-full bg-neutral-100 shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-28 bg-neutral-100" />
                      <Skeleton className="h-3 w-20 bg-neutral-100" />
                    </div>
                  </div>
                  <Skeleton className="h-3.5 w-20 bg-neutral-100 hidden sm:block" />
                  <Skeleton className="h-3.5 w-24 bg-neutral-100 hidden sm:block" />
                  <Skeleton className="h-3.5 w-20 bg-neutral-100 hidden md:block" />
                  <Skeleton className="h-3.5 w-14 bg-neutral-100 hidden md:block" />
                  <Skeleton className="h-3.5 w-24 bg-neutral-100 hidden lg:block" />
                  <Skeleton className="h-3.5 w-20 bg-neutral-100 hidden lg:block" />
                  <Skeleton className="h-3.5 w-20 bg-neutral-100 hidden lg:block" />
                  <Skeleton className="h-3.5 w-20 bg-neutral-100 hidden xl:block" />
                  <Skeleton className="h-5 w-16 rounded-full bg-neutral-100" />
                  <Skeleton className="h-7 w-16 rounded-lg bg-neutral-100 ml-auto" />
                </div>
              ))}
            </div>
          </>
        ) : filtered.length === 0 ? (
          /* ── Empty state ─────────────────────────────────────────────── */
          <motion.div variants={item}>
            <EmptyState
              icon={UsersIcon}
              title={hasFilters ? "No matching customers" : "No customers yet"}
              description={
                hasFilters
                  ? "Adjust your search or filter to find what you're looking for."
                  : "Add your first customer to start tracking subscriptions and revenue."
              }
              action={
                <Button
                  onClick={() => hasFilters ? clearFilters() : setShowAdd(true)}
                  className="gap-2 bg-[#0E2C72] hover:bg-[#0a2260] text-white"
                >
                  <Plus className="w-4 h-4" />
                  {hasFilters ? "Clear Filters" : "Add New Customer"}
                </Button>
              }
            />
          </motion.div>
        ) : (
          <>
            {/* ── Mobile card list (< md) ──────────────────────────────── */}
            <motion.div variants={item} className="md:hidden space-y-3">
              {filtered.map((customer) => {
                const name = customer.full_name ?? customer.name ?? "Unknown";
                const [bgCls, txtCls] = avatarColor(name);
                const ps = customer.primary_subscription;
                const statusCfg = subStatusConfig(ps?.status);
                return (
                  <div
                    key={customer.id}
                    className="bg-white rounded-xl border border-neutral-100 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-9 w-9 rounded-full ${bgCls} ${txtCls} flex items-center justify-center text-[12px] font-bold uppercase shrink-0`}>
                          {name.substring(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-semibold text-neutral-900 truncate">{name}</div>
                          <div className="text-[11.5px] text-neutral-400 truncate">{customer.phone ?? "—"}</div>
                        </div>
                      </div>
                      {statusCfg ? (
                        <Badge className={`text-[11px] border gap-1 shrink-0 ${statusCfg.cls}`}>
                          {statusCfg.dot && <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} inline-block`} />}
                          {statusCfg.label}
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-neutral-300 shrink-0">—</span>
                      )}
                    </div>

                    {/* Detail grid */}
                    {ps && (
                      <div className="grid grid-cols-2 gap-2 mb-3 text-[12px]">
                        {ps.property_name && (
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Property</span>
                            <div className="text-neutral-700 font-medium truncate">{ps.property_name}</div>
                          </div>
                        )}
                        {ps.plan_name && (
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Plan</span>
                            <div className="text-neutral-700 font-medium truncate">{ps.plan_name}</div>
                          </div>
                        )}
                        {ps.amount_paid != null && (
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Paid</span>
                            <div className="text-[#0E2C72] font-semibold">{fmt(ps.amount_paid)}</div>
                          </div>
                        )}
                        {ps.balance != null && (
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Balance</span>
                            <div className={`font-semibold ${ps.balance > 0 ? "text-red-600" : "text-neutral-700"}`}>{fmt(ps.balance)}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-neutral-50">
                      <button
                        onClick={() => navigate(`/customers/${customer.id}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-neutral-200 text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button
                        onClick={() => setAddSubTarget({ id: customer.id, name })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[#0E2C72]/15 bg-[#0E2C72]/6/50 text-[12px] font-medium text-[#0E2C72] hover:bg-[#d6e0f5] transition-colors"
                      >
                        <Building2 className="w-3.5 h-3.5" /> Subscribe
                      </button>
                      <button
                        onClick={() => setLogInspTarget(customer)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-violet-100 bg-violet-50/50 text-[12px] font-medium text-violet-700 hover:bg-violet-100 transition-colors"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" /> Inspect
                      </button>
                    </div>
                  </div>
                );
              })}
              <p className="text-[11px] text-neutral-400 text-center py-1">
                {filtered.length} of {customers.length} customer{customers.length !== 1 ? "s" : ""}
              </p>
            </motion.div>

            {/* ── Desktop table (≥ md) ─────────────────────────────────── */}
            <motion.div
              variants={item}
              className="hidden md:block bg-white rounded-xl border border-neutral-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
            >
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
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50/70">
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
                      <th className="px-5 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap">Customer</th>
                      <th className="px-5 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap">Contact</th>
                      <th className="px-5 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap">Subscriptions</th>
                      <th className="px-5 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap hidden lg:table-cell">Total Paid</th>
                      <th className="px-5 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap hidden lg:table-cell">Balance</th>
                      <th className="px-5 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap">Status</th>
                      <th className="px-5 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((customer, index) => {
                      const name = customer.full_name ?? customer.name ?? "Unknown";
                      const [bgCls, txtCls] = avatarColor(name);
                      const totalSubs = (customer.total_subscriptions ?? 0) ||
                        ((customer.active_subscriptions ?? 0) + (customer.completed_subscriptions ?? 0) + (customer.defaulting_subscriptions ?? 0));
                      const isExpanded = expandedIds.has(customer.id);
                      const isLoadingThisExpand = loadingExpand.has(customer.id);
                      const subs = subCache[customer.id] ?? [];

                      const summaryStatusCfg =
                        (customer.defaulting_subscriptions ?? 0) > 0 ? STATUS_CONFIG.DEFAULTING :
                        (customer.active_subscriptions ?? 0) > 0 ? STATUS_CONFIG.ACTIVE :
                        (customer.completed_subscriptions ?? 0) > 0 ? STATUS_CONFIG.COMPLETED :
                        subStatusConfig(customer.primary_subscription?.status);

                      return (
                        <Fragment key={customer.id}>
                          {/* Level 1 — customer row */}
                          <tr className={`hover:bg-neutral-50/60 transition-colors ${isExpanded ? "" : "border-b border-neutral-50"}`}>
                            <td className="px-4 py-3 w-8">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-neutral-300 text-[#0E2C72] accent-[#0E2C72]"
                                checked={selected.has(customer.id)}
                                onChange={() => toggleRow(customer.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="px-4 py-3 text-[12px] text-neutral-400 font-mono">{(page-1)*pageSize + index + 1}</td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-full ${bgCls} ${txtCls} flex items-center justify-center text-[11px] font-bold uppercase shrink-0`}>
                                  {name.substring(0, 2)}
                                </div>
                                <div>
                                  <p className="text-[13px] font-semibold text-neutral-900">{name}</p>
                                  <p className="text-[11px] text-neutral-400">{customer.email || "—"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <span className="text-[12.5px] text-neutral-700">{dash(customer.phone)}</span>
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center justify-center min-w-[1.375rem] h-5 px-1.5 rounded-full bg-neutral-100 text-[11px] font-bold text-neutral-700">
                                  {totalSubs}
                                </span>
                                {(customer.active_subscriptions ?? 0) > 0 && (
                                  <span className="w-2 h-2 rounded-full bg-[#2a52a8] shrink-0" title={`${customer.active_subscriptions} Active`} />
                                )}
                                {(customer.defaulting_subscriptions ?? 0) > 0 && (
                                  <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" title={`${customer.defaulting_subscriptions} Defaulting`} />
                                )}
                                {(customer.completed_subscriptions ?? 0) > 0 && (
                                  <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" title={`${customer.completed_subscriptions} Completed`} />
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap hidden lg:table-cell">
                              <span className="text-[12.5px] font-medium text-[#0E2C72]">
                                {fmt(customer.total_paid ?? customer.primary_subscription?.amount_paid)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap hidden lg:table-cell">
                              <span className="text-[12.5px] font-medium text-neutral-800">
                                {fmt(customer.total_balance ?? customer.primary_subscription?.balance)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              {summaryStatusCfg ? (
                                <Badge className={`text-[11px] border gap-1 ${summaryStatusCfg.cls}`}>
                                  {summaryStatusCfg.dot && <span className={`w-1.5 h-1.5 rounded-full ${summaryStatusCfg.dot} inline-block`} />}
                                  {summaryStatusCfg.label}
                                </Badge>
                              ) : (
                                <span className="text-[11px] text-neutral-300">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => navigate(`/customers/${customer.id}`)}
                                  title="View profile"
                                  className="h-7 w-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-[#0a2260] hover:bg-[#0E2C72]/6 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setAddSubTarget({ id: customer.id, name })}
                                  title="Add subscription"
                                  className="h-7 w-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                                >
                                  <Building2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setLogInspTarget(customer)}
                                  title="Add inspection request"
                                  className="h-7 w-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-violet-700 hover:bg-violet-50 transition-colors"
                                >
                                  <CalendarPlus className="w-3.5 h-3.5" />
                                </button>
                                {totalSubs > 0 && (
                                  <button
                                    onClick={() => toggleExpand(customer.id)}
                                    title={isExpanded ? "Collapse subscriptions" : "Expand subscriptions"}
                                    className="h-7 w-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-[#0a2260] hover:bg-[#0E2C72]/6 transition-colors"
                                  >
                                    {isLoadingThisExpand
                                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      : isExpanded
                                      ? <ChevronUp className="w-3.5 h-3.5" />
                                      : <ChevronDown className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Level 2 — subscription sub-rows */}
                          {isExpanded && (
                            isLoadingThisExpand ? (
                              <tr className="border-b border-neutral-50">
                                <td colSpan={9} className="px-5 py-2 bg-neutral-50/60">
                                  <div className="flex items-center gap-2 pl-11 text-[12px] text-neutral-400">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Loading subscriptions…
                                  </div>
                                </td>
                              </tr>
                            ) : subs.length === 0 ? (
                              <tr className="border-b border-neutral-100">
                                <td colSpan={9} className="px-5 py-2.5 bg-neutral-50/40">
                                  <p className="pl-11 text-[12px] text-neutral-400 italic">No subscriptions found.</p>
                                </td>
                              </tr>
                            ) : (
                              <>
                                {subs.map((sub: any, idx: number) => {
                                  const subCfg = subStatusConfig(sub.status);
                                  return (
                                    <tr
                                      key={sub.id}
                                      className={`bg-neutral-50/40 hover:bg-neutral-50/80 transition-colors ${idx === subs.length - 1 ? "border-b border-neutral-100" : "border-b border-neutral-50/70"}`}
                                    >
                                      <td colSpan={9} className="py-0">
                                        <div className="flex items-center gap-5 pl-16 pr-5 py-2.5 border-l-2 border-[#8aaad8]/60">
                                          <div className="flex-1 min-w-0">
                                            <p className="text-[12.5px] font-semibold text-neutral-800 truncate">{sub.property_name || "—"}</p>
                                            <p className="text-[11px] text-neutral-400">
                                              {sub.land_size ? `${sub.land_size} SQM` : ""}
                                              {sub.plan_name ? `${sub.land_size ? " · " : ""}${sub.plan_name}` : ""}
                                            </p>
                                          </div>
                                          <div className="hidden lg:flex items-center gap-6 shrink-0">
                                            <div className="text-right">
                                              <p className="text-[10px] text-neutral-400 uppercase tracking-wide font-semibold">Price</p>
                                              <p className="text-[12px] font-medium text-neutral-800">{fmt(sub.total_price)}</p>
                                            </div>
                                            <div className="text-right">
                                              <p className="text-[10px] text-neutral-400 uppercase tracking-wide font-semibold">Paid</p>
                                              <p className="text-[12px] font-medium text-[#0E2C72]">{fmt(sub.amount_paid)}</p>
                                            </div>
                                            <div className="text-right">
                                              <p className="text-[10px] text-neutral-400 uppercase tracking-wide font-semibold">Balance</p>
                                              <p className={`text-[12px] font-medium ${Number(sub.balance) > 0 ? "text-red-600" : "text-neutral-700"}`}>{fmt(sub.balance)}</p>
                                            </div>
                                            <div className="text-right">
                                              <p className="text-[10px] text-neutral-400 uppercase tracking-wide font-semibold">Next Due</p>
                                              <p className="text-[12px] text-neutral-600">{fmtDate(sub.next_due_date)}</p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2.5 shrink-0">
                                            {subCfg && (
                                              <Badge className={`text-[10.5px] border gap-1 ${subCfg.cls}`}>
                                                {subCfg.dot && <span className={`w-1.5 h-1.5 rounded-full ${subCfg.dot} inline-block`} />}
                                                {subCfg.label}
                                              </Badge>
                                            )}
                                            <button
                                              onClick={() => navigate(`/customers/${customer.id}`)}
                                              className="text-[12px] text-[#0E2C72] hover:text-[#0a2260] font-medium transition-colors whitespace-nowrap"
                                            >
                                              View →
                                            </button>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </>
                            )
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <TablePagination
                page={page}
                pageCount={pageCount}
                total={filtered.length}
                pageSize={pageSize}
                onPage={(n) => { setPage(n); setSelected(new Set()); }}
                onPageSize={(n) => { setPageSize(n); setPage(1); setSelected(new Set()); }}
              />
            </motion.div>
          </>
        )}
      </motion.div>

      {/* ── Add Customer Modal ─────────────────────────────────────────────── */}
      {showAdd && (
        <AddCustomerModal
          onClose={() => setShowAdd(false)}
          onCreated={fetchCustomers}
        />
      )}

      {/* ── Add Subscription Modal ──────────────────────────────────────────── */}
      {addSubTarget && (
        <AddSubscriptionModal
          customerId={addSubTarget.id}
          customerName={addSubTarget.name}
          onClose={() => setAddSubTarget(null)}
          onCreated={fetchCustomers}
        />
      )}

      {/* ── Log Inspection Modal ────────────────────────────────────────────── */}
      {logInspTarget && (
        <LogInspectionModal
          customer={logInspTarget}
          onClose={() => setLogInspTarget(null)}
          onCreated={() => {}}
        />
      )}
    </div>
  );
}



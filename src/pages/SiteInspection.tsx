import React, { useState, useEffect } from "react";
import { usePolling } from "../hooks/usePolling";
import { usePageTitle } from "../hooks/usePageTitle";
import { useWorkspaceRole } from "../hooks/useWorkspaceRole";
import {
  ClipboardList,
  Plus,
  X,
  Search,
  Filter,
  Loader2,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  UserCheck,
  Pencil,
  Trash2,
} from "lucide-react";

import { Skeleton } from "../components/ui/skeleton";
import { api } from "../services/api";
import { EmptyState } from "../components/ui/empty-state";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SiteInspection {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender?: string;
  linked_property: string | null;
  property_name: string;
  inspection_date: string;
  inspection_time: string | null;
  inspection_type: "PHYSICAL" | "VIRTUAL";
  slot_id?: string | null;
  status: "PENDING" | "ATTENDED" | "CANCELLED" | "NO_SHOW";
  notes: string;
  is_converted: boolean;
  converted_customer: string | null;
  converted_customer_name: string | null;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-400",
    icon: Clock,
  },
  ATTENDED: {
    label: "Attended",
    bg: "bg-[#0E2C72]/6",
    text: "text-[#0E2C72]",
    dot: "bg-[#1a3d8f]",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    icon: XCircle,
  },
  NO_SHOW: {
    label: "No Show",
    bg: "bg-neutral-100",
    text: "text-neutral-600",
    dot: "bg-neutral-400",
    icon: XCircle,
  },
} as const;

function relativeTime(dateStr: string, timeStr?: string | null): string {
  const dt = timeStr ? new Date(`${dateStr}T${timeStr}`) : new Date(`${dateStr}T00:00:00`);
  const diffMs = dt.getTime() - Date.now();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.ceil(diffMs / 86400000);

  if (Math.abs(diffMins) < 60) {
    if (diffMins > 0) return `In ${diffMins}m`;
    if (diffMins === 0) return "Now";
    return `${Math.abs(diffMins)}m ago`;
  }
  if (Math.abs(diffHours) < 24) {
    if (diffHours > 0) return `In ${diffHours}h`;
    return `${Math.abs(diffHours)}h ago`;
  }
  if (diffDays > 0) return `In ${diffDays}d`;
  if (diffDays === 0) return "Today";
  return `${Math.abs(diffDays)}d ago`;
}

function formatInspectionDateTime(dateStr: string, timeStr?: string | null): string {
  if (!dateStr) return "—";
  const dt = timeStr ? new Date(`${dateStr}T${timeStr}`) : new Date(`${dateStr}T12:00:00`);
  const formatted = dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  if (timeStr) {
    const t = new Date(`2000-01-01T${timeStr}`);
    const ampm = t.getHours() >= 12 ? "pm" : "am";
    const h = t.getHours() % 12 || 12;
    const m = String(t.getMinutes()).padStart(2, "0");
    return `${formatted}, ${h}:${m}${ampm}`;
  }
  return formatted;
}

function countdown(dateStr: string): string {
  return relativeTime(dateStr);
}

function StatusBadge({
  status,
  onClick,
}: {
  status: SiteInspection["status"];
  onClick?: () => void;
}) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold ${cfg.bg} ${cfg.text} ${
        onClick
          ? "hover:opacity-80 transition-opacity cursor-pointer"
          : "cursor-default"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
      {cfg.label}
    </button>
  );
}

function AttendanceDropdown({
  inspectionId,
  status,
  onUpdated,
}: {
  inspectionId: string;
  status: SiteInspection["status"];
  onUpdated: (updated: SiteInspection) => void;
}) {
  const [updating, setUpdating] = React.useState(false);
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as SiteInspection["status"];
    if (newStatus === status) return;
    setUpdating(true);
    try {
      const updated = await api.siteInspections.update(inspectionId, { status: newStatus });
      onUpdated(updated);
      toast.success("Status updated.");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      {updating && <Loader2 className="absolute left-2 w-3 h-3 animate-spin text-neutral-400 z-10 pointer-events-none" />}
      <select
        value={status}
        onChange={handleChange}
        disabled={updating}
        className={`pl-2.5 pr-6 py-1 rounded-full text-[11.5px] font-semibold border-0 outline-none cursor-pointer appearance-none ${cfg.bg} ${cfg.text} disabled:opacity-70`}
        style={{ backgroundImage: "none" }}
      >
        <option value="PENDING">Pending</option>
        <option value="ATTENDED">Attended</option>
        <option value="NO_SHOW">No Show</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
      <span className={`absolute right-1.5 pointer-events-none ${cfg.text} opacity-60`} style={{ fontSize: "8px" }}>▼</span>
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({
  inspection,
  onClose,
}: {
  inspection: SiteInspection;
  onClose: () => void;
}) {
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Contact", value: inspection.name },
    { label: "Phone", value: inspection.phone },
    { label: "Email", value: inspection.email },
    {
      label: "Property",
      value: inspection.property_name || "—",
    },
    { label: "Inspection Date", value: inspection.inspection_date },
    {
      label: "Time",
      value: inspection.inspection_time ?? "Not specified",
    },
    {
      label: "Type",
      value:
        inspection.inspection_type === "PHYSICAL" ? "Physical" : "Virtual",
    },
    {
      label: "Category",
      value: inspection.category.replace(/_/g, " "),
    },
    { label: "Persons", value: inspection.persons },
    {
      label: "Status",
      value: <StatusBadge status={inspection.status} />,
    },
    { label: "Notes", value: inspection.notes || "—" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h3 className="text-[14px] font-semibold text-neutral-900">
            Inspection Details
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <span className="w-28 shrink-0 text-[11.5px] font-semibold text-neutral-400 uppercase tracking-wide pt-0.5">
                {label}
              </span>
              <span className="text-[13px] text-neutral-800 font-medium">
                {value}
              </span>
            </div>
          ))}
        </div>
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-neutral-200 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Add Inspection Modal ──────────────────────────────────────────────────────
const BLANK_FORM = {
  name: "",
  phone: "",
  email: "",
  gender: "",
  linked_property: "",
  property_name: "",
  slot_id: "",
  inspection_date: "",
  inspection_time: "",
  inspection_type: "PHYSICAL" as "PHYSICAL" | "VIRTUAL",
  notes: "",
};

function AddInspectionModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (item: SiteInspection) => void;
}) {
  const [form, setForm] = useState({ ...BLANK_FORM });
  const [saving, setSaving] = useState(false);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  useEffect(() => {
    api.properties.list().then((list: any[]) => {
      const published = list.filter(
        (p) => p.status === "PUBLISHED" || p.status === "published"
      );
      setProperties(published.map((p) => ({ id: p.id, name: p.name })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.linked_property) { setAvailableSlots([]); return; }
    setSlotsLoading(true);
    api.properties.availableSlots(form.linked_property)
      .then((slots: any[]) => setAvailableSlots(Array.isArray(slots) ? slots : []))
      .catch(() => setAvailableSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [form.linked_property]);

  const set =
    (k: keyof typeof BLANK_FORM) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSlotChange = (slotId: string) => {
    const slot = availableSlots.find((s) => s.slot_id === slotId || s.id === slotId);
    setForm((prev) => ({
      ...prev,
      slot_id: slotId,
      inspection_date: slot?.date ?? prev.inspection_date,
      inspection_time: slot?.time ?? prev.inspection_time,
    }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) {
      toast.error("Name, phone and email are required.");
      return;
    }
    if (!form.linked_property) {
      toast.error("Please select a property.");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        gender: form.gender || undefined,
        linked_property: form.linked_property,
        property_name: form.property_name.trim(),
        slot_id: form.slot_id || undefined,
        inspection_date: form.inspection_date || undefined,
        inspection_time: form.inspection_time || undefined,
        inspection_type: form.inspection_type,
        notes: form.notes.trim(),
        status: "PENDING",
      };
      const created = await api.siteInspections.create(payload);
      onCreated(created);
      toast.success("Inspection request created.");
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create inspection request.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]/30 focus:border-[#2a52a8] bg-white placeholder:text-neutral-400";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl my-auto max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h3 className="text-[14px] font-semibold text-neutral-900">
            Add Inspection Request
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-56px)]">
          {/* 1. Property */}
          <div>
            <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">
              Property <span className="text-red-500">*</span>
            </label>
            <select
              className={inputCls}
              value={form.linked_property}
              onChange={(e) => {
                const selected = properties.find((p) => p.id === e.target.value);
                setForm((f) => ({
                  ...f,
                  linked_property: e.target.value,
                  property_name: selected?.name ?? "",
                  slot_id: "",
                  inspection_date: "",
                  inspection_time: "",
                }));
              }}
            >
              <option value="">— Select a property —</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* 2. Available Slot */}
          <div>
            <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">
              Available Slot
            </label>
            {slotsLoading ? (
              <div className="flex items-center gap-2 py-2 text-[12px] text-neutral-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading slots…
              </div>
            ) : !form.linked_property ? (
              <p className="text-[12px] text-neutral-400 py-1.5">Select a property first to see available slots.</p>
            ) : availableSlots.length === 0 ? (
              <p className="text-[12px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                No inspection slots available for this property.
              </p>
            ) : (
              <select
                className={inputCls}
                value={form.slot_id}
                onChange={(e) => handleSlotChange(e.target.value)}
              >
                <option value="">— Select a slot —</option>
                {availableSlots.map((s: any) => (
                  <option key={s.slot_id ?? s.id} value={s.slot_id ?? s.id}>
                    {s.label ?? `${s.date} ${s.time}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 3. Name */}
          <div>
            <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              className={inputCls}
              placeholder="Full name"
              value={form.name}
              onChange={set("name")}
            />
          </div>

          {/* 4. Phone */}
          <div>
            <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              className={inputCls}
              placeholder="+234 800 000 0000"
              value={form.phone}
              onChange={set("phone")}
            />
          </div>

          {/* 5. Email */}
          <div>
            <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className={inputCls}
              placeholder="john@example.com"
              value={form.email}
              onChange={set("email")}
            />
          </div>

          {/* 6. Gender */}
          <div>
            <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">
              Gender
            </label>
            <select className={inputCls} value={form.gender} onChange={set("gender")}>
              <option value="">— Select —</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            </select>
          </div>

          {/* 7. Inspection Type */}
          <div>
            <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">
              Inspection Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              {(["PHYSICAL", "VIRTUAL"] as const).map((t) => (
                <label key={t} className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${form.inspection_type === t ? "border-[#0E2C72] bg-[#0E2C72]/6" : "border-neutral-200 hover:border-[#0E2C72]/30"}`}>
                  <input type="radio" name="inspection_type" value={t} checked={form.inspection_type === t}
                    onChange={() => setForm((f) => ({ ...f, inspection_type: t }))} className="sr-only" />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${form.inspection_type === t ? "border-[#0E2C72]" : "border-neutral-300"}`}>
                    {form.inspection_type === t && <div className="w-2 h-2 rounded-full bg-[#0E2C72]" />}
                  </div>
                  <span className="text-[13px] font-semibold text-neutral-700">{t === "PHYSICAL" ? "Physical" : "Virtual"}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 8. Notes */}
          <div>
            <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">
              Notes
            </label>
            <textarea
              rows={3}
              className={`${inputCls} resize-none`}
              placeholder="Any additional information…"
              value={form.notes}
              onChange={set("notes")}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-[#0E2C72] text-white text-[13px] font-semibold hover:bg-[#0a2260] disabled:opacity-60 transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Creating…</> : "Create Request"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Action Confirm Modal ──────────────────────────────────────────────────────
function ActionConfirmModal({
  inspection,
  action,
  onClose,
  onUpdated,
}: {
  inspection: SiteInspection;
  action: "ATTENDED" | "CANCELLED";
  onClose: () => void;
  onUpdated: (updated: SiteInspection) => void;
}) {
  const [saving, setSaving] = useState(false);
  const isAttend = action === "ATTENDED";

  async function confirm() {
    setSaving(true);
    try {
      const updated = await api.siteInspections.update(inspection.id, {
        status: action,
      });
      onUpdated(updated);
      toast.success(
        isAttend ? "Marked as attended." : "Inspection cancelled."
      );
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update status.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="p-5">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${
              isAttend ? "bg-[#0E2C72]/6" : "bg-red-50"
            }`}
          >
            {isAttend ? (
              <CheckCircle2 className="w-5 h-5 text-[#0E2C72]" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
          <h3 className="text-[14px] font-semibold text-neutral-900 mb-1">
            {isAttend ? "Mark as Attended?" : "Cancel Inspection?"}
          </h3>
          <p className="text-[12.5px] text-neutral-500">
            {isAttend
              ? `Confirm that ${inspection.name} attended the inspection on ${inspection.inspection_date}.`
              : `Cancel the inspection request for ${inspection.name} on ${inspection.inspection_date}. This cannot be undone.`}
          </p>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={confirm}
            disabled={saving}
            className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-colors disabled:opacity-60 ${
              isAttend
                ? "bg-[#0E2C72] hover:bg-[#0a2260]"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {saving ? "Saving…" : isAttend ? "Confirm" : "Cancel Inspection"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Convert Inspection Modal ──────────────────────────────────────────────────
function ConvertInspectionModal({
  inspection,
  onClose,
  onConverted,
}: {
  inspection: SiteInspection;
  onClose: () => void;
  onConverted: (updated: SiteInspection) => void;
}) {
  const [customers, setCustomers] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.customers.list().then((list: any[]) => setCustomers(list)).catch(() => {});
  }, []);

  const filtered = customers.filter((c) =>
    `${c.full_name} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleConvert = async () => {
    if (!selectedId) { toast.error("Select a customer to link this conversion."); return; }
    setSaving(true);
    try {
      const updated = await api.siteInspections.convert(inspection.id, selectedId);
      onConverted(updated);
      toast.success("Inspection marked as converted.");
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to mark as converted.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]/30 focus:border-[#2a52a8] bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div>
            <h3 className="text-[14px] font-semibold text-neutral-900">Mark as Converted</h3>
            <p className="text-[11.5px] text-neutral-400 mt-0.5">{inspection.name} · {inspection.inspection_date}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-[12.5px] text-neutral-600">Link this inspection to an existing customer record to track conversion.</p>
          <div>
            <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">Search Customer</label>
            <input className={inputCls} placeholder="Name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="max-h-48 overflow-y-auto border border-neutral-100 rounded-lg divide-y divide-neutral-50">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-[12px] text-neutral-400 text-center">No customers found.</p>
            ) : filtered.slice(0, 20).map((c) => (
              <button key={c.id} type="button" onClick={() => setSelectedId(c.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${selectedId === c.id ? "bg-[#0E2C72]/6" : "hover:bg-neutral-50"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${selectedId === c.id ? "bg-[#0E2C72] text-white" : "bg-neutral-100 text-neutral-500"}`}>
                  {c.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-neutral-800 truncate">{c.full_name}</p>
                  <p className="text-[11px] text-neutral-400 truncate">{c.email}</p>
                </div>
                {selectedId === c.id && <CheckCircle2 className="size-4 text-[#0E2C72] shrink-0 ml-auto" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">Cancel</button>
          <button onClick={handleConvert} disabled={saving || !selectedId}
            className="flex-1 py-2.5 rounded-xl bg-[#0E2C72] text-white text-[13px] font-semibold hover:bg-[#0a2260] disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5">
            {saving ? <><Loader2 className="size-3.5 animate-spin" />Saving…</> : <><UserCheck className="size-3.5" />Confirm Conversion</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Inspection Config Modal ───────────────────────────────────────────────────
const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

interface TimeSlot {
  id: string;
  label: string;
  start_time: string;
  mode: "RECURRING" | "ONE_TIME";
  date: string;
  is_active: boolean;
}

function newSlotId() {
  return `slot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function InspectionConfigModal({ onClose }: { onClose: () => void }) {
  const [properties, setProperties]     = useState<{ id: string; name: string }[]>([]);
  const [selectedPropId, setSelectedPropId] = useState("");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [virtualLink, setVirtualLink]   = useState("");
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [timeSlots, setTimeSlots]       = useState<TimeSlot[]>([]);
  const [maxPersons, setMaxPersons]     = useState("20");
  const [notes, setNotes]               = useState("");
  const [saving, setSaving]             = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showConsent, setShowConsent]   = useState(false);

  // New slot form
  const [newLabel, setNewLabel]         = useState("");
  const [newTime, setNewTime]           = useState("09:00");
  const [newMode, setNewMode]           = useState<"RECURRING" | "ONE_TIME">("RECURRING");
  const [newDate, setNewDate]           = useState("");

  const inputCls = "w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]/30 focus:border-[#2a52a8] bg-white";

  useEffect(() => {
    api.properties.list().then((list: any[]) => {
      setProperties(list.map((p: any) => ({ id: p.id, name: p.name })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedPropId) return;
    api.properties.inspectionConfig.get(selectedPropId)
      .then((cfg: any) => {
        if (cfg && Object.keys(cfg).length > 0) {
          setMeetingPoint(cfg.meeting_point ?? "");
          setVirtualLink(cfg.virtual_link ?? "");
          setAvailableDays(cfg.available_days ?? []);
          setMaxPersons(String(cfg.max_persons ?? "20"));
          setNotes(cfg.notes ?? "");
          if (Array.isArray(cfg.time_slots) && cfg.time_slots.length > 0) {
            // Migrate legacy string slots to objects
            const migrated: TimeSlot[] = cfg.time_slots.map((s: any) =>
              typeof s === "string"
                ? { id: newSlotId(), label: s, start_time: s, mode: "RECURRING" as const, date: "", is_active: true }
                : { id: s.id ?? newSlotId(), label: s.label ?? s.start_time, start_time: s.start_time, mode: s.mode ?? "RECURRING", date: s.date ?? "", is_active: s.is_active !== false }
            );
            setTimeSlots(migrated);
          } else if (cfg.time_from) {
            setTimeSlots([{ id: newSlotId(), label: cfg.time_from, start_time: cfg.time_from, mode: "RECURRING", date: "", is_active: true }]);
          } else {
            setTimeSlots([]);
          }
        } else {
          setMeetingPoint(""); setVirtualLink(""); setAvailableDays([]);
          setTimeSlots([]); setMaxPersons("20"); setNotes("");
        }
      })
      .catch(() => {});

    // Check for pending inspections for this property
    api.siteInspections.list({ property: selectedPropId })
      .then((list: any[]) => {
        setPendingCount(list.filter((i: any) => i.status === "PENDING" && i.linked_property === selectedPropId).length);
      })
      .catch(() => setPendingCount(0));
  }, [selectedPropId]);

  const addSlot = () => {
    if (!newTime) return;
    const label = newLabel.trim() || newTime;
    if (newMode === "ONE_TIME" && !newDate) { toast.error("Select a date for one-time slots."); return; }
    setTimeSlots((prev) => [...prev, { id: newSlotId(), label, start_time: newTime, mode: newMode, date: newDate, is_active: true }]);
    setNewLabel(""); setNewDate("");
  };

  const removeSlot = (id: string) => setTimeSlots((prev) => prev.filter((s) => s.id !== id));
  const toggleSlotActive = (id: string) =>
    setTimeSlots((prev) => prev.map((s) => s.id === id ? { ...s, is_active: !s.is_active } : s));

  const doSave = async () => {
    setSaving(true);
    try {
      const sorted = [...timeSlots].sort((a, b) => a.start_time.localeCompare(b.start_time));
      await api.properties.inspectionConfig.save(selectedPropId, {
        meeting_point: meetingPoint,
        virtual_link: virtualLink,
        available_days: availableDays,
        time_slots: sorted,
        time_from: sorted[0]?.start_time ?? null,
        time_to: sorted[sorted.length - 1]?.start_time ?? null,
        max_persons: Number(maxPersons) || 20,
        notes,
      });
      toast.success("Inspection settings saved.");
      onClose();
    } catch {
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPropId) { toast.error("Select a property first."); return; }
    if (timeSlots.length === 0) { toast.error("Add at least one time slot."); return; }
    if (pendingCount > 0) { setShowConsent(true); return; }
    await doSave();
  };

  const toggleDay = (d: string) =>
    setAvailableDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="w-full max-w-lg bg-white rounded-2xl shadow-xl my-auto"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
            <div>
              <h3 className="text-[14px] font-semibold text-neutral-900">Inspection Settings</h3>
              <p className="text-[11.5px] text-neutral-400 mt-0.5">Configure per-property inspection schedule</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400"><X className="w-4 h-4" /></button>
          </div>

          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Property select */}
            <div>
              <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">Property <span className="text-red-500">*</span></label>
              <select className={inputCls} value={selectedPropId} onChange={(e) => setSelectedPropId(e.target.value)}>
                <option value="">— Select a property —</option>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {selectedPropId && (
              <>
                {pendingCount > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-[12px] text-amber-700 flex items-center gap-2">
                    <Clock className="size-3.5 shrink-0" />
                    <span>{pendingCount} pending inspection{pendingCount !== 1 ? "s" : ""} — you'll be asked to confirm before saving changes.</span>
                  </div>
                )}

                {/* Meeting point */}
                <div>
                  <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">Physical Meeting Point</label>
                  <input className={inputCls} placeholder="e.g. Main gate, Km 15 Lekki-Epe Expressway" value={meetingPoint} onChange={(e) => setMeetingPoint(e.target.value)} />
                </div>

                {/* Virtual link */}
                <div>
                  <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">Virtual Meeting Link</label>
                  <input className={inputCls} placeholder="e.g. https://meet.google.com/xyz" value={virtualLink} onChange={(e) => setVirtualLink(e.target.value)} />
                </div>

                {/* Available days */}
                <div>
                  <label className="block text-[11.5px] font-semibold text-neutral-600 mb-2">Available Inspection Days</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((d) => (
                      <button key={d} type="button" onClick={() => toggleDay(d)}
                        className={`px-2.5 py-1 rounded-lg text-[11.5px] font-medium border transition-colors ${availableDays.includes(d) ? "bg-[#0E2C72] text-white border-[#0E2C72]" : "bg-white border-neutral-200 text-neutral-600 hover:border-[#0E2C72]/40"}`}>
                        {d.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time slots */}
                <div>
                  <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1">
                    Time Slots <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[11px] text-neutral-400 mb-2">Customers pick from these slots. Toggle active/inactive without deleting.</p>

                  {/* Existing slots list */}
                  {timeSlots.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {timeSlots.map((slot) => (
                        <div key={slot.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px] transition-colors ${slot.is_active ? "bg-white border-neutral-200" : "bg-neutral-50 border-neutral-100 opacity-60"}`}>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-neutral-800">{slot.label}</span>
                            <span className="text-neutral-400 mx-1.5">·</span>
                            <span className="text-neutral-500">{slot.start_time}</span>
                            <span className={`ml-1.5 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${slot.mode === "RECURRING" ? "bg-blue-50 text-blue-600" : "bg-violet-50 text-violet-600"}`}>
                              {slot.mode === "RECURRING" ? "Recurring" : slot.date || "One-time"}
                            </span>
                          </div>
                          {/* Active toggle */}
                          <button type="button" onClick={() => toggleSlotActive(slot.id)}
                            title={slot.is_active ? "Deactivate slot" : "Activate slot"}
                            className={`w-8 h-4.5 rounded-full relative transition-colors shrink-0 ${slot.is_active ? "bg-[#1a3d8f]" : "bg-neutral-300"}`}
                            style={{ height: "18px", width: "32px" }}>
                            <span className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${slot.is_active ? "translate-x-[14px]" : "translate-x-0.5"}`} />
                          </button>
                          <button type="button" onClick={() => removeSlot(slot.id)} className="text-neutral-300 hover:text-red-500 transition-colors shrink-0">
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add new slot form */}
                  <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3 space-y-2">
                    <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Add Slot</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10.5px] text-neutral-400 mb-0.5 block">Label</label>
                        <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className={inputCls} placeholder="e.g. Morning Tour" />
                      </div>
                      <div>
                        <label className="text-[10.5px] text-neutral-400 mb-0.5 block">Start Time</label>
                        <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className={inputCls} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10.5px] text-neutral-400 mb-0.5 block">Mode</label>
                        <select value={newMode} onChange={(e) => setNewMode(e.target.value as "RECURRING" | "ONE_TIME")} className={inputCls}>
                          <option value="RECURRING">Recurring (weekly)</option>
                          <option value="ONE_TIME">One-time date</option>
                        </select>
                      </div>
                      {newMode === "ONE_TIME" && (
                        <div>
                          <label className="text-[10.5px] text-neutral-400 mb-0.5 block">Date <span className="text-red-500">*</span></label>
                          <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className={inputCls} min={new Date().toISOString().slice(0, 10)} />
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={addSlot}
                      className="w-full py-1.5 bg-[#0E2C72] hover:bg-[#0a2260] text-white text-[12px] font-semibold rounded-lg transition-colors">
                      + Add Slot
                    </button>
                  </div>
                </div>

                {/* Max persons */}
                <div>
                  <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">Max Persons per Inspection</label>
                  <input type="number" min="1" className={inputCls} value={maxPersons} onChange={(e) => setMaxPersons(e.target.value)} />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">Additional Notes / Instructions</label>
                  <textarea rows={3} className={`${inputCls} resize-none`}
                    placeholder="Any special instructions for inspectors or visitors…"
                    value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 px-5 pb-5">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#0E2C72] text-white text-[13px] font-semibold hover:bg-[#0a2260] disabled:opacity-60 transition-colors shadow-sm">
              {saving ? "Saving…" : "Save Settings"}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Consent modal — shown when there are pending inspections */}
      <AnimatePresence>
        {showConsent && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-neutral-100 p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                <Clock className="size-5 text-amber-600" />
              </div>
              <h3 className="text-[15px] font-bold text-neutral-900 mb-1">Existing Bookings Found</h3>
              <p className="text-[13px] text-neutral-500 mb-4">
                There {pendingCount === 1 ? "is" : "are"} <strong>{pendingCount}</strong> pending inspection{pendingCount !== 1 ? "s" : ""} for this property.
                Changing the schedule does not automatically notify customers — you may need to reach out manually.
              </p>
              <div className="flex gap-2.5">
                <button onClick={() => setShowConsent(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
                  Go Back
                </button>
                <button onClick={async () => { setShowConsent(false); await doSave(); }}
                  className="flex-1 py-2.5 rounded-xl bg-[#0E2C72] text-white text-[13px] font-semibold hover:bg-[#0a2260] transition-colors">
                  Save Anyway
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type StatusFilter = "ALL" | "PENDING" | "ATTENDED" | "CANCELLED" | "NO_SHOW";
type TypeFilter = "ALL" | "PHYSICAL" | "VIRTUAL";

export function SiteInspection() {
  usePageTitle("Site Inspections");
  const { role } = useWorkspaceRole();
  const isAdmin = role === "OWNER" || role === "ADMIN";

  const [inspections, setInspections] = useState<SiteInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [detailTarget, setDetailTarget] = useState<SiteInspection | null>(
    null
  );
  const [actionTarget, setActionTarget] = useState<{
    inspection: SiteInspection;
    action: "ATTENDED" | "CANCELLED";
  } | null>(null);
  const [convertTarget, setConvertTarget] = useState<SiteInspection | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<SiteInspection | null>(null);
  const [deleting, setDeleting]           = useState(false);

  const fetchInspections = async () => {
    try {
      const data = await api.siteInspections.list();
      setInspections(data as SiteInspection[]);
    } catch {
      // silently keep existing data on polling errors
    } finally {
      setLoading(false);
    }
  };

  usePolling(fetchInspections, 300_000);

  // ── Derived counts ────────────────────────────────────────────────────────
  const today = new Date().toISOString().split("T")[0];

  const totalRequests = inspections.length;
  const upcoming = inspections.filter(
    (i) => i.status === "PENDING" && i.inspection_date >= today
  ).length;
  const completed = inspections.filter(
    (i) => i.status === "ATTENDED"
  ).length;
  const cancelled = inspections.filter(
    (i) => i.status === "CANCELLED"
  ).length;

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = inspections.filter((i) => {
    if (statusFilter !== "ALL" && i.status !== statusFilter) return false;
    if (typeFilter !== "ALL" && i.inspection_type !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !i.name.toLowerCase().includes(q) &&
        !i.email.toLowerCase().includes(q) &&
        !i.phone.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  function handleCreated(item: SiteInspection) {
    setInspections((prev) => [item, ...prev]);
  }

  function handleUpdated(updated: SiteInspection) {
    setInspections((prev) =>
      prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i))
    );
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await api.siteInspections.delete(id);
      setInspections((prev) => prev.filter((i) => i.id !== id));
      toast.success("Inspection deleted.");
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete.");
    } finally {
      setDeleting(false);
    }
  }

  // ── Summary cards ─────────────────────────────────────────────────────────
  const summaryCards = [
    {
      label: "Total Requests",
      value: totalRequests,
      valueColor: "text-neutral-900",
      iconBg: "bg-neutral-100",
      icon: <ClipboardList className="w-5 h-5 text-neutral-500" />,
    },
    {
      label: "Upcoming Inspections",
      value: upcoming,
      valueColor: "text-amber-600",
      iconBg: "bg-amber-50",
      icon: <Clock className="w-5 h-5 text-amber-500" />,
    },
    {
      label: "Completed Inspections",
      value: completed,
      valueColor: "text-[#0E2C72]",
      iconBg: "bg-[#0E2C72]/6",
      icon: <CheckCircle2 className="w-5 h-5 text-[#1a3d8f]" />,
    },
    {
      label: "Cancelled Inspections",
      value: cancelled,
      valueColor: "text-red-500",
      iconBg: "bg-red-50",
      icon: <XCircle className="w-5 h-5 text-red-400" />,
    },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)] w-full bg-neutral-50/50">
      {/* ── Page Header ── */}
      <div className="bg-white border-b border-neutral-100 px-4 sm:px-6 lg:px-8 py-4 md:py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[17px] font-semibold text-neutral-900 tracking-tight">
              Site Inspection Requests
              {!loading && (
                <span className="ml-2 text-[13px] text-neutral-400 font-normal">
                  ({inspections.length})
                </span>
              )}
            </h1>
            <p className="text-[12px] text-neutral-400 mt-0.5 hidden sm:block">
              All requests across all properties
            </p>
          </div>
          <div className="flex items-center gap-2">
            {loading && (
              <Loader2 className="w-3.5 h-3.5 text-[#1a3d8f] animate-spin" />
            )}
            {isAdmin && (
              <button
                onClick={() => setShowConfig(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 bg-white text-neutral-600 text-[12px] font-medium hover:bg-neutral-50 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Inspection Settings</span>
              </button>
            )}
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0E2C72] text-white text-[12px] font-semibold hover:bg-[#0a2260] transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Inspection Request</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-5 flex-1">
        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-neutral-100 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  {card.label}
                </span>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg}`}
                >
                  {card.icon}
                </div>
              </div>
              <div className={`text-2xl font-bold ${card.valueColor}`}>
                {loading ? (
                  <Skeleton className="h-7 w-10 rounded-md bg-neutral-100" />
                ) : (
                  card.value
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Search + Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]/30 focus:border-[#2a52a8] bg-white placeholder:text-neutral-400"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            {(
              ["ALL", "PENDING", "ATTENDED", "NO_SHOW", "CANCELLED"] as StatusFilter[]
            ).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all ${
                  statusFilter === f
                    ? "bg-[#0E2C72] text-white shadow-sm"
                    : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {f === "ALL"
                  ? "All"
                  : STATUS_CONFIG[f as keyof typeof STATUS_CONFIG]?.label ?? f}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1.5">
            {(["ALL", "PHYSICAL", "VIRTUAL"] as TypeFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all ${
                  typeFilter === t
                    ? "bg-neutral-800 text-white shadow-sm"
                    : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {t === "ALL"
                  ? "All Types"
                  : t === "PHYSICAL"
                  ? "Physical"
                  : "Virtual"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        {loading && inspections.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl bg-neutral-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No inspection requests"
            description={
              search || statusFilter !== "ALL" || typeFilter !== "ALL"
                ? "No inspections match your current filters."
                : "Inspection requests will appear here once they are created."
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-xl border border-neutral-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-100">
                    <tr>
                      {[
                        "Contact Details",
                        "Property",
                        "Date & Time",
                        "Type",
                        "Attendance Status",
                        "Converted",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left text-[10.5px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    <AnimatePresence initial={false}>
                      {filtered.map((inspection) => (
                        <motion.tr
                          key={inspection.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-neutral-50/70 transition-colors"
                        >
                          {/* Contact */}
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-[13px] text-neutral-900 leading-tight">
                              {inspection.name}
                            </div>
                            <div className="text-[11.5px] text-neutral-500 mt-0.5">
                              {inspection.phone}
                            </div>
                            <div className="text-[11.5px] text-neutral-400">
                              {inspection.email}
                            </div>
                          </td>

                          {/* Property */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                              <span className="text-[13px] font-medium text-neutral-800 max-w-[160px] truncate">
                                {inspection.property_name || "—"}
                              </span>
                            </div>
                          </td>

                          {/* Date & Time */}
                          <td className="px-5 py-3.5">
                            <div>
                              <div className="text-[13px] font-medium text-neutral-800 whitespace-nowrap">
                                {formatInspectionDateTime(inspection.inspection_date, inspection.inspection_time)}
                              </div>
                              <span className={`inline-block mt-0.5 text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full ${
                                inspection.inspection_date >= new Date().toISOString().slice(0,10)
                                  ? "bg-[#0E2C72]/6 text-[#0E2C72]"
                                  : "bg-neutral-100 text-neutral-500"
                              }`}>
                                {relativeTime(inspection.inspection_date, inspection.inspection_time)}
                              </span>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                inspection.inspection_type === "PHYSICAL"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-purple-50 text-purple-700"
                              }`}
                            >
                              {inspection.inspection_type === "PHYSICAL" ? "Physical" : "Virtual"}
                            </span>
                          </td>

                          {/* Attendance Status — inline dropdown */}
                          <td className="px-5 py-3.5">
                            <AttendanceDropdown
                              inspectionId={inspection.id}
                              status={inspection.status}
                              onUpdated={handleUpdated}
                            />
                          </td>

                          {/* Converted */}
                          <td className="px-4 py-3">
                            {inspection.is_converted ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                                <CheckCircle2 className="w-3 h-3" /> Yes
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[11px] font-semibold">
                                No
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setDetailTarget(inspection)}
                                title="View details"
                                className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {isAdmin && inspection.status === "ATTENDED" && !inspection.is_converted && (
                                <button
                                  onClick={() => setConvertTarget(inspection)}
                                  title="Mark Converted"
                                  className="p-1.5 rounded-lg hover:bg-violet-50 text-neutral-400 hover:text-violet-600 transition-colors"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {isAdmin && (
                                <button
                                  onClick={() => setDeleteTarget(inspection)}
                                  title="Delete"
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              <AnimatePresence initial={false}>
                {filtered.map((inspection) => (
                  <motion.div
                    key={inspection.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="bg-white rounded-xl border border-neutral-100 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1 mr-3">
                        <div className="font-semibold text-[13.5px] text-neutral-900 truncate">
                          {inspection.name}
                        </div>
                        <div className="text-[12px] text-neutral-500 mt-0.5">
                          {inspection.phone}
                        </div>
                        <div className="text-[11.5px] text-neutral-400 truncate">
                          {inspection.email}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={inspection.status} />
                        {inspection.is_converted && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700">
                            <UserCheck className="size-2.5" /> Converted
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-[12px] mb-3">
                      <div className="flex items-center gap-1.5 text-neutral-600">
                        <MapPin className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                        <span className="truncate">
                          {inspection.property_name || "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-neutral-600">
                        <Calendar className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                        <span className="text-[11.5px]">
                          {formatInspectionDateTime(inspection.inspection_date, inspection.inspection_time)}
                        </span>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${inspection.inspection_type === "PHYSICAL" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                          {inspection.inspection_type === "PHYSICAL" ? "Physical" : "Virtual"}
                        </span>
                      </div>
                      <div>
                        <AttendanceDropdown inspectionId={inspection.id} status={inspection.status} onUpdated={handleUpdated} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-neutral-50">
                      <button
                        onClick={() => setDetailTarget(inspection)}
                        className="flex-1 py-1.5 rounded-lg text-[12px] font-medium text-neutral-600 border border-neutral-200 hover:bg-neutral-50 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Details
                      </button>
                      {isAdmin && inspection.status === "ATTENDED" && !inspection.is_converted && (
                        <button
                          onClick={() => setConvertTarget(inspection)}
                          className="flex-1 py-1.5 rounded-lg text-[12px] font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Convert
                        </button>
                      )}
                      {isAdmin && (
                        <button onClick={() => setDeleteTarget(inspection)}
                          className="py-1.5 px-2.5 rounded-lg text-[12px] font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showConfig && (
          <InspectionConfigModal onClose={() => setShowConfig(false)} />
        )}
        {showAdd && (
          <AddInspectionModal
            onClose={() => setShowAdd(false)}
            onCreated={handleCreated}
          />
        )}
        {detailTarget && (
          <DetailModal
            inspection={detailTarget}
            onClose={() => setDetailTarget(null)}
          />
        )}
        {actionTarget && (
          <ActionConfirmModal
            inspection={actionTarget.inspection}
            action={actionTarget.action}
            onClose={() => setActionTarget(null)}
            onUpdated={(updated) => {
              handleUpdated(updated);
              setActionTarget(null);
            }}
          />
        )}
        {convertTarget && (
          <ConvertInspectionModal
            inspection={convertTarget}
            onClose={() => setConvertTarget(null)}
            onConverted={(updated) => { handleUpdated(updated); setConvertTarget(null); }}
          />
        )}
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-5">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="text-[14px] font-semibold text-neutral-900 mb-1">Delete Inspection?</h3>
                <p className="text-[12.5px] text-neutral-500">
                  Delete the inspection for <strong>{deleteTarget.name}</strong>? This cannot be undone.
                </p>
              </div>
              <div className="flex gap-2 px-5 pb-5">
                <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteTarget.id)} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5">
                  {deleting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Deleting…</> : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



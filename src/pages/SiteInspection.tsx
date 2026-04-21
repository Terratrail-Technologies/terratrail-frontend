import { useState } from "react";
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
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
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
  linked_property: string | null;
  property_name: string;
  inspection_date: string;
  inspection_time: string | null;
  inspection_type: "PHYSICAL" | "VIRTUAL";
  category: "RESIDENTIAL" | "COMMERCIAL" | "FARM_LAND";
  persons: number;
  status: "PENDING" | "ATTENDED" | "CANCELLED";
  notes: string;
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
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    icon: XCircle,
  },
} as const;

function countdown(dateStr: string): string {
  const diff = Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / 86400000
  );
  if (diff < 0) return `${Math.abs(diff)}d ago`;
  if (diff === 0) return "Today";
  return `In ${diff}d`;
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
  property_name: "",
  inspection_date: "",
  inspection_time: "",
  inspection_type: "PHYSICAL" as "PHYSICAL" | "VIRTUAL",
  category: "RESIDENTIAL" as "RESIDENTIAL" | "COMMERCIAL" | "FARM_LAND",
  persons: "1",
  notes: "",
};

function AddInspectionModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (item: SiteInspection) => void;
}) {
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);

  const set =
    (k: keyof typeof BLANK_FORM) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.email.trim() ||
      !form.property_name.trim() ||
      !form.inspection_date
    ) {
      toast.error(
        "Contact name, phone, email, property name and date are required."
      );
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        property_name: form.property_name.trim(),
        inspection_date: form.inspection_date,
        inspection_time: form.inspection_time || undefined,
        inspection_type: form.inspection_type,
        category: form.category,
        persons: Math.max(1, Number(form.persons) || 1),
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
    "w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 bg-white placeholder:text-neutral-400";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl my-auto"
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Contact row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                className={inputCls}
                placeholder="John Doe"
                value={form.name}
                onChange={set("name")}
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                className={inputCls}
                placeholder="+234 800 000 0000"
                value={form.phone}
                onChange={set("phone")}
              />
            </div>
          </div>

          {/* Email */}
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

          {/* Property name */}
          <div>
            <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">
              Property Name <span className="text-red-500">*</span>
            </label>
            <input
              className={inputCls}
              placeholder="e.g. Lekki Phase 1 Duplex"
              value={form.property_name}
              onChange={set("property_name")}
            />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">
                Preferred Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className={inputCls}
                value={form.inspection_date}
                onChange={set("inspection_date")}
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">
                Preferred Time
              </label>
              <input
                type="time"
                className={inputCls}
                value={form.inspection_time}
                onChange={set("inspection_time")}
              />
            </div>
          </div>

          {/* Type + Category + Persons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">
                Inspection Type <span className="text-red-500">*</span>
              </label>
              <select
                className={inputCls}
                value={form.inspection_type}
                onChange={set("inspection_type")}
              >
                <option value="PHYSICAL">Physical</option>
                <option value="VIRTUAL">Virtual</option>
              </select>
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                className={inputCls}
                value={form.category}
                onChange={set("category")}
              >
                <option value="RESIDENTIAL">Residential</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="FARM_LAND">Farm Land</option>
              </select>
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">
                No. of Persons <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="50"
                className={inputCls}
                value={form.persons}
                onChange={set("persons")}
              />
            </div>
          </div>

          {/* Notes */}
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
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-colors shadow-sm"
            >
              {saving ? "Creating…" : "Create Request"}
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
              isAttend ? "bg-emerald-50" : "bg-red-50"
            }`}
          >
            {isAttend ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
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
                ? "bg-emerald-600 hover:bg-emerald-700"
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

// ── Main Page ─────────────────────────────────────────────────────────────────
type StatusFilter = "ALL" | "PENDING" | "ATTENDED" | "CANCELLED";
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
  const [detailTarget, setDetailTarget] = useState<SiteInspection | null>(
    null
  );
  const [actionTarget, setActionTarget] = useState<{
    inspection: SiteInspection;
    action: "ATTENDED" | "CANCELLED";
  } | null>(null);

  const fetchInspections = async () => {
    try {
      const data = await api.siteInspections.list();
      setInspections(data);
    } catch {
      // silently keep existing data on polling errors
    } finally {
      setLoading(false);
    }
  };

  usePolling(fetchInspections, 30_000);

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
      valueColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
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
              <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
            )}
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-[12px] font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
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
              className="w-full pl-9 pr-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 bg-white placeholder:text-neutral-400"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            {(
              ["ALL", "PENDING", "ATTENDED", "CANCELLED"] as StatusFilter[]
            ).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all ${
                  statusFilter === f
                    ? "bg-emerald-600 text-white shadow-sm"
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
                        "Contact",
                        "Property",
                        "Date & Countdown",
                        "Type",
                        "Persons",
                        "Status",
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

                          {/* Date & Countdown */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                              <div>
                                <div className="text-[13px] font-medium text-neutral-800">
                                  {inspection.inspection_date}
                                </div>
                                <div className="text-[11px] font-semibold text-neutral-400">
                                  {countdown(inspection.inspection_date)}
                                </div>
                              </div>
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
                              {inspection.inspection_type === "PHYSICAL"
                                ? "Physical"
                                : "Virtual"}
                            </span>
                          </td>

                          {/* Persons */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-neutral-300" />
                              <span className="text-[13px] font-semibold text-neutral-800">
                                {inspection.persons}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-3.5">
                            <StatusBadge status={inspection.status} />
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
                              {isAdmin &&
                                inspection.status === "PENDING" && (
                                  <>
                                    <button
                                      onClick={() =>
                                        setActionTarget({
                                          inspection,
                                          action: "ATTENDED",
                                        })
                                      }
                                      title="Mark Attended"
                                      className="p-1.5 rounded-lg hover:bg-emerald-50 text-neutral-400 hover:text-emerald-600 transition-colors"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        setActionTarget({
                                          inspection,
                                          action: "CANCELLED",
                                        })
                                      }
                                      title="Cancel"
                                      className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                    </button>
                                  </>
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
                      <StatusBadge status={inspection.status} />
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
                        <span>
                          {inspection.inspection_date}{" "}
                          <span className="text-neutral-400 text-[11px]">
                            ({countdown(inspection.inspection_date)})
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-neutral-600">
                        <Users className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                        <span>
                          {inspection.persons} person
                          {inspection.persons !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            inspection.inspection_type === "PHYSICAL"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-purple-50 text-purple-700"
                          }`}
                        >
                          {inspection.inspection_type === "PHYSICAL"
                            ? "Physical"
                            : "Virtual"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-neutral-50">
                      <button
                        onClick={() => setDetailTarget(inspection)}
                        className="flex-1 py-1.5 rounded-lg text-[12px] font-medium text-neutral-600 border border-neutral-200 hover:bg-neutral-50 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Details
                      </button>
                      {isAdmin && inspection.status === "PENDING" && (
                        <>
                          <button
                            onClick={() =>
                              setActionTarget({
                                inspection,
                                action: "ATTENDED",
                              })
                            }
                            className="flex-1 py-1.5 rounded-lg text-[12px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Attended
                          </button>
                          <button
                            onClick={() =>
                              setActionTarget({
                                inspection,
                                action: "CANCELLED",
                              })
                            }
                            className="flex-1 py-1.5 rounded-lg text-[12px] font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Cancel
                          </button>
                        </>
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
      </AnimatePresence>
    </div>
  );
}

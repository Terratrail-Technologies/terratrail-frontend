import { useState, useEffect } from "react";
import { usePolling } from "../hooks/usePolling";
import { usePageTitle } from "../hooks/usePageTitle";
import { useWorkspaceRole } from "../hooks/useWorkspaceRole";
import {
  Download, MapPin, Calendar, Users, CheckCircle2, Clock,
  Loader2, ClipboardList, Plus, X, XCircle, Filter,
} from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { api } from "../services/api";
import { Badge } from "../components/ui/badge";
import { EmptyState } from "../components/ui/empty-state";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

// ── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING:   { label: "Pending",   bg: "bg-amber-100",   text: "text-amber-700",   icon: Clock },
  ATTENDED:  { label: "Attended",  bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", bg: "bg-red-100",     text: "text-red-700",     icon: XCircle },
} as const;

function StatusBadge({ status, onClick }: { status: string; onClick?: () => void }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-semibold ${cfg.bg} ${cfg.text} ${onClick ? "hover:opacity-80 transition-opacity cursor-pointer" : "cursor-default"}`}
    >
      <Icon className="w-3 h-3" /> {cfg.label}
    </button>
  );
}

// ── Status Update Modal ───────────────────────────────────────────────────────
function StatusModal({
  inspection,
  onClose,
  onUpdated,
}: {
  inspection: any;
  onClose: () => void;
  onUpdated: (updated: any) => void;
}) {
  const [saving, setSaving] = useState(false);

  async function update(newStatus: string) {
    setSaving(true);
    try {
      const updated = await api.siteInspections.update(inspection.id, { status: newStatus });
      onUpdated(updated);
      toast.success("Status updated.");
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h3 className="text-[14px] font-semibold text-neutral-900">Update Status</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-2">
          <p className="text-[12.5px] text-neutral-500 mb-4">
            Inspection for <span className="font-medium text-neutral-800">{inspection.name}</span>
          </p>
          {(["PENDING", "ATTENDED", "CANCELLED"] as const).map((s) => {
            const cfg = STATUS_CONFIG[s];
            const Icon = cfg.icon;
            const isCurrent = inspection.status === s;
            return (
              <button
                key={s}
                disabled={isCurrent || saving}
                onClick={() => update(s)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                  isCurrent
                    ? `${cfg.bg} border-current ${cfg.text} opacity-80`
                    : "border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50 text-neutral-700"
                }`}
              >
                <Icon className={`w-4 h-4 ${isCurrent ? cfg.text : "text-neutral-400"}`} />
                <span className="text-[13px] font-medium">{cfg.label}</span>
                {isCurrent && <span className="ml-auto text-[11px] font-semibold">Current</span>}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ── Request Inspection Modal ──────────────────────────────────────────────────
const BLANK_FORM = {
  name: "", email: "", phone: "",
  linked_property: "",
  inspection_date: "", inspection_time: "",
  inspection_type: "PHYSICAL",
  category: "RESIDENTIAL",
  persons: "1",
  notes: "",
};

function RequestInspectionModal({
  properties,
  onClose,
  onCreated,
}: {
  properties: any[];
  onClose: () => void;
  onCreated: (item: any) => void;
}) {
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof BLANK_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.inspection_date) {
      toast.error("Name, email, phone and date are required.");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        inspection_date: form.inspection_date,
        inspection_time: form.inspection_time || undefined,
        inspection_type: form.inspection_type,
        category: form.category,
        persons: Number(form.persons) || 1,
        notes: form.notes,
        status: "PENDING",
      };
      if (form.linked_property) payload.linked_property = form.linked_property;
      const created = await api.siteInspections.create(payload);
      onCreated(created);
      toast.success("Inspection request created.");
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl my-auto"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h3 className="text-[14px] font-semibold text-neutral-900">New Inspection Request</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">Full Name *</label>
              <input className={inputCls} placeholder="John Doe" value={form.name} onChange={set("name")} />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">Phone *</label>
              <input className={inputCls} placeholder="+234..." value={form.phone} onChange={set("phone")} />
            </div>
          </div>
          <div>
            <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">Email *</label>
            <input type="email" className={inputCls} placeholder="john@example.com" value={form.email} onChange={set("email")} />
          </div>

          {/* Property */}
          <div>
            <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">Property</label>
            <select className={inputCls} value={form.linked_property} onChange={set("linked_property")}>
              <option value="">— Select property (optional) —</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">Date *</label>
              <input type="date" className={inputCls} value={form.inspection_date} onChange={set("inspection_date")} />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">Time</label>
              <input type="time" className={inputCls} value={form.inspection_time} onChange={set("inspection_time")} />
            </div>
          </div>

          {/* Type / Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">Type</label>
              <select className={inputCls} value={form.inspection_type} onChange={set("inspection_type")}>
                <option value="PHYSICAL">Physical</option>
                <option value="VIRTUAL">Virtual</option>
              </select>
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">Category</label>
              <select className={inputCls} value={form.category} onChange={set("category")}>
                <option value="RESIDENTIAL">Residential</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="FARM_LAND">Farm Land</option>
              </select>
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">Persons</label>
              <input type="number" min="1" max="50" className={inputCls} value={form.persons} onChange={set("persons")} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11.5px] font-semibold text-neutral-600 mb-1.5">Notes</label>
            <textarea rows={2} className={`${inputCls} resize-none`} placeholder="Any additional information…" value={form.notes} onChange={set("notes")} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-colors">
              {saving ? "Creating…" : "Create Request"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function SiteInspection() {
  usePageTitle("Site Inspections");
  const { isAdmin } = useWorkspaceRole();
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [properties, setProperties] = useState<any[]>([]);
  const [showRequest, setShowRequest] = useState(false);
  const [statusTarget, setStatusTarget] = useState<any>(null);

  const fetchInspections = async () => {
    try {
      const data = await api.siteInspections.list();
      setInspections(data);
    } catch {
      setInspections([]);
    } finally {
      setLoading(false);
    }
  };

  usePolling(fetchInspections, 30_000);

  useEffect(() => {
    api.properties.list().then(setProperties).catch(() => {});
  }, []);

  const filtered = statusFilter === "ALL"
    ? inspections
    : inspections.filter((i) => i.status === statusFilter);

  const attended  = inspections.filter((i) => i.status === "ATTENDED").length;
  const upcoming  = inspections.filter((i) => i.status === "PENDING").length;
  const cancelled = inspections.filter((i) => i.status === "CANCELLED").length;
  const totalPersons = inspections.reduce((sum, i) => sum + (Number(i.persons) || 0), 0);

  function handleStatusUpdated(updated: any) {
    setInspections((prev) => prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i)));
  }

  function handleCreated(item: any) {
    setInspections((prev) => [item, ...prev]);
  }

  // ── Summary stats ─────────────────────────────────────────────────────────
  const stats = [
    { label: "Total Requests", value: inspections.length, color: "text-neutral-900" },
    { label: "Attended",       value: attended,            color: "text-emerald-600" },
    { label: "Upcoming",       value: upcoming,            color: "text-amber-600"  },
    { label: "Cancelled",      value: cancelled,           color: "text-red-500"    },
    { label: "Total Persons",  value: totalPersons,        color: "text-neutral-900" },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)] w-full bg-neutral-50/50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-100 px-4 sm:px-6 lg:px-8 py-4 md:py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[17px] font-semibold text-neutral-900 tracking-tight">
              Site Inspections
              {!loading && <span className="ml-2 text-[13px] text-neutral-400 font-normal">({inspections.length})</span>}
            </h1>
            <p className="text-[12px] text-neutral-400 mt-0.5 hidden sm:block">All inspection requests across properties</p>
          </div>
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />}
            <button
              onClick={() => {/* TODO: CSV export */toast.info("CSV export coming soon.");}}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 text-[12px] font-medium text-neutral-600 bg-white hover:bg-neutral-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button
              onClick={() => setShowRequest(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-[12px] font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Request</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-5 flex-1">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-neutral-100 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">{s.label}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{loading ? "—" : s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          {["ALL", "PENDING", "ATTENDED", "CANCELLED"].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                statusFilter === f
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {f === "ALL" ? `All (${inspections.length})` :
               f === "PENDING" ? `Pending (${upcoming})` :
               f === "ATTENDED" ? `Attended (${attended})` :
               `Cancelled (${cancelled})`}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading && inspections.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl bg-neutral-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No inspection requests"
            description={statusFilter !== "ALL" ? "No inspections match this filter." : "Inspection requests will appear here."}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-xl border border-neutral-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-100">
                    <tr>
                      {["Contact", "Property", "Date & Time", "Type", "Category", "Persons", "Status"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-[10.5px] font-semibold text-neutral-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {filtered.map((inspection) => (
                      <tr key={inspection.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-[13px] text-neutral-900">{inspection.name}</div>
                          <div className="text-[11.5px] text-neutral-500">{inspection.phone}</div>
                          <div className="text-[11.5px] text-neutral-400">{inspection.email}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                            <span className="text-[13px] font-medium text-neutral-800 truncate max-w-[160px]">
                              {inspection.property_display || inspection.property_name || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                            <div>
                              <div className="text-[13px] font-medium text-neutral-800">{inspection.inspection_date}</div>
                              <div className="text-[11.5px] text-neutral-500">{inspection.inspection_time ?? "—"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant="secondary" className="text-[11px]">{inspection.inspection_type}</Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant="secondary" className="text-[11px]">
                            {(inspection.category ?? "").replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-neutral-300" />
                            <span className="text-[13px] font-semibold text-neutral-800">{inspection.persons}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge
                            status={inspection.status}
                            onClick={isAdmin ? () => setStatusTarget(inspection) : undefined}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((inspection) => (
                <motion.div
                  key={inspection.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl border border-neutral-100 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-[13.5px] text-neutral-900">{inspection.name}</div>
                      <div className="text-[12px] text-neutral-500">{inspection.phone} · {inspection.email}</div>
                    </div>
                    <StatusBadge
                      status={inspection.status}
                      onClick={isAdmin ? () => setStatusTarget(inspection) : undefined}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[12px]">
                    <div className="flex items-center gap-1.5 text-neutral-600">
                      <MapPin className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                      <span className="truncate">{inspection.property_display || inspection.property_name || "—"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-600">
                      <Calendar className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                      <span>{inspection.inspection_date} {inspection.inspection_time ? `@ ${inspection.inspection_time}` : ""}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-600">
                      <Users className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                      <span>{inspection.persons} person{inspection.persons !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-[10.5px]">{inspection.inspection_type}</Badge>
                      <Badge variant="secondary" className="text-[10.5px]">{(inspection.category ?? "").replace(/_/g, " ")}</Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showRequest && (
          <RequestInspectionModal
            properties={properties}
            onClose={() => setShowRequest(false)}
            onCreated={handleCreated}
          />
        )}
        {statusTarget && (
          <StatusModal
            inspection={statusTarget}
            onClose={() => setStatusTarget(null)}
            onUpdated={handleStatusUpdated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

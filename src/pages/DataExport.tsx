import { useState } from "react";
import {
  Users,
  Calendar,
  Building2,
  FileText,
  BarChart3,
  Clock,
  Download,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ShieldOff,
} from "lucide-react";
import { toast } from "sonner";
import { usePageTitle } from "../hooks/usePageTitle";
import { useWorkspaceRole } from "../hooks/useWorkspaceRole";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { api } from "../services/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ExportTypeId =
  | "customers"
  | "bookings"
  | "properties"
  | "customer-reps"
  | "transactions"
  | "installments"
  | "revenue"
  | "activity";

type ExportFormat = "CSV" | "XLSX";
type ExportStatus = "Processing" | "Ready" | "Failed";

interface ExportJob {
  id: string;
  typeId: ExportTypeId;
  typeName: string;
  format: ExportFormat;
  generatedBy: string;
  dateGenerated: string;
  status: ExportStatus;
}

interface FilterState {
  date_from: string;
  date_to: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------

const EXPORT_TYPES: {
  id: ExportTypeId;
  name: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    id: "customers",
    name: "Customer Data",
    description: "All customer profiles including personal info, next of kin",
    icon: Users,
  },
  {
    id: "bookings",
    name: "Subscriptions",
    description: "All subscription records",
    icon: Calendar,
  },
  {
    id: "properties",
    name: "Property Data",
    description: "All property details, pricing, slot inventory",
    icon: Building2,
  },
  {
    id: "customer-reps",
    name: "Customer Representatives",
    description: "All rep profiles, assigned properties",
    icon: Users,
  },
  {
    id: "transactions",
    name: "Payment Transactions",
    description: "All payment records",
    icon: FileText,
  },
  {
    id: "installments",
    name: "Payment Installments",
    description: "Full installment schedules",
    icon: FileText,
  },
  {
    id: "revenue",
    name: "Revenue Reports",
    description: "Aggregated revenue data",
    icon: BarChart3,
  },
  {
    id: "activity",
    name: "Activity Logs",
    description: "Full workspace audit trail",
    icon: Clock,
  },
];

const STATUS_OPTIONS: Record<ExportTypeId, string[]> = {
  customers: ["ACTIVE", "COMPLETED", "DEFAULTING", "CANCELLED"],
  transactions: ["PENDING", "APPROVED", "REJECTED"],
  installments: ["UPCOMING", "DUE", "OVERDUE", "PENDING", "PAID"],
  bookings: [],
  properties: [],
  "customer-reps": [],
  revenue: [],
  activity: [],
};

const STATUS_CONFIG: Record<
  ExportStatus,
  { cls: string; icon: React.ElementType; animate: boolean }
> = {
  Processing: { cls: "bg-amber-50 text-amber-700", icon: Loader2, animate: true },
  Ready: { cls: "bg-[#0E2C72]/6 text-[#0E2C72]", icon: CheckCircle2, animate: false },
  Failed: { cls: "bg-red-50 text-red-700", icon: AlertCircle, animate: false },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function uniqueId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function objectsToCSV(rows: Record<string, any>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function fetchExportData(typeId: ExportTypeId, filters: FilterState): Promise<any[]> {
  const params: any = {};
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to)   params.date_to   = filters.date_to;
  if (filters.status)    params.status     = filters.status;

  switch (typeId) {
    case "customers":     return api.customers.list();
    case "bookings":      return api.subscriptions.list(params);
    case "properties":    return api.properties.list();
    case "customer-reps": return api.customerReps?.list?.() ?? [];
    case "transactions":  return api.payments.list(params);
    case "installments":  return api.installments.list(params);
    case "revenue":       return api.dashboard.getStats({ from: filters.date_from || null, to: filters.date_to || null }).then((s) => [s]);
    case "activity":      return api.workspaces.activity().then((r: any) => r?.results ?? r ?? []);
    default:              return [];
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AccessDenied() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="bg-white border border-neutral-100 rounded-2xl p-12 flex flex-col items-center max-w-sm text-center shadow-sm">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <ShieldOff className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-2">Access Denied</h2>
        <p className="text-sm text-neutral-500">
          You don't have permission to access the Data Export page. Please contact your workspace
          administrator.
        </p>
      </div>
    </div>
  );
}

interface ExportTypeCardProps {
  type: (typeof EXPORT_TYPES)[number];
  selected: boolean;
  onClick: () => void;
}

function ExportTypeCard({ type, selected, onClick }: ExportTypeCardProps) {
  const Icon = type.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition-all ${
        selected
          ? "border-[#0E2C72] bg-[#0E2C72]/6"
          : "border-neutral-100 bg-white hover:border-[#0E2C72]/40 hover:shadow-sm"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${
          selected ? "bg-[#d6e0f5]" : "bg-neutral-50"
        }`}
      >
        <Icon
          className={`w-5 h-5 transition-colors ${selected ? "text-[#0E2C72]" : "text-neutral-500"}`}
        />
      </div>
      <p
        className={`text-sm font-semibold mb-1 ${selected ? "text-[#0E2C72]" : "text-neutral-800"}`}
      >
        {type.name}
      </p>
      <p className={`text-xs leading-snug ${selected ? "text-[#0E2C72]" : "text-neutral-500"}`}>
        {type.description}
      </p>
    </button>
  );
}

interface StatusBadgeProps {
  status: ExportStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.cls}`}
    >
      <Icon className={`w-3.5 h-3.5 ${cfg.animate ? "animate-spin" : ""}`} />
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DataExport() {
  usePageTitle("Data Export");

  const { role, loading: roleLoading } = useWorkspaceRole();
  const { displayName } = useCurrentUser();

  // Configuration state
  const [selectedType, setSelectedType] = useState<ExportTypeId>("customers");
  const [format, setFormat] = useState<ExportFormat>("CSV");
  const [filters, setFilters] = useState<FilterState>({
    date_from: "",
    date_to: "",
    status: "",
  });

  // History state
  const [history, setHistory] = useState<ExportJob[]>([]);

  // -------------------------------------------------------------------------
  // Role guard
  // -------------------------------------------------------------------------

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#0E2C72] animate-spin" />
      </div>
    );
  }

  if (role === "SALES_REP" || role === "CUSTOMER") {
    return <AccessDenied />;
  }

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------

  const selectedTypeMeta = EXPORT_TYPES.find((t) => t.id === selectedType)!;
  const statusOptions = STATUS_OPTIONS[selectedType];
  const hasStatusFilter = statusOptions.length > 0;

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function handleFilterChange(field: keyof FilterState, value: string) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  function handleTypeSelect(id: ExportTypeId) {
    setSelectedType(id);
    setFilters({ date_from: "", date_to: "", status: "" });
  }

  async function handleGenerateExport() {
    const job: ExportJob = {
      id: uniqueId(),
      typeId: selectedType,
      typeName: selectedTypeMeta.name,
      format,
      generatedBy: displayName,
      dateGenerated: new Date().toISOString(),
      status: "Processing",
    };

    setHistory((prev) => [job, ...prev]);
    toast.info("Fetching data…");

    try {
      const rows = await fetchExportData(selectedType, filters);
      if (!rows.length) {
        setHistory((prev) => prev.map((j) => j.id === job.id ? { ...j, status: "Failed" } : j));
        toast.error("No data found for the selected filters.");
        return;
      }

      const csv = objectsToCSV(rows);
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${selectedType}-${timestamp}.${format.toLowerCase()}`;
      const mime = format === "CSV" ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      // Store CSV in job for download
      setHistory((prev) =>
        prev.map((j) =>
          j.id === job.id ? { ...j, status: "Ready", _data: csv, _filename: filename, _mime: mime } : j
        )
      );
      toast.success(`${selectedTypeMeta.name} export ready — ${rows.length} records.`);
    } catch (err: any) {
      setHistory((prev) => prev.map((j) => j.id === job.id ? { ...j, status: "Failed" } : j));
      toast.error(err.message ?? "Export failed.");
    }
  }

  function handleDelete(id: string) {
    setHistory((prev) => prev.filter((j) => j.id !== id));
    toast.success("Export removed from history.");
  }

  function handleDownload(job: ExportJob & { _data?: string; _filename?: string; _mime?: string }) {
    if (job.status !== "Ready" || !job._data) return;
    downloadFile(job._data, job._filename ?? `export.${job.format.toLowerCase()}`, job._mime ?? "text/csv");
    toast.success(`Downloaded ${job._filename}`);
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Page header */}
      <div className="bg-white border-b border-neutral-200 px-8 py-5">
        <h1 className="text-2xl font-semibold text-neutral-900">Data Export</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Export your workspace data for analysis and reporting
        </p>
      </div>

      {/* Body */}
      <div className="p-8">
        <div className="flex flex-col xl:flex-row gap-8 items-start">
          {/* ================================================================
              LEFT — Export Configuration Panel
          ================================================================ */}
          <div className="w-full xl:w-[580px] shrink-0 space-y-6">
            <div className="bg-white border border-neutral-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100">
                <h2 className="text-base font-semibold text-neutral-900">Export Configuration</h2>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Configure and generate a new data export
                </p>
              </div>

              <div className="px-6 py-5 space-y-8">
                {/* Step 1 — Export Type */}
                <section>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                    Step 1 — Select Export Type
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {EXPORT_TYPES.map((type) => (
                      <ExportTypeCard
                        key={type.id}
                        type={type}
                        selected={selectedType === type.id}
                        onClick={() => handleTypeSelect(type.id)}
                      />
                    ))}
                  </div>
                </section>

                {/* Step 2 — Filters */}
                <section>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                    Step 2 — Configure Filters
                  </p>
                  <div className="space-y-4">
                    {/* Date range */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Date Range
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-neutral-500 mb-1">From</label>
                          <input
                            type="date"
                            value={filters.date_from}
                            onChange={(e) => handleFilterChange("date_from", e.target.value)}
                            className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#1a3d8f] focus:border-transparent transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-neutral-500 mb-1">To</label>
                          <input
                            type="date"
                            value={filters.date_to}
                            onChange={(e) => handleFilterChange("date_to", e.target.value)}
                            className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#1a3d8f] focus:border-transparent transition"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Status filter */}
                    {hasStatusFilter && (
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Status
                        </label>
                        <select
                          value={filters.status}
                          onChange={(e) => handleFilterChange("status", e.target.value)}
                          className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a3d8f] focus:border-transparent transition"
                        >
                          <option value="">All statuses</option>
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </section>

                {/* Step 3 — Format */}
                <section>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                    Step 3 — Export Format
                  </p>
                  <div className="flex gap-3">
                    {(["CSV", "XLSX"] as ExportFormat[]).map((fmt) => {
                      const active = format === fmt;
                      return (
                        <button
                          key={fmt}
                          onClick={() => setFormat(fmt)}
                          className={`flex-1 flex items-center gap-3 border rounded-xl px-4 py-3 transition-all ${
                            active
                              ? "border-[#0E2C72] bg-[#0E2C72]/6"
                              : "border-neutral-200 bg-white hover:border-[#0E2C72]/40"
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                              active ? "border-[#0E2C72]" : "border-neutral-300"
                            }`}
                          >
                            {active && (
                              <span className="w-2 h-2 rounded-full bg-[#1a3d8f] block" />
                            )}
                          </span>
                          <span
                            className={`text-sm font-medium ${active ? "text-[#0E2C72]" : "text-neutral-700"}`}
                          >
                            {fmt === "CSV" ? "CSV" : "Excel (.xlsx)"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Step 4 — Generate */}
                <section>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                    Step 4 — Generate Export
                  </p>
                  <button
                    onClick={handleGenerateExport}
                    className="w-full bg-[#0E2C72] hover:bg-[#0a2260] active:bg-[#0a2260] text-white text-sm font-semibold rounded-xl px-4 py-3 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Generate Export
                  </button>
                  <p className="text-xs text-neutral-400 mt-2 text-center">
                    Exporting{" "}
                    <span className="font-medium text-neutral-600">{selectedTypeMeta.name}</span>{" "}
                    as <span className="font-medium text-neutral-600">{format}</span>
                    {filters.date_from && (
                      <>
                        {" "}
                        from{" "}
                        <span className="font-medium text-neutral-600">{filters.date_from}</span>
                      </>
                    )}
                    {filters.date_to && (
                      <>
                        {" "}
                        to{" "}
                        <span className="font-medium text-neutral-600">{filters.date_to}</span>
                      </>
                    )}
                    {filters.status && (
                      <>
                        {" "}
                        · Status:{" "}
                        <span className="font-medium text-neutral-600">{filters.status}</span>
                      </>
                    )}
                  </p>
                </section>
              </div>
            </div>
          </div>

          {/* ================================================================
              RIGHT — Export History Panel
          ================================================================ */}
          <div className="w-full min-w-0 flex-1">
            <div className="bg-white border border-neutral-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-neutral-900">Export History</h2>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    Previously generated export files
                  </p>
                </div>
                {history.length > 0 && (
                  <span className="text-xs font-medium bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-full">
                    {history.length} {history.length === 1 ? "export" : "exports"}
                  </span>
                )}
              </div>

              {history.length === 0 ? (
                /* Empty state */
                <div className="py-20 flex flex-col items-center text-center px-6">
                  <div className="w-16 h-16 bg-neutral-50 border border-neutral-100 rounded-full flex items-center justify-center mb-4">
                    <Download className="w-7 h-7 text-neutral-300" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-700 mb-1">
                    No export history yet
                  </h3>
                  <p className="text-sm text-neutral-400 max-w-xs">
                    Configure your export on the left and click "Generate Export" to create your
                    first file.
                  </p>
                </div>
              ) : (
                /* Table */
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-100 bg-neutral-50">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                          Export Type
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                          Format
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                          Generated By
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                          Date Generated
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                          Status
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {history.map((job) => (
                        <tr key={job.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-neutral-900 whitespace-nowrap">
                            {job.typeName}
                          </td>
                          <td className="px-4 py-4 text-neutral-600 whitespace-nowrap">
                            <span className="bg-neutral-100 text-neutral-700 text-xs font-semibold px-2 py-0.5 rounded">
                              {job.format}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-neutral-600 whitespace-nowrap">You</td>
                          <td className="px-4 py-4 text-neutral-500 whitespace-nowrap text-xs">
                            {formatDate(job.dateGenerated)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <StatusBadge status={job.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleDownload(job)}
                                disabled={job.status !== "Ready"}
                                title={job.status !== "Ready" ? "File not ready yet" : "Download"}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                  job.status === "Ready"
                                    ? "bg-[#0E2C72]/6 text-[#0E2C72] hover:bg-[#d6e0f5]"
                                    : "bg-neutral-50 text-neutral-300 cursor-not-allowed"
                                }`}
                              >
                                <Download className="w-3.5 h-3.5" />
                                Download
                              </button>
                              <button
                                onClick={() => handleDelete(job.id)}
                                title="Delete"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  Filter,
  Eye,
  Trash2,
  Loader2,
  X,
  Download,
  UserCheck,
  ClipboardCheck,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { api } from "../services/api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { motion } from "motion/react";
import { toast } from "sonner";
import { TablePagination } from "../components/ui/TablePagination";
import { usePageTitle } from "../hooks/usePageTitle";
import { usePolling } from "../hooks/usePolling";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number | string | null | undefined) =>
  n == null || n === "" ? "—" : `₦${Number(n).toLocaleString("en-NG")}`;

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—";

// ─── Status badge helpers ──────────────────────────────────────────────────────

type SubStatus = "ACTIVE" | "PENDING" | "COMPLETED" | "CANCELLED" | "DEFAULTED" | "DEFAULTING";

const STATUS_CLS: Record<SubStatus, string> = {
  ACTIVE:     "bg-green-50 text-green-700 border-green-100",
  PENDING:    "bg-neutral-100 text-neutral-500 border-neutral-200",
  COMPLETED:  "bg-blue-50 text-blue-700 border-blue-100",
  CANCELLED:  "bg-red-50 text-red-600 border-red-100",
  DEFAULTED:  "bg-orange-50 text-orange-600 border-orange-100",
  DEFAULTING: "bg-amber-50 text-amber-600 border-amber-100",
};

function statusCls(val?: string | null) {
  if (!val) return "bg-neutral-100 text-neutral-500 border-neutral-200";
  return STATUS_CLS[(val.toUpperCase() as SubStatus)] ?? "bg-neutral-100 text-neutral-500 border-neutral-200";
}

function statusLabel(val?: string | null) {
  if (!val) return "—";
  const map: Record<string, string> = {
    ACTIVE: "Active", PENDING: "Pending", COMPLETED: "Completed",
    CANCELLED: "Cancelled", DEFAULTED: "Defaulted", DEFAULTING: "Defaulting",
  };
  return map[val.toUpperCase()] ?? val;
}

// ─── Mini progress bar ────────────────────────────────────────────────────────

function MiniProgress({ pct }: { pct: number }) {
  const pctClamped = Math.min(100, Math.max(0, pct ?? 0));
  return (
    <div className="flex items-center gap-1.5 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#1a3d8f] rounded-full transition-all"
          style={{ width: `${pctClamped}%` }}
        />
      </div>
      <span className="text-[11px] text-neutral-500 w-7 text-right shrink-0">{Math.round(pctClamped)}%</span>
    </div>
  );
}

// ─── Assign Sales Rep Modal ───────────────────────────────────────────────────

interface AssignRepModalProps {
  subscriptionIds: string[];
  onClose: () => void;
  onAssigned: () => void;
}

function AssignRepModal({ subscriptionIds, onClose, onAssigned }: AssignRepModalProps) {
  const [reps, setReps]             = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [selectedRepId, setSelectedRepId] = useState<string>("");
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  useEffect(() => {
    api.salesReps.list()
      .then((data: any[]) => setReps(data))
      .catch(() => setError("Failed to load sales reps."))
      .finally(() => setLoading(false));
  }, []);

  const filteredReps = reps.filter((r) => {
    const q = search.toLowerCase();
    return !q || (r.name ?? r.full_name ?? "").toLowerCase().includes(q) || (r.email ?? "").toLowerCase().includes(q);
  });

  const handleAssign = async () => {
    if (!selectedRepId) { setError("Please select a sales rep."); return; }
    setSaving(true);
    setError("");
    try {
      await Promise.all(subscriptionIds.map((id) => api.subscriptions.assignRep(id, selectedRepId)));
      toast.success(`Sales rep assigned to ${subscriptionIds.length} subscription${subscriptionIds.length !== 1 ? "s" : ""}.`);
      onAssigned();
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Failed to assign sales rep.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <h3 className="text-[15px] font-semibold text-neutral-900">Assign Sales Rep</h3>
            <p className="text-[12px] text-neutral-400 mt-0.5">
              {subscriptionIds.length} subscription{subscriptionIds.length !== 1 ? "s" : ""} selected
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-[12px]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{error}
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sales rep…"
              className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]/30 focus:border-[#2a52a8]"
            />
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-lg bg-neutral-100" />)}
            </div>
          ) : filteredReps.length === 0 ? (
            <p className="text-[13px] text-neutral-400 text-center py-4">No sales reps found.</p>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {filteredReps.map((rep) => {
                const name = rep.name ?? rep.full_name ?? rep.user_name ?? "Unknown";
                const email = rep.email ?? rep.user_email ?? "";
                return (
                  <button
                    key={rep.id}
                    onClick={() => setSelectedRepId(rep.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all text-[13px] ${
                      selectedRepId === rep.id
                        ? "border-[#0E2C72] bg-[#0E2C72]/6"
                        : "border-neutral-200 hover:border-[#0E2C72]/40 hover:bg-neutral-50"
                    }`}
                  >
                    <p className="font-medium text-neutral-800">{name}</p>
                    {email && <p className="text-[11px] text-neutral-400 mt-0.5">{email}</p>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex gap-2.5 px-6 pb-6 pt-4 border-t border-neutral-100">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-neutral-200 text-neutral-700 rounded-lg text-[13px] font-medium hover:bg-neutral-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleAssign} disabled={saving || !selectedRepId}
            className="flex-1 px-4 py-2.5 bg-[#0E2C72] text-white rounded-lg text-[13px] font-medium hover:bg-[#0a2260] disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Assigning…</> : "Assign Rep"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status filter options ─────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: "ALL",        label: "All" },
  { value: "ACTIVE",     label: "Active" },
  { value: "PENDING",    label: "Pending" },
  { value: "COMPLETED",  label: "Completed" },
  { value: "CANCELLED",  label: "Cancelled" },
  { value: "DEFAULTED",  label: "Defaulted" },
  { value: "DEFAULTING", label: "Defaulting" },
];

// ─── Export helpers ────────────────────────────────────────────────────────────

function exportCSV(rows: any[]) {
  const headers = ["S/N", "Customer", "Email", "Property", "Plan", "Total", "Paid", "Balance", "Status", "Start Date"];
  const lines = rows.map((s, i) => [
    i + 1,
    `"${(s.customer_name ?? "").replace(/"/g, '""')}"`,
    `"${(s.customer_email ?? "").replace(/"/g, '""')}"`,
    `"${(s.property_name ?? "").replace(/"/g, '""')}"`,
    `"${(s.pricing_plan_name ?? s.plan_name ?? "").replace(/"/g, '""')}"`,
    `"${(s.total_price ?? "").toString().replace(/"/g, '""')}"`,
    `"${(s.amount_paid ?? "").toString().replace(/"/g, '""')}"`,
    `"${(s.balance ?? "").toString().replace(/"/g, '""')}"`,
    `"${(s.status ?? "").replace(/"/g, '""')}"`,
    `"${s.start_date ? new Date(s.start_date).toLocaleDateString("en-NG") : ""}"`,
  ].join(","));
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "subscriptions.csv"; a.click();
  URL.revokeObjectURL(url);
}

function exportExcel(rows: any[]) {
  // Simple Excel XML export
  const headers = ["S/N", "Customer", "Email", "Property", "Plan", "Total", "Paid", "Balance", "Status", "Start Date"];
  const headerRow = headers.map((h) => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join("");
  const dataRows = rows.map((s, i) => {
    const cells = [
      i + 1,
      s.customer_name ?? "",
      s.customer_email ?? "",
      s.property_name ?? "",
      s.pricing_plan_name ?? s.plan_name ?? "",
      s.total_price ?? "",
      s.amount_paid ?? "",
      s.balance ?? "",
      s.status ?? "",
      s.start_date ? new Date(s.start_date).toLocaleDateString("en-NG") : "",
    ].map((v) => `<Cell><Data ss:Type="String">${String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Data></Cell>`).join("");
    return `<Row>${cells}</Row>`;
  });
  const xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Subscriptions"><Table><Row>${headerRow}</Row>${dataRows.join("")}</Table></Worksheet></Workbook>`;
  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "subscriptions.xls"; a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function Subscriptions() {
  usePageTitle("Subscriptions");
  const navigate = useNavigate();

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [properties, setProperties]       = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState("ALL");
  const [propertyFilter, setPropertyFilter] = useState("ALL");
  const [page, setPage]                   = useState(1);
  const [pageSize, setPageSize]           = useState(20);
  const [selected, setSelected]           = useState<Set<string>>(new Set());
  const [showAssignRep, setShowAssignRep] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const fetchSubscriptions = useCallback(async () => {
    setLoading((prev) => prev || subscriptions.length === 0);
    try {
      const data = await api.subscriptions.listAll();
      setSubscriptions(data);
    } catch (err) {
      console.error("Failed to load subscriptions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.properties.list().then(setProperties).catch(() => {});
  }, []);

  usePolling(fetchSubscriptions, 300_000);

  // ── Derived options ───────────────────────────────────────────────────────
  const propertyOptions = Array.from(
    new Set(subscriptions.map((s) => s.property_name).filter(Boolean))
  ).sort() as string[];

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = subscriptions.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (s.customer_name ?? "").toLowerCase().includes(q) ||
      (s.customer_email ?? "").toLowerCase().includes(q) ||
      (s.property_name ?? "").toLowerCase().includes(q);
    const matchesStatus = statusFilter === "ALL" || (s.status ?? "").toUpperCase() === statusFilter;
    const matchesProperty = propertyFilter === "ALL" || s.property_name === propertyFilter;
    return matchesSearch && matchesStatus && matchesProperty;
  });

  const hasFilters = search || statusFilter !== "ALL" || propertyFilter !== "ALL";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setPropertyFilter("ALL");
    setPage(1);
    setSelected(new Set());
  };

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // ── Bulk selection ────────────────────────────────────────────────────────
  const allPageSelected = paginated.length > 0 && paginated.every((s) => selected.has(s.id));
  const somePageSelected = paginated.some((s) => selected.has(s.id));

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelected((prev) => { const n = new Set(prev); paginated.forEach((s) => n.delete(s.id)); return n; });
    } else {
      setSelected((prev) => { const n = new Set(prev); paginated.forEach((s) => n.add(s.id)); return n; });
    }
  };
  const toggleRow = (id: string) => {
    setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete subscription for ${name}? This cannot be undone.`)) return;
    try {
      await api.subscriptions.delete(id);
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Subscription deleted.");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete subscription.");
    }
  };

  const isInitialLoad = loading && subscriptions.length === 0;

  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)] w-full">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-neutral-100 px-4 sm:px-6 lg:px-8 py-4 md:py-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div>
              <h1 className="text-[17px] font-semibold text-neutral-900 tracking-tight">Subscriptions</h1>
              <p className="text-[12px] text-neutral-400 mt-0.5 hidden sm:block">
                All property subscriptions across your workspace
              </p>
            </div>
            {loading && !isInitialLoad && (
              <Loader2 className="w-3.5 h-3.5 text-[#1a3d8f] animate-spin" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Export dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowExportMenu((v) => !v)}
                className="h-8 gap-1.5 border-neutral-200 text-neutral-700 text-[12px] font-medium rounded-lg px-3"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-neutral-100 rounded-xl shadow-lg z-20 overflow-hidden">
                  <button
                    onClick={() => { exportCSV(filtered); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-[13px] text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => { exportExcel(filtered); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-[13px] text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    Export as Excel
                  </button>
                </div>
              )}
            </div>
            {/* Assign Sales Rep */}
            <Button
              onClick={() => {
                if (selected.size === 0) { toast.info("Select at least one subscription to assign a rep."); return; }
                setShowAssignRep(true);
              }}
              className="h-8 gap-1.5 bg-[#0E2C72] hover:bg-[#0a2260] text-white text-[12px] font-medium rounded-lg px-3 shadow-sm"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Assign Sales Rep</span>
              {selected.size > 0 && (
                <span className="ml-0.5 bg-white/20 text-white text-[10px] font-bold rounded-full px-1.5">
                  {selected.size}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.14 }}
        className="p-4 sm:p-6 lg:p-8 space-y-5 flex-1"
      >
        {/* ── Filter bar ───────────────────────────────────────────────── */}
        {!isInitialLoad && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 flex-wrap">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <Input
                placeholder="Search by customer or property…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); setSelected(new Set()); }}
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
                    onClick={() => { setStatusFilter(sf.value); setPage(1); setSelected(new Set()); }}
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

            {/* Property filter */}
            {propertyOptions.length > 0 && (
              <select
                value={propertyFilter}
                onChange={(e) => { setPropertyFilter(e.target.value); setPage(1); setSelected(new Set()); }}
                className="h-9 px-2.5 border border-neutral-200 bg-white rounded-lg text-[12px] text-neutral-700 focus:outline-none focus:ring-1 focus:ring-[#1a3d8f]/30"
              >
                <option value="ALL">All Properties</option>
                {propertyOptions.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            )}

            {hasFilters && (
              <button onClick={clearFilters}
                className="h-9 px-2.5 flex items-center gap-1 border border-neutral-200 bg-white rounded-lg text-[12px] text-neutral-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        )}

        {isInitialLoad ? (
          /* ── Skeleton ─────────────────────────────────────────────── */
          <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="bg-neutral-50/70 border-b border-neutral-100 px-5 py-3 flex gap-4">
              {[40, 120, 120, 100, 80, 90, 80, 70, 80, 80, 60].map((w, i) => (
                <Skeleton key={i} className="h-3 rounded bg-neutral-200" style={{ width: w }} />
              ))}
            </div>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-4 border-b border-neutral-50 last:border-0">
                <Skeleton className="h-3.5 w-6 bg-neutral-100" />
                <Skeleton className="h-3.5 w-28 bg-neutral-100" />
                <Skeleton className="h-3.5 w-24 bg-neutral-100" />
                <Skeleton className="h-3.5 w-20 bg-neutral-100" />
                <Skeleton className="h-3.5 w-24 bg-neutral-100" />
                <Skeleton className="h-3.5 w-20 bg-neutral-100" />
                <Skeleton className="h-3.5 w-20 bg-neutral-100" />
                <Skeleton className="h-3.5 w-20 bg-neutral-100" />
                <Skeleton className="h-5 w-16 rounded-full bg-neutral-100" />
                <Skeleton className="h-3.5 w-20 bg-neutral-100" />
                <Skeleton className="h-7 w-16 rounded-lg bg-neutral-100 ml-auto" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* ── Empty state ─────────────────────────────────────────── */
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-neutral-100 shadow-sm">
            <ClipboardCheck className="w-12 h-12 text-neutral-200 mb-4" />
            <h3 className="text-[15px] font-semibold text-neutral-700">
              {hasFilters ? "No matching subscriptions" : "No subscriptions found"}
            </h3>
            <p className="text-[13px] text-neutral-400 mt-1.5 max-w-xs text-center">
              {hasFilters
                ? "Adjust your search or filter to find what you're looking for."
                : "Subscriptions will appear here once customers are assigned to properties."}
            </p>
            {hasFilters && (
              <button onClick={clearFilters}
                className="mt-4 px-4 py-2 rounded-lg bg-[#0E2C72] text-white text-[13px] font-medium hover:bg-[#0a2260] transition-colors">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          /* ── Table ───────────────────────────────────────────────── */
          <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            {/* Bulk action bar */}
            {selected.size > 0 && (
              <div className="bg-[#0E2C72]/5 border-b border-[#0E2C72]/20 px-4 py-2.5 flex items-center gap-3">
                <span className="text-[#0E2C72] font-semibold text-[12px]">{selected.size} selected</span>
                <button
                  onClick={() => setShowAssignRep(true)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#0E2C72]/20 text-[#0E2C72] text-[12px] font-medium hover:bg-[#0E2C72]/5 transition-colors flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Assign Sales Rep
                </button>
                <button
                  onClick={() => { setSelected(new Set()); }}
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
                        className="w-4 h-4 rounded border-neutral-300 accent-[#0E2C72]"
                        checked={allPageSelected}
                        ref={(el) => { if (el) el.indeterminate = !allPageSelected && somePageSelected; }}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    {["S/N", "Customer", "Property", "Plan", "Total Price", "Amount Paid", "Progress", "Status", "Start Date", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((sub, idx) => (
                    <tr key={sub.id} className="border-b border-neutral-50 hover:bg-neutral-50/60 transition-colors">
                      <td className="px-4 py-3 w-8">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-neutral-300 accent-[#0E2C72]"
                          checked={selected.has(sub.id)}
                          onChange={() => toggleRow(sub.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      {/* S/N */}
                      <td className="px-4 py-3 text-[12px] text-neutral-400 font-mono">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      {/* Customer */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-[13px] font-semibold text-neutral-900">{sub.customer_name ?? "—"}</p>
                        {sub.customer_email && (
                          <p className="text-[11px] text-neutral-400 mt-0.5">{sub.customer_email}</p>
                        )}
                      </td>
                      {/* Property */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-[12.5px] text-neutral-700">{sub.property_name ?? "—"}</span>
                      </td>
                      {/* Plan */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-[12px] text-neutral-600">{sub.pricing_plan_name ?? sub.plan_name ?? "—"}</span>
                      </td>
                      {/* Total Price */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-[12.5px] font-semibold text-neutral-800">{fmt(sub.total_price)}</span>
                      </td>
                      {/* Amount Paid */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-[12.5px] font-semibold text-[#0E2C72]">{fmt(sub.amount_paid)}</span>
                      </td>
                      {/* Progress */}
                      <td className="px-4 py-3.5 min-w-[100px]">
                        <MiniProgress pct={sub.payment_completion_pct ?? 0} />
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge className={`text-[11px] border ${statusCls(sub.status)}`}>
                          {statusLabel(sub.status)}
                        </Badge>
                      </td>
                      {/* Start Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-[12px] text-neutral-500">
                        {fmtDate(sub.start_date)}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/subscriptions/${sub.id}`)}
                            title="View subscription"
                            className="h-7 px-2.5 flex items-center gap-1 rounded-lg text-[#0E2C72] hover:bg-[#0E2C72]/6 text-[12px] font-medium transition-colors border border-[#0E2C72]/20"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                          <button
                            onClick={() => handleDelete(sub.id, sub.customer_name ?? "this subscription")}
                            title="Delete"
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
          </div>
        )}
      </motion.div>

      {/* ── Assign Rep Modal ──────────────────────────────────────────────── */}
      {showAssignRep && (
        <AssignRepModal
          subscriptionIds={Array.from(selected)}
          onClose={() => setShowAssignRep(false)}
          onAssigned={() => { setSelected(new Set()); fetchSubscriptions(); }}
        />
      )}

      {/* Close export menu on outside click */}
      {showExportMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
      )}
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePolling } from "../hooks/usePolling";
import { usePageTitle } from "../hooks/usePageTitle";
import { Link, useNavigate } from "react-router";
import {
  Plus, Search, MapPin, CheckCircle2, Clock,
  Building as BuildingIcon, Loader2, MoreHorizontal, Pencil, Eye, EyeOff,
  LayoutGrid, List, Home, TrendingUp, Package, AlertCircle,
} from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { api } from "../services/api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { motion, AnimatePresence } from "motion/react";
import { EmptyState } from "../components/ui/empty-state";
import { toast } from "sonner";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
} as const;
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 340, damping: 28 } },
} as const;

// ── Property card 3-dot dropdown ─────────────────────────────────────────────
function PropertyMenu({
  propertyId,
  status,
  onRefresh,
}: {
  propertyId: string;
  status?: string;
  onRefresh?: () => void;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!btnRef.current?.contains(e.target as Node) && !menuRef.current?.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((o) => !o);
  };

  const handlePublishToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    const isPublished = status === "PUBLISHED" || status === "published";
    try {
      if (isPublished) {
        await api.properties.unpublish(propertyId);
        toast.success("Property unpublished.");
      } else {
        await api.properties.publish(propertyId);
        toast.success("Property published.");
      }
      onRefresh?.();
    } catch (err: any) {
      toast.error(err.message ?? "Action failed.");
    }
  };

  const isPublished = status === "PUBLISHED" || status === "published";

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="h-7 w-7 rounded-md flex items-center justify-center bg-white/80 backdrop-blur-sm text-neutral-500 hover:text-neutral-900 hover:bg-white border border-neutral-200/60 shadow-sm transition-all"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.1 }}
              style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 9999 }}
              className="w-44 rounded-xl border border-neutral-100 bg-white shadow-lg shadow-neutral-900/10 overflow-hidden"
            >
              <div className="py-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setOpen(false); navigate(`/properties/${propertyId}`); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-neutral-400" />
                  View Details
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setOpen(false); navigate(`/properties/${propertyId}/edit`); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-neutral-400" />
                  Edit Property
                </button>
                {status !== undefined && (
                  <button
                    onClick={handlePublishToggle}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] font-medium transition-colors ${
                      isPublished ? "text-amber-600 hover:bg-amber-50" : "text-[#0E2C72] hover:bg-[#0E2C72]/6"
                    }`}
                  >
                    {isPublished
                      ? <EyeOff className="w-3.5 h-3.5" />
                      : <CheckCircle2 className="w-3.5 h-3.5" />}
                    {isPublished ? "Unpublish" : "Publish"}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// ── Property card (grid view) ─────────────────────────────────────────────────
function PropertyCard({ property, onRefresh }: { property: any; onRefresh: () => void }) {
  const navigate = useNavigate();
  const fmt = (n: number | string) => `₦${Number(n).toLocaleString("en-NG")}`;
  const isPublished = property.status === "PUBLISHED" || property.status === "published";

  const typeLabel = (property.property_type ?? property.type ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  return (
    <motion.div
      variants={item}
      onClick={() => navigate(`/properties/${property.id}`)}
      className="bg-white rounded-xl border border-neutral-100 overflow-hidden cursor-pointer
                 shadow-[0_1px_3px_rgba(0,0,0,0.06)]
                 hover:shadow-[0_6px_20px_rgba(0,0,0,0.09)]
                 hover:-translate-y-0.5 transition-all duration-200 group flex flex-col"
    >
      {/* Cover image */}
      <div className="h-44 relative overflow-hidden flex-shrink-0">
        {property.featured_image ? (
          <img
            src={property.featured_image}
            alt={property.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-50 to-[#eef2fb] flex items-center justify-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-white/60">
                <BuildingIcon className="w-7 h-7 text-[#1a3d8f]/60" />
              </div>
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">No cover image</span>
            </div>
          </div>
        )}

        {/* Status badge over image */}
        <div className="absolute top-3 left-3">
          <Badge
            className={isPublished
              ? "bg-[#1a3d8f]/90 text-white border-0 shadow-sm backdrop-blur-sm text-[10.5px] gap-1 px-2 py-0.5"
              : "bg-neutral-800/70 text-white border-0 shadow-sm backdrop-blur-sm text-[10.5px] gap-1 px-2 py-0.5"}
          >
            {isPublished
              ? <><CheckCircle2 className="w-2.5 h-2.5" />Published</>
              : <><Clock className="w-2.5 h-2.5" />Draft</>}
          </Badge>
        </div>

        {/* 3-dot menu */}
        <div className="absolute top-3 right-3">
          <PropertyMenu propertyId={property.id} status={property.status} onRefresh={onRefresh} />
        </div>

        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-[#0E2C72]/0 group-hover:bg-[#0E2C72]/[0.03] transition-colors pointer-events-none" />
      </div>

      {/* Info */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-3 gap-3">
          <div className="min-w-0">
            <h3 className="text-[14px] font-semibold text-neutral-900 group-hover:text-[#0E2C72] transition-colors truncate tracking-tight">
              {property.name}
            </h3>
            {typeLabel && (
              <span className="text-[11px] font-medium text-[#0E2C72] bg-[#0E2C72]/6 inline-flex px-2 py-0.5 rounded-md mt-1.5">
                {typeLabel}
              </span>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2 text-[12px] text-neutral-500 mb-5 bg-neutral-50 px-2.5 py-2 rounded-lg border border-neutral-100">
          <MapPin className="w-3.5 h-3.5 mt-0.5 text-neutral-400 shrink-0" />
          <span className="truncate">
            {property.location?.address
              ? `${property.location.address}, `
              : ""}
            <span className="font-medium">
              {property.location?.city && property.location?.state
                ? `${property.location.city}, ${property.location.state}`
                : property.location?.city || property.location?.state || <span className="text-neutral-300 italic">No location</span>}
            </span>
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-neutral-50 mt-auto">
          {[
            {
              label: "SQM",
              value: (property.total_sqms ?? property.totalSqm ?? property.total_sqm ?? 0).toLocaleString(),
            },
            {
              label: "Subs",
              value: String(property.subscription_count ?? property.subscriptions ?? 0),
            },
            {
              label: "Revenue",
              value: fmt(property.total_revenue ?? property.revenue ?? 0),
              highlight: true,
            },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-[9.5px] font-semibold uppercase tracking-wider text-neutral-400 mb-0.5">
                {s.label}
              </div>
              <div className={`text-[12.5px] font-bold ${s.highlight ? "text-[#0E2C72]" : "text-neutral-800"}`}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Property row (list view) ──────────────────────────────────────────────────
function PropertyRow({ property, onRefresh }: { property: any; onRefresh: () => void }) {
  const navigate = useNavigate();
  const isPublished = property.status === "PUBLISHED" || property.status === "published";
  const typeLabel = (property.property_type ?? property.type ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  const totalUnits   = property.available_units ?? 0;
  const unitsSold    = property.subscription_count ?? 0;
  const unitsAvail   = Math.max(0, totalUnits - unitsSold);
  const landSizesLabel = property.land_sizes?.length > 0
    ? property.land_sizes.map((ls: any) => Number(ls.land_size).toLocaleString()).join(", ") + " SQM"
    : "—";
  const priceFrom = property.price_from ?? property.min_pricing_plan?.total_price;
  const priceFmt  = priceFrom ? `₦${Number(priceFrom).toLocaleString("en-NG")}` : "—";

  return (
    <motion.tr
      variants={item}
      className="hover:bg-neutral-50/60 transition-colors group border-b border-neutral-50 last:border-0"
    >
      {/* Cover Image */}
      <td className="px-4 py-3 whitespace-nowrap">
        <button onClick={() => navigate(`/properties/${property.id}`)} className="block">
          {property.featured_image ? (
            <img src={property.featured_image} alt={property.name}
              className="h-10 w-16 object-cover rounded-lg border border-neutral-100 shrink-0" />
          ) : (
            <div className="h-10 w-16 rounded-lg bg-[#0E2C72]/6 border border-neutral-100 flex items-center justify-center shrink-0">
              <BuildingIcon className="w-4 h-4 text-[#4a6fc0]" />
            </div>
          )}
        </button>
      </td>
      {/* Property Name */}
      <td className="px-4 py-3 whitespace-nowrap">
        <button onClick={() => navigate(`/properties/${property.id}`)} className="text-left">
          <div className="text-[13px] font-semibold text-neutral-900 group-hover:text-[#0E2C72] transition-colors max-w-[180px] truncate">
            {property.name}
          </div>
        </button>
      </td>
      {/* Property Type */}
      <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
        {typeLabel
          ? <span className="text-[11px] font-medium text-[#0E2C72] bg-[#0E2C72]/6 px-2 py-0.5 rounded-md">{typeLabel}</span>
          : <span className="text-neutral-400">—</span>}
      </td>
      {/* Location */}
      <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
        <div className="flex items-center gap-1.5 text-[12.5px] text-neutral-500">
          <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
          <span className="truncate max-w-[140px]">
            {property.location?.city && property.location?.state
              ? `${property.location.city}, ${property.location.state}`
              : property.location?.city || property.location?.state || "—"}
          </span>
        </div>
      </td>
      {/* Total SQM */}
      <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell text-[12.5px] text-neutral-700">
        {(property.total_sqms ?? 0).toLocaleString()} sqm
      </td>
      {/* Land Sizes */}
      <td className="px-4 py-3 whitespace-nowrap hidden xl:table-cell text-[12px] text-neutral-600">
        {landSizesLabel}
      </td>
      {/* Total Units */}
      <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell text-[12.5px] text-neutral-700 text-center">
        {totalUnits}
      </td>
      {/* Units Available */}
      <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell text-[12.5px] font-medium text-[#0E2C72] text-center">
        {unitsAvail}
      </td>
      {/* Units Sold */}
      <td className="px-4 py-3 whitespace-nowrap hidden xl:table-cell text-[12.5px] font-medium text-violet-600 text-center">
        {unitsSold}
      </td>
      {/* Price From */}
      <td className="px-4 py-3 whitespace-nowrap hidden xl:table-cell text-[12.5px] font-semibold text-neutral-800">
        {priceFmt}
      </td>
      {/* Status */}
      <td className="px-4 py-3 whitespace-nowrap">
        <Badge className={isPublished
          ? "bg-[#0E2C72]/6 text-[#0E2C72] border border-[#0E2C72]/15 text-[10.5px] gap-1"
          : "bg-neutral-100 text-neutral-500 border border-neutral-200 text-[10.5px] gap-1"}>
          {isPublished ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
          {isPublished ? "Published" : "Draft"}
        </Badge>
      </td>
      {/* Actions */}
      <td className="px-4 py-3 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
        <PropertyMenu propertyId={property.id} status={property.status} onRefresh={onRefresh} />
      </td>
    </motion.tr>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  accentBg: string;
  iconBg: string;
  iconColor: string;
  loading: boolean;
}

function StatCard({ label, value, sub, icon: Icon, accentBg, iconBg, iconColor, loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="relative bg-white rounded-xl border border-neutral-100 p-4 shadow-sm overflow-hidden">
        <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentBg}`} />
        <Skeleton className="h-3 w-24 rounded bg-neutral-100 mb-3" />
        <Skeleton className="h-7 w-12 rounded bg-neutral-100 mb-2" />
        <Skeleton className="h-3 w-28 rounded bg-neutral-100" />
      </div>
    );
  }
  return (
    <div className="relative bg-white rounded-xl border border-neutral-100 p-4 shadow-sm overflow-hidden hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentBg}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold mb-1">{label}</p>
          <p className="text-2xl font-bold text-neutral-900">{value}</p>
          {sub && <p className="text-[11px] text-neutral-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-2 rounded-xl shrink-0 ${iconBg}`}>
          <Icon className={`size-4 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function Properties() {
  usePageTitle("Properties");
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [view, setView] = useState<"grid" | "list">("grid");

  const fetchProperties = async () => {
    setLoading((prev) => prev || properties.length === 0);
    try {
      const data = await api.properties.list();
      setProperties(data);
    } catch {
      toast.error("Failed to load properties.");
    } finally {
      setLoading(false);
    }
  };

  usePolling(fetchProperties, 300_000);

  // ── Derived stats ────────────────────────────────────────────────────────
  const totalProperties     = properties.length;
  const totalUnitsAvailable = properties.reduce((s, p) => s + (p.available_units ?? 0), 0);
  const totalUnitsSold      = properties.reduce((s, p) => s + (p.subscription_count ?? p.subscriptions ?? 0), 0);
  const totalUnitsPending   = properties.reduce((s, p) => s + (p.pending_units ?? 0), 0);

  const publishedCount = properties.filter((p) => p.status === "PUBLISHED" || p.status === "published").length;
  const draftCount     = properties.filter((p) => p.status === "DRAFT" || p.status === "draft").length;

  const typeOptions = Array.from(
    new Set(properties.map((p) => p.property_type ?? p.type).filter(Boolean))
  ).sort() as string[];

  const filtered = properties.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.name?.toLowerCase().includes(q) ||
      (p.property_type ?? p.type ?? "").toLowerCase().includes(q) ||
      p.location?.city?.toLowerCase().includes(q) ||
      p.location?.state?.toLowerCase().includes(q) ||
      p.location?.address?.toLowerCase().includes(q);
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PUBLISHED" && (p.status === "PUBLISHED" || p.status === "published")) ||
      (statusFilter === "DRAFT" && (p.status === "DRAFT" || p.status === "draft"));
    const matchType =
      typeFilter === "ALL" || (p.property_type ?? p.type) === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const isInitialLoad = loading && properties.length === 0;

  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)] w-full">
      {/* Page header */}
      <div className="bg-white border-b border-neutral-100 px-4 sm:px-6 lg:px-8 py-4 md:py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-[17px] font-semibold text-neutral-900 tracking-tight">Properties</h1>
              <p className="text-[12px] text-neutral-400 mt-0.5 hidden sm:block">
                {loading ? "Loading…" : `${properties.length} total · ${publishedCount} published · ${draftCount} draft`}
              </p>
            </div>
            {loading && properties.length > 0 && (
              <Loader2 className="w-3.5 h-3.5 text-[#1a3d8f] animate-spin" />
            )}
          </div>
          <Button asChild
            className="h-8 gap-1.5 bg-[#0E2C72] hover:bg-[#0a2260] text-white text-[12px] font-medium rounded-lg px-3 shadow-sm">
            <Link to="/properties/new">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Property</span>
              <span className="sm:hidden">Add</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-5 flex-1">
        {isInitialLoad ? (
          /* Skeleton */
          <>
            {/* Stats skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-neutral-100 p-4 shadow-sm">
                  <Skeleton className="h-3 w-24 rounded bg-neutral-100 mb-3" />
                  <Skeleton className="h-7 w-12 rounded bg-neutral-100 mb-2" />
                  <Skeleton className="h-3 w-28 rounded bg-neutral-100" />
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <Skeleton className="h-9 w-full sm:w-80 rounded-lg bg-neutral-100" />
              <Skeleton className="h-9 w-24 rounded-lg bg-neutral-100" />
            </div>
            <motion.div
              variants={container} initial="hidden" animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-neutral-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  <Skeleton className="h-44 w-full rounded-none bg-neutral-100" />
                  <div className="p-5 space-y-3">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-40 bg-neutral-100" />
                      <Skeleton className="h-5 w-20 rounded-md bg-neutral-100" />
                    </div>
                    <Skeleton className="h-9 w-full rounded-lg bg-neutral-100" />
                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-neutral-50">
                      {Array.from({ length: 3 }).map((_, j) => (
                        <div key={j} className="space-y-1">
                          <Skeleton className="h-2.5 w-8 bg-neutral-100" />
                          <Skeleton className="h-4 w-12 bg-neutral-100" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </>
        ) : (
          <>
            {/* ── Stats row ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Properties"
                value={totalProperties}
                sub={`${publishedCount} published · ${draftCount} draft`}
                icon={Home}
                accentBg="bg-blue-500"
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                loading={false}
              />
              <StatCard
                label="Units Available"
                value={totalUnitsAvailable}
                sub="Across all properties"
                icon={Package}
                accentBg="bg-[#1a3d8f]"
                iconBg="bg-[#0E2C72]/6"
                iconColor="text-[#0E2C72]"
                loading={false}
              />
              <StatCard
                label="Units Sold"
                value={totalUnitsSold}
                sub="Active subscriptions"
                icon={TrendingUp}
                accentBg="bg-violet-500"
                iconBg="bg-violet-50"
                iconColor="text-violet-600"
                loading={false}
              />
              <StatCard
                label="Pending Allocation"
                value={totalUnitsPending}
                sub="Awaiting assignment"
                icon={AlertCircle}
                accentBg="bg-amber-500"
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                loading={false}
              />
            </div>

            {/* ── Search + filter + view toggle ─────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                <Input
                  placeholder="Search by name, location…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-9 text-[13px] bg-white border-neutral-200 focus-visible:ring-1 focus-visible:ring-[#1a3d8f]/30 focus-visible:border-[#2a52a8] rounded-lg"
                />
              </div>

              {/* Status filter tabs */}
              <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1 self-start sm:self-auto">
                {(["ALL", "PUBLISHED", "DRAFT"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-3 py-1.5 rounded-md text-[11.5px] font-semibold transition-all ${
                      statusFilter === f
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-700"
                    }`}
                  >
                    {f === "ALL" ? `All (${properties.length})` : f === "PUBLISHED" ? `Published (${publishedCount})` : `Draft (${draftCount})`}
                  </button>
                ))}
              </div>

              {/* Type filter */}
              {typeOptions.length > 0 && (
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-9 px-2.5 border border-neutral-200 bg-white rounded-lg text-[12px] text-neutral-700 focus:outline-none focus:ring-1 focus:ring-[#1a3d8f]/30 self-start sm:self-auto"
                >
                  <option value="ALL">All Types</option>
                  {typeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              )}

              {/* Grid/List toggle */}
              <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1 self-start sm:self-auto ml-auto">
                <button
                  onClick={() => setView("grid")}
                  title="Grid view"
                  className={`p-1.5 rounded-md transition-all ${
                    view === "grid" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setView("list")}
                  title="List view"
                  className={`p-1.5 rounded-md transition-all ${
                    view === "list" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={BuildingIcon}
                title={search || statusFilter !== "ALL" || typeFilter !== "ALL" ? "No matching properties" : "No properties yet"}
                description={search || statusFilter !== "ALL" || typeFilter !== "ALL"
                  ? "Try adjusting your search or filter."
                  : "Get started by adding your first property."}
                action={
                  <Button asChild className="gap-2 bg-[#0E2C72] hover:bg-[#0a2260] text-white">
                    <Link to="/properties/new">
                      <Plus className="w-4 h-4" />
                      Add Your First Property
                    </Link>
                  </Button>
                }
              />
            ) : view === "grid" ? (
              /* ── Grid view ─────────────────────────────────────────────── */
              <motion.div
                variants={container} initial="hidden" animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
              >
                {filtered.map((property) => (
                  <PropertyCard key={property.id} property={property} onRefresh={fetchProperties} />
                ))}
              </motion.div>
            ) : (
              /* ── List view ─────────────────────────────────────────────── */
              <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <div className="overflow-x-auto">
                  <motion.table
                    variants={container} initial="hidden" animate="show"
                    className="w-full text-sm text-left"
                  >
                    <thead>
                      <tr className="border-b border-neutral-100 bg-neutral-50/70">
                        <th className="px-4 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap">Image</th>
                        <th className="px-4 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap">Property Name</th>
                        <th className="px-4 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap hidden lg:table-cell">Type</th>
                        <th className="px-4 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap hidden md:table-cell">Location</th>
                        <th className="px-4 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap hidden lg:table-cell">Total SQM</th>
                        <th className="px-4 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap hidden xl:table-cell">Land Sizes</th>
                        <th className="px-4 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap hidden lg:table-cell text-center">Total Units</th>
                        <th className="px-4 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap hidden lg:table-cell text-center">Available</th>
                        <th className="px-4 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap hidden xl:table-cell text-center">Sold</th>
                        <th className="px-4 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap hidden xl:table-cell">Price From</th>
                        <th className="px-4 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase whitespace-nowrap">Status</th>
                        <th className="px-4 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase text-right whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((property) => (
                        <PropertyRow key={property.id} property={property} onRefresh={fetchProperties} />
                      ))}
                    </tbody>
                  </motion.table>
                </div>
                <div className="px-4 py-2.5 border-t border-neutral-50 bg-neutral-50/40">
                  <p className="text-[11px] text-neutral-400">
                    Showing {filtered.length} of {properties.length} propert{properties.length !== 1 ? "ies" : "y"}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}




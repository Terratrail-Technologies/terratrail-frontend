import { useState, useRef, useEffect } from "react";
import { usePolling } from "../hooks/usePolling";
import { usePageTitle } from "../hooks/usePageTitle";
import { Link, useNavigate } from "react-router";
import {
  Plus, Search, MapPin, CheckCircle2, Clock,
  Building as BuildingIcon, Loader2, MoreHorizontal, Pencil, Eye,
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
function PropertyMenu({ propertyId }: { propertyId: string; onDelete?: (id: string) => void }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="h-7 w-7 rounded-md flex items-center justify-center bg-white/80 backdrop-blur-sm text-neutral-500 hover:text-neutral-900 hover:bg-white border border-neutral-200/60 shadow-sm transition-all"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-neutral-100 bg-white shadow-lg shadow-neutral-900/10 z-50 overflow-hidden"
          >
            <div className="py-1">
              <button
                onClick={(e) => { e.stopPropagation(); setOpen(false); navigate(`/properties/${propertyId}/edit`); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-neutral-400" />
                Edit Property
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setOpen(false); navigate(`/properties/${propertyId}/preview`); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-neutral-400" />
                View Details
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Property card ─────────────────────────────────────────────────────────────
function PropertyCard({ property }: { property: any }) {
  const navigate = useNavigate();
  const fmt = (n: number | string) => `₦${Number(n).toLocaleString("en-NG")}`;
  const isPublished = property.status === "PUBLISHED" || property.status === "published";

  const typeLabel = (property.property_type ?? property.type ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  return (
    <motion.div
      variants={item}
      onClick={() => navigate(`/properties/${property.id}/preview`)}
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
          <div className="w-full h-full bg-gradient-to-br from-neutral-50 to-emerald-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-white/60">
                <BuildingIcon className="w-7 h-7 text-emerald-500/60" />
              </div>
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">No cover image</span>
            </div>
          </div>
        )}

        {/* Status badge over image */}
        <div className="absolute top-3 left-3">
          <Badge
            className={isPublished
              ? "bg-emerald-500/90 text-white border-0 shadow-sm backdrop-blur-sm text-[10.5px] gap-1 px-2 py-0.5"
              : "bg-neutral-800/70 text-white border-0 shadow-sm backdrop-blur-sm text-[10.5px] gap-1 px-2 py-0.5"}
          >
            {isPublished
              ? <><CheckCircle2 className="w-2.5 h-2.5" />Published</>
              : <><Clock className="w-2.5 h-2.5" />Draft</>}
          </Badge>
        </div>

        {/* 3-dot menu */}
        <div className="absolute top-3 right-3">
          <PropertyMenu propertyId={property.id} />
        </div>

        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-emerald-600/0 group-hover:bg-emerald-600/[0.03] transition-colors pointer-events-none" />
      </div>

      {/* Info */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-3 gap-3">
          <div className="min-w-0">
            <h3 className="text-[14px] font-semibold text-neutral-900 group-hover:text-emerald-600 transition-colors truncate tracking-tight">
              {property.name}
            </h3>
            {typeLabel && (
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 inline-flex px-2 py-0.5 rounded-md mt-1.5">
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
              <div className={`text-[12.5px] font-bold ${s.highlight ? "text-emerald-600" : "text-neutral-800"}`}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function Properties() {
  usePageTitle("Properties");
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");

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

  const filtered = properties.filter((p) => {
    const matchSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      (p.property_type ?? p.type ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PUBLISHED" && (p.status === "PUBLISHED" || p.status === "published")) ||
      (statusFilter === "DRAFT" && (p.status === "DRAFT" || p.status === "draft"));
    return matchSearch && matchStatus;
  });

  const publishedCount = properties.filter((p) => p.status === "PUBLISHED" || p.status === "published").length;
  const draftCount = properties.filter((p) => p.status === "DRAFT" || p.status === "draft").length;

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
              <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
            )}
          </div>
          <Button asChild
            className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-medium rounded-lg px-3 shadow-sm">
            <Link to="/properties/new">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Property</span>
              <span className="sm:hidden">Add</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-5 flex-1">
        {loading && properties.length === 0 ? (
          /* Skeleton grid */
          <>
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
            {/* Search + filter bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                <Input
                  placeholder="Search properties…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-9 text-[13px] bg-white border-neutral-200 focus-visible:ring-1 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-400 rounded-lg"
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
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={BuildingIcon}
                title={search || statusFilter !== "ALL" ? "No matching properties" : "No properties yet"}
                description={search || statusFilter !== "ALL"
                  ? "Try adjusting your search or filter."
                  : "Get started by adding your first property."}
                action={
                  <Button asChild className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Link to="/properties/new">
                      <Plus className="w-4 h-4" />
                      Add Your First Property
                    </Link>
                  </Button>
                }
              />
            ) : (
              <motion.div
                variants={container} initial="hidden" animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
              >
                {filtered.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

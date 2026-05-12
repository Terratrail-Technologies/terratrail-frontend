import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, MapPin, CheckCircle2, Clock, ChevronLeft, ChevronRight,
  Building as BuildingIcon, Layers, Home, CreditCard, FileText, Shield,
  TrendingUp, Plus, X, Calendar, Loader2,
} from "lucide-react";
import { api } from "../services/api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { usePageTitle } from "../hooks/usePageTitle";
import { Skeleton } from "../components/ui/skeleton";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../components/ui/utils";
import { useWorkspaceRole } from "../hooks/useWorkspaceRole";
import { toast } from "sonner";

const fmt = (n: number | string) => `₦${Number(n).toLocaleString("en-NG")}`;

// ── Gallery lightbox ──────────────────────────────────────────────────────────
function Gallery({ cover, images }: { cover: string | null; images: any[] }) {
  const all = [
    ...(cover ? [{ image: cover, caption: "Cover" }] : []),
    ...images,
  ];
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (all.length === 0) {
    return (
      <div className="w-full h-72 md:h-96 bg-gradient-to-br from-neutral-100 to-[#eef2fb] flex items-center justify-center rounded-2xl border border-neutral-100">
        <div className="flex flex-col items-center gap-2 text-neutral-400">
          <BuildingIcon className="w-14 h-14 opacity-40" />
          <span className="text-sm font-medium">No images available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative w-full h-72 md:h-[420px] rounded-2xl overflow-hidden bg-neutral-100 cursor-pointer group"
        onClick={() => setLightbox(true)}>
        <img src={all[idx].image} alt={all[idx].caption ?? ""}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
        {all.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + all.length) % all.length); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % all.length); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {all.map((_, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                  className={cn("w-2 h-2 rounded-full transition-colors", i === idx ? "bg-white" : "bg-white/40")} />
              ))}
            </div>
          </>
        )}
        <div className="absolute top-3 right-3 bg-black/40 text-white text-[11px] px-2.5 py-1 rounded-full">
          {idx + 1} / {all.length}
        </div>
      </div>

      {/* Thumbnails */}
      {all.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {all.map((img, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={cn("shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                i === idx ? "border-[#0E2C72]" : "border-transparent opacity-60 hover:opacity-100")}>
              <img src={img.image} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}>
            <button onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + all.length) % all.length); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <img src={all[idx].image} alt="" className="max-h-[90vh] max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
            <button onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % all.length); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center">
              <ChevronRight className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 bg-[#0E2C72]/6 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#0E2C72]" />
        </div>
        <h2 className="font-semibold text-neutral-900 text-[15px]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ── Amenity status color ──────────────────────────────────────────────────────
const amenityColor = (s: string) =>
  s === "COMPLETED" ? "bg-[#d6e0f5] text-[#0E2C72]" :
  s === "IN_PROGRESS" ? "bg-amber-100 text-amber-700" :
  "bg-neutral-100 text-neutral-500";

const amenityLabel = (s: string) =>
  s === "COMPLETED" ? "Completed" : s === "IN_PROGRESS" ? "In Progress" : "Not Started";

const docLabel = (t: string) => ({
  C_OF_O: "Certificate of Occupancy (C of O)",
  DEED_OF_ASSIGNMENT: "Deed of Assignment",
  SURVEY_PLAN: "Survey Plan",
  OTHER: "Other",
}[t] ?? t);

const docStatusColor = (s: string) =>
  s === "READY" ? "bg-[#d6e0f5] text-[#0E2C72]" :
  s === "IN_PROGRESS" ? "bg-amber-100 text-amber-700" :
  "bg-neutral-100 text-neutral-500";

// ── Appreciation ─────────────────────────────────────────────────────────────
interface AppreciationEntry {
  id: string;
  effective_date: string;
  old_price: number;
  new_price: number;
  percentage_change: number;
  notes: string;
  created_at: string;
}

function AppreciationModal({ propertyId, onClose, onSave }: { propertyId: string; onClose: () => void; onSave: (e: AppreciationEntry) => void }) {
  const [form, setForm] = useState({ effective_date: new Date().toISOString().slice(0, 10), old_price: "", new_price: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const pct = (() => {
    const o = Number(form.old_price), n = Number(form.new_price);
    if (!o || !n) return null;
    return (((n - o) / o) * 100).toFixed(2);
  })();

  const handleSubmit = async () => {
    if (!form.effective_date || !form.old_price || !form.new_price) {
      toast.error("Please fill in date, old price, and new price.");
      return;
    }
    setSaving(true);
    try {
      const entry = await api.properties.appreciations.create(propertyId, {
        effective_date: form.effective_date,
        old_price: Number(form.old_price),
        new_price: Number(form.new_price),
        notes: form.notes,
      });
      onSave(entry);
      onClose();
    } catch {
      toast.error("Failed to save appreciation record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-neutral-100">
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#0E2C72]/6 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#0E2C72]" />
            </div>
            <h2 className="font-semibold text-neutral-900">Record Appreciation</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-neutral-100 transition-colors">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-[12px] font-medium text-neutral-600 block mb-1.5">Effective Date</label>
            <input type="date" value={form.effective_date} onChange={e => setForm(f => ({ ...f, effective_date: e.target.value }))}
              className="w-full h-9 px-3 rounded-lg border border-neutral-200 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#1a3d8f]/40 focus:border-[#2a52a8]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-neutral-600 block mb-1.5">Previous Price (₦)</label>
              <input type="number" min="0" placeholder="0" value={form.old_price} onChange={e => setForm(f => ({ ...f, old_price: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-neutral-200 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#1a3d8f]/40 focus:border-[#2a52a8]" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-neutral-600 block mb-1.5">New Price (₦)</label>
              <input type="number" min="0" placeholder="0" value={form.new_price} onChange={e => setForm(f => ({ ...f, new_price: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-neutral-200 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#1a3d8f]/40 focus:border-[#2a52a8]" />
            </div>
          </div>
          {pct !== null && (
            <div className={cn("text-[12.5px] font-semibold px-3 py-2 rounded-lg", Number(pct) >= 0 ? "bg-[#0E2C72]/6 text-[#0E2C72]" : "bg-red-50 text-red-700")}>
              {Number(pct) >= 0 ? "+" : ""}{pct}% change
            </div>
          )}
          <div>
            <label className="text-[12px] font-medium text-neutral-600 block mb-1.5">Notes (optional)</label>
            <textarea rows={2} placeholder="Reason for appreciation…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-[13px] resize-none focus:outline-none focus:ring-1 focus:ring-[#1a3d8f]/40 focus:border-[#2a52a8]" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 p-5 border-t border-neutral-100">
          <Button variant="outline" onClick={onClose} className="text-[13px] h-9">Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-[#0E2C72] hover:bg-[#0a2260] text-white text-[13px] h-9">{saving ? "Saving…" : "Save Record"}</Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function PropertyPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [showAppreciation, setShowAppreciation] = useState(false);
  const [appreciationHistory, setAppreciationHistory] = useState<AppreciationEntry[]>([]);
  const { role } = useWorkspaceRole();
  const isAdmin = role === "ADMIN" || role === "OWNER";
  usePageTitle(property ? `Preview: ${property.name}` : "Property Preview");

  const handleStatusChange = async (status: "PUBLISHED" | "DRAFT") => {
    if (!id) return;
    setPublishing(true);
    try {
      await api.properties.update(id, { status });
      setProperty((p: any) => ({ ...p, status }));
      toast.success(status === "PUBLISHED" ? "Property published successfully." : "Property saved as draft.");
    } catch {
      toast.error("Failed to update property status.");
    } finally {
      setPublishing(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.properties.get(id),
      api.properties.appreciations.list(id).catch(() => []),
    ])
      .then(([p, apprs]) => { setProperty(p); setAppreciationHistory(apprs ?? []); })
      .catch(() => navigate("/properties"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="w-full h-96 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!property) return null;

  const isPublished = property.status === "PUBLISHED";
  const typeLabel = (property.property_type ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());
  const loc = property.location;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-lg border border-neutral-200 bg-white flex items-center justify-center hover:bg-neutral-50 transition-colors shadow-sm">
            <ArrowLeft className="w-4 h-4 text-neutral-600" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-neutral-900">{property.name}</h1>
              <Badge className={isPublished
                ? "bg-[#d6e0f5] text-[#0E2C72] border-0 gap-1"
                : "bg-neutral-100 text-neutral-600 border-0 gap-1"}>
                {isPublished ? <><CheckCircle2 className="w-3 h-3" />Published</> : <><Clock className="w-3 h-3" />Draft</>}
              </Badge>
            </div>
            {typeLabel && <p className="text-sm text-neutral-500 mt-0.5">{typeLabel}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {isAdmin && (
            isPublished ? (
              <Button
                variant="outline"
                onClick={() => handleStatusChange("DRAFT")}
                disabled={publishing}
                className="text-sm bg-white text-neutral-700"
              >
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save as Draft"}
              </Button>
            ) : (
              <Button
                onClick={() => handleStatusChange("PUBLISHED")}
                disabled={publishing}
                className="text-sm bg-[#0E2C72] hover:bg-[#0a2260] text-white gap-1.5"
              >
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" />Publish</>}
              </Button>
            )
          )}
          <Button onClick={() => navigate(`/properties/${id}/edit`)}
            variant="outline" className="text-sm bg-white">
            Edit Property
          </Button>
        </div>
      </div>

      {/* Gallery */}
      <Gallery cover={property.featured_image ?? null} images={property.gallery_images ?? []} />

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Area", value: `${Number(property.total_sqms).toLocaleString()} sqm` },
          { label: "Available Units", value: property.available_units ?? "—" },
          { label: "Pricing Plans", value: (property.pricing_plans?.length ?? 0) },
          { label: "Status", value: isPublished ? "Published" : "Draft" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-neutral-100 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider mb-1">{s.label}</div>
            <div className="text-[17px] font-bold text-neutral-900">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Description */}
      {property.description && (
        <Section title="About This Property" icon={Home}>
          <p className="text-[13.5px] text-neutral-600 leading-relaxed whitespace-pre-line">
            {property.description}
          </p>
        </Section>
      )}

      {/* Location */}
      {loc && (
        <Section title="Location" icon={MapPin}>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
              {loc.address && (
                <div><span className="text-neutral-400 block text-[11px] uppercase tracking-wider mb-0.5">Address</span>
                  <span className="text-neutral-800 font-medium">{loc.address}</span></div>
              )}
              {loc.city && (
                <div><span className="text-neutral-400 block text-[11px] uppercase tracking-wider mb-0.5">City</span>
                  <span className="text-neutral-800 font-medium">{loc.city}</span></div>
              )}
              {loc.state && (
                <div><span className="text-neutral-400 block text-[11px] uppercase tracking-wider mb-0.5">State</span>
                  <span className="text-neutral-800 font-medium">{loc.state}</span></div>
              )}
              {loc.nearest_landmark && (
                <div><span className="text-neutral-400 block text-[11px] uppercase tracking-wider mb-0.5">Nearest Landmark</span>
                  <span className="text-neutral-800 font-medium">{loc.nearest_landmark}</span></div>
              )}
            </div>
            {loc.latitude && loc.longitude && (
              <a
                href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-2.5 px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-[#0E2C72]/6 hover:border-[#8aaad8] transition-colors group"
              >
                <MapPin className="w-4 h-4 text-[#0E2C72] shrink-0" />
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-neutral-800 group-hover:text-[#0a2260] transition-colors">View on Google Maps</p>
                  <p className="text-[11px] text-neutral-400">{Number(loc.latitude).toFixed(5)}, {Number(loc.longitude).toFixed(5)}</p>
                </div>
                <span className="ml-auto text-neutral-300 group-hover:text-[#4a6fc0] transition-colors text-sm">↗</span>
              </a>
            )}
          </div>
        </Section>
      )}

      {/* Pricing Plans */}
      {property.pricing_plans?.length > 0 && (
        <Section title="Pricing Plans" icon={CreditCard}>
          <div className="space-y-4">
            {property.pricing_plans.map((plan: any) => (
              <div key={plan.id} className="border border-neutral-100 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-neutral-900">{plan.plan_name}</h3>
                    <p className="text-[12px] text-neutral-400 mt-0.5">{Number(plan.land_size).toLocaleString()} sqm</p>
                  </div>
                  <Badge className={plan.payment_type === "OUTRIGHT" ? "bg-blue-100 text-blue-700 border-0" : "bg-purple-100 text-purple-700 border-0"}>
                    {plan.payment_type === "OUTRIGHT" ? "Outright" : "Installment"}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-[#0E2C72] mb-3">{fmt(plan.total_price)}</div>
                {plan.payment_type === "INSTALLMENT" && (
                  <div className="flex flex-wrap gap-4 text-[12.5px] text-neutral-500">
                    <span>Initial: <span className="font-semibold text-neutral-800">{fmt(plan.initial_payment)}</span></span>
                    <span>Monthly: <span className="font-semibold text-neutral-800">{fmt(plan.monthly_installment)}</span></span>
                    <span>Duration: <span className="font-semibold text-neutral-800">{plan.duration_months} months</span></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Amenities */}
      {property.amenities?.length > 0 && (
        <Section title="Amenities" icon={Layers}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {property.amenities.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-3.5 border border-neutral-100 rounded-lg">
                <span className="text-[13px] font-medium text-neutral-800">{a.name}</span>
                <Badge className={cn("text-[11px] border-0", amenityColor(a.status))}>
                  {amenityLabel(a.status)}
                </Badge>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Documents */}
      {property.documents?.length > 0 && (
        <Section title="Legal Documents" icon={Shield}>
          <div className="space-y-3">
            {property.documents.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between p-3.5 border border-neutral-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#0E2C72]/6 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-[#0E2C72]" />
                  </div>
                  <span className="text-[13px] font-medium text-neutral-800">{docLabel(d.document_type)}</span>
                </div>
                <Badge className={cn("text-[11px] border-0", docStatusColor(d.status))}>
                  {d.status === "READY" ? "Ready" : d.status === "IN_PROGRESS" ? "In Progress" : "Not Started"}
                </Badge>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Payment Methods */}
      {property.bank_accounts?.length > 0 && (
        <Section title="Payment Accounts" icon={CreditCard}>
          <div className="space-y-3">
            {property.bank_accounts.map((b: any) => (
              <div key={b.id} className="p-4 border border-neutral-100 rounded-xl">
                <div className="font-semibold text-neutral-900 text-[13.5px]">{b.bank_name}</div>
                <div className="text-[12.5px] text-neutral-600 mt-0.5">{b.account_name}</div>
                <div className="text-[12px] text-neutral-400 font-mono mt-0.5">{b.account_number}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Price Appreciation */}
      <Section title="Price Appreciation" icon={TrendingUp}>
        <div className="space-y-4">
          {isAdmin && (
            <div className="flex justify-end">
              <Button onClick={() => setShowAppreciation(true)}
                className="h-8 gap-1.5 bg-[#0E2C72] hover:bg-[#0a2260] text-white text-[12px] rounded-lg px-3">
                <Plus className="w-3.5 h-3.5" />
                Record Update
              </Button>
            </div>
          )}
          {appreciationHistory.length === 0 ? (
            <div className="text-center py-8 text-neutral-400 text-[13px]">
              No appreciation updates recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {[...appreciationHistory].map((entry) => {
                const pct = Number(entry.percentage_change ?? 0).toFixed(2);
                const up = Number(pct) >= 0;
                return (
                  <div key={entry.id} className="border border-neutral-100 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <div className="flex items-center gap-2 text-[12px] text-neutral-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(entry.effective_date).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}
                      </div>
                      <span className={cn("text-[12px] font-bold px-2 py-0.5 rounded-md", up ? "bg-[#0E2C72]/6 text-[#0E2C72]" : "bg-red-50 text-red-700")}>
                        {up ? "+" : ""}{pct}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[13px]">
                      <span className="text-neutral-500 line-through">{fmt(entry.old_price)}</span>
                      <span className="text-neutral-300">→</span>
                      <span className="font-bold text-neutral-900">{fmt(entry.new_price)}</span>
                    </div>
                    {entry.notes && (
                      <p className="text-[12px] text-neutral-500 mt-2 leading-relaxed">{entry.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Section>

      <AnimatePresence>
        {showAppreciation && (
          <AppreciationModal
            propertyId={id!}
            onClose={() => setShowAppreciation(false)}
            onSave={(entry) => {
              setAppreciationHistory((prev) => [entry, ...prev]);
              toast.success("Appreciation update recorded.");
            }}
          />
        )}
      </AnimatePresence>

      <div className="pb-8" />
    </div>
  );
}





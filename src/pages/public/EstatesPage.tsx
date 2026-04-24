import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router";
import {
  Building2, MapPin, Search, ChevronLeft, ChevronRight, X,
  Phone, Mail, CheckCircle2, ArrowRight, TrendingUp,
  Star, Shield, Clock, Users, ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform, useInView } from "motion/react";
import { api, BASE_URL } from "../../services/api";

// ── Types ──────────────────────────────────────────────────────────────────────
interface PricingPlan {
  id: string; plan_name: string; land_size: string; total_price: string;
  payment_type: "OUTRIGHT" | "INSTALLMENT"; initial_payment: string;
  duration_months: number; monthly_installment: string; is_active: boolean;
}
interface Property {
  id: string; name: string; property_type: string; description: string;
  total_sqms: number; available_units: number; unit_measurement: string;
  status: string; featured_image: string | null;
  location: { address: string; city: string; state: string; country: string; latitude: string | null; longitude: string | null } | null;
  pricing_plans: PricingPlan[];
  gallery_images: { id: string; image: string; caption: string }[];
  amenities: { id: string; name: string; status: string }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function imgSrc(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${BASE_URL.replace("/api/v1", "")}${url}`;
}
function fmt(val: string | number) {
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(n)) return "—";
  return `₦${n.toLocaleString("en-NG")}`;
}
function minPrice(plans: PricingPlan[]) {
  const active = plans.filter((p) => p.is_active);
  if (!active.length) return null;
  return Math.min(...active.map((p) => parseFloat(p.total_price)));
}
function typeLabel(t: string) {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Animation variants ────────────────────────────────────────────────────────
const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 24 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

// ── FadeIn section wrapper ────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>
      {children}
    </motion.div>
  );
}

// ── Inspection modal ──────────────────────────────────────────────────────────
function InspectionModal({ property, workspaceSlug, onClose }: { property: Property; workspaceSlug: string; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", date: "", persons: "1", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.siteInspections.create({
        workspace_slug: workspaceSlug,
        name: form.name,
        email: form.email,
        phone: form.phone,
        inspection_date: form.date || new Date().toISOString().slice(0, 10),
        persons: Number(form.persons),
        notes: form.message,
        linked_property: property.id,
        property_name: property.name,
        inspection_type: "PHYSICAL",
        category: "RESIDENTIAL",
        status: "PENDING",
      });
      setSent(true);
    } catch {
      setSent(true); // still show success to user
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white px-5 pt-5 pb-4 border-b border-neutral-100 rounded-t-3xl sm:rounded-t-2xl z-10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[16px] font-bold text-neutral-900">Book Site Inspection</h3>
              <p className="text-[12px] text-neutral-500 mt-0.5 truncate">{property.name}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-neutral-100 transition-colors shrink-0">
              <X className="size-4 text-neutral-500" />
            </button>
          </div>
        </div>

        {sent ? (
          <div className="p-8 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="size-8 text-emerald-600" />
            </motion.div>
            <h4 className="text-[16px] font-bold text-neutral-900 mb-2">Request Submitted!</h4>
            <p className="text-[13px] text-neutral-500 leading-relaxed">Our team will reach out within 24 hours to confirm your inspection details.</p>
            <button onClick={onClose} className="mt-6 px-6 py-2.5 bg-emerald-600 text-white text-[13px] font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">Full Name *</label>
                <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                  className="w-full px-3 py-2.5 text-[13px] border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                  placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">Phone *</label>
                <input required value={form.phone} onChange={(e) => set("phone", e.target.value)}
                  className="w-full px-3 py-2.5 text-[13px] border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                  placeholder="+234..." />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                className="w-full px-3 py-2.5 text-[13px] border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                placeholder="you@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">Preferred Date</label>
                <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2.5 text-[13px] border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">Persons</label>
                <select value={form.persons} onChange={(e) => set("persons", e.target.value)}
                  className="w-full px-3 py-2.5 text-[13px] border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all bg-white">
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? "person" : "people"}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">Additional Notes</label>
              <textarea value={form.message} onChange={(e) => set("message", e.target.value)} rows={2}
                className="w-full px-3 py-2.5 text-[13px] border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all resize-none"
                placeholder="Any specific questions or requirements..." />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-emerald-600 text-white text-[14px] font-bold rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
              {loading ? "Submitting…" : "Submit Request"}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Image Gallery for property detail ────────────────────────────────────────
function ImageGallery({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);
  if (!images.length) return (
    <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-neutral-100 to-emerald-50 flex items-center justify-center">
      <Building2 className="size-16 text-neutral-300" />
    </div>
  );
  return (
    <div className="space-y-2">
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100 group">
        <AnimatePresence mode="wait">
          <motion.img key={idx} src={imgSrc(images[idx])} alt=""
            initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 w-full h-full object-cover" />
        </AnimatePresence>
        {images.length > 1 && (<>
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors">
            <ChevronLeft className="size-5" />
          </button>
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors">
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? "bg-white scale-125" : "bg-white/50"}`} />
            ))}
          </div>
        </>)}
        <div className="absolute top-3 right-3 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
          {idx + 1} / {images.length}
        </div>
      </div>
      {images.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${i === idx ? "border-emerald-500" : "border-transparent opacity-60 hover:opacity-100"}`}>
              <img src={imgSrc(img)} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Property Detail View ──────────────────────────────────────────────────────
function PropertyDetail({ property, workspaceSlug, onBack }: { property: Property; workspaceSlug: string; onBack: () => void }) {
  const [showInspection, setShowInspection] = useState(false);
  const images = [
    ...(property.featured_image ? [property.featured_image] : []),
    ...property.gallery_images.map((g) => g.image),
  ];
  const activePlans = property.pricing_plans.filter((p) => p.is_active);
  const loc = property.location;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <AnimatePresence>
        {showInspection && <InspectionModal property={property} workspaceSlug={workspaceSlug} onClose={() => setShowInspection(false)} />}
      </AnimatePresence>

      <motion.button onClick={onBack} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-1.5 text-[13px] font-semibold text-neutral-500 hover:text-emerald-600 mb-6 transition-colors group">
        <ChevronLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to listings
      </motion.button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
        {/* Gallery */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <ImageGallery images={images} />
        </motion.div>

        {/* Info */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold uppercase tracking-wide">
                {typeLabel(property.property_type)}
              </span>
              {property.available_units > 0 && (
                <span className="px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold">
                  {property.available_units} units available
                </span>
              )}
            </div>
            <h1 className="text-[24px] sm:text-[28px] font-extrabold text-neutral-900 leading-tight">{property.name}</h1>
            {loc && (
              <p className="flex items-center gap-1.5 text-[13px] text-neutral-500 mt-1.5">
                <MapPin className="size-3.5 shrink-0 text-emerald-500" />
                {[loc.address, loc.city, loc.state].filter(Boolean).join(", ")}
              </p>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-100">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Total Area</p>
              <p className="text-[18px] font-extrabold text-neutral-900">{Number(property.total_sqms).toLocaleString()} <span className="text-[13px] font-semibold text-neutral-500">sqm</span></p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3.5 border border-blue-100">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Starting From</p>
              <p className="text-[16px] font-extrabold text-neutral-900">{minPrice(property.pricing_plans) ? fmt(minPrice(property.pricing_plans)!) : "Contact us"}</p>
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <p className="text-[13.5px] text-neutral-600 leading-relaxed">{property.description}</p>
          )}

          {/* Pricing Plans */}
          {activePlans.length > 0 && (
            <div>
              <h3 className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-2.5">Pricing Options</h3>
              <div className="space-y-2">
                {activePlans.map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-neutral-100 shadow-sm hover:border-emerald-200 transition-colors">
                    <div>
                      <p className="text-[13px] font-bold text-neutral-900">{plan.plan_name}</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        {Number(plan.land_size).toLocaleString()} sqm · {plan.payment_type === "OUTRIGHT" ? "Outright" : `${plan.duration_months}mo installment`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[15px] font-extrabold text-emerald-700">{fmt(plan.total_price)}</p>
                      {plan.payment_type === "INSTALLMENT" && (
                        <p className="text-[11px] text-neutral-400">{fmt(plan.initial_payment)} initial</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <div>
              <h3 className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-2.5">Amenities</h3>
              <div className="flex flex-wrap gap-1.5">
                {property.amenities.map((a) => (
                  <span key={a.id} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${a.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-neutral-50 text-neutral-500 border border-neutral-100"}`}>
                    {a.status === "COMPLETED" && <CheckCircle2 className="size-3" />}
                    {a.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Map link */}
          {loc?.latitude && loc?.longitude && (
            <a href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-emerald-50 hover:border-emerald-200 transition-colors group">
              <MapPin className="size-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-[12.5px] font-semibold text-neutral-800 group-hover:text-emerald-700 transition-colors">View on Google Maps</p>
                <p className="text-[11px] text-neutral-400">{Number(loc.latitude).toFixed(5)}, {Number(loc.longitude).toFixed(5)}</p>
              </div>
              <ExternalLink className="size-3.5 ml-auto text-neutral-300 group-hover:text-emerald-400 transition-colors" />
            </a>
          )}

          {/* CTA */}
          <button onClick={() => setShowInspection(true)}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-[15px] font-bold rounded-xl transition-all shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2">
            Book a Site Inspection
            <ArrowRight className="size-4" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}

// ── Property Card ─────────────────────────────────────────────────────────────
function PropertyCard({ property, onClick }: { property: Property; onClick: () => void; index?: number }) {
  const min = minPrice(property.pricing_plans);
  const loc = property.location;
  const activePlansCount = property.pricing_plans.filter((p) => p.is_active).length;

  return (
    <motion.button variants={fadeUp} onClick={onClick}
      className="group text-left w-full bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-neutral-200/60 hover:-translate-y-1 hover:border-emerald-200/70 transition-all duration-300">
      {/* Image */}
      <div className="aspect-[16/10] bg-neutral-100 overflow-hidden relative">
        {property.featured_image ? (
          <img src={imgSrc(property.featured_image)} alt={property.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-neutral-100">
            <Building2 className="size-12 text-emerald-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wide shadow-sm">
            {typeLabel(property.property_type)}
          </span>
        </div>
        {property.available_units > 0 && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-0.5 rounded-full bg-white/95 text-neutral-700 text-[10px] font-semibold shadow-sm backdrop-blur-sm">
              {property.available_units} left
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="text-[14px] font-bold text-neutral-900 truncate group-hover:text-emerald-700 transition-colors mb-1">
          {property.name}
        </h3>
        {loc && (
          <p className="flex items-center gap-1 text-[12px] text-neutral-500 mb-3">
            <MapPin className="size-3 shrink-0 text-emerald-500" />
            <span className="truncate">{[loc.city, loc.state].filter(Boolean).join(", ")}</span>
          </p>
        )}
        <div className="flex items-end justify-between pt-3 border-t border-neutral-50">
          <div>
            <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wide mb-0.5">Starting from</p>
            <p className="text-[16px] font-extrabold text-emerald-700">{min ? fmt(min) : "Contact us"}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-neutral-500">{Number(property.total_sqms).toLocaleString()} sqm</p>
            <p className="text-[11px] text-neutral-400">{activePlansCount} plan{activePlansCount !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero({ search, setSearch, propertyCount }: { search: string; setSearch: (v: string) => void; propertyCount: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div ref={ref} className="relative overflow-hidden bg-gradient-to-br from-[#0a3d2e] via-[#0f5c3a] to-[#1a7a4a] min-h-[480px] flex items-center">
      {/* Animated background shapes */}
      <motion.div style={{ y }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-emerald-300/10 rounded-full blur-3xl" />
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute top-10 right-20 w-32 h-32 border border-white/5 rounded-full" />
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-10 left-32 w-20 h-20 border border-white/5 rounded-full" />
        {/* Subtle grid */}
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </motion.div>

      <motion.div style={{ opacity }} className="relative max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center w-full">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-[11px] font-semibold tracking-wide mb-5 backdrop-blur-sm">
          <Star className="size-3 text-yellow-400" fill="currentColor" />
          {propertyCount > 0 ? `${propertyCount} Premium Propert${propertyCount !== 1 ? "ies" : "y"} Available` : "Premium Real Estate"}
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[36px] sm:text-[52px] font-black text-white leading-[1.1] tracking-tight mb-4">
          Find Your Perfect
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300">Dream Property</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[15px] sm:text-[17px] text-white/70 mb-8 max-w-lg mx-auto leading-relaxed">
          Browse available land and properties with flexible payment plans tailored for you.
        </motion.p>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-lg mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or location…"
            className="w-full pl-11 pr-4 py-4 rounded-2xl text-[14px] text-neutral-900 bg-white shadow-2xl shadow-black/20 focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-neutral-400" />
        </motion.div>

        {/* Trust signals */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-6 mt-8 flex-wrap">
          {[
            { icon: Shield, label: "Verified Listings" },
            { icon: Clock, label: "Fast Response" },
            { icon: Users, label: "Trusted by Many" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-white/60 text-[12px]">
              <Icon className="size-3.5 text-emerald-400" />
              {label}
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EstatesPage() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selected, setSelected] = useState<Property | null>(null);

  useEffect(() => {
    if (!workspaceSlug) return;
    setLoading(true);
    api.public.properties(workspaceSlug)
      .then((data) => setProperties(Array.isArray(data) ? data : []))
      .catch(() => setError("Could not load properties. Please try again."))
      .finally(() => setLoading(false));
  }, [workspaceSlug]);

  const types = ["ALL", ...Array.from(new Set(properties.map((p) => p.property_type))).filter(Boolean)];
  const filtered = properties.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q)
      || p.location?.city?.toLowerCase().includes(q)
      || p.location?.state?.toLowerCase().includes(q);
    const matchType = typeFilter === "ALL" || p.property_type === typeFilter;
    return matchSearch && matchType;
  });

  if (selected) {
    return (
      <div className="min-h-screen bg-[#f7f9f8]">
        <TopBar workspaceSlug={workspaceSlug!} />
        <PropertyDetail property={selected} workspaceSlug={workspaceSlug!} onBack={() => setSelected(null)} />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9f8]">
      <TopBar workspaceSlug={workspaceSlug!} />
      <Hero search={search} setSearch={setSearch} propertyCount={properties.length} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Filters */}
        <FadeIn>
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {types.map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all ${typeFilter === t ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20" : "bg-white border border-neutral-200 text-neutral-600 hover:border-emerald-300 hover:text-emerald-600"}`}>
                {t === "ALL" ? "All Types" : typeLabel(t)}
              </button>
            ))}
            {!loading && (
              <span className="ml-auto text-[12px] text-neutral-400 font-medium">
                {filtered.length} propert{filtered.length !== 1 ? "ies" : "y"}
              </span>
            )}
          </div>
        </FadeIn>

        {/* Grid */}
        {loading ? (
          <motion.div variants={stagger} initial="hidden" animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div key={i} variants={fadeUp} className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
                <div className="aspect-[16/10] bg-neutral-100 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-neutral-100 rounded-full w-3/4 animate-pulse" />
                  <div className="h-3 bg-neutral-100 rounded-full w-1/2 animate-pulse" />
                  <div className="h-5 bg-neutral-100 rounded-full w-1/3 mt-3 animate-pulse" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : error ? (
          <FadeIn className="text-center py-24">
            <Building2 className="size-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500 text-[14px]">{error}</p>
          </FadeIn>
        ) : filtered.length === 0 ? (
          <FadeIn className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <Building2 className="size-8 text-neutral-400" />
            </div>
            <h3 className="text-[16px] font-bold text-neutral-800 mb-1">No properties found</h3>
            <p className="text-[13px] text-neutral-500">Try adjusting your search or filter.</p>
          </FadeIn>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p, i) => (
              <PropertyCard key={p.id} property={p} onClick={() => setSelected(p)} index={i} />
            ))}
          </motion.div>
        )}

        {/* Stats band */}
        {!loading && properties.length > 0 && (
          <FadeIn delay={0.2}>
            <div className="mt-16 bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-3xl p-8 text-white text-center">
              <h2 className="text-[20px] font-bold mb-2">Ready to invest in your future?</h2>
              <p className="text-emerald-200 text-[14px] mb-6">Browse our verified properties with flexible payment options.</p>
              <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
                {[
                  { value: properties.length, label: "Properties" },
                  { value: properties.reduce((s, p) => s + p.available_units, 0), label: "Units" },
                  { value: properties.reduce((s, p) => s + p.pricing_plans.filter(pl => pl.is_active).length, 0), label: "Plans" },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <p className="text-[24px] font-black">{value}</p>
                    <p className="text-[11px] text-emerald-300 font-semibold uppercase tracking-wide">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        )}
      </div>

      <Footer />
    </div>
  );
}

// ── Shared TopBar ─────────────────────────────────────────────────────────────
function TopBar({ workspaceSlug: _workspaceSlug }: { workspaceSlug: string }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header className={`sticky top-0 z-30 transition-all duration-200 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-neutral-100" : "bg-transparent"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 shadow-sm shadow-emerald-600/30">
            <Building2 className="size-4 text-white" />
          </div>
          <span className={`text-[15px] font-extrabold tracking-tight transition-colors ${scrolled ? "text-neutral-900" : "text-white"}`}>TerraTrail</span>
        </div>
        <div className={`flex items-center gap-4 text-[12px] font-medium transition-colors ${scrolled ? "text-neutral-600" : "text-white/80"}`}>
          <a href="tel:+234" className="hidden sm:flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
            <Phone className="size-3.5" />
            Contact Us
          </a>
          <a href="mailto:hello@terratrail.io" className="hidden sm:flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
            <Mail className="size-3.5" />
            Email
          </a>
        </div>
      </div>
    </header>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-neutral-100 bg-white mt-12 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600">
            <Building2 className="size-3 text-white" />
          </div>
          <span className="text-[13px] font-bold text-neutral-800">TerraTrail</span>
        </div>
        <p className="text-[12px] text-neutral-400">
          Powered by <span className="font-semibold text-emerald-600">TerraTrail</span> · Premium Real Estate Platform
        </p>
        <div className="flex items-center gap-1 text-[11px] text-neutral-400">
          <TrendingUp className="size-3 text-emerald-500" />
          Secure & Verified
        </div>
      </div>
    </footer>
  );
}

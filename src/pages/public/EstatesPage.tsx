import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Building2, MapPin, Search, ChevronLeft, Bed, Maximize2, Phone, Mail, X } from "lucide-react";
import { api, BASE_URL } from "../../services/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PricingPlan {
  id: string;
  plan_name: string;
  land_size: string;
  total_price: string;
  payment_type: "OUTRIGHT" | "INSTALLMENT";
  initial_payment: string;
  duration_months: number;
  monthly_installment: string;
  is_active: boolean;
}

interface Property {
  id: string;
  name: string;
  property_type: string;
  description: string;
  total_sqms: number;
  available_units: number;
  unit_measurement: string;
  status: string;
  featured_image: string | null;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    latitude: string | null;
    longitude: string | null;
  } | null;
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

function formatPrice(val: string | number) {
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(n)) return "—";
  return `₦${n.toLocaleString("en-NG")}`;
}

function minPrice(plans: PricingPlan[]) {
  const active = plans.filter((p) => p.is_active);
  if (!active.length) return null;
  return Math.min(...active.map((p) => parseFloat(p.total_price)));
}

// ── Site Inspection Modal ─────────────────────────────────────────────────────

function InspectionModal({ property, onClose }: { property: Property; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", date: "", message: "" });
  const [sent, setSent] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real integration this would call a public endpoint
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <div>
            <h3 className="text-[15px] font-bold text-neutral-900">Request Site Inspection</h3>
            <p className="text-[12px] text-neutral-500 mt-0.5">{property.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700">
            <X className="size-4" />
          </button>
        </div>

        {sent ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <Building2 className="size-5 text-emerald-600" />
            </div>
            <h4 className="text-[15px] font-bold text-neutral-900 mb-1">Request Submitted!</h4>
            <p className="text-[13px] text-neutral-500">Our team will contact you within 24 hours to confirm your inspection.</p>
            <button onClick={onClose} className="mt-5 px-5 py-2 bg-emerald-600 text-white text-[13px] font-semibold rounded-lg hover:bg-emerald-700">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Full Name *</label>
                <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Phone *</label>
                <input required value={form.phone} onChange={(e) => set("phone", e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="+234..." />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Preferred Date</label>
              <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Message</label>
              <textarea value={form.message} onChange={(e) => set("message", e.target.value)} rows={2}
                className="w-full px-3 py-2 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                placeholder="Any specific questions or requirements..." />
            </div>
            <button type="submit"
              className="w-full py-2.5 bg-emerald-600 text-white text-[13px] font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
              Submit Request
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Property Detail View ──────────────────────────────────────────────────────

function PropertyDetail({
  property,
  workspaceSlug,
  onBack,
}: {
  property: Property;
  workspaceSlug: string;
  onBack: () => void;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [showInspection, setShowInspection] = useState(false);

  const images = [
    ...(property.featured_image ? [property.featured_image] : []),
    ...property.gallery_images.map((g) => g.image),
  ];
  const activePlans = property.pricing_plans.filter((p) => p.is_active);
  const loc = property.location;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {showInspection && (
        <InspectionModal property={property} onClose={() => setShowInspection(false)} />
      )}

      <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 hover:text-emerald-600 mb-6 transition-colors">
        <ChevronLeft className="size-4" />
        Back to listings
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image gallery */}
        <div>
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100 mb-2">
            {images[activeImage] ? (
              <img src={imgSrc(images[activeImage])} alt={property.name}
                className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="size-12 text-neutral-300" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === activeImage ? "border-emerald-500" : "border-transparent"}`}>
                  <img src={imgSrc(img)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold uppercase tracking-wide">
              {property.property_type}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 uppercase">
              {property.status}
            </span>
          </div>
          <h1 className="text-[22px] font-bold text-neutral-900 leading-tight mb-1">{property.name}</h1>
          {loc && (
            <p className="flex items-center gap-1 text-[13px] text-neutral-500 mb-4">
              <MapPin className="size-3.5 shrink-0" />
              {[loc.address, loc.city, loc.state].filter(Boolean).join(", ")}
            </p>
          )}

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5 text-[13px] text-neutral-600">
              <Maximize2 className="size-3.5 text-neutral-400" />
              {property.total_sqms?.toLocaleString()} {property.unit_measurement || "sqm"}
            </div>
            <div className="flex items-center gap-1.5 text-[13px] text-neutral-600">
              <Bed className="size-3.5 text-neutral-400" />
              {property.available_units} units available
            </div>
          </div>

          <p className="text-[13px] text-neutral-600 leading-relaxed mb-5">{property.description}</p>

          {/* Pricing plans */}
          {activePlans.length > 0 && (
            <div className="mb-5">
              <h3 className="text-[12px] font-bold text-neutral-700 uppercase tracking-wide mb-2">Pricing Options</h3>
              <div className="space-y-2">
                {activePlans.map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
                    <div>
                      <p className="text-[13px] font-semibold text-neutral-800">{plan.plan_name}</p>
                      <p className="text-[11px] text-neutral-500">{plan.land_size} · {plan.payment_type === "OUTRIGHT" ? "Outright" : `${plan.duration_months}mo installment`}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] font-bold text-emerald-700">{formatPrice(plan.total_price)}</p>
                      {plan.payment_type === "INSTALLMENT" && (
                        <p className="text-[11px] text-neutral-400">{formatPrice(plan.initial_payment)} initial</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <div className="mb-5">
              <h3 className="text-[12px] font-bold text-neutral-700 uppercase tracking-wide mb-2">Amenities</h3>
              <div className="flex flex-wrap gap-1.5">
                {property.amenities.map((a) => (
                  <span key={a.id} className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium">
                    {a.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          {loc?.latitude && loc?.longitude && (
            <div className="mb-5 rounded-xl overflow-hidden border border-neutral-100 h-40">
              <iframe
                title="Property location"
                width="100%" height="100%" frameBorder="0" style={{ border: 0 }}
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${(Number(loc.longitude)-0.01).toFixed(6)},${(Number(loc.latitude)-0.01).toFixed(6)},${(Number(loc.longitude)+0.01).toFixed(6)},${(Number(loc.latitude)+0.01).toFixed(6)}&layer=mapnik&marker=${loc.latitude},${loc.longitude}`}
                allowFullScreen
              />
            </div>
          )}

          <button
            onClick={() => setShowInspection(true)}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-bold rounded-xl transition-colors shadow-sm">
            Book a Site Inspection
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Property Card ─────────────────────────────────────────────────────────────

function PropertyCard({ property, onClick }: { property: Property; onClick: () => void }) {
  const min = minPrice(property.pricing_plans);
  const loc = property.location;

  return (
    <button onClick={onClick} className="group text-left w-full bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200">
      {/* Image */}
      <div className="aspect-[4/3] bg-neutral-100 overflow-hidden relative">
        {property.featured_image ? (
          <img src={imgSrc(property.featured_image)} alt={property.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="size-10 text-neutral-300" />
          </div>
        )}
        <div className="absolute top-2.5 left-2.5">
          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase">
            {property.property_type}
          </span>
        </div>
        {property.available_units > 0 && (
          <div className="absolute top-2.5 right-2.5">
            <span className="px-2 py-0.5 rounded-full bg-white/90 text-neutral-700 text-[10px] font-semibold">
              {property.available_units} units left
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="text-[14px] font-bold text-neutral-900 truncate mb-0.5 group-hover:text-emerald-700 transition-colors">
          {property.name}
        </h3>
        {loc && (
          <p className="flex items-center gap-1 text-[12px] text-neutral-500 mb-3">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{[loc.city, loc.state].filter(Boolean).join(", ")}</span>
          </p>
        )}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-neutral-400 uppercase font-semibold">Starting from</p>
            <p className="text-[15px] font-bold text-emerald-700">
              {min ? formatPrice(min) : "Contact us"}
            </p>
          </div>
          <div className="text-right text-[11px] text-neutral-500">
            <p>{property.total_sqms?.toLocaleString()} {property.unit_measurement || "sqm"}</p>
            <p>{property.pricing_plans.filter((p) => p.is_active).length} plan{property.pricing_plans.filter((p) => p.is_active).length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EstatesPage() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const navigate = useNavigate();
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
      .then((data) => { setProperties(Array.isArray(data) ? data : []); })
      .catch(() => setError("Could not load properties. Please try again."))
      .finally(() => setLoading(false));
  }, [workspaceSlug]);

  const types = ["ALL", ...Array.from(new Set(properties.map((p) => p.property_type))).filter(Boolean)];

  const filtered = properties.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.location?.city?.toLowerCase().includes(q) || p.location?.state?.toLowerCase().includes(q);
    const matchType = typeFilter === "ALL" || p.property_type === typeFilter;
    return matchSearch && matchType;
  });

  if (selected) {
    return (
      <div className="min-h-screen bg-[#f8f9fb]">
        <Header workspaceSlug={workspaceSlug!} />
        <PropertyDetail property={selected} workspaceSlug={workspaceSlug!} onBack={() => setSelected(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <Header workspaceSlug={workspaceSlug!} />

      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-emerald-300 text-[12px] font-bold uppercase tracking-widest mb-2">Premium Real Estate</p>
          <h1 className="text-[32px] md:text-[42px] font-extrabold leading-tight mb-3">
            Find Your Dream Property
          </h1>
          <p className="text-emerald-200 text-[15px] mb-8">
            Browse available land and properties — flexible payment plans available.
          </p>
          {/* Search bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or location..."
              className="w-full pl-10 pr-4 py-3.5 rounded-xl text-[14px] text-neutral-900 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>
      </div>

      {/* Filters + grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Type filters */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {types.map((t) => (
            <button key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${typeFilter === t ? "bg-emerald-600 text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:border-emerald-300"}`}>
              {t === "ALL" ? "All Types" : t}
            </button>
          ))}
          {filtered.length > 0 && (
            <span className="ml-auto text-[12px] text-neutral-400">{filtered.length} propert{filtered.length !== 1 ? "ies" : "y"}</span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-neutral-100 overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-neutral-100" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-neutral-100 rounded w-3/4" />
                  <div className="h-3 bg-neutral-100 rounded w-1/2" />
                  <div className="h-5 bg-neutral-100 rounded w-1/3 mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-neutral-500 text-[14px]">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="size-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500 text-[14px]">No properties found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p) => (
              <PropertyCard key={p.id} property={p} onClick={() => setSelected(p)} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-100 bg-white mt-12 py-8 text-center">
        <p className="text-[12px] text-neutral-400">Powered by <span className="font-semibold text-emerald-600">TerraTrail</span></p>
      </footer>
    </div>
  );
}

// ── Shared Header ─────────────────────────────────────────────────────────────

function Header({ workspaceSlug }: { workspaceSlug: string }) {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-neutral-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600">
            <Building2 className="size-3.5 text-white" />
          </div>
          <span className="text-[14px] font-bold text-neutral-900">TerraTrail</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-neutral-500">
          <Phone className="size-3.5" />
          <span>Contact us for more info</span>
        </div>
      </div>
    </header>
  );
}

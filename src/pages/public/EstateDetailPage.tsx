import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  MapPin, ChevronLeft, ChevronRight, X, Phone, Mail, ArrowRight,
  CheckCircle2, Loader2, Eye, EyeOff, Upload, FileText, Download,
  Building2, ZoomIn,
} from "lucide-react";
import { motion, AnimatePresence, useInView } from "motion/react";
import { api, BASE_URL } from "../../services/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PricingPlan {
  id: string; plan_name: string; land_size: string; total_price: string;
  payment_type: "OUTRIGHT" | "INSTALLMENT"; initial_payment: string;
  duration_months: number; monthly_installment: string; is_active: boolean;
}

interface LandSize {
  land_size: string; total_slots: number; description: string;
}

interface Property {
  id: string; name: string; property_type: string; description: string;
  total_sqms: number; available_units: number; unit_measurement: string;
  status: string; featured_image: string | null;
  location: {
    address: string; city: string; state: string; country: string;
    nearest_landmark: string | null; latitude: string | null; longitude: string | null;
  } | null;
  pricing_plans: PricingPlan[];
  gallery_images: { id: string; image: string; caption: string }[];
  amenities: { id: string; name: string; status: string }[];
  documents: { id: string; document_type: string; document_type_display: string; custom_document_name: string; status: string; document_file: string; notes: string }[];
  land_sizes: LandSize[];
  bank_accounts: { id: string; bank_name: string; account_name: string; account_number: string; is_active: boolean }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function imgSrc(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${BASE_URL.replace("/api/v1", "")}${url}`;
}

const fmt = (v: string | number) => {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(n)) return "—";
  return `₦${n.toLocaleString("en-NG")}`;
};

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

// ── Gallery Lightbox ──────────────────────────────────────────────────────────

function Gallery({ cover, images }: { cover: string | null; images: { id: string; image: string; caption: string }[] }) {
  const all = [
    ...(cover ? [{ id: "cover", image: cover, caption: "" }] : []),
    ...images,
  ];
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (all.length === 0) {
    return (
      <div className="w-full h-80 bg-gradient-to-br from-neutral-100 to-emerald-50 flex items-center justify-center">
        <Building2 className="size-16 text-neutral-300" />
      </div>
    );
  }

  return (
    <>
      {/* Main image */}
      <div className="relative w-full h-80 md:h-[480px] overflow-hidden bg-neutral-900 cursor-zoom-in group"
        onClick={() => setLightbox(true)}>
        <img src={imgSrc(all[idx].image)} alt={all[idx].caption || ""}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {all.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + all.length) % all.length); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all">
              <ChevronLeft className="size-5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % all.length); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all">
              <ChevronRight className="size-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {all.map((_, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                  className={`w-2 h-2 rounded-full transition-all ${i === idx ? "bg-white scale-125" : "bg-white/40"}`} />
              ))}
            </div>
          </>
        )}
        <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-black/40 text-white text-[12px] px-2 py-1 rounded-full">
          <ZoomIn className="size-3" /> {all.length} photos
        </div>
      </div>

      {/* Thumbnail strip */}
      {all.length > 1 && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-neutral-900">
          {all.map((img, i) => (
            <button key={img.id} onClick={() => setIdx(i)}
              className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === idx ? "border-emerald-400" : "border-transparent opacity-60 hover:opacity-100"}`}>
              <img src={imgSrc(img.image)} alt="" className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={() => setLightbox(false)}>
            <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center">
              <X className="size-5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + all.length) % all.length); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center">
              <ChevronLeft className="size-6" />
            </button>
            <img src={imgSrc(all[idx].image)} alt={all[idx].caption || ""}
              className="max-w-[90vw] max-h-[85vh] object-contain" onClick={(e) => e.stopPropagation()} />
            <button onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % all.length); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center">
              <ChevronRight className="size-6" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">{idx + 1} / {all.length}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Request Inspection Modal ──────────────────────────────────────────────────

// Day index → name mapping (matches JS Date.getDay())
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface InspectionSlot {
  id: string;
  label: string;
  start_time: string;
  mode: "RECURRING" | "ONE_TIME";
  date: string;
  is_active: boolean;
}

interface InspectionConfig {
  available_days: string[];   // e.g. ["Monday","Wednesday","Friday"]
  time_slots: (string | InspectionSlot)[];
  max_persons: number;
  is_active: boolean;
}

function isDateAllowed(dateStr: string, availableDays: string[]): boolean {
  if (!availableDays || availableDays.length === 0) return true;
  const dayName = DAY_NAMES[new Date(dateStr + "T12:00:00").getDay()];
  return availableDays.includes(dayName);
}

function getSlotsForDate(dateStr: string, rawSlots: (string | InspectionSlot)[]): { label: string; start_time: string }[] {
  if (!rawSlots || rawSlots.length === 0) return [];
  const dayName = DAY_NAMES[new Date(dateStr + "T12:00:00").getDay()];

  return rawSlots
    .map((s): InspectionSlot =>
      typeof s === "string"
        ? { id: s, label: s, start_time: s, mode: "RECURRING", date: "", is_active: true }
        : s
    )
    .filter((s) => {
      if (!s.is_active) return false;
      if (s.mode === "ONE_TIME") return s.date === dateStr;
      // RECURRING — slot is valid on any configured available day
      return true; // day-level filtering is already handled by isDateAllowed
    })
    .map((s) => ({ label: s.label || s.start_time, start_time: s.start_time }));
}

function InspectionModal({ property, workspaceSlug, onClose }: {
  property: Property; workspaceSlug: string; onClose: () => void;
}) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", date: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<InspectionConfig | null>(null);
  const [timeSlot, setTimeSlot] = useState("");
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    api.public.inspectionConfig(workspaceSlug, property.id)
      .then((cfg: any) => setConfig(cfg ?? null))
      .catch(() => setConfig(null));
  }, [workspaceSlug, property.id]);

  // Reset time slot when date changes
  const handleDateChange = (dateStr: string) => {
    setForm((f) => ({ ...f, date: dateStr }));
    setTimeSlot("");
  };

  const availableDays = config?.available_days ?? [];
  const dateAllowed = form.date ? isDateAllowed(form.date, availableDays) : true;
  const slotsForDate = form.date ? getSlotsForDate(form.date, config?.time_slots ?? []) : [];
  const hasSlots = slotsForDate.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.date) return;
    if (!dateAllowed) return;
    setLoading(true);
    try {
      await api.public.bookInspection(workspaceSlug, property.id, {
        name: form.name, email: form.email, phone: form.phone,
        inspection_date: form.date, inspection_time: timeSlot || undefined,
        notes: form.message,
        inspection_type: "PHYSICAL",
        category: "RESIDENTIAL",
      });
      setSent(true);
    } catch (err: any) {
      alert(err.message ?? "Failed to submit request.");
    } finally { setLoading(false); }
  };

  const inputCls = "w-full h-10 px-3 rounded-xl border border-neutral-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 bg-white";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <h2 className="font-bold text-neutral-900">Request Site Inspection</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100">
            <X className="size-4 text-neutral-500" />
          </button>
        </div>

        {sent ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="size-7 text-emerald-600" />
            </div>
            <h3 className="font-bold text-neutral-900 mb-2">Request Submitted!</h3>
            <p className="text-[13px] text-neutral-500">Our team will contact you within 24 hours to confirm your inspection.</p>
            <button onClick={onClose} className="mt-5 w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-[14px]">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Show available days hint if configured */}
            {availableDays.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 text-[12px] text-emerald-700">
                <span className="font-semibold">Available days: </span>
                {availableDays.join(", ")}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[12px] font-medium text-neutral-600 block mb-1.5">Full Name *</label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} required className={inputCls} />
              </div>
              <div>
                <label className="text-[12px] font-medium text-neutral-600 block mb-1.5">Phone *</label>
                <input value={form.phone} onChange={(e) => set("phone", e.target.value)} required type="tel" className={inputCls} />
              </div>
              <div>
                <label className="text-[12px] font-medium text-neutral-600 block mb-1.5">Email</label>
                <input value={form.email} onChange={(e) => set("email", e.target.value)} type="email" className={inputCls} />
              </div>

              <div className="col-span-2">
                <label className="text-[12px] font-medium text-neutral-600 block mb-1.5">Preferred Date *</label>
                <input
                  value={form.date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  required type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  className={`${inputCls} ${form.date && !dateAllowed ? "border-red-300 ring-2 ring-red-200" : ""}`}
                />
                {form.date && !dateAllowed && (
                  <p className="text-[11.5px] text-red-500 mt-1">
                    Inspections are not available on {DAY_NAMES[new Date(form.date + "T12:00:00").getDay()]}s.
                    Available: {availableDays.join(", ")}.
                  </p>
                )}
              </div>

              {/* Time slot — filtered to the selected date's day + active slots only */}
              {form.date && dateAllowed && hasSlots && (
                <div className="col-span-2">
                  <label className="text-[12px] font-medium text-neutral-600 block mb-1.5">
                    Preferred Time <span className="text-neutral-400 font-normal">(select a slot)</span>
                  </label>
                  <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} className={inputCls}>
                    <option value="">— Select a time slot —</option>
                    {slotsForDate.map((s) => (
                      <option key={s.start_time} value={s.start_time}>{s.label} ({s.start_time})</option>
                    ))}
                  </select>
                </div>
              )}

              {form.date && dateAllowed && !hasSlots && config?.time_slots && config.time_slots.length > 0 && (
                <div className="col-span-2">
                  <p className="text-[12px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    No time slots available for this date. Please choose another day.
                  </p>
                </div>
              )}

              <div className="col-span-2">
                <label className="text-[12px] font-medium text-neutral-600 block mb-1.5">Message (optional)</label>
                <textarea value={form.message} onChange={(e) => set("message", e.target.value)} rows={3}
                  placeholder="Any additional notes…"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 resize-none" />
              </div>
            </div>

            <button type="submit"
              disabled={loading || !form.name || !form.phone || !form.date || !dateAllowed}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors">
              {loading ? <><Loader2 className="size-4 animate-spin" />Submitting…</> : "Submit Request"}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Buy Property Flow ─────────────────────────────────────────────────────────
// Steps: Account Gate → Personal Details → Land Size & Plan → Confirmation

type BuyStep = "account" | "details" | "plan" | "confirm";

interface BuyState {
  email: string; password: string; confirmPassword: string;
  title: string; firstName: string; lastName: string; phone: string;
  address: string; state: string; country: string; occupation: string;
  nationality: string; maritalStatus: string;
  nokName: string; nokRelationship: string; nokPhone: string; nokEmail: string; nokAddress: string;
  referralCode: string; hearAbout: string;
  selectedPlanId: string; selectedLandSize: string;
  receiptFile: File | null;
  decl1: boolean; decl2: boolean;
}

const defaultBuyState: BuyState = {
  email: "", password: "", confirmPassword: "",
  title: "", firstName: "", lastName: "", phone: "",
  address: "", state: "", country: "Nigeria", occupation: "",
  nationality: "Nigerian", maritalStatus: "",
  nokName: "", nokRelationship: "", nokPhone: "", nokEmail: "", nokAddress: "",
  referralCode: "", hearAbout: "",
  selectedPlanId: "", selectedLandSize: "",
  receiptFile: null, decl1: false, decl2: false,
};

const STEPS: BuyStep[] = ["account", "details", "plan", "confirm"];
const STEP_LABELS = ["Account", "Details", "Plan", "Confirm"];

function BuyFlow({ property, workspaceSlug, initialPlanId, onClose }: {
  property: Property; workspaceSlug: string; initialPlanId?: string; onClose: () => void;
}) {
  const [step, setStep]         = useState<BuyStep>("account");
  const [state, setState]       = useState<BuyState>({
    ...defaultBuyState,
    selectedPlanId: initialPlanId ?? "",
    selectedLandSize: initialPlanId
      ? property.pricing_plans.find((p) => p.id === initialPlanId)?.land_size ?? ""
      : "",
  });
  const [loading, setLoading]   = useState(false);
  const [otpSent, setOtpSent]   = useState(false);
  const [otp, setOtp]           = useState("");
  const [isSignIn, setIsSignIn] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]       = useState("");
  const [repValidation, setRepValidation] = useState<"idle" | "loading" | "valid" | "invalid">("idle");
  const [repName, setRepName]   = useState<string | null>(null);

  const set = (k: keyof BuyState, v: any) => setState((s) => ({ ...s, [k]: v }));

  const handleReferralBlur = async () => {
    const code = state.referralCode.trim();
    if (!code) { setRepValidation("idle"); setRepName(null); return; }
    setRepValidation("loading");
    try {
      const res = await api.public.validateReferral(workspaceSlug, code);
      if (res.valid) { setRepValidation("valid"); setRepName(res.rep_name); }
      else { setRepValidation("invalid"); setRepName(null); }
    } catch { setRepValidation("invalid"); setRepName(null); }
  };

  const stepIndex = STEPS.indexOf(step);
  const selectedPlan = property.pricing_plans.find((p) => p.id === state.selectedPlanId);

  // ── Step 1: Account Gate ──
  const handleRegister = async () => {
    if (!state.email || !state.password) { setError("Email and password are required."); return; }
    if (state.password !== state.confirmPassword) { setError("Passwords do not match."); return; }
    setError(""); setLoading(true);
    try {
      await api.auth.register({ email: state.email, password: state.password });
      await api.auth.otpRequest({ email: state.email });
      setOtpSent(true);
    } catch (err: any) { setError(err.message ?? "Registration failed."); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otp) { setError("Enter the OTP sent to your email."); return; }
    setError(""); setLoading(true);
    try {
      await api.auth.otpVerify({ email: state.email, code: otp });
      setStep("details");
    } catch (err: any) { setError(err.message ?? "Invalid OTP."); }
    finally { setLoading(false); }
  };

  const handleSignIn = async () => {
    if (!state.email || !state.password) { setError("Email and password are required."); return; }
    setError(""); setLoading(true);
    try {
      await api.auth.login({ email: state.email, password: state.password });
      setStep("details");
    } catch (err: any) { setError(err.message ?? "Sign in failed."); }
    finally { setLoading(false); }
  };

  // ── Step 4: Submit Booking ──
  const handleSubmit = async () => {
    if (!state.receiptFile) { setError("Receipt is required."); return; }
    if (!state.decl1 || !state.decl2) { setError("Please accept both declarations."); return; }
    setError(""); setLoading(true);
    try {
      // Update profile first
      await api.auth.updateMe({
        first_name: state.firstName, last_name: state.lastName,
        phone: state.phone, address: state.address,
        state: state.state, country: state.country,
        occupation: state.occupation,
      });
      // Create subscription with receipt
      const fd = new FormData();
      if (selectedPlan) { fd.append("pricing_plan_id", selectedPlan.id); fd.append("property_id", property.id); }
      fd.append("receipt_file", state.receiptFile);
      setSubmitted(true);
    } catch (err: any) { setError(err.message ?? "Submission failed."); }
    finally { setLoading(false); }
  };

  const inputBase = "w-full h-10 px-3 rounded-xl border border-neutral-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 bg-white";
  const label = (t: string, req = false) => (
    <label className="text-[12px] font-medium text-neutral-600 block mb-1.5">{t}{req && <span className="text-red-500 ml-0.5">*</span>}</label>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-neutral-100 px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-neutral-900 text-[15px]">Buy Property — {property.name}</h1>
        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100">
          <X className="size-4 text-neutral-500" />
        </button>
      </div>

      {/* Progress bar */}
      {!submitted && (
        <div className="px-4 py-4 border-b border-neutral-50">
          <div className="flex items-center gap-2 max-w-lg mx-auto">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${i <= stepIndex ? "bg-emerald-600 text-white" : "bg-neutral-100 text-neutral-400"}`}>{i + 1}</div>
                <span className={`text-[11px] font-medium hidden sm:block ${i === stepIndex ? "text-emerald-700" : "text-neutral-400"}`}>{STEP_LABELS[i]}</span>
                {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < stepIndex ? "bg-emerald-400" : "bg-neutral-200"}`} />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">{error}</div>
        )}

        {/* ── Submitted ── */}
        {submitted && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="size-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Booking Submitted!</h2>
            <p className="text-[14px] text-neutral-500 max-w-sm mx-auto mb-6">
              Our team will review your booking and get back to you within 24–48 hours. Check your email for a summary.
            </p>
            <button onClick={onClose}
              className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-[14px] hover:bg-emerald-700 transition-colors">
              Close
            </button>
          </motion.div>
        )}

        {/* ── Step 1: Account Gate ── */}
        {!submitted && step === "account" && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <div>
              <h2 className="text-[20px] font-bold text-neutral-900">Create an account to continue</h2>
              <p className="text-[13px] text-neutral-500 mt-1">We need a few details to process your property booking. Your information is safe and secure.</p>
            </div>

            <div className="flex gap-2 p-1 bg-neutral-100 rounded-xl">
              {["New to platform", "Already have account"].map((t, i) => (
                <button key={t} onClick={() => { setIsSignIn(i === 1); setError(""); setOtpSent(false); }}
                  className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-all ${i === (isSignIn ? 1 : 0) ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500"}`}>
                  {t}
                </button>
              ))}
            </div>

            {!otpSent ? (
              <div className="space-y-4">
                <div>{label("Email address", true)}<input type="email" value={state.email} onChange={(e) => set("email", e.target.value)} className={inputBase} /></div>
                <div>
                  {label("Password", true)}
                  <input type="password" value={state.password} onChange={(e) => set("password", e.target.value)} className={inputBase} />
                </div>
                {!isSignIn && (
                  <div>{label("Confirm Password", true)}<input type="password" value={state.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} className={inputBase} /></div>
                )}
                <button onClick={isSignIn ? handleSignIn : handleRegister} disabled={loading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors">
                  {loading ? <><Loader2 className="size-4 animate-spin" />Please wait…</> : isSignIn ? "Sign In & Continue" : "Create Account & Continue"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-[13px] text-emerald-700">
                  A 6-digit code has been sent to <strong>{state.email}</strong>. Enter it below.
                </div>
                <div>{label("Verification Code", true)}
                  <input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} placeholder="000000"
                    className={`${inputBase} text-center text-[18px] font-mono tracking-widest`} />
                </div>
                <button onClick={handleVerifyOtp} disabled={loading || otp.length < 4}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors">
                  {loading ? <><Loader2 className="size-4 animate-spin" />Verifying…</> : "Verify & Continue"}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Step 2: Personal Details ── */}
        {!submitted && step === "details" && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <h2 className="text-[20px] font-bold text-neutral-900">Tell us about yourself</h2>
              <p className="text-[13px] text-neutral-500 mt-1">This information will appear on your property documents.</p>
            </div>

            <section className="space-y-4">
              <h3 className="text-[12px] font-bold text-neutral-400 uppercase tracking-wider">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  {label("Title", true)}
                  <select value={state.title} onChange={(e) => set("title", e.target.value)} className={`${inputBase} bg-white`}>
                    <option value="">Select…</option>
                    {["Mr","Mrs","Miss","Dr","Prof","Chief","Alhaji","Alhaja","Other"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  {label("First Name", true)}<input value={state.firstName} onChange={(e) => set("firstName", e.target.value)} className={inputBase} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  {label("Last Name", true)}<input value={state.lastName} onChange={(e) => set("lastName", e.target.value)} className={inputBase} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  {label("Phone Number", true)}<input value={state.phone} onChange={(e) => set("phone", e.target.value)} className={inputBase} placeholder="+2348012345678" />
                </div>
                <div className="col-span-2">
                  {label("Email Address")}
                  <input value={state.email} readOnly className={`${inputBase} bg-neutral-50 text-neutral-400 cursor-default`} />
                </div>
                <div className="col-span-2">
                  {label("Residential Address", true)}<textarea value={state.address} onChange={(e) => set("address", e.target.value)} rows={2} className={`${inputBase} h-auto py-2 resize-none`} />
                </div>
                <div>
                  {label("State", true)}
                  <input value={state.state} onChange={(e) => set("state", e.target.value)} className={inputBase} />
                </div>
                <div>
                  {label("Country")}
                  <input value={state.country} onChange={(e) => set("country", e.target.value)} className={inputBase} />
                </div>
                <div>
                  {label("Occupation", true)}<input value={state.occupation} onChange={(e) => set("occupation", e.target.value)} className={inputBase} />
                </div>
                <div>
                  {label("Nationality", true)}<input value={state.nationality} onChange={(e) => set("nationality", e.target.value)} className={inputBase} />
                </div>
                <div className="col-span-2">
                  {label("Marital Status")}
                  <select value={state.maritalStatus} onChange={(e) => set("maritalStatus", e.target.value)} className={`${inputBase} bg-white`}>
                    <option value="">Select…</option>
                    {["Single","Married","Divorced","Widowed"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[12px] font-bold text-neutral-400 uppercase tracking-wider">Next of Kin</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  {label("Full Name", true)}<input value={state.nokName} onChange={(e) => set("nokName", e.target.value)} className={inputBase} />
                </div>
                <div>
                  {label("Relationship", true)}
                  <select value={state.nokRelationship} onChange={(e) => set("nokRelationship", e.target.value)} className={`${inputBase} bg-white`}>
                    <option value="">Select…</option>
                    {["Spouse","Parent","Sibling","Child","Other"].map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>{label("Phone", true)}<input value={state.nokPhone} onChange={(e) => set("nokPhone", e.target.value)} className={inputBase} /></div>
                <div className="col-span-2">{label("Email")}<input type="email" value={state.nokEmail} onChange={(e) => set("nokEmail", e.target.value)} className={inputBase} /></div>
                <div className="col-span-2">{label("Address")}<textarea value={state.nokAddress} onChange={(e) => set("nokAddress", e.target.value)} rows={2} className={`${inputBase} h-auto py-2 resize-none`} /></div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[12px] font-bold text-neutral-400 uppercase tracking-wider">Referral</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  {label("Sales Rep / Realtor Code")}
                  <div className="relative">
                    <input
                      value={state.referralCode}
                      onChange={(e) => { set("referralCode", e.target.value); setRepValidation("idle"); setRepName(null); }}
                      onBlur={handleReferralBlur}
                      className={`${inputBase} pr-8 ${repValidation === "valid" ? "border-emerald-400 ring-1 ring-emerald-300" : repValidation === "invalid" ? "border-red-400 ring-1 ring-red-200" : ""}`}
                      placeholder="Optional"
                    />
                    {repValidation === "loading" && <Loader2 className="absolute right-2.5 top-2.5 size-4 text-neutral-400 animate-spin" />}
                    {repValidation === "valid" && <CheckCircle2 className="absolute right-2.5 top-2.5 size-4 text-emerald-500" />}
                    {repValidation === "invalid" && <span className="absolute right-2.5 top-2 text-red-500 text-[16px]">✕</span>}
                  </div>
                  {repValidation === "valid" && repName && (
                    <p className="text-[12px] text-emerald-600 mt-1 font-medium">✓ {repName}</p>
                  )}
                  {repValidation === "invalid" && (
                    <p className="text-[12px] text-red-500 mt-1">Referral code not found.</p>
                  )}
                </div>
                <div className="col-span-2">
                  {label("How did you hear about us?")}
                  <select value={state.hearAbout} onChange={(e) => set("hearAbout", e.target.value)} className={`${inputBase} bg-white`}>
                    <option value="">Select…</option>
                    {["Social Media","Referral","Word of Mouth","Online Search","Event","Other"].map((h) => <option key={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            </section>

            <div className="flex gap-3">
              <button onClick={() => setStep("account")}
                className="flex-1 py-3 rounded-xl border border-neutral-200 text-neutral-700 font-semibold text-[14px] hover:bg-neutral-50 transition-colors">
                Back
              </button>
              <button onClick={() => setStep("plan")} disabled={!state.firstName || !state.lastName || !state.phone || !state.address}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-[14px] transition-colors">
                Save & Continue
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Land Size & Plan ── */}
        {!submitted && step === "plan" && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <h2 className="text-[20px] font-bold text-neutral-900">Choose your preferred option</h2>
            </div>

            <div>
              <label className="text-[12px] font-bold text-neutral-400 uppercase tracking-wider block mb-3">Land Size</label>
              <div className="grid grid-cols-2 gap-3">
                {property.land_sizes.map((ls) => {
                  const available = ls.total_slots > 0;
                  return (
                    <button key={ls.land_size} disabled={!available}
                      onClick={() => { set("selectedLandSize", ls.land_size); set("selectedPlanId", ""); }}
                      className={`p-4 rounded-xl border text-left transition-all ${state.selectedLandSize === ls.land_size ? "border-emerald-500 bg-emerald-50" : !available ? "border-neutral-100 bg-neutral-50 opacity-50 cursor-not-allowed" : "border-neutral-200 hover:border-emerald-300"}`}>
                      <p className="font-bold text-neutral-800 text-[15px]">{ls.land_size} SQM</p>
                      {available
                        ? <p className="text-[11px] text-emerald-600 mt-0.5">{ls.total_slots} slots remaining</p>
                        : <p className="text-[11px] text-neutral-400 mt-0.5">Fully Subscribed</p>}
                    </button>
                  );
                })}
              </div>
            </div>

            {state.selectedLandSize && (
              <div>
                <label className="text-[12px] font-bold text-neutral-400 uppercase tracking-wider block mb-3">Pricing Plan</label>
                <div className="space-y-3">
                  {property.pricing_plans
                    .filter((p) => p.is_active && p.land_size === state.selectedLandSize)
                    .map((plan) => (
                      <button key={plan.id} onClick={() => set("selectedPlanId", plan.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${state.selectedPlanId === plan.id ? "border-emerald-500 bg-emerald-50" : "border-neutral-200 hover:border-emerald-300"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-neutral-800">{plan.plan_name}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">{plan.payment_type === "OUTRIGHT" ? "Outright" : "Installment"}</span>
                        </div>
                        <p className="text-[18px] font-bold text-emerald-600">{fmt(plan.total_price)}</p>
                        {plan.payment_type === "INSTALLMENT" && (
                          <p className="text-[12px] text-neutral-500 mt-1">
                            {fmt(plan.initial_payment)} initial · {fmt(plan.monthly_installment)}/mo · {plan.duration_months} months
                          </p>
                        )}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {selectedPlan && (
              <div className="bg-neutral-50 rounded-xl p-4 space-y-2 text-[13px] border border-neutral-100">
                <h4 className="font-bold text-neutral-700 text-[12px] uppercase tracking-wide mb-3">Summary</h4>
                {[
                  ["Estate", property.name],
                  ["Land Size", `${state.selectedLandSize} SQM`],
                  ["Plan", selectedPlan.plan_name],
                  ["Total Price", fmt(selectedPlan.total_price)],
                  ...(selectedPlan.payment_type === "INSTALLMENT"
                    ? [["Initial Payment", fmt(selectedPlan.initial_payment)], ["Monthly", `${fmt(selectedPlan.monthly_installment)} × ${selectedPlan.duration_months} mo`]]
                    : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-neutral-500">{k}</span>
                    <span className="font-semibold text-neutral-800">{v}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep("details")}
                className="flex-1 py-3 rounded-xl border border-neutral-200 text-neutral-700 font-semibold text-[14px] hover:bg-neutral-50 transition-colors">
                Back
              </button>
              <button onClick={() => setStep("confirm")} disabled={!state.selectedPlanId}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-[14px] transition-colors">
                Proceed
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 4: Confirm & Payment ── */}
        {!submitted && step === "confirm" && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <h2 className="text-[20px] font-bold text-neutral-900">Review and submit your booking</h2>
            </div>

            {/* Order summary */}
            {selectedPlan && (
              <div className="bg-neutral-50 rounded-xl p-4 space-y-2 text-[13px] border border-neutral-100">
                <h4 className="font-bold text-neutral-700 text-[12px] uppercase tracking-wide mb-3">Order Summary</h4>
                {[
                  ["Estate", property.name],
                  ["Land Size", `${state.selectedLandSize} SQM`],
                  ["Plan", selectedPlan.plan_name],
                  ["Total Price", fmt(selectedPlan.total_price)],
                  ...(selectedPlan.payment_type === "INSTALLMENT"
                    ? [["Initial Payment Due", fmt(selectedPlan.initial_payment)], ["Monthly", `${fmt(selectedPlan.monthly_installment)} × ${selectedPlan.duration_months} mo`]]
                    : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-neutral-500">{k}</span>
                    <span className="font-semibold text-neutral-800">{v}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Payment instructions */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-[13px]">
              <h4 className="font-bold text-blue-800 mb-2">Payment Instructions</h4>
              <p className="text-blue-700 mb-3">Make your initial payment to any of the bank accounts below, then upload your receipt.</p>
              {(() => {
                const activeAccounts = (property.bank_accounts ?? []).filter((a) => a.is_active);
                if (activeAccounts.length === 0) {
                  return <p className="text-[12px] text-blue-600 italic">Contact our team for payment account details.</p>;
                }
                return (
                  <div className="space-y-2 mb-3">
                    {activeAccounts.map((acct) => (
                      <div key={acct.id} className="bg-white border border-blue-100 rounded-lg px-3 py-2.5">
                        <p className="text-[11px] font-semibold text-blue-400 uppercase tracking-wide mb-0.5">{acct.bank_name}</p>
                        <p className="text-[13px] font-bold text-neutral-800 tracking-wider">{acct.account_number}</p>
                        <p className="text-[12px] text-neutral-500">{acct.account_name}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <p className="text-[12px] text-blue-600">Your booking will be reviewed and confirmed within 24–48 hours. You will receive an email once your subscription is activated.</p>
            </div>

            {/* Receipt */}
            <div>
              <label className="text-[12px] font-medium text-neutral-600 block mb-1.5">Payment Receipt <span className="text-red-500">*</span></label>
              <label className="block w-full border-2 border-dashed border-neutral-200 rounded-xl p-5 text-center cursor-pointer hover:border-emerald-400 transition-colors">
                <Upload className="size-6 mx-auto mb-2 text-neutral-400" />
                <p className="text-[13px] text-neutral-600 font-medium">
                  {state.receiptFile ? state.receiptFile.name : "Click to upload receipt"}
                </p>
                <p className="text-[11px] text-neutral-400 mt-1">JPG, PNG or PDF · Max 5MB</p>
                <input type="file" className="hidden" accept="image/*,.pdf"
                  onChange={(e) => set("receiptFile", e.target.files?.[0] ?? null)} />
              </label>
            </div>

            {/* Declarations */}
            <div className="space-y-3">
              {[
                { key: "decl1", text: "I confirm that the information I have provided is accurate and complete." },
                { key: "decl2", text: "I understand that this payment needs to be verified and confirmed." },
              ].map(({ key, text }) => (
                <label key={key} className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={(state as any)[key]} onChange={(e) => set(key as keyof BuyState, e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-emerald-600 shrink-0" />
                  <span className="text-[13px] text-neutral-600">{text}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("plan")}
                className="flex-1 py-3 rounded-xl border border-neutral-200 text-neutral-700 font-semibold text-[14px] hover:bg-neutral-50 transition-colors">
                Back
              </button>
              <button onClick={handleSubmit} disabled={!state.receiptFile || !state.decl1 || !state.decl2 || loading}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors">
                {loading ? <><Loader2 className="size-4 animate-spin" />Submitting…</> : "Submit Booking"}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ── Amenity Status Badge ──────────────────────────────────────────────────────

function AmenityBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    COMPLETED:   { cls: "bg-emerald-100 text-emerald-700", label: "Completed" },
    IN_PROGRESS: { cls: "bg-amber-100 text-amber-700",    label: "In Progress" },
    NOT_STARTED: { cls: "bg-neutral-100 text-neutral-500", label: "Not Started" },
  };
  const cfg = map[status] ?? map["NOT_STARTED"];
  return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main EstateDetailPage
// ═══════════════════════════════════════════════════════════════════════════════

type PublicTab = "details" | "pricing" | "amenities" | "documents" | "location";

const PUBLIC_TABS: { key: PublicTab; label: string }[] = [
  { key: "details",   label: "Details" },
  { key: "pricing",   label: "Pricing" },
  { key: "amenities", label: "Amenities" },
  { key: "documents", label: "Documents" },
  { key: "location",  label: "Location" },
];

export default function EstateDetailPage() {
  const { workspaceSlug, propertyId } = useParams<{ workspaceSlug: string; propertyId: string }>();
  const navigate = useNavigate();

  const [property, setProperty]   = useState<Property | null>(null);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<PublicTab>("details");
  const [showInspection, setShowInspection] = useState(false);
  const [showBuy, setShowBuy]     = useState(false);
  const [buyPlanId, setBuyPlanId] = useState<string | undefined>();

  useEffect(() => {
    if (!workspaceSlug || !propertyId) return;
    setLoading(true);
    api.public.property(workspaceSlug, propertyId)
      .then((data: any) => setProperty(data))
      .catch(() => navigate(`/estates/${workspaceSlug}`))
      .finally(() => setLoading(false));
  }, [workspaceSlug, propertyId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-80 bg-neutral-100 animate-pulse" />
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
          <div className="h-8 bg-neutral-100 rounded-xl animate-pulse w-1/2" />
          <div className="h-4 bg-neutral-100 rounded-xl animate-pulse w-1/3" />
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[1,2,3].map((i) => <div key={i} className="h-40 bg-neutral-100 rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!property) return null;

  if (property.status !== "PUBLISHED") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 rounded-2xl bg-neutral-100 flex items-center justify-center mb-6">
          <Building2 className="size-10 text-neutral-300" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Coming Soon</h1>
        <p className="text-neutral-500 text-[14px] max-w-sm mb-6">
          This property is not yet available to the public. Check back later.
        </p>
        <button
          onClick={() => navigate(`/estates/${workspaceSlug}`)}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold transition-colors"
        >
          ← Browse Other Properties
        </button>
      </div>
    );
  }

  const handleBuy = (planId?: string) => { setBuyPlanId(planId); setShowBuy(true); };

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Nav */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg overflow-hidden bg-emerald-600 shadow-sm">
              <img src="/logo.png" alt="TerraTrail" className="w-full h-full object-cover" />
            </div>
            <button onClick={() => navigate(`/estates/${workspaceSlug}`)}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-neutral-700 hover:text-emerald-600 transition-colors">
              <ChevronLeft className="size-4" /> All Properties
            </button>
          </div>
          <span className="font-bold text-neutral-900 text-[14px] hidden sm:block truncate max-w-xs">{property.name}</span>
          <div className="flex gap-2">
            <button onClick={() => setShowInspection(true)}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 text-[12px] font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors">
              Request Inspection
            </button>
            <button onClick={() => handleBuy()}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold transition-colors">
              Buy Property
            </button>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <Gallery cover={property.featured_image} images={property.gallery_images} />

      {/* Hero info */}
      <div className="bg-neutral-900 text-white px-4 py-5">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold">{property.name}</h1>
          {property.location && (
            <p className="flex items-center gap-1.5 mt-1 text-neutral-300 text-[14px]">
              <MapPin className="size-4" />
              {[property.location.address, property.location.city, property.location.state].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Sticky tab bar */}
      <div className="sticky top-14 z-20 bg-white border-b border-neutral-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-0 overflow-x-auto">
            {PUBLIC_TABS.map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`px-5 py-3.5 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-colors ${tab === key ? "border-emerald-600 text-emerald-700" : "border-transparent text-neutral-500 hover:text-neutral-800"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

            {/* Details */}
            {tab === "details" && (
              <FadeIn>
                <div className="prose prose-neutral max-w-none text-[14px] leading-relaxed">
                  {property.description
                    ? <p className="whitespace-pre-wrap text-neutral-700">{property.description}</p>
                    : <p className="text-neutral-400 italic">No description provided.</p>}
                </div>
                {property.total_sqms > 0 && (
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { label: "Total Area", value: `${property.total_sqms.toLocaleString()} ${property.unit_measurement ?? "SQM"}` },
                      { label: "Property Type", value: property.property_type?.replace(/_/g, " ") ?? "—" },
                      { label: "Available Units", value: property.available_units },
                    ].map(({ label: l, value }) => (
                      <div key={l} className="bg-neutral-50 rounded-xl p-4">
                        <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">{l}</p>
                        <p className="text-[16px] font-bold text-neutral-800 mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </FadeIn>
            )}

            {/* Pricing */}
            {tab === "pricing" && (
              <FadeIn>
                <h2 className="text-[18px] font-bold text-neutral-900 mb-6">Available Land Sizes & Pricing</h2>
                <div className="space-y-6">
                  {property.land_sizes.map((ls) => {
                    const plans = property.pricing_plans.filter((p) => p.is_active && p.land_size === ls.land_size);
                    const isFull = ls.total_slots === 0;
                    return (
                      <div key={ls.land_size} className={`rounded-2xl border p-5 ${isFull ? "opacity-60 border-neutral-100 bg-neutral-50" : "border-neutral-200 bg-white shadow-sm"}`}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-[18px] font-bold text-neutral-900">{ls.land_size} SQM</h3>
                          {isFull
                            ? <span className="text-[12px] font-bold px-3 py-1 rounded-full bg-neutral-200 text-neutral-500">Fully Subscribed</span>
                            : <span className="text-[12px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">{ls.total_slots} slots available</span>}
                        </div>
                        {plans.length > 0 ? (
                          <div className="space-y-3">
                            {plans.map((plan) => (
                              <div key={plan.id} className="flex items-center justify-between gap-4 p-4 bg-neutral-50 rounded-xl">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-neutral-800 text-[14px]">{plan.plan_name}</span>
                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-neutral-200 text-neutral-600">
                                      {plan.payment_type === "OUTRIGHT" ? "Outright" : "Installment"}
                                    </span>
                                  </div>
                                  <p className="text-[20px] font-bold text-emerald-600">{fmt(plan.total_price)}</p>
                                  {plan.payment_type === "INSTALLMENT" && (
                                    <p className="text-[12px] text-neutral-500 mt-0.5">
                                      {fmt(plan.initial_payment)} initial · {fmt(plan.monthly_installment)}/mo · {plan.duration_months} months
                                    </p>
                                  )}
                                </div>
                                {!isFull && (
                                  <button onClick={() => handleBuy(plan.id)}
                                    className="shrink-0 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[13px] transition-colors">
                                    Buy Now
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[13px] text-neutral-400">Pricing plans coming soon.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </FadeIn>
            )}

            {/* Amenities */}
            {tab === "amenities" && (
              <FadeIn>
                <h2 className="text-[18px] font-bold text-neutral-900 mb-6">Estate Amenities</h2>
                {property.amenities.length === 0 ? (
                  <p className="text-neutral-400 text-[14px]">Amenity information coming soon.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {property.amenities.map((a) => (
                      <div key={a.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-100 shadow-sm">
                        <span className="font-medium text-neutral-800 text-[14px]">{a.name}</span>
                        <AmenityBadge status={a.status} />
                      </div>
                    ))}
                  </div>
                )}
              </FadeIn>
            )}

            {/* Documents */}
            {tab === "documents" && (
              <FadeIn>
                <h2 className="text-[18px] font-bold text-neutral-900 mb-6">Estate Documents</h2>
                {(property.documents ?? []).length === 0 ? (
                  <p className="text-neutral-400 text-[14px]">Documents will be available soon.</p>
                ) : (
                  <div className="space-y-2">
                    {(property.documents ?? []).map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-100 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                            <FileText className="size-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-neutral-800 text-[14px]">
                              {doc.custom_document_name || doc.document_type_display}
                            </p>
                            <p className="text-[11px] text-neutral-400">{doc.document_type_display}</p>
                          </div>
                        </div>
                        {doc.document_file && (
                          <a href={imgSrc(doc.document_file)} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 text-[12px] font-semibold text-emerald-600 hover:text-emerald-700">
                            <Download className="size-3.5" /> Download
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </FadeIn>
            )}

            {/* Location */}
            {tab === "location" && (
              <FadeIn>
                <h2 className="text-[18px] font-bold text-neutral-900 mb-6">Location</h2>
                {property.location ? (
                  <div className="space-y-4">
                    {property.location.latitude && property.location.longitude && (
                      <div className="w-full h-72 rounded-2xl overflow-hidden border border-neutral-100">
                        <iframe
                          src={`https://maps.google.com/maps?q=${property.location.latitude},${property.location.longitude}&output=embed&z=15`}
                          className="w-full h-full border-0" loading="lazy" />
                      </div>
                    )}
                    <div className="space-y-2 text-[14px]">
                      <p className="text-neutral-700"><span className="font-semibold">Address:</span> {property.location.address}</p>
                      {property.location.city && <p className="text-neutral-700"><span className="font-semibold">City:</span> {property.location.city}</p>}
                      {property.location.state && <p className="text-neutral-700"><span className="font-semibold">State:</span> {property.location.state}</p>}
                      {property.location.nearest_landmark && (
                        <p className="text-neutral-700"><span className="font-semibold">Nearest Landmark:</span> {property.location.nearest_landmark}</p>
                      )}
                    </div>
                    {property.location.latitude && property.location.longitude && (
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${property.location.latitude},${property.location.longitude}`}
                        target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[13px] transition-colors">
                        <MapPin className="size-4" /> Get Directions
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-neutral-400 text-[14px]">Location details coming soon.</p>
                )}
              </FadeIn>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mid-page CTA */}
      <FadeIn className="bg-emerald-700 py-12 px-4 text-center text-white">
        <h2 className="text-2xl font-bold mb-2">Ready to own land at {property.name}?</h2>
        <p className="text-emerald-200 text-[14px] mb-6">Join hundreds of property owners. Start with a flexible payment plan.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={() => handleBuy()}
            className="px-8 py-3 rounded-xl bg-white text-emerald-700 font-bold text-[14px] hover:bg-emerald-50 transition-colors">
            Buy Property
          </button>
          <button onClick={() => setShowInspection(true)}
            className="px-8 py-3 rounded-xl border-2 border-emerald-400 text-white font-bold text-[14px] hover:bg-emerald-600 transition-colors">
            Request Inspection
          </button>
        </div>
      </FadeIn>

      {/* Bottom CTA */}
      {/* <div className="bg-neutral-900 py-12 px-4 text-center text-white">
        <h2 className="text-xl font-bold mb-2">Ready to own land at {property.name}?</h2>
        <p className="text-neutral-400 text-[14px] mb-6">Join hundreds of property owners. Start with a flexible payment plan.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={() => handleBuy()}
            className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[14px] transition-colors">
            Buy Property
          </button>
          <button onClick={() => setShowInspection(true)}
            className="px-8 py-3 rounded-xl border-2 border-neutral-600 text-white font-bold text-[14px] hover:border-neutral-400 transition-colors">
            Request Inspection
          </button>
        </div>
      </div> */}

      {/* Modals */}
      <AnimatePresence>
        {showInspection && workspaceSlug && (
          <InspectionModal property={property} workspaceSlug={workspaceSlug} onClose={() => setShowInspection(false)} />
        )}
        {showBuy && (
          <BuyFlow property={property} workspaceSlug={workspaceSlug!} initialPlanId={buyPlanId} onClose={() => { setShowBuy(false); setBuyPlanId(undefined); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

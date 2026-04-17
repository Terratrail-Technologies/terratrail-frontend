import { useState, useEffect, useRef, useId } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../../services/api";
import { FormInput } from "../components/FormInput";
import s from "../styles/onboarding.module.css";

// ─── Icons ─────────────────────────────────────────────────────────────────────

const BuildingIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const SlidersIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
    <circle cx="8" cy="6" r="2" fill="currentColor" stroke="none"/>
    <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/>
    <circle cx="10" cy="18" r="2" fill="currentColor" stroke="none"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="20 6 9 17 4 12"/>
  </svg>
);

const XCircleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const SpinnerMini = () => (
  <span style={{ display:"inline-flex", width:14, height:14, border:"2px solid #e2e8f0", borderTopColor:"#1c2268", borderRadius:"50%", animation:"spin 0.6s linear infinite", flexShrink:0 }} />
);

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

const TIMEZONES = [
  "Africa/Lagos", "Africa/Accra", "Africa/Nairobi", "Africa/Johannesburg",
  "Africa/Cairo", "Africa/Casablanca", "Europe/London", "Europe/Paris",
  "America/New_York", "America/Chicago", "America/Los_Angeles",
  "Asia/Dubai", "Asia/London",
];

const STEPS = ["Foundation", "Preferences"];

const slideVariants = {
  enter:  (dir: number) => ({ opacity: 0, x: dir > 0 ? 36 : -36 }),
  center: { opacity: 1, x: 0 },
  exit:   (dir: number) => ({ opacity: 0, x: dir > 0 ? -36 : 36 }),
};

// ─── Slug status types ─────────────────────────────────────────────────────────

type SlugStatus = "idle" | "checking" | "available" | "taken";

// ─── Step 1 form ───────────────────────────────────────────────────────────────

interface Step1Form {
  name: string;
  slug: string;
  timezone: string;
  region: string;
  support_email: string;
  support_whatsapp: string;
}

// ─── Step 2 form ───────────────────────────────────────────────────────────────

interface Step2Form {
  // Workspace model (PATCH /workspaces/detail/)
  initial_payment_as_first_month: boolean;
  create_estate_public_pages: boolean;
  // WorkspaceSettings model (PATCH /workspaces/settings/)
  notify_admin_on_new_booking: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function WorkspaceSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [loading, setLoading] = useState(false);

  // ── Slug state ───────────────────────────────────────────────────────────────
  const [slugStatus, setSlugStatus]         = useState<SlugStatus>("idle");
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);
  const [slugEdited, setSlugEdited]           = useState(false); // user manually typed slug
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form1 = useForm<Step1Form>({
    defaultValues: { timezone: "Africa/Lagos", region: "Nigeria" },
  });
  const form2 = useForm<Step2Form>({
    defaultValues: { initial_payment_as_first_month: true, create_estate_public_pages: false, notify_admin_on_new_booking: true },
  });

  const watchedName = form1.watch("name") ?? "";
  const watchedSlug = form1.watch("slug") ?? "";

  // Auto-populate slug from name (only when user hasn't manually edited slug)
  useEffect(() => {
    if (!slugEdited && watchedName) {
      const generated = toSlug(watchedName);
      form1.setValue("slug", generated, { shouldValidate: false });
    }
  }, [watchedName, slugEdited]);

  // Debounced slug uniqueness check
  useEffect(() => {
    if (!watchedSlug || watchedSlug.length < 2) {
      setSlugStatus("idle");
      setSlugSuggestions([]);
      return;
    }
    setSlugStatus("checking");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await api.workspaces.checkSlug(watchedSlug);
        setSlugStatus(result.available ? "available" : "taken");
        setSlugSuggestions(result.suggestions ?? []);
      } catch {
        setSlugStatus("idle");
      }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [watchedSlug]);

  // ── Navigation ───────────────────────────────────────────────────────────────

  const goNext = () => { setDir(1); setStep((s) => s + 1); };
  const goPrev = () => { setDir(-1); setStep((s) => s - 1); };

  // ── Step 1 submit: create workspace ─────────────────────────────────────────

  const submitStep1 = form1.handleSubmit(async (data) => {
    if (slugStatus === "taken") {
      form1.setError("slug", { message: "This slug is already taken — pick another or use a suggestion below." });
      return;
    }
    if (slugStatus === "checking") {
      toast.error("Please wait for slug availability check to finish.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.workspaces.create({
        name: data.name,
        slug: data.slug || undefined,
        timezone: data.timezone || undefined,
        region: data.region || undefined,
        support_email: data.support_email || undefined,
        support_whatsapp: data.support_whatsapp || undefined,
      });
      const slug = res?.slug ?? toSlug(data.name);
      localStorage.setItem("tt_workspace_slug", slug);
      toast.success("Workspace created!");
      goNext();
    } catch (err: any) {
      toast.error(err.message || "Could not create workspace. Please try again.");
    } finally {
      setLoading(false);
    }
  });

  // ── Step 2 submit: preferences → select plan ────────────────────────────────

  const submitStep2 = form2.handleSubmit(async (data) => {
    setLoading(true);
    try {
      // Workspace model fields → PATCH /workspaces/detail/
      await api.workspaces.updateDetail({
        initial_payment_as_first_month: data.initial_payment_as_first_month,
        create_estate_public_pages: data.create_estate_public_pages,
      });
    } catch { /* non-fatal */ }
    try {
      // WorkspaceSettings model fields → PATCH /workspaces/settings/
      await api.workspaces.updateSettings({
        notify_admin_on_new_booking: data.notify_admin_on_new_booking,
      });
    } catch { /* non-fatal */ }
    setLoading(false);
    navigate("/auth/select-plan");
  });

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Stepper */}
      <div className={s.stepper}>
        {STEPS.map((_, i) => (
          <div key={i} className={s.stepItem}>
            <div className={[s.stepDot, i === step ? s.stepDotActive : "", i < step ? s.stepDotDone : ""].join(" ")}>
              {i < step ? <CheckIcon /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={[s.stepLine, i < step ? s.stepLineDone : ""].join(" ")} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" custom={dir}>
        {/* ── Step 1: Foundation ──────────────────────────────────────────────── */}
        {step === 0 && (
          <motion.div key="step0" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22, ease: [0.4,0,0.2,1] }}>
            <div className={s.wsHero}><BuildingIcon /></div>
            <h1 className={s.heading}>Set up your workspace</h1>
            <p className={s.subtext}>Your company's digital office on TerraTrail.</p>

            <form className={s.form} onSubmit={submitStep1} noValidate>
              {/* Company name */}
              <FormInput
                label="Company Name"
                placeholder="e.g. Tehillah Estates"
                autoComplete="organization"
                error={form1.formState.errors.name?.message}
                {...form1.register("name", { required: "Company name is required" })}
              />

              {/* Slug field with live check */}
              <div className={s.fieldGroup}>
                <label className={s.label}>Workspace URL Slug</label>
                <div style={{ position: "relative" }}>
                  <div className={s.slugPreview} style={{ borderColor: slugStatus === "taken" ? "#ef4444" : slugStatus === "available" ? "#16a34a" : undefined }}>
                    <span className={s.slugBase}>terratrail.app/</span>
                    <input
                      style={{ flex: 1, border: "none", background: "transparent", outline: "none", padding: "0 8px", fontSize: 13, fontWeight: 600, color: "#1c2268", fontFamily: "Courier New, monospace" }}
                      placeholder="your-company"
                      {...form1.register("slug", {
                        required: "Slug is required",
                        pattern: { value: /^[a-z0-9-]+$/, message: "Only lowercase letters, numbers and hyphens" },
                        minLength: { value: 2, message: "Minimum 2 characters" },
                      })}
                      onChange={(e) => {
                        setSlugEdited(true);
                        form1.setValue("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""), { shouldValidate: true });
                      }}
                    />
                    <span style={{ paddingRight: 10, display: "flex", alignItems: "center" }}>
                      {slugStatus === "checking"   && <SpinnerMini />}
                      {slugStatus === "available"  && <CheckCircleIcon />}
                      {slugStatus === "taken"      && <XCircleIcon />}
                    </span>
                  </div>
                </div>

                {/* Status messages */}
                {slugStatus === "available" && (
                  <span style={{ fontSize: 11, color: "#16a34a", marginTop: 3, display: "block" }}>✓ Available</span>
                )}
                {slugStatus === "taken" && (
                  <span style={{ fontSize: 11, color: "#ef4444", marginTop: 3, display: "block" }}>
                    Already taken.{" "}
                    {slugSuggestions.length > 0 && (
                      <>
                        Try:{" "}
                        {slugSuggestions.map((sg, i) => (
                          <button key={i} type="button"
                            style={{ background: "none", border: "none", padding: "0 4px 0 0", color: "#1c2268", fontWeight: 700, cursor: "pointer", fontSize: 11, fontFamily: "Courier New, monospace", textDecoration: "underline" }}
                            onClick={() => { setSlugEdited(true); form1.setValue("slug", sg, { shouldValidate: true }); }}
                          >{sg}</button>
                        ))}
                      </>
                    )}
                  </span>
                )}
                {form1.formState.errors.slug && (
                  <span className={s.errorMsg} role="alert">{form1.formState.errors.slug.message}</span>
                )}
              </div>

              {/* Timezone + Region side-by-side */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className={s.fieldGroup}>
                  <label className={s.label}>Timezone</label>
                  <select
                    className={s.input}
                    style={{ height: 42, appearance: "auto" }}
                    {...form1.register("timezone")}
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
                <FormInput
                  label="Region"
                  placeholder="Nigeria"
                  {...form1.register("region")}
                />
              </div>

              {/* Contact info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <FormInput
                  label="Support Email"
                  type="email"
                  placeholder="support@company.com"
                  {...form1.register("support_email")}
                />
                <FormInput
                  label="WhatsApp"
                  type="tel"
                  placeholder="+234 800 000 0000"
                  {...form1.register("support_whatsapp")}
                />
              </div>

              <button type="submit" className={s.btn} disabled={loading || slugStatus === "checking" || slugStatus === "taken"}>
                <span className={s.btnInner}>
                  {loading && <span className={s.spinner} />}
                  {loading ? "Creating workspace…" : "Create Workspace →"}
                </span>
              </button>
            </form>
          </motion.div>
        )}

        {/* ── Step 2: Preferences ─────────────────────────────────────────────── */}
        {step === 1 && (
          <motion.div key="step1" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22, ease: [0.4,0,0.2,1] }}>
            <div className={s.wsHero} style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)" }}>
              <SlidersIcon />
            </div>
            <h1 className={s.heading}>Configure preferences</h1>
            <p className={s.subtext}>Tailor how TerraTrail works for your business. You can change these anytime.</p>

            <form className={s.form} onSubmit={submitStep2} noValidate>
              <ToggleRow label="First payment = first month" desc="Count the initial payment as the first installment month." fieldId="initial_payment_as_first_month" register={form2.register} />
              <ToggleRow label="Public estate pages" desc="Enable public-facing, SEO-optimised property pages for customers." fieldId="create_estate_public_pages" register={form2.register} />
              <ToggleRow label="Notify on new booking" desc="Receive email alerts when a customer books a property." fieldId="notify_admin_on_new_booking" register={form2.register} />

              <button type="submit" className={s.btn} disabled={loading} style={{ marginTop: 8 }}>
                <span className={s.btnInner}>
                  {loading && <span className={s.spinner} />}
                  {loading ? "Saving…" : "Continue to Plans →"}
                </span>
              </button>
              <button type="button" className={s.btnSecondary} onClick={() => navigate("/auth/select-plan")}>
                Skip for now
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {step > 0 && (
        <button type="button" className={s.backLink} onClick={goPrev} style={{ marginTop: 14, display: "flex" }}>
          ← Back
        </button>
      )}
    </>
  );
}

// ─── ToggleRow ──────────────────────────────────────────────────────────────────

function ToggleRow({ label, desc, fieldId, register }: { label: string; desc: string; fieldId: string; register: any }) {
  const uid = useId();
  return (
    <div className={s.toggleRow}>
      <div className={s.toggleInfo}>
        <span className={s.toggleTitle}>{label}</span>
        <span className={s.toggleDesc}>{desc}</span>
      </div>
      <label className={s.toggle}>
        <input type="checkbox" id={uid} {...register(fieldId)} />
        <span className={s.toggleTrack} />
      </label>
    </div>
  );
}

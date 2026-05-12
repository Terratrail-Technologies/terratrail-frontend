import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormInput } from "../components/FormInput";
import { PasswordInput } from "../components/PasswordInput";
import { useAuth } from "../../hooks/useAuth";
import s from "../styles/onboarding.module.css";

interface SignUpForm {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

const FEATURES = [
  { title: "Multi-property management", desc: "Track estates, units, and pricing plans in one place." },
  { title: "Installment & payment tracking", desc: "Automated schedules, receipts, and overdue alerts." },
  { title: "Sales rep commissions", desc: "Tiered commission tracking with one-click payouts." },
  { title: "Customer self-service portal", desc: "Customers view plans, pay, and track progress online." },
  { title: "Site inspection scheduling", desc: "Public booking page, attendance tracking, and follow-ups." },
];

const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

export function SignUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite") ?? "";
  const prefillEmail = searchParams.get("email") ?? "";
  const { register: authRegister } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<SignUpForm>({
    defaultValues: { email: prefillEmail },
  });

  const onSubmit = async (data: SignUpForm) => {
    setLoading(true);
    setFormError("");
    try {
      await authRegister({
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        email: data.email,
        password: data.password,
      });
      toast.success("Account created! Please verify your email.");
      navigate("/auth/verify", {
        state: { email: data.email, flow: "signup", inviteToken: inviteToken || undefined },
      });
    } catch (err: any) {
      setFormError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.signupSplit}>
      {/* ── Left panel ─────────────────────────────────────────── */}
      <div className={s.signupLeft}>
        <div className={s.logoWrap} style={{ marginBottom: 28 }}>
          <div className={s.logoIcon}>
            <img
              src="/logo.png"
              alt="Terratrail"
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 7 }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                (e.currentTarget.parentElement as HTMLElement).innerHTML =
                  '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 5h12M9 5v8" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>';
              }}
            />
          </div>
          <span className={s.logoText} style={{ color: "#fff" }}>Terratrail</span>
        </div>

        <p style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: "0 0 6px", lineHeight: 1.25, letterSpacing: "-0.4px", fontFamily: "inherit" }}>
          Real Estate Management,<br />Simplified.
        </p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: "0 0 28px", lineHeight: 1.6, fontFamily: "inherit" }}>
          Built for Nigerian real estate companies managing properties, subscriptions, and field teams.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#6b8fd4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0, fontFamily: "inherit" }}>{f.title}</p>
                <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)", margin: "1px 0 0", fontFamily: "inherit", lineHeight: 1.45 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "auto", paddingTop: 28, borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 11.5, color: "rgba(255,255,255,0.4)", fontFamily: "inherit" }}>
          Trusted by real estate companies across Nigeria
        </div>
      </div>

      {/* ── Right panel — form ─────────────────────────────────── */}
      <div className={s.signupRight}>
        <h1 className={s.heading}>Create your account</h1>
        <p className={s.subtext}>Join Terratrail to manage your estate portfolio.</p>

        <form className={s.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={s.grid2}>
            <FormInput
              label="First Name"
              placeholder="Praise"
              autoComplete="given-name"
              error={errors.first_name?.message}
              {...register("first_name", { required: "Required" })}
            />
            <FormInput
              label="Last Name"
              placeholder="Adebayo"
              autoComplete="family-name"
              error={errors.last_name?.message}
              {...register("last_name", { required: "Required" })}
            />
          </div>

          <FormInput
            label="Work / Personal Email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email", {
              required: "Email is required",
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
            })}
          />

          <PasswordInput
            label="Password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password", {
              required: "Password is required",
              minLength: { value: 8, message: "Minimum 8 characters" },
            })}
          />

          {formError && (
            <div style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 6,
              padding: "9px 12px",
              fontSize: 12.5,
              color: "#dc2626",
              fontWeight: 600,
              fontFamily: "inherit",
            }}>
              {formError}
            </div>
          )}

          <button type="submit" className={s.btn} disabled={loading}>
            <span className={s.btnInner}>
              {loading && <span className={s.spinner} />}
              {loading ? "Creating account…" : "Create My Account"}
            </span>
          </button>
        </form>

        <p className={s.footer}>
          Already have an account?{" "}
          <button type="button" className={s.footerLink} onClick={() => navigate("/auth/sign-in")}>
            Log in here
          </button>
        </p>

        <p className={s.termsText}>
          By signing up, you agree to our{" "}
          <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>{" "}
          and{" "}
          <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
        </p>

        <div className={s.securityBadge}>
          <LockIcon />
          Data encrypted with bank-grade security
        </div>
      </div>
    </div>
  );
}



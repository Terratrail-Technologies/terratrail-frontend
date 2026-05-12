import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormInput } from "../components/FormInput";
import { PasswordInput } from "../components/PasswordInput";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../services/api";
import s from "../styles/onboarding.module.css";

interface SignInForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

const FEATURES = [
  { title: "Multi-property management", desc: "Track estates, units, and pricing plans in one place." },
  { title: "Installment & payment tracking", desc: "Automated schedules, receipts, and overdue alerts." },
  { title: "Sales rep commissions", desc: "Tiered commission tracking with one-click payouts." },
  { title: "Customer self-service portal", desc: "Customers view plans, pay, and track progress online." },
  { title: "Site inspection scheduling", desc: "Public booking page, attendance tracking, and follow-ups." },
];

export function SignIn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextUrl = searchParams.get("next") ?? "/";
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<SignInForm>({
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data: SignInForm) => {
    setLoading(true);
    setFormError("");
    try {
      await login({ email: data.email, password: data.password });
      try {
        const workspaces: any[] = await api.workspaces.mine();
        if (Array.isArray(workspaces) && workspaces.length === 0) {
          // No workspace yet — resume onboarding setup
          navigate("/auth/workspace-setup", { replace: true });
          return;
        }
        if (Array.isArray(workspaces) && workspaces.length > 1) {
          toast.success("Welcome back!");
          navigate("/auth/select-workspace", { replace: true });
          return;
        }
        if (Array.isArray(workspaces) && workspaces.length === 1) {
          localStorage.setItem("tt_workspace_slug", workspaces[0].slug);
        }
      } catch {
        // mine() not critical — proceed normally
      }
      toast.success("Welcome back!");
      navigate(nextUrl, { replace: true });
    } catch (err: any) {
      if (err.message?.includes("OTP")) {
        navigate("/auth/verify", { state: { email: data.email, flow: "signin" } });
      } else {
        setFormError(err.message || "Invalid email or password.");
      }
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
                  <path d="M2 6l3 3 5-5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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
        <h1 className={s.heading}>Welcome to Terratrail</h1>
        <p className={s.subtext}>Log in to manage your estate portfolio.</p>

        <form className={s.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormInput
            label="Email"
            type="email"
            placeholder="enter your work email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email", {
              required: "Email is required",
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
            })}
          />

          <PasswordInput
            label="Password"
            placeholder="enter your password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password", {
              required: "Password is required",
              minLength: { value: 6, message: "Minimum 6 characters" },
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

          <div className={s.rememberRow}>
            <label className={s.checkLabel}>
              <input type="checkbox" className={s.checkbox} {...register("rememberMe")} />
              Remember me
            </label>
            <button
              type="button"
              className={s.forgotLink}
              onClick={() => navigate("/auth/forgot-password")}
            >
              Forgotten Password?
            </button>
          </div>

          <button type="submit" className={s.btn} disabled={loading}>
            <span className={s.btnInner}>
              {loading && <span className={s.spinner} />}
              {loading ? "Signing in…" : "Login to Dashboard"}
            </span>
          </button>
        </form>

        <p className={s.footer}>
          New to Terratrail?{" "}
          <button
            type="button"
            className={s.footerLink}
            onClick={() => navigate("/auth/sign-up")}
          >
            Create a workspace
          </button>
        </p>
      </div>
    </div>
  );
}


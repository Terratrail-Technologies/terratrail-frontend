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
      // Check how many workspaces this user belongs to
      try {
        const workspaces: any[] = await api.workspaces.mine();
        if (Array.isArray(workspaces) && workspaces.length > 1) {
          toast.success("Welcome back!");
          navigate("/auth/select-workspace", { replace: true });
          return;
        }
        if (Array.isArray(workspaces) && workspaces.length === 1) {
          localStorage.setItem("tt_workspace_slug", workspaces[0].slug);
        }
      } catch {
        // mine() not critical — proceed normally, workspace resolves from localStorage
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
    <>
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
    </>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormInput } from "../components/FormInput";
import { PasswordInput } from "../components/PasswordInput";
import s from "../styles/onboarding.module.css";

interface SignUpForm {
  fullName: string;
  email: string;
  companyName: string;
  password: string;
  rememberMe: boolean;
}

const GoogleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 48 48" fill="none">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-3.59-13.46-8.83l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

export function SignUp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignUpForm>({
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data: SignUpForm) => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1100));
      console.log("Sign up payload:", data);
      toast.success("Workspace created! Please verify your email.");
      navigate("/auth/verify", { state: { email: data.email, flow: "signup" } });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className={s.heading}>Welcome to TerraTrail</h1>
      <p className={s.subtext}>Log in to manage your estate portfolio.</p>

      <form className={s.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormInput
          label="Full Name"
          placeholder="Enter your full name"
          autoComplete="name"
          error={errors.fullName?.message}
          {...register("fullName", { required: "Full name is required" })}
        />

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

        <FormInput
          label="Company Name"
          placeholder="Enter your company's name"
          autoComplete="organization"
          error={errors.companyName?.message}
          {...register("companyName", { required: "Company name is required" })}
        />

        <PasswordInput
          label="Create Password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password", {
            required: "Password is required",
            minLength: { value: 8, message: "Minimum 8 characters" },
          })}
        />

        {/* Remember me + Forgot */}
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
            {loading ? "Creating workspace…" : "Create My Workspace"}
          </span>
        </button>

        <div className={s.divider}>Or</div>

        <button
          type="button"
          className={s.googleBtn}
          onClick={() => toast.info("Google sign-in coming soon.")}
        >
          <GoogleIcon />
          Continue with Google
        </button>
      </form>

      <p className={s.footer}>
        Already have an account?{" "}
        <button
          type="button"
          className={s.footerLink}
          onClick={() => navigate("/auth/sign-in")}
        >
          Log in here
        </button>
      </p>

      <p className={s.termsText}>
        By signing up, you agree to our{" "}
        <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a> and{" "}
        <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>.
      </p>

      <div className={s.securityBadge}>
        <LockIcon />
        Data encrypted with bank grade security
      </div>
    </>
  );
}

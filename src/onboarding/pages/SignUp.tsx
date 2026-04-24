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
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite") ?? "";
  const prefillEmail = searchParams.get("email") ?? "";
  const { register: authRegister } = useAuth();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignUpForm>({
    defaultValues: { email: prefillEmail },
  });

  const onSubmit = async (data: SignUpForm) => {
    setLoading(true);
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
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className={s.heading}>Create your account</h1>
      <p className={s.subtext}>Join TerraTrail to manage your estate portfolio.</p>

      <form className={s.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Name row */}
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
          label="Work/Personal Email"
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

        <button type="submit" className={s.btn} disabled={loading}>
          <span className={s.btnInner}>
            {loading && <span className={s.spinner} />}
            {loading ? "Creating account…" : "Create My Account"}
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
        <button type="button" className={s.footerLink} onClick={() => navigate("/auth/sign-in")}>
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
        Data encrypted with bank-grade security
      </div>
    </>
  );
}

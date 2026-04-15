import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormInput } from "../components/FormInput";
import { PasswordInput } from "../components/PasswordInput";
import s from "../styles/onboarding.module.css";

interface SignInForm {
  email: string;
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

export function SignIn() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignInForm>({
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data: SignInForm) => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1100));
      console.log("Sign in payload:", data);
      toast.success("Welcome back!");
      navigate("/onboarding/verify", { state: { email: data.email, flow: "signin" } });
    } catch {
      toast.error("Invalid credentials. Please try again.");
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

        {/* Remember me + Forgot password */}
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
        New to TerraTrail?{" "}
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

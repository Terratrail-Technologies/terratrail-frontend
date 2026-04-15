import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormInput } from "../components/FormInput";
import s from "../styles/onboarding.module.css";

interface ForgotForm {
  email: string;
}

const BackArrow = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);

import { useAuth } from "../../hooks/useAuth";

export function ForgotPassword() {
  const navigate = useNavigate();
  const { otpRequest } = useAuth();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>();

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true);
    try {
      await otpRequest({ email: data.email });
      toast.success("Verification code sent! Check your inbox.");
      navigate("/auth/verify", { state: { email: data.email, flow: "reset" } });
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className={s.heading}>Forgot Password?</h1>
      <p className={s.subtext}>
        Enter your email address and we&apos;ll send you a link to reset your
        password.
      </p>

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

        <button type="submit" className={s.btn} disabled={loading}>
          <span className={s.btnInner}>
            {loading && <span className={s.spinner} />}
            {loading ? "Sending…" : "Send Reset Link"}
          </span>
        </button>
      </form>

      <p className={s.footer}>
        <button
          type="button"
          className={s.backLink}
          onClick={() => navigate("/auth/sign-in")}
          style={{ margin: "12px auto 0", display: "flex" }}
        >
          <BackArrow /> Back to Login
        </button>
      </p>
    </>
  );
}

import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import s from "../styles/onboarding.module.css";

interface VerifyForm {
  code: string;
}

import { useAuth } from "../../hooks/useAuth";

export function VerifyIdentity() {
  const navigate = useNavigate();
  const location = useLocation();
  const { otpVerify, otpRequest } = useAuth();
  const state = location.state as { email?: string; flow?: string } | null;
  const email = state?.email ?? "";
  const flow  = state?.flow  ?? "signin";

  const [loading, setLoading]             = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { register, handleSubmit, formState: { errors } } = useForm<VerifyForm>();

  const onSubmit = async (data: VerifyForm) => {
    if (!email) {
      toast.error("Missing email. Please go back and try again.");
      return;
    }
    setLoading(true);
    try {
      await otpVerify({ email, code: data.code });
      toast.success("Identity verified!");
      if (flow === "reset") {
        navigate("/auth/reset-password", { state: { email } });
      } else if (flow === "signup") {
        navigate("/auth/workspace-setup", { state: { email } });
      } else {
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    try {
      await otpRequest({ email });
      toast.success("A new code has been sent.");
      setResendCooldown(30);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || "Failed to resend code.");
    }
  };

  return (
    <>
      <h1 className={s.heading}>Verify Your Identity</h1>
      <p className={s.subtext}>
        We&apos;ve sent a 6-digit code to{" "}
        <strong style={{ color: "#0f172a" }}>{email}</strong>. Enter it below
        to continue.
      </p>

      <form className={s.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={s.fieldGroup}>
          <label htmlFor="code" className={s.label}>
            Enter verification code
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="______"
            autoComplete="one-time-code"
            className={[s.otpSingle, errors.code ? s.inputError : ""].join(" ")}
            {...register("code", {
              required: "Verification code is required",
              pattern: { value: /^\d{6}$/, message: "Enter the 6-digit code" },
            })}
          />
          {errors.code && (
            <span className={s.errorMsg} role="alert">{errors.code.message}</span>
          )}
        </div>

        <div className={s.resendRow}>
          Didn&apos;t receive the code?{" "}
          <button
            type="button"
            className={s.footerLink}
            onClick={handleResend}
            disabled={resendCooldown > 0}
            style={resendCooldown > 0 ? { opacity: 0.5, cursor: "default" } : {}}
          >
            {resendCooldown > 0 ? `Resend Email (${resendCooldown}s)` : "Resend Email"}
          </button>
        </div>

        <button type="submit" className={s.btn} disabled={loading}>
          <span className={s.btnInner}>
            {loading && <span className={s.spinner} />}
            {loading ? "Verifying…" : "Verify & Proceed"}
          </span>
        </button>
      </form>
    </>
  );
}

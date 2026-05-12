import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PasswordInput } from "../components/PasswordInput";
import s from "../styles/onboarding.module.css";
import { useAuth } from "../../hooks/useAuth";

interface NewPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

export function CreateNewPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const { register, handleSubmit, watch, formState: { errors } } = useForm<NewPasswordForm>();
  const newPassword = watch("newPassword");

  const onSubmit = async (data: NewPasswordForm) => {
    setLoading(true);
    setFormError("");
    try {
      await resetPassword({
        password: data.newPassword,
        email: (location.state as any)?.email,
        otp: (location.state as any)?.otp,
      });
      toast.success("Password updated successfully! You can now log in.");
      navigate("/auth/sign-in");
    } catch (err: any) {
      setFormError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className={s.heading}>Create New Password</h1>
      <p className={s.subtext}>
        Your new password must be different from your previous password.
      </p>

      <form className={s.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <PasswordInput
          label="New Password"
          placeholder="Enter at least 8 characters"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register("newPassword", {
            required: "Password is required",
            minLength: { value: 8, message: "Minimum 8 characters" },
          })}
        />

        <PasswordInput
          label="Confirm New Password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword", {
            required: "Please confirm your password",
            validate: (v) => v === newPassword || "Passwords do not match",
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
            {loading ? "Updating…" : "Update Password"}
          </span>
        </button>
      </form>
    </>
  );
}


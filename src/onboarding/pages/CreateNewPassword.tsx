import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PasswordInput } from "../components/PasswordInput";
import s from "../styles/onboarding.module.css";

interface NewPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

export function CreateNewPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<NewPasswordForm>();
  const newPassword = watch("newPassword");

  const onSubmit = async (_data: NewPasswordForm) => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      toast.success("Password updated successfully! You can now log in.");
      navigate("/auth/sign-in");
    } catch {
      toast.error("Something went wrong. Please try again.");
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

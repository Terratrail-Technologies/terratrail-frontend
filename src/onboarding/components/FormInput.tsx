import React from "react";
import s from "../styles/onboarding.module.css";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, id, className, ...rest }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className={s.fieldGroup}>
        <label htmlFor={inputId} className={s.label}>
          {label}
        </label>
        <input
          id={inputId}
          ref={ref}
          className={[s.input, error ? s.inputError : "", className ?? ""].join(" ")}
          {...rest}
        />
        {error && <span className={s.errorMsg} role="alert">{error}</span>}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

/**
 * PasswordInput — password field with visibility toggle.
 * Wraps the base Input component and adds show/hide functionality.
 *
 * Props: same as Input, minus `type` (managed internally).
 */

import { useState } from "react";

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M1.5 8C1.5 8 3.5 3.5 8 3.5S14.5 8 14.5 8 12.5 12.5 8 12.5 1.5 8 1.5 8z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M2 2l12 12M6.5 6.6A2 2 0 0 0 9.4 9.5M4.5 4.6C2.8 5.7 1.5 8 1.5 8S3.5 12.5 8 12.5c1.3 0 2.5-.4 3.5-1M7 3.6C7.3 3.5 7.7 3.5 8 3.5c4.5 0 6.5 4.5 6.5 4.5s-.5 1.2-1.5 2.3"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function PasswordInput({
  id,
  label,
  error,
  helperText,
  disabled = false,
  required = false,
  className = "",
  inputClassName = "",
  ...rest
}) {
  const [visible, setVisible] = useState(false);
  const hasError = Boolean(error);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className={`text-xs font-medium ${
            hasError ? "text-red-400/80" : "text-white/50"
          }`}
        >
          {label}
          {required && (
            <span className="ml-1 text-white/30" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          disabled={disabled}
          required={required}
          aria-invalid={hasError}
          aria-describedby={
            hasError
              ? `${id}-error`
              : helperText
              ? `${id}-helper`
              : undefined
          }
          className={`
            w-full px-3.5 py-2.5 pr-10 text-sm text-white
            bg-white/[0.04] rounded-lg
            border outline-none
            transition-all duration-150
            placeholder:text-white/20
            disabled:opacity-40 disabled:cursor-not-allowed
            ${
              hasError
                ? "border-red-500/50 focus:border-red-500/80 focus:ring-2 focus:ring-red-500/20"
                : "border-white/[0.1] focus:border-white/30 focus:ring-2 focus:ring-white/[0.08]"
            }
            ${inputClassName}
          `}
          {...rest}
        />

        {/* Toggle button */}
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
          className="
            absolute right-3 top-1/2 -translate-y-1/2
            text-white/30 hover:text-white/60
            transition-colors duration-150
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30
            rounded-sm
            disabled:pointer-events-none
          "
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>

      {/* Error or helper text */}
      {hasError ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-center gap-1 text-xs text-red-400/80"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
            <path
              d="M6 4v2.5M6 8v.5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
          {error}
        </p>
      ) : helperText ? (
        <p id={`${id}-helper`} className="text-xs text-white/30">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

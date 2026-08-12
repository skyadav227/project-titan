/**
 * Input — reusable, accessible text input component.
 *
 * Props:
 *   id          : string  (required for label association)
 *   label       : string
 *   error       : string  (error message; triggers error state)
 *   helperText  : string  (shown below input when no error)
 *   disabled    : boolean
 *   required    : boolean
 *   className   : string  (extra classes on the wrapper)
 *   inputClassName : string (extra classes on the <input> itself)
 *   ...rest     : any other <input> props
 */

export default function Input({
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

      {/* Input */}
      <input
        id={id}
        name={id}
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
          w-full px-3.5 py-2.5 text-sm text-white
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
        <p
          id={`${id}-helper`}
          className="text-xs text-white/30"
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

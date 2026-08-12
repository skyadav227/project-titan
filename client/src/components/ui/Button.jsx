/**
 * Button — reusable, accessible button component.
 *
 * Props:
 *   variant   : "primary" | "secondary" | "ghost"   (default: "primary")
 *   size      : "sm" | "md" | "lg"                  (default: "md")
 *   isLoading : boolean                              (default: false)
 *   disabled  : boolean                              (default: false)
 *   fullWidth : boolean                              (default: false)
 *   type      : "button" | "submit" | "reset"        (default: "button")
 *   children  : ReactNode
 *   className : string (extra classes)
 *   ...rest   : any other <button> props
 */

const VARIANT_STYLES = {
  primary: `
    text-black bg-white
    hover:bg-white/90
    disabled:bg-white/30 disabled:text-black/40
    focus-visible:ring-white/60
  `,
  secondary: `
    text-white/70 border border-white/[0.12] bg-transparent
    hover:border-white/25 hover:text-white hover:bg-white/[0.04]
    disabled:border-white/[0.06] disabled:text-white/25
    focus-visible:ring-white/40
  `,
  ghost: `
    text-white/50 bg-transparent
    hover:text-white hover:bg-white/[0.04]
    disabled:text-white/20
    focus-visible:ring-white/30
  `,
};

const SIZE_STYLES = {
  sm: "px-4 py-2 text-xs rounded-lg gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-lg gap-2",
  lg: "px-6 py-3 text-base rounded-xl gap-2",
};

function Spinner({ size }) {
  const dim = size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4";
  return (
    <svg
      className={`${dim} animate-spin flex-shrink-0`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  fullWidth = false,
  type = "button",
  children,
  className = "",
  ...rest
}) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={isLoading}
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-150 select-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0
        disabled:cursor-not-allowed
        ${!isDisabled ? "active:scale-[0.98] hover:scale-[1.02]" : ""}
        ${VARIANT_STYLES[variant]}
        ${SIZE_STYLES[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...rest}
    >
      {isLoading && <Spinner size={size} />}
      <span className={isLoading ? "opacity-70" : ""}>{children}</span>
    </button>
  );
}

import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";

/* ── Validators ── */
const validate = {
  fullName: (v) => {
    if (!v.trim()) return "Full name is required.";
    if (v.trim().length < 2) return "Name must be at least 2 characters.";
    return "";
  },
  email: (v) => {
    if (!v.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address.";
    return "";
  },
  password: (v) => {
    if (!v) return "Password is required.";
    if (v.length < 8) return "Must be at least 8 characters.";
    if (!/[A-Za-z]/.test(v) || !/[0-9]/.test(v)) return "Include at least one letter and one number.";
    return "";
  },
  confirmPassword: (v, pw) => {
    if (!v) return "Please confirm your password.";
    if (v !== pw) return "Passwords do not match.";
    return "";
  },
};

/* ── Spinner ── */
function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ── Field wrapper ── */
function Field({ id, label, error, touched, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className={`text-xs font-medium transition-colors duration-150 ${
          error && touched ? "text-red-400/80" : "text-white/45"
        }`}
      >
        {label}
      </label>
      {children}
      {error && touched && (
        <p
          id={`${id}-error`}
          role="alert"
          className="validation-enter flex items-center gap-1.5 text-xs text-red-400/80"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
            <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.1" />
            <path d="M5.5 3.5v2.2M5.5 7v.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

/* ── Base input classes ── */
const inputBase = `
  w-full px-3.5 py-2.5 text-sm text-white rounded-lg
  bg-white/[0.04] border outline-none auth-input
  placeholder:text-white/20
  disabled:opacity-40 disabled:cursor-not-allowed
`;
const inputBorder = (err) =>
  err
    ? "border-red-500/40 focus:border-red-500/70 focus:ring-2 focus:ring-red-500/15"
    : "border-white/[0.1]";

/* ── Password visibility toggle ── */
function EyeToggle({ visible, onToggle, disabled }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onToggle}
      disabled={disabled}
      aria-label={visible ? "Hide password" : "Show password"}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-sm disabled:pointer-events-none"
    >
      {visible ? (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <path d="M1.5 1.5l12 12M6.1 6.2A2 2 0 0 0 8.8 8.9M4.2 4.3C2.6 5.3 1.5 7.5 1.5 7.5S3.3 11.5 7.5 11.5c1.2 0 2.3-.4 3.2-1M6.5 3.6C6.8 3.5 7.1 3.5 7.5 3.5c4.2 0 6 4 6 4s-.5 1.1-1.4 2.1" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <path d="M1.5 7.5C1.5 7.5 3.3 3.5 7.5 3.5S13.5 7.5 13.5 7.5 11.7 11.5 7.5 11.5 1.5 7.5 1.5 7.5z" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
          <circle cx="7.5" cy="7.5" r="1.75" stroke="currentColor" strokeWidth="1.15" />
        </svg>
      )}
    </button>
  );
}

/* ── Password strength indicator ── */
function PasswordStrength({ password }) {
  if (!password) return null;
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const levels = [
    { label: "Weak",   color: "bg-red-500/55" },
    { label: "Fair",   color: "bg-amber-500/55" },
    { label: "Good",   color: "bg-amber-400/55" },
    { label: "Strong", color: "bg-emerald-500/55" },
  ];
  const { label, color } = levels[Math.max(0, score - 1)];

  return (
    <div
      className="flex flex-col gap-1.5"
      aria-live="polite"
      aria-label={`Password strength: ${label}`}
    >
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-all duration-300 ${
              i <= score ? color : "bg-white/[0.07]"
            }`}
          />
        ))}
      </div>
      <p className="text-[11px] text-white/30">
        Strength:{" "}
        <span className="text-white/50">{label}</span>
      </p>
    </div>
  );
}

/* ── Form-level error banner ── */
function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="validation-enter flex items-start gap-2.5 px-3.5 py-3 rounded-xl border border-red-500/25 bg-red-500/[0.06] text-xs text-red-400/85 leading-relaxed"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 mt-0.5" aria-hidden="true">
        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
        <path d="M7 4.5V7M7 9v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      {message}
    </div>
  );
}

/* ════════════════════════════════════════════════════ */

const INIT_VALUES  = { fullName: "", email: "", password: "", confirmPassword: "" };
const INIT_ERRORS  = { fullName: "", email: "", password: "", confirmPassword: "" };
const INIT_TOUCHED = { fullName: false, email: false, password: false, confirmPassword: false };

export default function RegisterPage() {
  const navigate = useNavigate();
  const [values, setValues]     = useState(INIT_VALUES);
  const [errors, setErrors]     = useState(INIT_ERRORS);
  const [touched, setTouched]   = useState(INIT_TOUCHED);
  const [showPw, setShowPw]     = useState(false);
  const [showCPw, setShowCPw]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
    if (formError) setFormError("");
    // Keep confirmPassword in sync when password changes
    if (name === "password" && touched.confirmPassword) {
      setErrors((p) => ({
        ...p,
        confirmPassword: validate.confirmPassword(values.confirmPassword, value),
      }));
    }
  }, [errors, formError, touched.confirmPassword, values.confirmPassword]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));
    const err =
      name === "confirmPassword"
        ? validate.confirmPassword(value, values.password)
        : validate[name]?.(value) ?? "";
    setErrors((p) => ({ ...p, [name]: err }));
  }, [values.password]);

  const validateAll = () => {
    const e = {
      fullName:        validate.fullName(values.fullName),
      email:           validate.email(values.email),
      password:        validate.password(values.password),
      confirmPassword: validate.confirmPassword(values.confirmPassword, values.password),
    };
    setErrors(e);
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true });
    return Object.values(e).every((v) => !v);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validateAll()) return;
    setIsLoading(true);
    setFormError("");
    try {
      // TODO: connect registration API
      await new Promise((r) => setTimeout(r, 1600));
      navigate("/dashboard");
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col gap-7">

        {/* ── Heading ── */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Create your TITAN account.
          </h1>
          <p className="text-sm text-white/40">
            Practice smarter. Build confidence. Get hired.
          </p>
        </div>

        {/* ── Form-level error ── */}
        <ErrorBanner message={formError} />

        {/* ── Form ── */}
        <form
          onSubmit={handleSubmit}
          noValidate
          aria-label="Create account form"
          className="flex flex-col gap-4"
        >
          {/* Full name */}
          <Field id="fullName" label="Full name" error={errors.fullName} touched={touched.fullName}>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Alex Johnson"
              value={values.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
              required
              aria-invalid={!!errors.fullName && touched.fullName}
              aria-describedby={errors.fullName && touched.fullName ? "fullName-error" : undefined}
              className={`${inputBase} ${inputBorder(errors.fullName && touched.fullName)}`}
            />
          </Field>

          {/* Email */}
          <Field id="email" label="Email address" error={errors.email} touched={touched.email}>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
              required
              aria-invalid={!!errors.email && touched.email}
              aria-describedby={errors.email && touched.email ? "email-error" : undefined}
              className={`${inputBase} ${inputBorder(errors.email && touched.email)}`}
            />
          </Field>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <Field id="password" label="Password" error={errors.password} touched={touched.password}>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isLoading}
                  required
                  aria-invalid={!!errors.password && touched.password}
                  aria-describedby={errors.password && touched.password ? "password-error" : undefined}
                  className={`${inputBase} pr-10 ${inputBorder(errors.password && touched.password)}`}
                />
                <EyeToggle visible={showPw} onToggle={() => setShowPw((v) => !v)} disabled={isLoading} />
              </div>
            </Field>
            {/* Strength bar — only when typing */}
            {values.password && <PasswordStrength password={values.password} />}
          </div>

          {/* Confirm password */}
          <Field id="confirmPassword" label="Confirm password" error={errors.confirmPassword} touched={touched.confirmPassword}>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showCPw ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={values.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isLoading}
                required
                aria-invalid={!!errors.confirmPassword && touched.confirmPassword}
                aria-describedby={errors.confirmPassword && touched.confirmPassword ? "confirmPassword-error" : undefined}
                className={`${inputBase} pr-10 ${inputBorder(errors.confirmPassword && touched.confirmPassword)}`}
              />
              <EyeToggle visible={showCPw} onToggle={() => setShowCPw((v) => !v)} disabled={isLoading} />
            </div>
          </Field>

          {/* Terms */}
          <p className="text-xs text-white/22 leading-relaxed">
            By creating an account you agree to our{" "}
            <button type="button" className="text-white/38 hover:text-white/60 underline underline-offset-2 transition-colors cursor-pointer">
              Terms
            </button>
            {" "}and{" "}
            <button type="button" className="text-white/38 hover:text-white/60 underline underline-offset-2 transition-colors cursor-pointer">
              Privacy Policy
            </button>
            .
          </p>

          {/* Create account button */}
          <button
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            className="
              auth-btn-primary
              w-full flex items-center justify-center gap-2
              py-2.5 px-5 mt-1
              text-sm font-semibold text-black bg-white rounded-lg
              hover:bg-white/92
              disabled:opacity-50 disabled:cursor-not-allowed
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50
            "
          >
            {isLoading && <Spinner />}
            <span className={isLoading ? "opacity-70" : ""}>
              {isLoading ? "Creating account…" : "Create account"}
            </span>
          </button>
        </form>

        {/* ── Divider ── */}
        <div className="flex items-center gap-3" aria-hidden="true">
          <div className="flex-1 h-px bg-white/[0.07]" />
          <span className="text-xs text-white/20">or</span>
          <div className="flex-1 h-px bg-white/[0.07]" />
        </div>

        {/* ── Login link ── */}
        <p className="text-center text-sm text-white/35">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-white/65 hover:text-white transition-colors duration-150 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-sm"
          >
            Sign in
          </Link>
        </p>

      </div>
    </AuthLayout>
  );
}

import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";

/* ── Validation ── */
const validate = {
  email: (v) => {
    if (!v.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address.";
    return "";
  },
  password: (v) => (!v ? "Password is required." : ""),
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

/* ── Field — label + input + animated error ── */
function Field({ id, label, error, touched, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={`text-xs font-medium transition-colors duration-150 ${error && touched ? "text-red-400/80" : "text-white/45"}`}>
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

/* ── Base input styles ── */
const inputBase = `
  w-full px-3.5 py-2.5 text-sm text-white rounded-lg
  bg-white/[0.04] border outline-none
  placeholder:text-white/20
  auth-input
  disabled:opacity-40 disabled:cursor-not-allowed
`;

const inputBorder = (hasError) =>
  hasError
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

/* ── Custom checkbox ── */
function Checkbox({ checked, onChange, disabled, label, id }) {
  return (
    <label htmlFor={id} className="flex items-center gap-2.5 cursor-pointer group w-fit select-none">
      <div className="relative flex-shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`w-4 h-4 rounded flex items-center justify-center border transition-all duration-150 ${
            checked ? "bg-white border-white" : "bg-transparent border-white/[0.18] group-hover:border-white/35"
          } ${disabled ? "opacity-40" : ""}`}
          aria-hidden="true"
        >
          {checked && (
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
              <path d="M1 4l2 2 4-4" stroke="#0a0a0a" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
      <span className={`text-sm text-white/40 group-hover:text-white/60 transition-colors duration-150 ${disabled ? "opacity-40" : ""}`}>
        {label}
      </span>
    </label>
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

export default function LoginPage() {
  const navigate = useNavigate();
  const [values, setValues]       = useState({ email: "", password: "" });
  const [errors, setErrors]       = useState({ email: "", password: "" });
  const [touched, setTouched]     = useState({ email: false, password: false });
  const [showPw, setShowPw]       = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
    if (formError) setFormError("");
  }, [errors, formError]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));
    setErrors((p) => ({ ...p, [name]: validate[name](value) }));
  }, []);

  const validateAll = () => {
    const e = { email: validate.email(values.email), password: validate.password(values.password) };
    setErrors(e);
    setTouched({ email: true, password: true });
    return !e.email && !e.password;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validateAll()) return;
    setIsLoading(true);
    setFormError("");
    try {
      // TODO: connect auth API
      await new Promise((r) => setTimeout(r, 1400));
      navigate("/dashboard");
    } catch {
      setFormError("Invalid email or password. Please try again.");
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
            Welcome back.
          </h1>
          <p className="text-sm text-white/40">
            Your next interview is waiting.
          </p>
        </div>

        {/* ── Form-level error ── */}
        <ErrorBanner message={formError} />

        {/* ── Form ── */}
        <form
          onSubmit={handleSubmit}
          noValidate
          aria-label="Sign in form"
          className="flex flex-col gap-5"
        >
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
          <Field id="password" label="Password" error={errors.password} touched={touched.password}>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
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

          {/* Remember me + Forgot password */}
          <div className="flex items-center justify-between">
            <Checkbox
              id="remember-me"
              label="Remember me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
            />
            <button
              type="button"
              disabled={isLoading}
              onClick={() => alert("Forgot password flow coming soon.")}
              className="text-xs text-white/35 hover:text-white/65 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-sm cursor-pointer disabled:opacity-40"
            >
              Forgot password?
            </button>
          </div>

          {/* Continue button */}
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
              {isLoading ? "Signing in…" : "Continue"}
            </span>
          </button>
        </form>

        {/* ── Divider ── */}
        <div className="flex items-center gap-3" aria-hidden="true">
          <div className="flex-1 h-px bg-white/[0.07]" />
          <span className="text-xs text-white/20">or</span>
          <div className="flex-1 h-px bg-white/[0.07]" />
        </div>

        {/* ── Register link ── */}
        <p className="text-center text-sm text-white/35">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-white/65 hover:text-white transition-colors duration-150 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-sm"
          >
            Create one free
          </Link>
        </p>

      </div>
    </AuthLayout>
  );
}

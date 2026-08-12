/**
 * AuthLayout v2
 * Centered single-column layout. No split-screen.
 * Background: subtle blurred dashboard elements at very low opacity.
 * Card: compact, balanced, with generous vertical spacing.
 */
import { Link } from "react-router-dom";
import AuthBackground from "../components/auth/AuthBackground";
import AuthCard from "../components/auth/AuthCard";

export default function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-12 overflow-hidden">

      {/* ── Atmospheric background ── */}
      <AuthBackground />

      {/* ── Logo — sits above the card, unobtrusive ── */}
      <div
        className="relative z-10 mb-8 animate-fade-in"
        style={{ animationDelay: "0ms", animationFillMode: "both" }}
      >
        <Link
          to="/"
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-md"
          aria-label="TITAN – back to home"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-opacity duration-150 group-hover:opacity-80"
            style={{ background: "linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)" }}
            aria-hidden="true"
          >
            <span className="text-black text-sm font-black tracking-tight">T</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">TITAN</span>
        </Link>
      </div>

      {/* ── Centered auth card ── */}
      <div className="relative z-10 w-full flex justify-center">
        <AuthCard>
          {children}
        </AuthCard>
      </div>

      {/* ── Footer note ── */}
      <p
        className="relative z-10 mt-8 text-xs text-white/20 animate-fade-in"
        style={{ animationDelay: "400ms", animationFillMode: "both" }}
      >
        No credit card. No limits. Free forever.
      </p>

    </div>
  );
}

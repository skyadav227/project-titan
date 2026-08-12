import { Link } from "react-router-dom";
import HeroDashboard from "./HeroDashboard";

export default function HeroSection() {
  return (
    <section
      aria-label="Hero"
      className="relative min-h-[calc(100vh-64px)] flex items-center pt-16 overflow-hidden grid-bg"
    >
      {/* Background radial gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,255,255,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Left: Text ── */}
          <div className="flex flex-col gap-6 lg:gap-8">

            {/* Badge */}
            <div className="animate-fade-in">
              <span className="badge-pill" role="text">
                <span aria-hidden="true">✨</span>
                Free AI Interview Platform
              </span>
            </div>

            {/* Headline */}
            <h1 className="animate-fade-in-up delay-100 text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.08] tracking-tight">
              Ace Your Next
              <br />
              <span className="shimmer-text">Interview.</span>
            </h1>

            {/* Supporting text */}
            <p className="animate-fade-in-up delay-200 text-base sm:text-lg text-white/50 leading-relaxed max-w-md">
              Practice realistic AI interviews, improve communication, receive
              detailed reports, and build confidence before your real interview.
            </p>

            {/* CTA buttons */}
            <div className="animate-fade-in-up delay-300 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="btn-scale inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-black bg-white rounded-lg hover:bg-white/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                Start Free
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>

              <button
                className="btn-scale inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white/70 border border-white/[0.12] rounded-lg hover:border-white/25 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 cursor-pointer"
                onClick={() => {
                  document.getElementById("interactive-demo")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M5.5 4.5l4 2.5-4 2.5V4.5z" fill="currentColor" />
                </svg>
                Watch Demo
              </button>
            </div>

            {/* Trust indicators */}
            <div className="animate-fade-in-up delay-400 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/30">
              {[
                "No credit card required",
                "Completely free",
                "Resume-aware AI",
              ].map((item, i) => (
                <span key={item} className="flex items-center gap-1.5">
                  {i > 0 && <span className="w-px h-3 bg-white/15" aria-hidden="true" />}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right: Dashboard mockup ── */}
          <div className="animate-fade-in-right delay-300 w-full">
            <HeroDashboard />
          </div>

        </div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        aria-hidden="true"
        style={{
          background: "linear-gradient(to bottom, transparent, #0a0a0a)",
        }}
      />
    </section>
  );
}

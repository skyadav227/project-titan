import { Link } from "react-router-dom";
import { useScrollReveal } from "../hooks/useScrollReveal";

export default function FinalCTA() {
  const ref = useScrollReveal({ threshold: 0.15 });

  return (
    <section
      ref={ref}
      aria-labelledby="cta-heading"
      className="py-24 sm:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="reveal relative rounded-3xl border border-white/[0.08] bg-white/[0.02] overflow-hidden px-8 py-16 sm:py-20 text-center"
        >
          {/* Subtle radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 100%, rgba(255,255,255,0.04) 0%, transparent 70%)",
            }}
          />

          {/* Grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            aria-hidden="true"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />

          <div className="relative">
            {/* Badge */}
            <div className="flex justify-center mb-6">
              <span className="badge-pill">
                <span aria-hidden="true">✨</span>
                Free — no credit card needed
              </span>
            </div>

            {/* Headline */}
            <h2
              id="cta-heading"
              className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-5 leading-tight"
            >
              Ready to Build
              <br />
              <span className="shimmer-text">Confidence?</span>
            </h2>

            {/* Supporting text */}
            <p className="text-base sm:text-lg text-white/45 max-w-lg mx-auto mb-10 leading-relaxed">
              Join the engineers who stopped guessing and started practising with a mentor
              that's always available, always honest, and completely free.
            </p>

            {/* CTA button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/register"
                className="
                  btn-scale inline-flex items-center gap-2
                  px-8 py-3.5 text-base font-semibold text-black bg-white rounded-xl
                  hover:bg-white/90 transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60
                "
              >
                Start Free
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2 8h12M8 2l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                to="/login"
                className="
                  btn-scale inline-flex items-center gap-2
                  px-8 py-3.5 text-base font-medium text-white/60
                  border border-white/[0.12] rounded-xl
                  hover:border-white/25 hover:text-white transition-all
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40
                "
              >
                Already have an account
              </Link>
            </div>

            {/* Trust line */}
            <p className="mt-8 text-xs text-white/25">
              No signup fees. No limits. No excuses.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

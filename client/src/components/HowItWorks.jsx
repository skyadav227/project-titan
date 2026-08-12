import { useScrollReveal } from "../hooks/useScrollReveal";

const STEPS = [
  {
    number: "01",
    title: "Upload Resume",
    description:
      "Drop your resume and TITAN instantly parses your skills, experience, and projects to build a personalised question bank just for you.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M11 14V4M7 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 16v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Start Interview",
    description:
      "Choose a mode — resume-based, job description match, or company-specific. Your AI interviewer starts immediately, no setup required.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8.5 7.5l6 3.5-6 3.5V7.5z" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Receive AI Coaching",
    description:
      "Get live feedback as you answer. TITAN analyses your communication, flags weak points, and coaches you mid-session — like a senior engineer would.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M4 6h14a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 18h6M11 15v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Track Improvement",
    description:
      "Your dashboard tracks every session. See score trends, mastered skills, weak areas to target, and your rank on the leaderboard.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M4 17l4-5 3 3 3-4 4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="3" y="3" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  const ref = useScrollReveal({ threshold: 0.08 });

  return (
    <section
      id="how-it-works"
      ref={ref}
      aria-labelledby="hiw-heading"
      className="py-24 sm:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <p className="reveal text-center text-xs font-medium uppercase tracking-widest text-white/25 mb-4">
          How It Works
        </p>
        <h2
          id="hiw-heading"
          className="reveal text-center text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4"
        >
          From signup to offer-ready.
        </h2>
        <p className="reveal text-center text-base text-white/45 max-w-xl mx-auto mb-16">
          Four steps. No fluff. Just the fastest path to interview confidence.
        </p>

        {/* Steps — desktop: horizontal with connectors, mobile: vertical */}
        <div className="relative">

          {/* Horizontal connector line (desktop only) */}
          <div
            className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 15%, rgba(255,255,255,0.08) 85%, transparent)" }}
            aria-hidden="true"
          />

          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 stagger-children" role="list">
            {STEPS.map(({ number, title, description, icon }, i) => (
              <li
                key={title}
                className="reveal flex flex-col gap-4"
              >
                {/* Step icon + number */}
                <div className="relative flex flex-col items-center lg:items-start">
                  <div
                    className="
                      w-20 h-20 rounded-2xl flex flex-col items-center justify-center gap-1
                      border border-white/[0.08] bg-white/[0.03]
                      lg:mb-0
                    "
                  >
                    <div className="text-white/50">{icon}</div>
                    <span className="text-[10px] font-bold text-white/20 tracking-wider">{number}</span>
                  </div>

                  {/* Vertical connector for mobile/tablet */}
                  {i < STEPS.length - 1 && (
                    <div
                      className="sm:hidden absolute left-1/2 -translate-x-1/2 top-full mt-2 w-px h-6 bg-white/[0.08]"
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* Text */}
                <div className="text-center lg:text-left">
                  <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed">{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

      </div>
    </section>
  );
}

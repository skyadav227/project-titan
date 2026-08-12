import { useScrollReveal } from "../hooks/useScrollReveal";

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.4" />
        <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M6 10a4 4 0 0 1 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2 2" />
      </svg>
    ),
    title: "AI Interviews",
    description:
      "Lifelike AI-driven interviews that adapt to your answers in real time. No scripts — just realistic, flowing conversation.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6 7h8M6 10h8M6 13h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="15" cy="15" r="3" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.2" />
        <path d="M14.2 15l.8.8 1.5-1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
    title: "Resume Analysis",
    description:
      "TITAN reads your resume and generates questions directly from your experience, skills, and projects — just like a real interviewer would.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M4 4h12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M7 8h6M7 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M8 16l2 2 2-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    title: "Job Description Matching",
    description:
      "Paste a JD and TITAN tailors every question to that exact role — skills, stack, responsibilities, and seniority level.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M3 14l4-5 3 3 3-4 4 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
    title: "Performance Reports",
    description:
      "Comprehensive post-interview breakdowns covering technical accuracy, communication clarity, confidence, and specific areas to improve.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="1.4" />
        <path d="M4 17c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M14 5l1.5-1.5M15.5 7H17M14 9l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    title: "Communication Coaching",
    description:
      "Real-time analysis of your delivery — filler words, pace, clarity, and structure — with actionable tips to sound more confident.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M5 16V10M9 16V6M13 16V9M17 16V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M3 16h15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    title: "Progress Tracking",
    description:
      "Track your improvement across sessions. See your score trends, mastered skills, and exactly what to focus on next.",
  },
];

export default function FeaturesSection() {
  const ref = useScrollReveal({ threshold: 0.08 });

  return (
    <section
      id="features"
      ref={ref}
      aria-labelledby="features-heading"
      className="py-24 sm:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section label */}
        <p className="reveal text-center text-xs font-medium uppercase tracking-widest text-white/25 mb-4">
          Features
        </p>

        {/* Heading */}
        <h2
          id="features-heading"
          className="reveal text-center text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4"
        >
          Everything you need to prepare.
        </h2>
        <p className="reveal text-center text-base text-white/45 max-w-xl mx-auto mb-16">
          From your first mock interview to landing the offer — TITAN covers every dimension of interview readiness.
        </p>

        {/* Feature cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {FEATURES.map(({ icon, title, description }) => (
            <article
              key={title}
              className="reveal card-lift group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 flex flex-col gap-4 cursor-default"
            >
              {/* Icon */}
              <div
                className="
                  w-10 h-10 rounded-xl flex items-center justify-center
                  border border-white/[0.08] bg-white/[0.04] text-white/50
                  group-hover:border-white/20 group-hover:text-white/80
                  transition-all duration-200
                "
              >
                {icon}
              </div>

              {/* Title */}
              <h3 className="text-base font-semibold text-white group-hover:text-white transition-colors">
                {title}
              </h3>

              {/* Description */}
              <p className="text-sm text-white/45 leading-relaxed">
                {description}
              </p>

              {/* Hover indicator */}
              <div
                className="
                  mt-auto flex items-center gap-1 text-xs text-white/0
                  group-hover:text-white/40 transition-all duration-200
                "
                aria-hidden="true"
              >
                <span>Explore</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}

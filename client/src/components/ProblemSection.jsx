import { useScrollReveal } from "../hooks/useScrollReveal";

const PROBLEMS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.4" />
        <path d="M11 7v4l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    title: "Generic, scripted questions",
    description:
      "Traditional platforms throw the same questions at everyone. Real interviews are personalised — based on your resume, your role, your company.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M4 17L8 13M18 4l-4 4M8 13l2-2M14 7l-2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="6" cy="19" r="2" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="16" cy="3" r="2" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
    title: "No feedback, no improvement",
    description:
      "Practising in silence is useless. Without knowing what went wrong — your filler words, weak answers, missing context — you repeat the same mistakes.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="3" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M7 9h8M7 13h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M16 17l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    title: "Hidden behind a paywall",
    description:
      "Premium tools cost money most students and fresh graduates simply don't have. Interview prep should not be a privilege.",
  },
];

export default function ProblemSection() {
  const ref = useScrollReveal({ threshold: 0.1 });

  return (
    <section ref={ref} aria-labelledby="problem-heading" className="py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section label */}
        <p className="reveal text-center text-xs font-medium uppercase tracking-widest text-white/25 mb-4">
          The Problem
        </p>

        {/* Heading */}
        <h2
          id="problem-heading"
          className="reveal text-center text-3xl sm:text-4xl font-bold text-white tracking-tight mb-16"
        >
          Interview prep is broken.
        </h2>

        {/* Problem cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-16 stagger-children">
          {PROBLEMS.map(({ icon, title, description }) => (
            <article
              key={title}
              className="reveal card-lift rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 flex flex-col gap-4"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/[0.08] bg-white/[0.04] text-white/50">
                {icon}
              </div>
              <h3 className="text-base font-semibold text-white">{title}</h3>
              <p className="text-sm text-white/45 leading-relaxed">{description}</p>
            </article>
          ))}
        </div>

        {/* Transition bridge */}
        <div className="reveal flex flex-col items-center gap-4">
          {/* Connecting arrow */}
          <div className="flex flex-col items-center gap-1" aria-hidden="true">
            <div className="w-px h-8 bg-gradient-to-b from-white/20 to-white/5" />
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8l6 6 6-6" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* TITAN solves them */}
          <div className="rounded-2xl border border-white/[0.1] bg-white/[0.04] px-8 py-6 text-center max-w-lg">
            <p className="text-xl font-bold text-white mb-2">TITAN solves them.</p>
            <p className="text-sm text-white/45 leading-relaxed">
              Personalised, resume-aware AI interviews with live coaching, detailed reports,
              and zero cost — built to feel like practising with a senior engineer.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}

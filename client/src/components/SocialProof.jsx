import { useScrollReveal } from "../hooks/useScrollReveal";

const ROLES = [
  "Frontend Engineer",
  "Backend Developer",
  "React Developer",
  "Node.js Engineer",
  "AI / ML Engineer",
  "Data Scientist",
  "DevOps Engineer",
  "Cloud Architect",
  "Full Stack Dev",
  "System Designer",
  "SDE-II",
  "FAANG Aspirant",
];

export default function SocialProof() {
  const ref = useScrollReveal({ threshold: 0.15 });

  return (
    <section ref={ref} aria-label="Trusted by engineers across roles" className="py-16 border-y border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <p className="reveal text-center text-xs font-medium uppercase tracking-widest text-white/25 mb-8">
          Built for engineers across every specialisation
        </p>

        {/* Role chips — two rows, auto-scroll marquee feel via flex-wrap */}
        <div className="reveal flex flex-wrap justify-center gap-2 stagger-children" role="list">
          {ROLES.map((role) => (
            <span
              key={role}
              role="listitem"
              className="
                inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium
                border border-white/[0.08] bg-white/[0.03] text-white/50
                hover:border-white/20 hover:text-white/80 hover:bg-white/[0.06]
                transition-all duration-200 cursor-default select-none
              "
            >
              {role}
            </span>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="reveal text-center text-xs text-white/20 mt-8">
          No fake numbers. No inflated user counts.
        </p>
      </div>
    </section>
  );
}

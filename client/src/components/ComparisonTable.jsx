import { useScrollReveal } from "../hooks/useScrollReveal";

const FEATURES = [
  "Completely free",
  "Resume-aware questions",
  "Live AI coaching",
  "Personalised interviews",
  "Progress tracking",
  "Communication analysis",
  "JD-based interviews",
  "Performance reports",
];

const PLATFORMS = [
  {
    name: "TITAN",
    highlight: true,
    values: [true, true, true, true, true, true, true, true],
  },
  {
    name: "LeetCode",
    values: [true, false, false, false, true, false, false, false],
  },
  {
    name: "Pramp",
    values: [true, false, false, false, false, false, false, false],
  },
  {
    name: "InterviewBit",
    values: [false, false, false, false, true, false, false, true],
  },
];

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="7" fill="rgba(255,255,255,0.08)" />
    <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Cross = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="rgba(255,255,255,0.15)" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export default function ComparisonTable() {
  const ref = useScrollReveal({ threshold: 0.1 });

  return (
    <section
      ref={ref}
      aria-labelledby="comparison-heading"
      className="py-24 sm:py-32"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <p className="reveal text-center text-xs font-medium uppercase tracking-widest text-white/25 mb-4">
          Why TITAN
        </p>
        <h2
          id="comparison-heading"
          className="reveal text-center text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4"
        >
          Built differently.
        </h2>
        <p className="reveal text-center text-base text-white/45 max-w-xl mx-auto mb-14">
          Traditional platforms give you generic questions. TITAN gives you a mentor.
        </p>

        {/* Table wrapper */}
        <div className="reveal overflow-x-auto rounded-2xl border border-white/[0.08]">
          <table className="w-full min-w-[560px]" role="table" aria-label="Feature comparison between TITAN and other platforms">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th
                  scope="col"
                  className="text-left px-5 py-4 text-xs font-medium text-white/30 uppercase tracking-wider"
                >
                  Feature
                </th>
                {PLATFORMS.map(({ name, highlight }) => (
                  <th
                    key={name}
                    scope="col"
                    className={`px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider ${
                      highlight ? "text-white" : "text-white/30"
                    }`}
                  >
                    {highlight ? (
                      <span className="inline-flex items-center gap-1.5">
                        {name}
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-white/10 text-white/70 normal-case font-medium tracking-normal">
                          You
                        </span>
                      </span>
                    ) : name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((feature, fi) => (
                <tr
                  key={feature}
                  className={`border-b border-white/[0.04] ${
                    fi % 2 === 0 ? "bg-white/[0.01]" : ""
                  }`}
                >
                  <td className="px-5 py-3.5 text-sm text-white/60">{feature}</td>
                  {PLATFORMS.map(({ name, values, highlight }) => (
                    <td
                      key={name}
                      className={`px-4 py-3.5 text-center ${highlight ? "bg-white/[0.03]" : ""}`}
                    >
                      <div className="flex justify-center" aria-label={values[fi] ? `${name}: supported` : `${name}: not supported`}>
                        {values[fi] ? <Check /> : <Cross />}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Disclaimer */}
        <p className="reveal text-center text-xs text-white/20 mt-6">
          Comparison based on publicly available feature information. Subject to change.
        </p>

      </div>
    </section>
  );
}

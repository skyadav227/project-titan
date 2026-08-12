import { useScrollReveal } from "../hooks/useScrollReveal";

/* ── Mini bar chart ── */
function MiniBar({ height, delay = 0 }) {
  return (
    <div
      className="flex-1 rounded-t-sm bg-white/50 transition-all duration-700"
      style={{
        height: `${height}%`,
        transitionDelay: `${delay}ms`,
        maxHeight: "100%",
      }}
    />
  );
}

/* ── Score ring ── */
function ScoreRing({ value, label, size = 72 }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth={5}
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1) 0.3s" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
          {value}
        </span>
      </div>
      <span className="text-[10px] text-white/40 text-center">{label}</span>
    </div>
  );
}

const WEEKLY = [50, 65, 45, 80, 60, 90, 72];
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

const SESSIONS = [
  { title: "System Design", type: "Company", score: 91, date: "Today" },
  { title: "React Deep Dive", type: "JD Match", score: 84, date: "Yesterday" },
  { title: "Behavioural Round", type: "Resume", score: 76, date: "2d ago" },
  { title: "DSA — Arrays", type: "Practice", score: 69, date: "3d ago" },
];

const SKILLS = [
  { name: "Problem Solving", pct: 88 },
  { name: "Communication", pct: 76 },
  { name: "System Design", pct: 82 },
  { name: "Code Quality", pct: 71 },
];

export default function DashboardShowcase() {
  const ref = useScrollReveal({ threshold: 0.08 });

  return (
    <section
      ref={ref}
      aria-labelledby="showcase-heading"
      className="py-24 sm:py-32 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <p className="reveal text-center text-xs font-medium uppercase tracking-widest text-white/25 mb-4">
          Dashboard
        </p>
        <h2
          id="showcase-heading"
          className="reveal text-center text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4"
        >
          Your progress, at a glance.
        </h2>
        <p className="reveal text-center text-base text-white/45 max-w-xl mx-auto mb-16">
          Every session feeds into a rich analytics dashboard that shows your growth,
          strengths, and exactly what to work on next.
        </p>

        {/* Laptop frame */}
        <div className="reveal laptop-screen max-w-5xl mx-auto">

          {/* Laptop lid */}
          <div
            className="rounded-t-2xl border border-white/[0.1] bg-[#0f0f0f] overflow-hidden shadow-2xl"
            style={{
              boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
            }}
          >
            {/* Screen chrome */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-[#111111]">
              <div className="flex gap-1.5" aria-hidden="true">
                <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]">
                <span className="w-2 h-2 rounded-full bg-emerald-500/60" aria-hidden="true" />
                <span className="text-[10px] text-white/30 font-mono">app.titan.ai/dashboard</span>
              </div>
              <div className="w-16" />
            </div>

            {/* Dashboard content */}
            <div className="p-4 sm:p-5 grid grid-cols-12 gap-3 bg-[#0d0d0d]">

              {/* Sidebar nav */}
              <div className="col-span-2 hidden sm:flex flex-col gap-1">
                {["Dashboard", "Interviews", "Reports", "Progress", "Settings"].map((item, i) => (
                  <div
                    key={item}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] cursor-default ${
                      i === 0
                        ? "bg-white/[0.08] text-white font-medium"
                        : "text-white/30 hover:text-white/50"
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-white/60" : "bg-white/15"}`} aria-hidden="true" />
                    {item}
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="col-span-12 sm:col-span-10 grid grid-cols-10 gap-3">

                {/* Scores row */}
                <div className="col-span-10 grid grid-cols-3 gap-3">
                  {[
                    { label: "Overall", value: 84 },
                    { label: "Technical", value: 91 },
                    { label: "Comm.", value: 77 },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 flex flex-col items-center gap-1"
                    >
                      <ScoreRing value={s.value} label={s.label} size={60} />
                    </div>
                  ))}
                </div>

                {/* Weekly chart */}
                <div className="col-span-6 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                  <p className="text-[10px] text-white/35 mb-2 uppercase tracking-wider font-medium">Weekly Score</p>
                  <div className="flex items-end gap-1" style={{ height: 48 }}>
                    {WEEKLY.map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <MiniBar height={h} delay={i * 70} />
                        <span className="text-[7px] text-white/20">{DAYS[i]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skill bars */}
                <div className="col-span-4 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                  <p className="text-[10px] text-white/35 mb-2 uppercase tracking-wider font-medium">Skills</p>
                  <div className="flex flex-col gap-1.5">
                    {SKILLS.map(({ name, pct }) => (
                      <div key={name}>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[9px] text-white/40">{name}</span>
                          <span className="text-[9px] text-white/40">{pct}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-white/[0.08] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-white/50 transition-all duration-1000"
                            style={{ width: `${pct}%`, transitionDelay: "400ms" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent sessions */}
                <div className="col-span-10 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                  <p className="text-[10px] text-white/35 mb-2 uppercase tracking-wider font-medium">Recent Sessions</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {SESSIONS.map((s) => (
                      <div
                        key={s.title}
                        className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-white/[0.08] flex items-center justify-center text-[8px] text-white/40 font-bold">
                            {s.score}
                          </div>
                          <div>
                            <p className="text-[10px] text-white/70 font-medium">{s.title}</p>
                            <p className="text-[8px] text-white/25">{s.type} · {s.date}</p>
                          </div>
                        </div>
                        <div
                          className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                            s.score >= 85
                              ? "bg-emerald-500/10 text-emerald-400/70"
                              : s.score >= 75
                              ? "bg-amber-500/10 text-amber-400/70"
                              : "bg-white/[0.06] text-white/30"
                          }`}
                        >
                          {s.score >= 85 ? "Excellent" : s.score >= 75 ? "Good" : "Needs Work"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Laptop base */}
          <div className="relative mx-auto" aria-hidden="true">
            <div className="h-3 bg-gradient-to-b from-[#1a1a1a] to-[#141414] rounded-b-sm border-x border-b border-white/[0.06]" />
            <div className="h-2 bg-[#111111] rounded-b-xl mx-4 border-x border-b border-white/[0.04]" />
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-[#1c1c1c] rounded-b-lg" />
          </div>
        </div>

      </div>
    </section>
  );
}

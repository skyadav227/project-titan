import { useEffect, useState, useRef } from "react";

/* ── Mini bar chart bars ── */
function BarChart({ bars }) {
  return (
    <div className="flex items-end gap-1 h-12">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-white/20 relative overflow-hidden"
          style={{ height: `${h}%` }}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white/60 rounded-sm progress-animate"
            style={{ height: "100%", animationDelay: `${i * 80}ms` }}
          />
        </div>
      ))}
    </div>
  );
}

/* ── Circular progress ring ── */
function CircleProgress({ value, size = 52, stroke = 4, color = "#ffffff" }) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circ);

  useEffect(() => {
    const t = setTimeout(() => {
      setOffset(circ - (value / 100) * circ);
    }, 400);
    return () => clearTimeout(t);
  }, [value, circ]);

  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
      />
    </svg>
  );
}

/* ── Score card ── */
function ScoreCard({ label, value, color }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1400;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setDisplayed(Math.floor(progress * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex items-center justify-center">
        <CircleProgress value={value} color={color} />
        <span className="absolute text-xs font-bold text-white">{displayed}</span>
      </div>
      <span className="text-[10px] text-white/50 text-center leading-tight">{label}</span>
    </div>
  );
}

/* ── Radar chart (SVG-only) ── */
function RadarChart() {
  const axes = ["DSA", "System\nDesign", "Comm", "Coding", "BQ", "React"];
  const values = [0.82, 0.65, 0.78, 0.88, 0.72, 0.90];
  const cx = 52, cy = 52, r = 40;

  const getPoint = (angle, val) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + val * r * Math.sin(rad), y: cy - val * r * Math.cos(rad) };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const numAxes = axes.length;
  const angleStep = 360 / numAxes;

  const dataPath = values
    .map((v, i) => {
      const p = getPoint(i * angleStep, v);
      return `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    })
    .join(" ") + " Z";

  return (
    <svg viewBox="0 0 104 104" className="w-full h-full" aria-label="Skill radar chart">
      {/* Grid rings */}
      {gridLevels.map((level) => {
        const pts = Array.from({ length: numAxes }, (_, i) => getPoint(i * angleStep, level));
        const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ") + " Z";
        return <path key={level} d={d} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />;
      })}

      {/* Axis lines */}
      {Array.from({ length: numAxes }, (_, i) => {
        const p = getPoint(i * angleStep, 1);
        return <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(2)} y2={p.y.toFixed(2)} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />;
      })}

      {/* Data polygon */}
      <path d={dataPath} fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.6)" strokeWidth="1" className="radar-line" />

      {/* Data points */}
      {values.map((v, i) => {
        const p = getPoint(i * angleStep, v);
        return <circle key={i} cx={p.x.toFixed(2)} cy={p.y.toFixed(2)} r="2" fill="white" />;
      })}
    </svg>
  );
}

/* ── Weekly bar chart data ── */
const WEEKLY_BARS = [45, 70, 55, 85, 60, 90, 75];
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

/* ── Recent interview items ── */
const RECENT = [
  { role: "Frontend Engineer", company: "Mock Co.", score: 88, tag: "Resume" },
  { role: "React Developer", company: "Tech Inc.", score: 74, tag: "JD" },
];

/* ── Timeline items ── */
const TIMELINE = [
  { label: "System Design Q&A", time: "2h ago", type: "done" },
  { label: "Behavioural Round", time: "Yesterday", type: "done" },
  { label: "Live Coding Session", time: "2d ago", type: "done" },
];

export default function HeroDashboard() {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="relative w-full max-w-lg xl:max-w-xl mx-auto"
      aria-label="Dashboard preview mockup"
      role="img"
    >
      {/* Outer glow */}
      <div
        className="absolute -inset-4 rounded-2xl opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      {/* Main dashboard card */}
      <div
        className={`relative rounded-2xl border border-white/[0.08] bg-[#111111] overflow-hidden shadow-2xl transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
          </div>
          <span className="text-[11px] text-white/30 font-mono">titan.app/dashboard</span>
          <div className="w-14" />
        </div>

        <div className="p-4 grid grid-cols-12 gap-3">

          {/* ── Row 1: Scores ── */}
          <div
            className={`col-span-12 grid grid-cols-3 gap-3 transition-all duration-500 delay-100 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {[
              { label: "Overall", value: 84, color: "#ffffff" },
              { label: "Communication", value: 78, color: "#a0a0a0" },
              { label: "Technical", value: 91, color: "#c0c0c0" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 flex flex-col items-center gap-1"
              >
                {visible && <ScoreCard label={s.label} value={s.value} color={s.color} />}
              </div>
            ))}
          </div>

          {/* ── Row 2: Weekly Progress + Radar ── */}
          <div
            className={`col-span-7 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 transition-all duration-500 delay-200 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <p className="text-[10px] text-white/40 mb-2 font-medium uppercase tracking-wider">Weekly Progress</p>
            <div className="flex items-end gap-1 h-10 mb-1">
              {WEEKLY_BARS.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-sm bg-white/60 transition-all duration-700"
                    style={{
                      height: visible ? `${h}%` : "0%",
                      transitionDelay: `${300 + i * 60}ms`,
                      maxHeight: "40px",
                    }}
                  />
                  <span className="text-[8px] text-white/30">{DAYS[i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`col-span-5 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 flex flex-col transition-all duration-500 delay-300 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <p className="text-[10px] text-white/40 mb-1 font-medium uppercase tracking-wider">Skills</p>
            <div className="flex-1 w-full aspect-square max-h-16 mx-auto">
              {visible && <RadarChart />}
            </div>
          </div>

          {/* ── Row 3: Recent Interviews ── */}
          <div
            className={`col-span-12 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 transition-all duration-500 delay-[350ms] ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <p className="text-[10px] text-white/40 mb-2 font-medium uppercase tracking-wider">Recent Interviews</p>
            <div className="flex flex-col gap-2">
              {RECENT.map((r) => (
                <div key={r.role} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-[9px] text-white/50 font-bold">
                      {r.role[0]}
                    </div>
                    <div>
                      <p className="text-[10px] text-white/80 font-medium leading-tight">{r.role}</p>
                      <p className="text-[9px] text-white/30">{r.tag} based</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/50">{r.tag}</span>
                    <span className="text-xs font-bold text-white">{r.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Row 4: Today's Goal + Weak/Strong + Timeline ── */}
          <div
            className={`col-span-5 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 transition-all duration-500 delay-[400ms] ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <p className="text-[10px] text-white/40 mb-2 font-medium uppercase tracking-wider">Today's Goal</p>
            <div className="flex flex-col gap-1.5">
              {[
                { label: "DSA Practice", pct: 75 },
                { label: "Mock Interview", pct: 40 },
              ].map((g) => (
                <div key={g.label}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[9px] text-white/50">{g.label}</span>
                    <span className="text-[9px] text-white/50">{g.pct}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white/60 transition-all duration-1000"
                      style={{ width: visible ? `${g.pct}%` : "0%", transitionDelay: "600ms" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`col-span-7 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 transition-all duration-500 delay-[450ms] ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <p className="text-[10px] text-white/40 mb-2 font-medium uppercase tracking-wider">Activity</p>
            <div className="flex flex-col gap-1.5">
              {TIMELINE.map((t) => (
                <div key={t.label} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40 flex-shrink-0" />
                  <span className="text-[9px] text-white/60 flex-1 truncate">{t.label}</span>
                  <span className="text-[8px] text-white/25">{t.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Row 5: Weak/Strong Areas + Achievement + Leaderboard ── */}
          <div
            className={`col-span-6 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 transition-all duration-500 delay-500 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="flex flex-col gap-1.5">
              <div>
                <p className="text-[9px] text-white/30 mb-1 uppercase tracking-wider">Strong</p>
                <div className="flex flex-wrap gap-1">
                  {["React", "System Design"].map((s) => (
                    <span key={s} className="text-[8px] px-1.5 py-0.5 rounded bg-white/10 text-white/60">{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] text-white/30 mb-1 uppercase tracking-wider">Improve</p>
                <div className="flex flex-wrap gap-1">
                  {["DP", "SQL"].map((s) => (
                    <span key={s} className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div
            className={`col-span-6 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 transition-all duration-500 delay-[550ms] ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <p className="text-[10px] text-white/40 mb-2 font-medium uppercase tracking-wider">Leaderboard</p>
            <div className="flex flex-col gap-1">
              {[
                { rank: 1, name: "alex_k", score: 96 },
                { rank: 2, name: "you", score: 84, highlight: true },
                { rank: 3, name: "priya_s", score: 81 },
              ].map((u) => (
                <div
                  key={u.rank}
                  className={`flex items-center gap-1.5 rounded px-1 py-0.5 ${
                    u.highlight ? "bg-white/10" : ""
                  }`}
                >
                  <span className="text-[8px] text-white/30 w-3">{u.rank}</span>
                  <span className={`text-[9px] flex-1 ${u.highlight ? "text-white font-semibold" : "text-white/50"}`}>
                    {u.name}
                  </span>
                  <span className="text-[9px] text-white/60">{u.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Achievement badge */}
          <div
            className={`col-span-12 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 transition-all duration-500 delay-[600ms] ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="text-lg" aria-hidden="true">🏆</div>
            <div>
              <p className="text-[10px] text-white/70 font-semibold">7-Day Streak Achieved</p>
              <p className="text-[9px] text-white/30">You're in the top 15% this week</p>
            </div>
            <div className="ml-auto badge-pill">
              <span className="text-[9px]">New</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

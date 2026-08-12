/**
 * AuthBackground
 * Subtle, blurred dashboard-inspired interface elements floating behind the auth card.
 * Everything is pointer-events:none, aria-hidden, and kept at very low opacity.
 * Never distracts from the form — purely atmospheric.
 */

/* ── Mini score ring (SVG only) ── */
function TinyRing({ value = 78, size = 56, opacity = 0.5 }) {
  const r = (size - 5) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={`rgba(255,255,255,${opacity * 0.12})`} strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={`rgba(255,255,255,${opacity * 0.55})`} strokeWidth={4}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
    </svg>
  );
}

/* ── Tiny bar chart ── */
function TinyBars({ bars = [40, 65, 50, 80, 60], opacity = 0.5 }) {
  return (
    <div className="flex items-end gap-0.5" style={{ height: 28 }}>
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-3 rounded-sm"
          style={{
            height: `${h}%`,
            background: `rgba(255,255,255,${opacity * 0.4})`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Tiny feedback line ── */
function FeedbackLine({ icon, text, color, opacity = 0.5 }) {
  return (
    <div
      className="flex items-center gap-2 text-[10px] rounded-lg px-2.5 py-1.5 border"
      style={{
        borderColor: `rgba(255,255,255,${opacity * 0.12})`,
        background: `rgba(255,255,255,${opacity * 0.03})`,
        color: `rgba(255,255,255,${opacity * 0.5})`,
      }}
    >
      <span>{icon}</span>
      <span className="truncate">{text}</span>
    </div>
  );
}

/* ── Ghost card wrapper ── */
function GhostCard({ children, className = "", style = {} }) {
  return (
    <div
      className={`absolute rounded-2xl border pointer-events-none select-none ${className}`}
      style={{
        borderColor: "rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.015)",
        backdropFilter: "blur(2px)",
        ...style,
      }}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

export default function AuthBackground() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* ── Radial centre glow ── */}
      <div
        className="absolute inset-0 bg-pulse"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 45%, rgba(255,255,255,0.025) 0%, transparent 65%)",
        }}
      />

      {/* ── Grid ── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.6,
        }}
      />

      {/* ── Top-left: score card ghost ── */}
      <GhostCard
        className="bg-drift"
        style={{
          top: "8%",
          left: "4%",
          padding: "14px",
          opacity: 0,
          animation: "bgPulse 7s ease-in-out 0.4s infinite, bgDrift 22s ease-in-out 1s infinite",
          animationFillMode: "forwards",
        }}
      >
        <div style={{ opacity: 0.65 }}>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginBottom: 8, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Overall Score
          </p>
          <div className="flex items-center gap-3">
            <TinyRing value={84} size={52} opacity={0.8} />
            <div>
              <p style={{ fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.55)", lineHeight: 1 }}>84</p>
              <p style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>↑ 6 from last week</p>
            </div>
          </div>
        </div>
      </GhostCard>

      {/* ── Top-right: weekly bars ghost ── */}
      <GhostCard
        style={{
          top: "6%",
          right: "5%",
          padding: "12px 14px",
          opacity: 0,
          animation: "bgPulse 8s ease-in-out 1.2s infinite, bgDrift 25s ease-in-out 2s infinite",
          animationFillMode: "forwards",
        }}
      >
        <div style={{ opacity: 0.55 }}>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Weekly Progress
          </p>
          <TinyBars bars={[45, 70, 52, 85, 63, 90, 74]} opacity={0.8} />
        </div>
      </GhostCard>

      {/* ── Bottom-left: AI feedback ghost ── */}
      <GhostCard
        style={{
          bottom: "10%",
          left: "3%",
          padding: "12px",
          width: 200,
          opacity: 0,
          animation: "bgPulse 9s ease-in-out 2s infinite, bgDrift 20s ease-in-out 0.5s infinite",
          animationFillMode: "forwards",
          display: "flex",
          flexDirection: "column",
          gap: 5,
        }}
      >
        <div style={{ opacity: 0.5 }}>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            AI Feedback
          </p>
          <FeedbackLine icon="✓" text="Strong introduction" color="emerald" opacity={0.9} />
          <FeedbackLine icon="⚠" text="Add measurable results" color="amber" opacity={0.9} />
          <FeedbackLine icon="💡" text="Mention your projects" color="sky" opacity={0.9} />
        </div>
      </GhostCard>

      {/* ── Bottom-right: skill bars ghost ── */}
      <GhostCard
        style={{
          bottom: "8%",
          right: "4%",
          padding: "12px 14px",
          width: 170,
          opacity: 0,
          animation: "bgPulse 7.5s ease-in-out 1.8s infinite, bgDrift 28s ease-in-out 3s infinite",
          animationFillMode: "forwards",
        }}
      >
        <div style={{ opacity: 0.5 }}>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginBottom: 8, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Skills
          </p>
          {[
            { label: "Technical", pct: 88 },
            { label: "Communication", pct: 76 },
            { label: "Problem Solving", pct: 82 },
          ].map(({ label, pct }) => (
            <div key={label} style={{ marginBottom: 5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 8, color: "rgba(255,255,255,0.25)" }}>{label}</span>
                <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)" }}>{pct}%</span>
              </div>
              <div style={{ height: 3, borderRadius: 9999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", borderRadius: 9999, background: "rgba(255,255,255,0.3)" }} />
              </div>
            </div>
          ))}
        </div>
      </GhostCard>

      {/* ── Mid-left: activity dot indicator ── */}
      <GhostCard
        style={{
          top: "42%",
          left: "2%",
          padding: "10px 12px",
          opacity: 0,
          animation: "bgPulse 10s ease-in-out 3s infinite",
          animationFillMode: "forwards",
        }}
      >
        <div style={{ opacity: 0.4, display: "flex", flexDirection: "column", gap: 5 }}>
          {["System Design · 91", "React Interview · 84", "DSA Round · 71"].map((t) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>{t}</span>
            </div>
          ))}
        </div>
      </GhostCard>

      {/* ── Mid-right: streak badge ── */}
      <GhostCard
        style={{
          top: "38%",
          right: "3%",
          padding: "8px 12px",
          opacity: 0,
          animation: "bgPulse 11s ease-in-out 2.4s infinite",
          animationFillMode: "forwards",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div style={{ opacity: 0.45, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14 }}>🏆</span>
          <div>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>7-Day Streak</p>
            <p style={{ fontSize: 8, color: "rgba(255,255,255,0.2)" }}>Top 15% this week</p>
          </div>
        </div>
      </GhostCard>

      {/* ── Vignette edges ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(10,10,10,0.7) 100%)",
        }}
      />
    </div>
  );
}

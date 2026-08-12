import { useState, useEffect, useRef } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";

const ANSWER_PLACEHOLDER =
  "I'm a software engineer with 2 years of experience building React applications. I graduated in Computer Science and have worked on projects involving REST APIs, state management with Redux, and building accessible UI components...";

const FEEDBACK_ITEMS = [
  {
    type: "positive",
    icon: "✓",
    text: "Strong introduction — you led with your domain and experience level.",
  },
  {
    type: "warning",
    icon: "⚠",
    text: "Mention at least one measurable achievement (e.g. improved performance by 30%).",
  },
  {
    type: "tip",
    icon: "💡",
    text: "Talk about your React projects — connect your skills directly to the job.",
  },
  {
    type: "warning",
    icon: "⚠",
    text: "Avoid vague phrases like 'various projects' — be specific.",
  },
  {
    type: "positive",
    icon: "✓",
    text: "Good structure — introduction, experience, skills. Keep this format.",
  },
];

const SCORE_ITEMS = [
  { label: "Clarity", value: 82 },
  { label: "Confidence", value: 74 },
  { label: "Relevance", value: 88 },
];

const TYPING_TEXT =
  "I'm a software engineer with 2 years of experience building React apps. I've worked on REST APIs, Redux, and accessible UI components...";

export default function InteractiveDemo() {
  const sectionRef = useScrollReveal({ threshold: 0.1 });
  const [showFeedback, setShowFeedback] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [feedbackVisible, setFeedbackVisible] = useState([]);
  const [hasStarted, setHasStarted] = useState(false);
  const typingRef = useRef(null);
  const charRef = useRef(0);

  const startDemo = () => {
    if (hasStarted) return;
    setHasStarted(true);
    setIsTyping(true);
    setDisplayedText("");
    setShowFeedback(false);
    setFeedbackVisible([]);
    charRef.current = 0;

    const typeNext = () => {
      if (charRef.current < TYPING_TEXT.length) {
        charRef.current++;
        setDisplayedText(TYPING_TEXT.slice(0, charRef.current));
        typingRef.current = setTimeout(typeNext, 28 + Math.random() * 20);
      } else {
        setIsTyping(false);
        setTimeout(() => {
          setShowFeedback(true);
          FEEDBACK_ITEMS.forEach((_, i) => {
            setTimeout(() => {
              setFeedbackVisible((prev) => [...prev, i]);
            }, i * 280);
          });
        }, 500);
      }
    };
    typeNext();
  };

  const resetDemo = () => {
    clearTimeout(typingRef.current);
    setHasStarted(false);
    setIsTyping(false);
    setDisplayedText("");
    setShowFeedback(false);
    setFeedbackVisible([]);
    charRef.current = 0;
  };

  useEffect(() => () => clearTimeout(typingRef.current), []);

  const feedbackColor = {
    positive: "text-emerald-400",
    warning: "text-amber-400",
    tip: "text-sky-400",
  };

  const feedbackBg = {
    positive: "bg-emerald-400/[0.06] border-emerald-400/20",
    warning: "bg-amber-400/[0.06] border-amber-400/20",
    tip: "bg-sky-400/[0.06] border-sky-400/20",
  };

  return (
    <section
      id="interactive-demo"
      ref={sectionRef}
      aria-labelledby="demo-heading"
      className="py-24 sm:py-32"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <p className="reveal text-center text-xs font-medium uppercase tracking-widest text-white/25 mb-4">
          Interactive Demo
        </p>
        <h2
          id="demo-heading"
          className="reveal text-center text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4"
        >
          See TITAN in action.
        </h2>
        <p className="reveal text-center text-base text-white/45 max-w-xl mx-auto mb-12">
          A real interview experience — with live AI feedback on every answer you give.
        </p>

        {/* Demo container */}
        <div className="reveal rounded-2xl border border-white/[0.08] bg-[#111111] overflow-hidden">

          {/* Terminal-style top bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
            </div>
            <span className="text-[11px] text-white/30 font-mono">TITAN Interview — Round 1 / Behavioural</span>
            <div
              className="flex items-center gap-1.5 text-[10px] text-white/30"
              aria-label="Recording indicator"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500/70 animate-pulse-subtle" aria-hidden="true" />
              REC
            </div>
          </div>

          <div className="p-5 sm:p-6 grid lg:grid-cols-2 gap-6">

            {/* ── Left: Question + answer ── */}
            <div className="flex flex-col gap-4">

              {/* AI question */}
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.06] border border-white/[0.08] flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                  >
                    <span className="text-[10px] font-bold text-white/60">AI</span>
                  </div>
                  <div>
                    <p className="text-[11px] text-white/30 mb-1">Behavioural Question 1 of 5</p>
                    <p className="text-sm font-medium text-white leading-relaxed">
                      "Tell me about yourself."
                    </p>
                  </div>
                </div>
              </div>

              {/* Candidate response box */}
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-white/30">Your response</p>
                  {isTyping && (
                    <span className="text-[10px] text-white/30 flex items-center gap-1" aria-live="polite">
                      <span className="w-1 h-1 rounded-full bg-white/40 animate-pulse-subtle" aria-hidden="true" />
                      Analysing…
                    </span>
                  )}
                </div>

                <div
                  className="min-h-[80px] text-sm text-white/65 leading-relaxed"
                  aria-live="polite"
                  aria-label="Candidate answer"
                >
                  {displayedText}
                  {isTyping && (
                    <span className="inline-block w-0.5 h-4 bg-white/60 ml-0.5 animate-pulse-subtle align-middle" aria-hidden="true" />
                  )}
                  {!hasStarted && (
                    <span className="text-white/20 italic">
                      Click "Start Demo" to simulate your answer…
                    </span>
                  )}
                </div>

                {/* Scores */}
                {showFeedback && (
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.06]">
                    {SCORE_ITEMS.map(({ label, value }) => (
                      <div key={label} className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] text-white/40">
                          <span>{label}</span>
                          <span>{value}</span>
                        </div>
                        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-white/60 transition-all duration-1000"
                            style={{ width: `${value}%`, transitionDelay: "200ms" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                {!hasStarted ? (
                  <button
                    onClick={startDemo}
                    className="btn-scale flex-1 py-2.5 text-sm font-medium text-black bg-white rounded-lg hover:bg-white/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 cursor-pointer"
                  >
                    Start Demo
                  </button>
                ) : (
                  <button
                    onClick={resetDemo}
                    className="btn-scale flex-1 py-2.5 text-sm font-medium text-white/60 border border-white/[0.12] rounded-lg hover:border-white/25 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* ── Right: AI feedback panel ── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-white/30 uppercase tracking-wider">AI Feedback</p>
                {showFeedback && (
                  <span className="badge-pill" aria-label="Feedback ready">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" aria-hidden="true" />
                    <span className="text-[9px]">Live</span>
                  </span>
                )}
              </div>

              <div
                className="flex flex-col gap-2"
                aria-live="polite"
                aria-label="AI feedback items"
              >
                {!showFeedback && !hasStarted && (
                  <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 flex flex-col gap-2">
                    {[80, 60, 90, 70].map((w, i) => (
                      <div key={i} className="h-2 rounded-full bg-white/[0.06]" style={{ width: `${w}%` }} aria-hidden="true" />
                    ))}
                    <p className="text-xs text-white/20 mt-2 text-center">Feedback will appear here</p>
                  </div>
                )}

                {FEEDBACK_ITEMS.map((item, i) => (
                  <div
                    key={i}
                    className={`
                      flex items-start gap-3 rounded-xl border p-3
                      transition-all duration-300
                      ${feedbackBg[item.type]}
                      ${feedbackVisible.includes(i)
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-2 pointer-events-none"
                      }
                    `}
                    role="listitem"
                  >
                    <span
                      className={`text-sm font-bold flex-shrink-0 mt-0.5 ${feedbackColor[item.type]}`}
                      aria-hidden="true"
                    >
                      {item.icon}
                    </span>
                    <p className="text-xs text-white/65 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>

              {showFeedback && (
                <div className="mt-2 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 flex items-center justify-between">
                  <span className="text-xs text-white/40">Overall answer quality</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full w-[78%] rounded-full bg-white/60 transition-all duration-1000" style={{ transitionDelay: "400ms" }} />
                    </div>
                    <span className="text-xs font-bold text-white">78</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* CTA below demo */}
        <p className="reveal text-center text-sm text-white/35 mt-8">
          Every real interview session has full feedback, skill scores, and improvement suggestions.
        </p>

      </div>
    </section>
  );
}

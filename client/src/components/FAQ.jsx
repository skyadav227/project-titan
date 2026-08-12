import { useState } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";

const FAQS = [
  {
    q: "Is TITAN really free?",
    a: "Yes — completely. No credit card, no trial period, no hidden tier. TITAN is built on the belief that interview prep should be accessible to everyone, regardless of their background or financial situation.",
  },
  {
    q: "How does the resume-based interview work?",
    a: "You upload your resume (PDF or text). TITAN's AI parses your experience, projects, skills, and education, then generates interview questions directly from your background — exactly like a real interviewer who studied your CV before the call.",
  },
  {
    q: "Can I practice for a specific company?",
    a: "Yes. TITAN's company mode uses publicly known interview patterns, question styles, and technical expectations for specific companies to tailor your preparation — without fabricating proprietary content.",
  },
  {
    q: "What does live coaching actually do?",
    a: "During the interview, TITAN analyses your answer in real time and shows feedback after each response: what landed well, what to improve, filler words, and concrete suggestions. It's like having a senior engineer debrief you after every answer.",
  },
  {
    q: "How is TITAN different from LeetCode or Pramp?",
    a: "LeetCode focuses on algorithmic challenges with no personalisation. Pramp gives you a human peer — which is great but not always available. TITAN is personalised to your resume, available 24/7, covers the full interview loop (DSA, system design, behavioural, communication), and provides structured reports every session.",
  },
  {
    q: "Does TITAN help with communication, not just technical skills?",
    a: "Yes. Communication is a first-class feature. TITAN tracks filler words, response structure, clarity, and confidence signals — then gives you targeted coaching. You can be technically strong and still fail interviews due to poor delivery. TITAN addresses both.",
  },
  {
    q: "Can I track my progress over time?",
    a: "Every session is stored and feeds into your dashboard. You'll see score trends across sessions, skill-by-skill progress, weak areas to focus on, and a leaderboard to benchmark yourself against other users.",
  },
  {
    q: "What types of interviews does TITAN support?",
    a: "Resume-based interviews, job description matching, company-specific prep, behavioural rounds, technical DSA sessions, and system design interviews. More modes are being added regularly.",
  },
];

function FAQItem({ q, a, isOpen, onToggle, index }) {
  return (
    <div className="border-b border-white/[0.05]">
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-sm cursor-pointer group"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${index}`}
        id={`faq-question-${index}`}
      >
        <span className="text-sm sm:text-base font-medium text-white/80 group-hover:text-white transition-colors leading-relaxed">
          {q}
        </span>
        <span
          className={`flex-shrink-0 w-5 h-5 mt-0.5 text-white/40 transition-transform duration-300 ${
            isOpen ? "rotate-45" : ""
          }`}
          aria-hidden="true"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </span>
      </button>

      <div
        id={`faq-answer-${index}`}
        role="region"
        aria-labelledby={`faq-question-${index}`}
        className="overflow-hidden transition-all duration-350 ease-in-out"
        style={{
          maxHeight: isOpen ? "400px" : "0px",
          opacity: isOpen ? 1 : 0,
          transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease",
        }}
      >
        <p className="pb-5 text-sm text-white/45 leading-relaxed pr-8">
          {a}
        </p>
      </div>
    </div>
  );
}

export default function FAQ() {
  const ref = useScrollReveal({ threshold: 0.08 });
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (i) => setOpenIndex((prev) => (prev === i ? -1 : i));

  return (
    <section
      id="faq"
      ref={ref}
      aria-labelledby="faq-heading"
      className="py-24 sm:py-32"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <p className="reveal text-center text-xs font-medium uppercase tracking-widest text-white/25 mb-4">
          FAQ
        </p>
        <h2
          id="faq-heading"
          className="reveal text-center text-3xl sm:text-4xl font-bold text-white tracking-tight mb-14"
        >
          Common questions.
        </h2>

        {/* Accordion */}
        <div className="reveal" role="list">
          {FAQS.map((item, i) => (
            <FAQItem
              key={item.q}
              q={item.q}
              a={item.a}
              isOpen={openIndex === i}
              onToggle={() => toggle(i)}
              index={i}
            />
          ))}
        </div>

      </div>
    </section>
  );
}

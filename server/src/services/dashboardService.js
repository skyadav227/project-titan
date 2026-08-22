/**
 * dashboardService.js
 *
 * Lightweight aggregation service for the TITAN Dashboard.
 * Draws exclusively from existing models (InterviewSession, ResumeVersion) —
 * creates zero duplicate data structures.
 *
 * Returns one consolidated object so the frontend makes a single API
 * call instead of 3–4 separate ones.
 *
 * Per dashboard spec: correctness > premature optimization.
 * Queries are kept simple and index-backed (userId + createdAt/completedAt).
 *
 * Fixes applied vs initial draft:
 *   - Removed unused AnswerAttempt import (Bug 1)
 *   - hasResume derived from ResumeVersion directly, not from isFirstTimeUser (Bug 2)
 *   - interviewsCompleted uses countDocuments, not completedSessions.length (Bug 8)
 *   - completedSessions limit raised from 10 → 50 (Bug 8)
 */
"use strict";

const InterviewSession = require("../models/InterviewSession");
const ResumeVersion    = require("../models/ResumeVersion");

/**
 * Build the complete dashboard stats object for a user.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
async function getDashboardStats(userId) {
  // ── 1. Parallel fetches ───────────────────────────────────────────────────
  const [
    allSessions,
    completedSessions,
    resumeVersion,
    totalSessions,
    completedSessionsCount,
  ] = await Promise.all([
    // All sessions newest-first (for activity feed + totalQuestionsAnswered)
    InterviewSession.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("status configuration finalReport startedAt completedAt createdAt progress interviewContextSnapshot")
      .lean(),

    // Completed sessions with ready reports (for scores + performance + recent list)
    InterviewSession.find({ userId, status: "completed", "finalReport.status": "ready" })
      .sort({ completedAt: -1 })
      .limit(50)
      .select("configuration finalReport completedAt createdAt interviewContextSnapshot")
      .lean(),

    // Active resume — the source of truth for resume existence
    ResumeVersion.findOne({ userId, isActive: true })
      .select("fileName fileType createdAt updatedAt")
      .lean(),

    // Accurate total session count (not capped by any limit)
    InterviewSession.countDocuments({ userId }),

    // Accurate completed-with-report count (not capped by limit above)
    InterviewSession.countDocuments({ userId, status: "completed", "finalReport.status": "ready" }),
  ]);

  // ── 2. User state flags ───────────────────────────────────────────────────
  const isFirstTimeUser = totalSessions === 0;

  // hasResume is derived exclusively from ResumeVersion, not from interview state.
  // A user can have an active resume with zero interviews, or interviews with no resume.
  const hasResume = !!resumeVersion;

  // ── 3. Stats ──────────────────────────────────────────────────────────────
  // Use countDocuments result — not capped by the query limit
  const sessionsCompleted = completedSessionsCount;

  // Overall score: average across all completed+ready sessions (up to 50)
  const allScores = completedSessions
    .map(s => s.finalReport?.overallScore)
    .filter(s => s !== null && s !== undefined);

  const overallScore = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : null;

  // Previous score: average excluding the most-recent session
  const prevScores = allScores.slice(1);
  const previousScore = prevScores.length > 0
    ? Math.round(prevScores.reduce((a, b) => a + b, 0) / prevScores.length)
    : null;

  const scoreDelta = (overallScore !== null && previousScore !== null)
    ? overallScore - previousScore
    : null;

  // Total questions answered — sum across all sessions (all statuses, capped at 20)
  const totalQuestionsAnswered = allSessions.reduce(
    (sum, s) => sum + (s.progress?.questionsCompleted || 0), 0
  );

  // ── 4. Per-dimension performance (from finalReport.dimensions) ────────────
  // Fields confirmed in InterviewSession.finalReport.dimensions schema:
  //   technicalAccuracy, communication, clarity, structure, relevance, problemSolving
  const dimFields = ["technicalAccuracy", "communication", "clarity", "structure", "relevance"];
  const dimTotals = {};
  const dimCounts = {};
  for (const f of dimFields) { dimTotals[f] = 0; dimCounts[f] = 0; }

  for (const s of completedSessions) {
    const dims = s.finalReport?.dimensions || {};
    for (const f of dimFields) {
      if (dims[f] !== null && dims[f] !== undefined) {
        dimTotals[f] += dims[f];
        dimCounts[f]++;
      }
    }
  }

  const performance = {
    overall: {
      score: overallScore,
      delta: scoreDelta,
    },
    technical: {
      score: dimCounts.technicalAccuracy > 0
        ? Math.round(dimTotals.technicalAccuracy / dimCounts.technicalAccuracy)
        : null,
      delta: null,
    },
    communication: {
      score: dimCounts.communication > 0
        ? Math.round(dimTotals.communication / dimCounts.communication)
        : null,
      delta: null,
    },
    clarity: {
      score: dimCounts.clarity > 0
        ? Math.round(dimTotals.clarity / dimCounts.clarity)
        : null,
      delta: null,
    },
  };

  // ── 5. Knowledge gaps and strengths ───────────────────────────────────────
  // Aggregate across all completed sessions, frequency-ranked.
  // Source: finalReport.knowledgeGaps (gaps) and finalReport.strengths (strengths)
  // Note: finalReport.improvements is a separate AI-generated field; we use
  //       knowledgeGaps for the "improve" column as it is more precise.
  const gapCounter      = {};
  const strengthCounter = {};

  for (const s of completedSessions) {
    for (const gap of (s.finalReport?.knowledgeGaps || [])) {
      gapCounter[gap] = (gapCounter[gap] || 0) + 1;
    }
    for (const str of (s.finalReport?.strengths || [])) {
      strengthCounter[str] = (strengthCounter[str] || 0) + 1;
    }
  }

  const topGaps = Object.entries(gapCounter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label]) => label);

  const topStrengths = Object.entries(strengthCounter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label]) => label);

  // ── 6. Recent interviews (up to 5 completed with ready reports) ──────────
  const recentInterviews = completedSessions.slice(0, 5).map(s => ({
    id:          s._id.toString(),
    role:        s.configuration?.targetRole || s.interviewContextSnapshot?.targetRole || "Interview",
    company:     s.configuration?.company    || "",
    type:        _formatType(s.configuration?.interviewType),
    date:        s.completedAt || s.createdAt,
    score:       s.finalReport?.overallScore ?? null,
    reportRoute: `/interview/session/${s._id}`,
    sessionId:   s._id.toString(),
  }));

  // ── 7. Activity feed ──────────────────────────────────────────────────────
  // Derived from session events (completed/started) + resume upload timestamp.
  const activityEvents = [];

  for (const s of allSessions.slice(0, 8)) {
    if (s.status === "completed" && s.completedAt) {
      activityEvents.push({
        id:   `itv_${s._id}`,
        type: "interview",
        label: _buildActivityLabel(s),
        time: s.completedAt,
        ts:   new Date(s.completedAt).getTime(),
      });
      if (s.finalReport?.status === "ready") {
        activityEvents.push({
          id:   `rep_${s._id}`,
          type: "report",
          label: `Report generated — ${s.configuration?.targetRole || "Interview"}`,
          time: s.completedAt,
          ts:   new Date(s.completedAt).getTime() + 1, // ensure sort after interview event
        });
      }
    } else if (["active", "abandoned"].includes(s.status) && s.startedAt) {
      activityEvents.push({
        id:   `itv_started_${s._id}`,
        type: "interview",
        label: `Started interview${s.configuration?.targetRole ? ` — ${s.configuration.targetRole}` : ""}`,
        time: s.startedAt,
        ts:   new Date(s.startedAt).getTime(),
      });
    }
  }

  if (resumeVersion) {
    activityEvents.push({
      id:   `rsm_${resumeVersion._id}`,
      type: "resume",
      label: `Resume uploaded — ${resumeVersion.fileName}`,
      time: resumeVersion.createdAt,
      ts:   new Date(resumeVersion.createdAt).getTime(),
    });
  }

  activityEvents.sort((a, b) => b.ts - a.ts);
  const activityFeed = activityEvents.slice(0, 6).map(e => ({
    id:    e.id,
    type:  e.type,
    label: e.label,
    time:  _relativeTime(e.time),
  }));

  // ── 8. Today's missions (rule-based, non-fabricated) ─────────────────────
  const missions = _buildMissions({
    sessionsCompleted,
    recentInterviews,
    completedSessions,
    hasResume,
  });

  // ── 9. AI Mentor (deterministic, no external AI call) ─────────────────────
  const aiMentor = _buildAiMentor({
    isFirstTimeUser,
    topGaps,
    topStrengths,
    overallScore,
    scoreDelta,
    hasResume,
    sessionsCompleted,
  });

  // ── 10. Skills (qualitative, from finalReport aggregation) ───────────────
  // level is always null — no per-skill numeric scores exist in the data model.
  // SkillsOverviewCard must handle level === null gracefully.
  const skills = sessionsCompleted > 0 ? {
    strong:      topStrengths.slice(0, 4).map(name => ({ name, level: null })),
    improve:     topGaps.slice(0, 4).map(name => ({ name, level: null })),
    recommended: topGaps.slice(0, 3),
    hasData:     true,
  } : null;

  // ── Return ────────────────────────────────────────────────────────────────
  return {
    isFirstTimeUser,
    hasResume,           // explicit field — derived from ResumeVersion, not isFirstTimeUser
    stats: {
      interviewsCompleted:   sessionsCompleted,     // from countDocuments, not array.length
      totalSessions,
      totalQuestionsAnswered,
      overallScore,
      previousScore,
      // V1: these require features not yet implemented
      streak:        null,
      rank:          null,
      totalUsers:    null,
      level:         null,
      levelProgress: null,
    },
    performance,
    recentInterviews,
    activityFeed,
    todaysMissions: missions,
    aiMentor,
    skills,
  };
}

// ── Private helpers ───────────────────────────────────────────────────────────

function _formatType(interviewType) {
  const map = {
    technical:    "Technical",
    behavioral:   "Behavioral",
    mixed:        "Technical + Behavioral",
    role_specific:"Role-Specific",
  };
  return map[interviewType] || interviewType || "Interview";
}

function _buildActivityLabel(session) {
  const role    = session.configuration?.targetRole || "";
  const company = session.configuration?.company    || "";
  if (role && company) return `Completed interview — ${role} at ${company}`;
  if (role)            return `Completed interview — ${role}`;
  return "Completed interview";
}

function _relativeTime(dateInput) {
  if (!dateInput) return "";
  const now  = Date.now();
  const then = new Date(dateInput).getTime();
  if (isNaN(then)) return "";
  const diff = now - then;

  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);

  if (mins < 2)   return "Just now";
  if (mins < 60)  return `${mins} minutes ago`;
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  if (days === 1) return "Yesterday";
  if (days < 7)   return `${days} days ago`;
  if (weeks === 1)return "1 week ago";
  return `${weeks} weeks ago`;
}

function _buildMissions({ sessionsCompleted, recentInterviews, completedSessions, hasResume }) {
  const missions = [];

  // Mission: Upload resume (only shown when no active resume exists)
  if (!hasResume) {
    missions.push({
      id:        "upload_resume",
      label:     "Upload your resume",
      completed: false,
      route:     "/resume",
    });
  }

  // Mission: Complete an interview today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const interviewedToday = completedSessions.some(s => {
    const d = s.completedAt ? new Date(s.completedAt) : null;
    return d && d >= today;
  });
  missions.push({
    id:        "complete_interview",
    label:     "Complete an interview",
    completed: interviewedToday,
    route:     "/interview/setup",
  });

  // Mission: Review last report (only when a scored report exists)
  if (recentInterviews.length > 0 && recentInterviews[0].score !== null) {
    missions.push({
      id:        "review_report",
      label:     "Review your latest report",
      completed: false,
      route:     recentInterviews[0].reportRoute,
    });
  }

  // Mission: Build history (shown when fewer than 3 completed sessions)
  if (sessionsCompleted < 3) {
    const remaining = 3 - sessionsCompleted;
    missions.push({
      id:        "build_history",
      label:     `Complete ${remaining} more interview${remaining !== 1 ? "s" : ""} to unlock performance trends`,
      completed: false,
      route:     "/interview/setup",
    });
  }

  return missions.slice(0, 4);
}

function _buildAiMentor({ isFirstTimeUser, topGaps, overallScore, scoreDelta, hasResume, sessionsCompleted }) {
  // First-time user: onboarding-focused
  if (isFirstTimeUser) {
    if (hasResume) {
      return {
        recommendation: "Your resume is ready — start your first interview so TITAN can tailor every question to your real experience.",
        reason:         "Resume-aware interviews produce significantly more actionable feedback.",
        ctaLabel:       "Start First Interview",
        ctaRoute:       "/interview/setup",
      };
    }
    return {
      recommendation: "Start by uploading your resume so TITAN can personalise your interview questions to your actual projects and skills.",
      reason:         "Resume-aware interviews produce significantly more actionable feedback.",
      ctaLabel:       "Upload Resume",
      ctaRoute:       "/resume",
    };
  }

  // Returning user: data-driven
  if (topGaps.length > 0 && sessionsCompleted >= 2) {
    return {
      recommendation: `Focus on "${topGaps[0]}" — it appears as a gap in your recent sessions.`,
      reason:         topGaps.length > 1
        ? `Also identified: ${topGaps.slice(1, 3).join(", ")}.`
        : "Targeted practice on weak areas produces the fastest score improvement.",
      ctaLabel: "Practice Now",
      ctaRoute: "/interview/setup",
    };
  }

  if (overallScore !== null && overallScore < 60) {
    return {
      recommendation: "Your answers are good — focus on structuring them more clearly.",
      reason:         "Structured answers score consistently higher on clarity and completeness.",
      ctaLabel:       "Start Interview",
      ctaRoute:       "/interview/setup",
    };
  }

  if (scoreDelta !== null && scoreDelta > 0) {
    return {
      recommendation: `You improved by ${scoreDelta} points since your previous session. Keep going.`,
      reason:         "Consistent practice is the strongest predictor of interview performance.",
      ctaLabel:       "Start Interview",
      ctaRoute:       "/interview/setup",
    };
  }

  // Generic fallback
  return {
    recommendation: sessionsCompleted > 0
      ? "Complete another interview to unlock personalised recommendations based on your performance patterns."
      : "Start your first interview to unlock AI-powered coaching recommendations.",
    reason:    "TITAN learns from your answers to provide targeted guidance.",
    ctaLabel:  "Start Interview",
    ctaRoute:  "/interview/setup",
  };
}

module.exports = { getDashboardStats };

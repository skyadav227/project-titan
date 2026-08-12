/**
 * dashboardMockData.js
 *
 * Realistic mock data for the TITAN Dashboard.
 * This file is the single source of truth for all dashboard card content.
 * Replace these values with real API responses when the backend is ready.
 *
 * Two exports:
 *   firstTimeUserData  — user who has never completed an interview
 *   returningUserData  — user with a history of completed interviews
 */

// ─── First-Time User ────────────────────────────────────────────────────────

export const firstTimeUserData = {
  user: {
    name: "Sher",
    email: "Karthik@example.com",
    avatarInitials: "SKY",
    joinedDate: "2026-08-06",
  },

  stats: {
    interviewsCompleted: 0,
    streak: 0,
    rank: null,
    level: "Beginner",
    overallScore: null,
  },

  onboarding: { 
    // Each item: { id, label, completed, action (route or null) }
    checklist: [
      { id: "resume",    label: "Upload your resume",        completed: false, route: "/resume" },
      { id: "role",      label: "Choose your target role",   completed: false, route: "/interview" },
      { id: "skills",    label: "Select your tech stack",    completed: false, route: "/interview" },
      { id: "interview", label: "Complete your first interview", completed: false, route: "/interview" },
      { id: "report",    label: "Review your first report",  completed: false, route: "/report" },
    ],
  },

  // First-time AI mentor content is purely explanatory
  aiMentor: {
    recommendation: "Start by uploading your resume so TITAN can tailor every question to your real experience.",
    reason: "Resume-aware interviews feel 40% more realistic and produce more actionable feedback.",
    ctaLabel: "Upload Resume",
    ctaRoute: "/resume",
  },
};

// ─── Returning User ──────────────────────────────────────────────────────────

export const returningUserData = {
  user: {
    name: "Sher",
    email: "Karthik@example.com",
    avatarInitials: "SKY",
    joinedDate: "2026-06-14",
  },

  stats: {
    interviewsCompleted: 12,
    streak: 5,           // days
    rank: 142,           // leaderboard position
    totalUsers: 4800,
    level: "Intermediate",
    levelProgress: 68,   // % toward next level
    overallScore: 74,    // out of 100
    previousScore: 68,   // last week
  },

  performance: {
    overall:       { score: 74, delta: +6 },
    communication: { score: 81, delta: +4 },
    technical:     { score: 67, delta: +8 },
    confidence:    { score: 72, delta: +3 },
  },

  todaysMissions: [
    { id: "m1", label: "Complete one interview",         completed: true,  route: "/interview" },
    { id: "m2", label: "Review yesterday's report",      completed: false, route: "/report" },
    { id: "m3", label: "Practice system design answers", completed: false, route: "/interview" },
  ],

  skills: {
    strong: [
      { name: "React",            level: 88 },
      { name: "Communication",    level: 81 },
      { name: "Problem Solving",  level: 78 },
      { name: "JavaScript",       level: 76 },
    ],
    improve: [
      { name: "System Design",    level: 51 },
      { name: "SQL",              level: 55 },
      { name: "Behavioural",      level: 58 },
      { name: "TypeScript",       level: 62 },
    ],
    recommended: [
      "STAR method answers",
      "LLD interview patterns",
      "Async JavaScript deep dive",
    ],
  },

  aiMentor: {
    recommendation: "Focus on system design this week — it's your weakest area and appears in 80% of senior frontend interviews.",
    reason: "Your last 3 interviews included system design questions where scores dropped below 55.",
    ctaLabel: "Practice System Design",
    ctaRoute: "/interview",
  },

  recentInterviews: [
    {
      id: "i1",
      role: "Senior Frontend Engineer",
      company: "Stripe",
      type: "Technical",
      date: "2026-08-05",
      score: 78,
      reportRoute: "/report",
    },
    {
      id: "i2",
      role: "Frontend Developer",
      company: "Razorpay",
      type: "Technical + Behavioural",
      date: "2026-08-03",
      score: 71,
      reportRoute: "/report",
    },
    {
      id: "i3",
      role: "React Developer",
      company: "Atlassian",
      type: "Technical",
      date: "2026-07-31",
      score: 69,
      reportRoute: "/report",
    },
    {
      id: "i4",
      role: "UI Engineer",
      company: "Figma",
      type: "Behavioural",
      date: "2026-07-28",
      score: 82,
      reportRoute: "/report",
    },
    {
      id: "i5",
      role: "Frontend Engineer",
      company: "Vercel",
      type: "Technical",
      date: "2026-07-24",
      score: 66,
      reportRoute: "/report",
    },
  ],

  activityFeed: [
    {
      id: "a1",
      type: "interview",
      label: "Completed interview at Stripe",
      time: "2 hours ago",
    },
    {
      id: "a2",
      type: "report",
      label: "Report generated — Stripe",
      time: "2 hours ago",
    },
    {
      id: "a3",
      type: "achievement",
      label: "Earned 'Consistent Practitioner' badge",
      time: "Yesterday",
    },
    {
      id: "a4",
      type: "interview",
      label: "Completed interview at Razorpay",
      time: "2 days ago",
    },
    {
      id: "a5",
      type: "resume",
      label: "Resume updated — v3",
      time: "4 days ago",
    },
  ],

  resume: {
    uploaded: true,
    fileName: "Karthik_Yadav_resume_v3.pdf",
    lastUpdated: "2026-08-02",
    matchScore: 84,       // % match for current target role
  },

  notifications: [
    {
      id: "n1",
      label: "Your Stripe interview report is ready.",
      time: "2 hours ago",
      read: false,
      route: "/report",
    },
    {
      id: "n2",
      label: "5-day streak achieved. Keep going!",
      time: "Today",
      read: false,
      route: null,
    },
    {
      id: "n3",
      label: "New company added: Zepto. Practice now.",
      time: "Yesterday",
      read: true,
      route: "/interview",
    },
  ],
};

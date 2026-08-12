# TITAN Dashboard Wireframe

**Version:** 1.0

**Purpose**

This document defines the structural layout of the TITAN Dashboard before visual styling begins.

It focuses only on:

* Layout
* Information hierarchy
* Component placement
* User flow

It intentionally ignores colors, fonts, icons, spacing, animations, and implementation details.

---

# Dashboard Philosophy

The dashboard is the user's command center.

When users log in, they should immediately understand:

1. Where they are.
2. What they should do next.
3. How they are improving.
4. What needs improvement.
5. Where they can navigate.

The dashboard must prioritize actions over analytics.

---

# Dashboard States

The dashboard supports two states:

* First-Time User
* Returning User

Both states share the same overall layout but display different content.

---

# Desktop Layout

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ Sidebar │ Header                                             Profile        │
├─────────┼──────────────────────────────────────────────────────────────────┤
│         │                                                                  │
│         │ Primary Action Card                                               │
│         │ (Start / Continue Interview)                                     │
│         │                                                                  │
├─────────┼──────────────────────────────┬───────────────────────────────────┤
│         │ Today's Focus                │ Performance Overview              │
├─────────┼──────────────────────────────┼───────────────────────────────────┤
│         │ AI Mentor                    │ Skills Overview                   │
├─────────┼──────────────────────────────┼───────────────────────────────────┤
│         │ Recent Interviews            │ Quick Actions                     │
├─────────┼──────────────────────────────┴───────────────────────────────────┤
│         │ Activity Timeline                                            More │
└─────────┴──────────────────────────────────────────────────────────────────┘
```

---

# Mobile Layout

```text
Header

↓

Primary Action

↓

Today's Focus

↓

Performance

↓

AI Mentor

↓

Skills

↓

Recent Interviews

↓

Quick Actions

↓

Activity

↓

Bottom Navigation
```

No horizontal scrolling.

Cards stack vertically.

---

# Sidebar

Navigation Order

* Dashboard
* Interview
* Reports
* History
* Leaderboard
* Resume
* Settings

Bottom Section

* Feedback
* Logout

---

# First-Time Dashboard

The dashboard becomes an onboarding experience.

```text
Header

↓

Welcome

↓

Start First Interview

↓

Getting Started Checklist

↓

Resume Upload

↓

Recommended Roles

↓

Interview Journey

↓

Quick Actions
```

No statistics.

No graphs.

No rankings.

No empty cards.

---

# Returning Dashboard

```text
Header

↓

Continue Interview

↓

Today's Focus

↓

Performance

↓

AI Mentor

↓

Skills

↓

Recent Interviews

↓

Quick Actions

↓

Activity Timeline
```

The interface shifts from onboarding to improvement.

---

# Component Priority

★★★★★ Primary Action

★★★★☆ Today's Focus

★★★★☆ Performance Overview

★★★☆☆ AI Mentor

★★★☆☆ Skills Overview

★★★☆☆ Recent Interviews

★★☆☆☆ Quick Actions

★★☆☆☆ Activity Timeline

This priority determines visual emphasis and card size.

---

# Empty State Strategy

Unavailable information should never leave blank space.

Replace missing content with guidance.

Examples:

No Resume

→ Upload Resume

No Interviews

→ Start First Interview

No Reports

→ Complete an interview to unlock reports.

No Weak Skills

→ Complete interviews to receive personalized insights.

---

# Wireframe Rules

* Every card must answer a user question.
* The Primary Action card is always the largest element.
* Maintain consistent card alignment.
* Avoid visual clutter.
* Do not overload the dashboard.
* Keep scrolling minimal.
* Keep navigation obvious.
* Design for future expansion without redesigning the layout.

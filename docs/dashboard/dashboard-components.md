# TITAN Dashboard Component Specification

**Version:** 1.0

This document defines every reusable component that appears on the TITAN Dashboard.

It specifies the purpose, behaviour, layout expectations, and interaction rules for each component.

---

# Component Priority

★★★★★ Critical

★★★★☆ High

★★★☆☆ Medium

★★☆☆☆ Low

★☆☆☆☆ Optional

---

# 1. Header

Priority

★★★★★

Purpose

Immediately orient the user.

Visible

Always.

Contains

* Greeting
* User Name
* Notification
* Profile Avatar

Behaviour

Greeting changes depending on time.

Examples

Good Morning

Good Afternoon

Good Evening

Never display more than one greeting.

---

# 2. Primary Action Card

Priority

★★★★★

Purpose

Guide users toward the most valuable next action.

Visible

Always.

Examples

Start First Interview

Continue Interview

Resume Interview

Company Interview

Required Elements

Title

Short description

Primary CTA

Optional progress

Rules

Only ONE primary action.

Never show multiple competing CTAs.

Must remain the largest card on the dashboard.

---

# 3. Today's Focus

Priority

★★★★☆

Purpose

Give users small achievable goals.

Examples

Complete one interview.

Practice Communication.

Upload Resume.

Behaviour

Tasks update automatically.

Completed tasks display a check mark.

Future

XP

Achievements

Daily streak rewards

---

# 4. Performance Overview

Priority

★★★★☆

Purpose

Provide a quick summary of progress.

Visible

Returning users only.

Displays

Overall

Communication

Technical

Confidence

Rules

No decorative graphs.

Prefer compact score cards.

Animated numbers only.

---

# 5. AI Mentor

Priority

★★★★☆

Purpose

Provide personalized recommendations.

Visible

Always.

Content

One recommendation.

Reason.

Single CTA.

Examples

Improve SQL.

Practice Behavioural Questions.

Update Resume.

Rules

Maximum 3 lines of text.

One CTA only.

---

# 6. Skills Overview

Priority

★★★★☆

Purpose

Highlight strengths and weaknesses.

Displays

Strong Skills

Needs Improvement

Recommended Topics

Rules

Easy to scan.

Avoid large charts.

Tags preferred.

---

# 7. Resume Status

Priority

★★★★☆

Purpose

Show resume readiness.

First-Time User

Upload Resume.

Returning User

Resume Uploaded

Last Updated

Resume Match %

Future

Resume score.

ATS score.

Version history.

---

# 8. Recent Interviews

Priority

★★★☆☆

Purpose

Provide quick access to recent interviews.

Each Item

Role

Date

Score

View Report

Limit

Maximum five items.

Older interviews accessed through History.

---

# 9. Activity Timeline

Priority

★★★☆☆

Purpose

Display chronological activity.

Examples

Interview completed.

Resume updated.

Achievement unlocked.

Report generated.

Order

Newest first.

---

# 10. Quick Actions

Priority

★★★☆☆

Purpose

Fast navigation.

Buttons

Start Interview

Upload Resume

Reports

History

Leaderboard

Settings

Rules

No duplicates.

Actions must remain recognizable.

---

# 11. Getting Started Checklist

Priority

★★★★★

Visible

First-Time Users only.

Purpose

Reduce uncertainty.

Checklist

Upload Resume

Choose Role

Choose Skills

Complete Interview

View Report

Progress updates automatically.

Completed items remain visible.

---

# 12. Interview Journey

Priority

★★☆☆☆

Purpose

Explain TITAN workflow.

Flow

Resume

↓

Interview

↓

AI Analysis

↓

Report

↓

Improve

Shown only until the first interview is completed.

---

# 13. Recommended Roles

Priority

★★☆☆☆

Purpose

Help new users start quickly.

Examples

Frontend

Backend

Full Stack

Java

Python

Future

Personalized recommendations.

---

# 14. Notifications

Priority

★★☆☆☆

Purpose

Surface important updates.

Examples

New report ready.

Achievement unlocked.

Resume needs updating.

Rules

Keep concise.

Avoid promotional messages.

---

# Component States

Every component must support:

Loading

Loaded

Empty

Error

Disabled (if applicable)

No component should abruptly appear or disappear.

---

# Empty State Rules

Every empty state should educate.

Never display

"No Data"

Instead provide:

A reason.

A helpful explanation.

A clear next action.

---

# Loading Rules

Skeleton loaders preferred.

Never shift layouts while loading.

Avoid blocking the entire dashboard.

---

# Hover Behaviour

Cards

Subtle elevation.

Buttons

Slight brightness increase.

Navigation

Soft highlight.

Avoid exaggerated animations.

---

# Animation Rules

Fade

150–250 ms

Scale

Very subtle.

Numbers

Smooth counting.

Sidebar

Slide.

Cards

Fade upward.

Nothing should bounce, spin, or shake.

---

# Responsive Behaviour

Desktop

Multi-column layout.

Tablet

Reduce columns.

Mobile

Single-column stack.

Sidebar becomes bottom navigation.

Touch targets remain comfortable.

---

# Future Components

Reserved for future releases.

* AI Study Planner
* Calendar
* Job Tracker
* Interview Goals
* Achievement Center
* Company Roadmaps
* Resume Versions
* Mock Interview Scheduler
* Notifications Center
* Team Challenges

These should integrate without redesigning the dashboard.

---

# Component Design Principles

Every component must satisfy at least one of the following:

* Inform
* Guide
* Motivate
* Navigate
* Improve

If a component serves none of these purposes, it should not be included in TITAN.

---

# Final Vision

The dashboard should feel like an intelligent mentor, not a collection of widgets.

Every component exists to move the user one step closer to interview success.

The experience should remain calm, purposeful, and consistent from the first interview to the hundredth.

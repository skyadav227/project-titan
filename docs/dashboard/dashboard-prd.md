# TITAN Dashboard Product Requirements Document (PRD)

---

# TITAN Dashboard

**Version:** 1.0

**Status:** Product Design

**Product:** TITAN

---

# 1. Product Vision

The TITAN Dashboard is not a statistics page.

It is the user's personal interview command center.

Every screen, every section, every interaction must guide the user toward becoming better at interviews.

The dashboard should never feel overwhelming, confusing, or abandoned.

Instead, it should always answer one simple question:

> **"What should I do next to become better?"**

Unlike traditional learning platforms that overwhelm users with charts and analytics, TITAN focuses on actionable guidance.

The dashboard should motivate, educate, and encourage users throughout their interview preparation journey.

---

# 2. Primary Goals

The dashboard should:

* Guide first-time users.
* Help existing users improve.
* Encourage consistency.
* Show meaningful progress.
* Reduce cognitive load.
* Feel premium and professional.
* Never display unnecessary information.
* Never confuse the user.
* Encourage users to return every day.

---

# 3. Design Philosophy

The dashboard should feel like a calm workspace built for serious interview preparation.

Visual inspiration:

* Linear
* Vercel
* GitHub
* Notion

Avoid gaming aesthetics, excessive gradients, loud colors, or decorative animations.

The interface should communicate confidence and professionalism.

---

# 4. Core Design Principles

## Action before Analytics

Users should always know their next action before seeing their statistics.

---

## Simplicity

Every component should exist for a reason.

If a card does not help the user make a decision or understand progress, it should not exist.

---

## Progressive Disclosure

Show important information first.

Advanced information should appear only when relevant.

---

## Purposeful Motion

Animations should improve clarity.

Animations must never exist only for decoration.

---

## Consistency

Spacing

Typography

Buttons

Cards

Icons

Colors

must remain consistent throughout the dashboard.

---

# 5. Dashboard States

The dashboard contains two major experiences.

---

## State A

# First-Time User Dashboard

Users who have never completed an interview.

Characteristics:

* No reports
* No history
* No ranking
* No strengths
* No weaknesses
* No streak
* No statistics

Instead of empty cards, the dashboard becomes an onboarding experience.

The user should immediately understand:

* what TITAN is
* how interviews work
* where to begin
* what to expect

The interface should feel welcoming instead of analytical.

---

## State B

# Returning User Dashboard

Users who have completed one or more interviews.

Characteristics:

* Reports available
* History available
* Scores available
* Rankings available
* Personalized recommendations
* Improvement tracking

The dashboard shifts from onboarding to continuous improvement.

---

# 6. Dashboard Questions

Every dashboard component must answer one of these questions.

## Who am I?

Greeting

Profile

Current level

Streak

Rank

---

## What should I do next?

Continue Interview

Start New Interview

Upload Resume

Choose Target Company

---

## How am I improving?

Overall Performance

Communication

Technical

Confidence

Recent Improvements

---

## What should I improve?

Weak Skills

AI Mentor Suggestions

Recommended Topics

---

## What happened recently?

Recent Interviews

Latest Reports

Activity Timeline

---

## Where can I go next?

Quick Actions

Reports

History

Leaderboard

Settings

Resume

---

If a component answers none of these questions, it should not be included.

---

# 7. Information Architecture

Dashboard

├── Header

├── Primary Action

├── Today's Focus

├── Performance Overview

├── AI Mentor

├── Skills Analysis

├── Recent Activity

├── Quick Actions

└── Footer

---

# 8. First-Time User Dashboard

The first-time dashboard acts as an onboarding assistant.

The interface should replace statistics with guidance.

## Components

### Welcome Hero

Greeting

Personalized welcome

Short motivational message

---

### Getting Started Checklist

Upload Resume

Choose Target Role

Choose Technologies

Complete First Interview

View First Report

Progress should update automatically.

---

### Primary CTA

Start First Interview

Large

Highly visible

Most important element on the page.

---

### Resume Card

Explain why uploading a resume improves interview quality.

Button

Upload Resume

---

### AI Mentor

Explain how TITAN works.

Friendly but professional tone.

---

### Interview Journey

Simple timeline explaining:

Resume

↓

Interview

↓

Analysis

↓

Report

↓

Improvement

---

### Quick Actions

Upload Resume

Explore Roles

Settings

Help

---

# 9. Returning User Dashboard

The returning dashboard focuses on improvement.

---

## Header

Greeting

Current streak

Rank

Current level

---

## Primary Card

Continue Interview

or

Recommended Interview

This card always remains the largest component.

---

## Today's Mission

Daily objectives.

Examples:

Complete one interview

Improve communication

Practice React

Upload updated resume

---

## Performance Overview

Overall Score

Communication

Technical

Confidence

Display as clean cards.

Avoid complicated graphs.

---

## Skills Analysis

Strong Skills

Weak Skills

Recommended Topics

---

## AI Mentor

Personalized recommendations.

Examples:

Improve behavioral answers.

Practice SQL.

Communication improved by 6%.

---

## Recent Interviews

Role

Company

Score

Date

Report button

---

## Activity Feed

Timeline

Completed interviews

Achievements

Resume uploads

Milestones

---

## Quick Actions

Start Interview

Upload Resume

Reports

History

Leaderboard

Settings

---

# 10. Empty States

The dashboard should never appear broken.

Instead of showing:

No Reports

Show:

Complete your first interview to unlock detailed reports.

---

Instead of:

No History

Show:

Your interview journey begins here.

---

Instead of:

No Weak Skills

Show:

Complete interviews to discover improvement areas.

---

Every empty state should guide the user toward the next meaningful action.

---

# 11. Navigation

Sidebar (Desktop)

Bottom Navigation (Mobile)

Navigation should remain identical throughout the application.

Items:

Dashboard

Interview

Reports

History

Leaderboard

Resume

Settings

---

# 12. Visual Design

Dark Theme

Rounded cards

Soft shadows

Subtle borders

Minimal gradients

Generous spacing

Readable typography

Professional appearance

No unnecessary visual noise.

---

# 13. Motion Design

Animations should be subtle.

Examples:

Cards fade upward.

Numbers count smoothly.

Buttons gently scale.

Page transitions fade.

Hover states remain lightweight.

Avoid dramatic animations.

---

# 14. Responsive Design

Desktop

Sidebar

Multiple columns

Large spacing

---

Tablet

Reduced columns

Maintain hierarchy

---

Mobile

Bottom navigation

Stacked cards

Touch-friendly spacing

No horizontal scrolling.

---

# 15. Accessibility

Keyboard navigation

Visible focus states

ARIA labels

High contrast

Readable font sizes

Screen reader support

Accessible color choices

---

# 16. Performance

Dashboard should feel instant.

Lazy load heavy sections.

Optimize images.

Avoid unnecessary re-renders.

Maintain smooth scrolling.

---

# 17. Future Extensibility

The dashboard must be modular.

Future modules should integrate without redesigning the layout.

Examples:

Achievements

Goals

Company Preparation

Calendar

Notifications

Study Planner

AI Resume Review

Mock Interview Scheduler

Job Applications

Interview Roadmap

---

# 18. Things to Avoid

Do not display decorative graphs.

Do not show meaningless statistics.

Do not create empty cards.

Do not duplicate information.

Do not overload the interface.

Do not leave large empty spaces.

Do not use excessive animations.

Do not use placeholder data pretending to be real.

Do not force unnecessary scrolling.

Do not distract users from their next action.

---

# 19. Success Criteria

A successful dashboard allows users to answer these questions within five seconds:

* Where am I?
* What should I do next?
* How am I improving?
* What should I improve?
* Where can I navigate?

If users can answer these questions immediately without confusion, the dashboard has achieved its purpose.

---

# 20. Final Vision

The TITAN Dashboard should not feel like an analytics portal.

It should feel like a personal mentor that understands where the user is, what they have accomplished, and what they should do next.

Every visit should leave users feeling more confident, more focused, and motivated to continue preparing.

The dashboard is the heart of TITAN.

It should inspire progress—not simply display data.

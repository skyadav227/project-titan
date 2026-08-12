# TITAN Dashboard UI Specification

**Version:** 1.0

**Status:** Design System

**Applies To:**

* Dashboard
* Future Dashboard Components
* Foundation for all authenticated pages

---

# 1. Purpose

This document defines the visual language and interaction rules for the TITAN Dashboard.

Unlike the Product Requirements Document (PRD), this document does not explain *what* features the dashboard should contain.

Instead, it specifies **how the dashboard should look, feel, and behave**.

Every component should follow these guidelines to ensure a consistent, premium user experience.

---

# 2. Design Philosophy

The dashboard should feel like a calm, intelligent workspace.

Users should feel focused—not overwhelmed.

The interface should communicate:

* Professionalism
* Confidence
* Clarity
* Trust
* Progress

The visual design should avoid looking like a gaming dashboard or a data analytics portal.

---

# 3. Design Inspiration

The dashboard should draw inspiration from:

* Linear
* Vercel
* GitHub
* Notion
* Raycast

Not for copying layouts, but for adopting their principles:

* Minimalism
* Clear hierarchy
* Excellent spacing
* Fast interactions
* Restrained use of color
* Purposeful animations

---

# 4. Color System

Primary Background

Very dark charcoal / near black.

Secondary Background

Slightly lighter than the page background.

Card Background

Dark surface with subtle contrast.

Borders

Very low-opacity light borders.

Primary Text

High contrast white.

Secondary Text

Muted gray.

Success

Reserved only for completed progress.

Warning

Used sparingly for improvement suggestions.

Error

Only for validation or failed operations.

Accent colors should never dominate the interface.

The dashboard should remain mostly monochromatic.

---

# 5. Typography

Hierarchy should remain consistent across the application.

Page Title

Largest text on the page.

Section Titles

Medium weight.

Card Titles

Slightly smaller.

Body Text

Comfortable reading size.

Metadata

Small and muted.

Avoid excessive font weights.

Use whitespace rather than bold text to create emphasis.

---

# 6. Spacing System

Use an 8px spacing scale.

Examples

8

16

24

32

40

48

64

Cards should never feel cramped.

Whitespace is part of the design.

---

# 7. Grid System

Desktop

Persistent left sidebar.

Main content uses a responsive multi-column grid.

Cards align perfectly.

Tablet

Reduce the number of columns.

Maintain reading order.

Mobile

Single-column layout.

Cards stack vertically.

No horizontal scrolling.

---

# 8. Card System

Every dashboard card should follow the same visual rules.

Rounded corners.

Soft border.

Minimal shadow.

Consistent padding.

Consistent spacing between cards.

Hover should create slight elevation.

Cards should never bounce, shake, or rotate.

Cards should feel stable.

---

# 9. Header

Contains:

Greeting

User name

Optional motivational message

Notification button

Profile menu

The greeting should change naturally throughout the day.

Examples

Good Morning

Good Afternoon

Good Evening

---

# 10. Sidebar

Desktop

Persistent.

Collapsible in future versions.

Contains:

Dashboard

Interview

Reports

History

Leaderboard

Resume

Settings

Bottom Section

Feedback

Logout

The active page should be visually obvious.

Hover states should be subtle.

---

# 11. Primary Action Card

This is the most important component.

It must always appear near the top.

Examples

Start First Interview

Continue Interview

Resume Practice

Company Interview

The card should be visually larger than every other card.

It should contain only one primary action.

---

# 12. Performance Cards

Show only meaningful information.

Examples

Overall Score

Communication

Technical

Confidence

Avoid decorative charts.

Simple score cards are preferred.

Numbers should animate smoothly when loaded.

---

# 13. AI Mentor Card

The AI Mentor is one of TITAN's defining features.

The card should include:

A short recommendation.

A reason for the recommendation.

One clear action.

Never overwhelm users with paragraphs.

Recommendations should be concise and actionable.

---

# 14. Skills Overview

Display strengths and improvement areas.

Prefer simple tags, lists, or progress indicators.

Avoid complex radar charts unless they provide genuine value.

The information should be understandable within a few seconds.

---

# 15. Recent Interviews

Each row should display:

Role

Interview Type

Date

Score

View Report action

Rows should remain compact and readable.

---

# 16. Activity Timeline

Shows recent activity in chronological order.

Examples

Interview completed.

Resume uploaded.

New report generated.

Achievement unlocked.

Avoid unnecessary details.

---

# 17. Quick Actions

Should contain only frequently used actions.

Examples

Start Interview

Upload Resume

View Reports

History

Resume

Settings

Each action should be instantly recognizable.

---

# 18. Empty States

Every empty state should educate and guide.

Never display blank cards.

Examples

No Reports

→ Complete your first interview to unlock reports.

No Resume

→ Upload your resume to receive personalized interviews.

No History

→ Your interview journey starts here.

---

# 19. Motion Design

Animations should improve usability.

Recommended transitions:

Page fade

Card fade

Hover elevation

Button press

Sidebar transition

Accordion expand

Loading skeleton

Animations should remain short and smooth.

Avoid excessive movement.

---

# 20. Buttons

Primary

Filled

High contrast

Largest emphasis

Secondary

Outlined

Low emphasis

Text Buttons

Minimal

Used for supporting actions

Buttons should have consistent height and corner radius.

---

# 21. Inputs

Consistent height.

Rounded corners.

Clear labels.

Visible focus state.

Accessible placeholder text.

Validation messages should appear below the field.

---

# 22. Icons

Use one consistent icon library throughout the application.

Icons should support labels rather than replace them.

Avoid decorative icons.

---

# 23. Loading States

Skeleton loaders are preferred.

Avoid large loading spinners covering the page.

Loading should preserve layout to prevent content shifting.

---

# 24. Accessibility

Keyboard navigation.

Visible focus indicators.

Sufficient contrast.

Semantic HTML.

Screen reader support.

Descriptive ARIA labels where required.

---

# 25. Responsive Behaviour

Desktop

Sidebar visible.

Multi-column layout.

Tablet

Reduced columns.

Comfortable spacing.

Mobile

Bottom navigation.

Single-column cards.

Touch-friendly controls.

---

# 26. Performance Guidelines

Lazy-load heavy content.

Avoid unnecessary re-renders.

Keep animations at 60 FPS.

Optimize assets.

Do not block the interface during loading.

---

# 27. Visual Consistency Rules

Every page should feel like part of TITAN.

Maintain:

* identical border radius
* spacing rhythm
* button styles
* card styles
* typography hierarchy
* hover behaviour
* animation timing

Users should never feel that they have navigated to a different application.

---

# 28. Things to Avoid

Do not use bright gradients.

Do not use neon colors.

Do not use oversized shadows.

Do not overuse animations.

Do not fill the page with charts.

Do not create decorative widgets.

Do not overload users with statistics.

Do not leave large empty spaces.

Do not display fake or placeholder data.

---

# 29. Success Criteria

A successful dashboard should allow users to:

* identify their next action within 5 seconds.
* understand their progress at a glance.
* navigate confidently.
* recognize important information immediately.
* feel encouraged to continue preparing.

The dashboard should always guide, never distract.

---

# 30. Final Design Vision

The TITAN Dashboard should feel less like software and more like a professional mentor's workspace.

It should quietly communicate confidence through clarity, consistency, and thoughtful interactions.

Every visual decision should support the user's interview preparation journey.

Nothing should exist purely for decoration.

Everything should have a purpose.

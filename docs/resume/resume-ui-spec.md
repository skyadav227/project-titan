# TITAN — Resume Intelligence UI Specification

**Document:** Resume Intelligence UI Specification
**Version:** 1.1
**Status:** Proposed
**Module:** Resume Intelligence

**Parent Documents:**

* `resume-intelligence-prd.md`
* `resume-wireframe.md`

---

# 1. Purpose

This document defines the visual and interaction specification for the TITAN Resume Intelligence module.

The Resume page must visually continue the existing TITAN product experience.

It must reuse the established:

* Dashboard shell
* Design system
* Typography
* Colors
* Cards
* Buttons
* Borders
* Inputs
* Icons
* Motion principles

Do not introduce a new visual theme.

This specification translates the structural requirements defined in `resume-wireframe.md` into concrete UI behavior and visual rules.

---

# 2. Core Visual Direction

The Resume page should feel:

**Minimal + premium + technical + calm.**

The visual language should communicate:

> "This is a professional AI career platform."

Not:

> "This is an experimental AI tool."

The page should maintain the same visual DNA as the existing TITAN landing page and dashboard.

The dashboard design system is the strongest visual reference.

---

# 3. Theme

Use the existing TITAN dark theme.

Primary background:

```text
#0a0a0a
```

Primary surface:

```text
#111111
```

Secondary surface:

```text
rgba(255,255,255,0.03)
```

Borders:

```text
rgba(255,255,255,0.07)
```

Subtle borders:

```text
rgba(255,255,255,0.05)
```

Primary text:

```text
#ffffff
```

Secondary text:

```text
rgba(255,255,255,0.60)
```

Muted text:

```text
rgba(255,255,255,0.40)
```

Very muted text:

```text
rgba(255,255,255,0.25)
```

The exact values should reuse existing TITAN CSS variables/classes wherever available rather than duplicating them.

---

# 4. No New Color System

Resume Intelligence must not introduce:

* Purple dashboards
* Blue AI gradients
* Neon green
* Bright orange
* Random accent colors

unless the existing TITAN design system already defines them.

The current product uses a restrained monochrome aesthetic.

Maintain it.

Status colors may use existing TITAN semantic colors where those already exist:

* Success
* Error
* Warning
* Informational

Do not create a new status-color system specifically for Resume Intelligence.

---

# 5. Typography

Use the existing TITAN typography system.

Hierarchy:

### Page Title

Large and strong.

Example:

```text
Resume Intelligence
```

### Supporting Text

Smaller and muted.

Example:

```text
Your resume powers personalized interviews and feedback.
```

### Section Heading

Medium weight.

Example:

```text
Candidate Profile
```

### Card Label

Small uppercase or compact label where appropriate.

Example:

```text
ACTIVE RESUME
```

### Body

Readable and restrained.

Avoid excessive font-size variation.

---

# 6. Page Width

The Resume page should use the same content width as the dashboard.

Recommended structure:

```text
┌─────────────────────────────────────────────────────┐
│                  Main Container                     │
│                                                     │
│       max-width consistent with Dashboard          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Do not create a separate full-width layout.

---

# 7. Page Padding

Desktop:

Use the dashboard's existing horizontal padding.

Tablet:

Reduce padding proportionally.

Mobile:

Use compact horizontal padding while preserving readable spacing.

Do not hard-code a completely independent spacing system.

Reuse existing TITAN spacing tokens/classes wherever available.

---

# 8. Card Language

Resume cards should follow the same visual treatment as existing TITAN dashboard cards.

Base:

```text
background: rgba(255,255,255,0.03)
border: 1px solid rgba(255,255,255,0.07)
border-radius: existing TITAN card radius
```

Cards should feel subtle rather than heavily elevated.

Avoid:

```text
large shadows
bright outlines
thick borders
glassmorphism everywhere
```

---

# 9. Card Hierarchy

Not every card should look equally important.

Use three levels.

### Primary Card

For:

* Resume upload/dropzone
* Active resume
* Interview CTA

Slightly stronger surface and border.

### Secondary Card

For:

* Skills
* Education
* Experience
* Projects
* Candidate Profile

Standard TITAN card treatment.

### Supporting Card

For:

* Metadata
* Processing details
* Small information

More subtle surface.

The hierarchy must communicate importance without introducing a new visual style.

---

# 10. Border Radius

Use the existing TITAN radius scale.

Approximate hierarchy:

```text
Large containers: rounded-xl / rounded-2xl
Cards: rounded-xl
Small controls: rounded-lg
Tags: rounded-md / pill
```

Do not mix many unrelated radius values.

---

# 11. Page Header

Structure:

```text
Resume Intelligence
Your resume powers personalized interviews and recommendations.
```

For an existing resume:

```text
Resume Intelligence
Your active resume powers personalized interviews and recommendations.
```

Spacing:

```text
Title
↓
8–12px
↓
Description
↓
24–32px
↓
Content
```

For users with an active resume, the header may contain a compact secondary action such as:

```text
[Replace Resume]
```

The header should not consume excessive vertical space.

---

# 12. New User Empty State

The empty state is a major visual component.

It should feel intentional rather than empty.

The empty state should also function as the primary upload interaction rather than creating a separate competing upload interface.

Structure:

```text
┌─────────────────────────────────────────────────────┐
│                                                     │
│                    Resume Icon                     │
│                                                     │
│              Build your TITAN profile              │
│                                                     │
│    Upload your resume so TITAN can personalize     │
│    your interviews around your experience.         │
│                                                     │
│             ┌──────────────────────┐               │
│             │    Upload Resume     │               │
│             └──────────────────────┘               │
│                                                     │
│          PDF or DOCX · Maximum 5 MB                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

The empty state should support:

* Click to browse
* Drag and drop where appropriate

Do not display a separate full upload card directly below this component.

The container should occupy enough space to feel purposeful without dominating the dashboard.

---

# 13. Empty State Icon

Use a simple existing icon style.

Preferred:

* File
* Document
* Upload

Avoid:

* Large illustrations
* Cartoon graphics
* 3D objects
* Complex AI robots

The icon should remain subtle.

---

# 14. Primary CTA

The primary Resume CTA in the new-user state is:

```text
Upload Resume
```

Use the existing TITAN primary button component/style.

Visual priority:

```text
White background
Black text
```

if that is already the established TITAN primary button style.

Do not invent a new button design.

The primary CTA must be clearly associated with the upload/dropzone.

---

# 15. Secondary Actions

Examples:

```text
Remove
Cancel
Try Again
Replace Resume
```

Use existing secondary/ghost button styles.

Primary action should always be visually stronger.

CTA hierarchy changes according to the current state.

```text
No Resume:
Primary → Upload Resume

Selected:
Primary → Process Resume
Secondary → Remove

Processing:
No competing action

Ready:
Primary → Start Interview
Secondary → Replace Resume

Error:
Primary → Try Again
Secondary → Upload Different Resume
```

---

# 16. File Dropzone

The new-user empty state should function as the upload/dropzone.

If a dedicated dropzone component is needed, it should remain visually integrated with the empty state rather than becoming a separate page section.

Visual:

```text
┌──────────────────────────────────────────────┐
│                                              │
│                 Upload icon                  │
│                                              │
│         Drag & drop your resume here         │
│                    or                        │
│               Browse files                   │
│                                              │
│          PDF / DOCX · Max 5 MB               │
│                                              │
└──────────────────────────────────────────────┘
```

The dropzone should support:

* Drag and drop
* Click to browse
* Keyboard-accessible activation
* Mobile file selection

The dropzone should use a subtle dashed border if consistent with TITAN's existing input language.

---

# 17. Dropzone States

### Default

Subtle border.

### Hover

Border becomes slightly brighter.

### Drag Over

Clearly indicates that the file can be dropped.

### Invalid File

Use the existing error treatment and explain the problem.

### Uploading

Disable additional file selection.

### Processing

The upload interaction is replaced by the processing state.

Do not allow accidental duplicate uploads while processing.

---

# 18. Selected File Card

After selecting a valid file:

```text
┌──────────────────────────────────────────────┐
│ PDF    Resume.pdf                    2.4 MB │
│        PDF document                         │
│                                              │
│ [Remove]                  [Process Resume]  │
└──────────────────────────────────────────────┘
```

The selected-file state replaces the empty upload interaction.

Filename should truncate gracefully on small screens.

The user must be able to remove the file before processing.

---

# 19. Processing UI

The processing state should feel like TITAN is actively working.

Avoid fake percentage progress if the backend cannot provide real progress.

Instead use meaningful stages:

```text
✓ Resume uploaded
✓ Reading resume
● Extracting information
○ Understanding your profile
○ Building interview context
```

The UI should clearly indicate the current stage.

---

# 20. Processing Indicator

Use subtle motion.

Acceptable:

* Pulsing active indicator
* Smooth progress line when real progress exists
* Fade transitions
* Small spinner

Avoid:

* Huge loading spinner
* Excessive particle effects
* Constant bouncing
* Full-screen flashy animations

---

# 21. Processing Copy

Use human language.

Good:

```text
Understanding your profile
```

Good:

```text
Building your interview context
```

Avoid:

```text
Calling LLM endpoint...
```

Avoid:

```text
Running NLP pipeline...
```

The user doesn't need implementation details.

---

# 22. Resume Ready State

Once processing completes, the page should visually transition from:

```text
Upload experience
```

to:

```text
Profile experience
```

Recommended structure:

```text
Resume Overview
      ↓
Candidate Profile
      ↓
Skills / Experience / Education
      ↓
Projects
      ↓
Start Interview
```

A short success transition may be used, but it should not interrupt the user.

---

# 23. Active Resume Card

The active resume card should be visually important.

Example:

```text
┌─────────────────────────────────────────────────────┐
│ ACTIVE RESUME                                       │
│                                                     │
│  📄  Sher_Karthikeya_Resume.pdf                    │
│      PDF · 2.4 MB                                   │
│                                                     │
│      ● Active                                       │
│                                                     │
│                              [Replace Resume]       │
└─────────────────────────────────────────────────────┘
```

It should communicate:

* Filename
* File type
* File size
* Active status
* Processing status
* Last updated
* Replace action
* Delete action through a secondary/destructive control or overflow menu

The active indicator should be subtle.

Do not use bright green unless already defined in the design system.

---

# 24. Candidate Profile

Candidate profile should use a compact information grid.

Desktop:

```text
┌────────────────┬────────────────┬──────────────────┐
│ Name           │ Target Role    │ Experience       │
│ Sher...        │ Software Eng.  │ Entry Level      │
└────────────────┴────────────────┴──────────────────┘
```

Mobile:

```text
Name
Sher Karthikeya Yadav

Target Role
Software Engineer

Experience
Entry Level
```

Only display fields returned by the backend.

Do not display empty labels unnecessarily.

---

# 25. Skills UI

Skills should use tags.

Example:

```text
Languages
[JavaScript] [Python]

Frontend
[React] [HTML] [CSS]

Backend
[Node.js] [Express.js]

Database
[MongoDB] [MySQL]
```

Tags:

* Small
* Low contrast
* Compact
* Consistent

Do not use large colored skill badges.

---

# 26. Skill Group Labels

Group labels should be muted.

Example:

```text
Languages
```

not:

```text
🔥 LANGUAGES
```

Keep the visual language professional.

---

# 27. Experience UI

Experience should use a timeline-like vertical structure where appropriate.

Example:

```text
● Frontend Developer
│  Company
│  Jan 2026 — Present
│
│  • Built...
│  • Improved...
│
● Software Intern
   Company
   Jun 2025 — Aug 2025
```

The timeline should remain subtle.

Do not turn the Resume page into a highly animated timeline.

If no professional experience exists, a compact informational state may be shown:

```text
Experience
No professional experience listed.
```

This is intentional profile information, not an error.

---

# 28. Education UI

Education should prioritize readability.

Example:

```text
B.Tech — Computer Science & Engineering
University Name
2022 — 2026
CGPA: 7.41
```

Grade information should appear as secondary metadata.

Multiple education entries should be supported.

---

# 29. Projects UI

Projects should receive slightly more visual emphasis because TITAN uses projects heavily for personalized interview questions.

Example:

```text
┌─────────────────────────────────────────────────────┐
│ TITAN                                               │
│ AI Interview Preparation Platform                   │
│                                                     │
│ React · Node.js · Express · MongoDB                │
│                                                     │
│ Built an AI-powered interview preparation...       │
└─────────────────────────────────────────────────────┘
```

Each project may expose:

* Project name
* Description
* Technologies
* Highlights
* Optional URL

Technology tags should remain subtle.

Do not invent project data if the resume does not contain it.

---

# 30. Empty Sections

Never create large empty cards.

For optional sections, omit the section entirely when no data exists:

* Certifications
* Achievements
* Optional additional sections

For core candidate information, use compact intentional states where useful.

For example:

```text
Experience
No professional experience listed.
```

This allows the profile to communicate that the candidate is entry-level without creating an abandoned-looking card.

Do not render:

```text
Certifications

Nothing here
```

inside a large empty container.

The page should remain compact.

---

# 31. Interview CTA

Once the resume is ready, show a contextual CTA.

Example:

```text
┌─────────────────────────────────────────────────────┐
│ Your interview profile is ready.                   │
│                                                     │
│ Practice with questions tailored to your experience.│
│                                                     │
│                    [Start Interview →]             │
└─────────────────────────────────────────────────────┘
```

This should be visually connected to the rest of the page.

The CTA should act as the natural next step, not as an unrelated promotional banner.

---

# 32. CTA Hierarchy

CTA hierarchy is state-dependent.

### No Resume

Primary:

```text
Upload Resume
```

### File Selected

Primary:

```text
Process Resume
```

Secondary:

```text
Remove
```

### Processing

No competing primary CTA.

### Resume Ready

Primary:

```text
Start Interview
```

Secondary:

```text
Replace Resume
```

Tertiary:

```text
View / Edit Profile
```

### Processing Failed

Primary:

```text
Try Again
```

Secondary:

```text
Upload Different Resume
```

Do not place multiple equally dominant buttons beside each other.

---

# 33. Error Styling

Errors should be visible but restrained.

Use:

* Existing TITAN error color
* Subtle error background
* Clear text
* Retry action

Avoid:

* Huge red boxes
* Flashing errors
* Browser alert dialogs

Errors should appear close to the relevant interaction.

---

# 34. Success Styling

After successful processing:

```text
✓ Resume ready
```

Use a short success animation.

The success state should transition naturally into the candidate profile.

Avoid a large celebratory screen.

---

# 35. Replace Resume UI

Replacing should not feel destructive.

Recommended flow:

```text
Current resume
      ↓
Replace Resume
      ↓
Select new resume
      ↓
Process
      ↓
New resume becomes active
```

The user should be able to cancel before the new resume is processed.

Historical interviews remain associated with the previous resume/profile snapshot according to the backend retention model.

The active Resume page should show only the current version unless version history is introduced later.

---

# 36. Delete Confirmation

Use the existing TITAN modal/dialog style.

Structure:

```text
Delete resume?

Your resume and candidate profile will be removed
from your active profile.

Historical interview records may retain the profile
snapshot used during those interviews.

[Cancel] [Delete Resume]
```

The destructive action should be visually distinct according to the existing design system.

Deletion must require confirmation.

The actual deletion behavior must follow the backend data-retention policy.

---

# 37. Responsive Design

### Desktop

Use multi-column layouts where useful.

Example:

```text
Skills       Education
Experience   Profile
```

### Tablet

Reduce columns where necessary.

### Mobile

Everything becomes a vertical flow.

```text
Resume
↓
Profile
↓
Skills
↓
Experience
↓
Education
↓
Projects
↓
CTA
```

Do not allow important information to depend on horizontal scrolling.

---

# 38. Mobile Upload

The upload experience must remain easy on mobile.

Primary action:

```text
Upload Resume
```

should be large enough to tap comfortably.

Drag-and-drop should never be required.

The mobile experience should prioritize:

1. Browse/select file
2. Validate file
3. Process resume
4. Show processing status

---

# 39. Mobile Cards

Cards should use full available width.

Avoid:

* Tiny two-column cards
* Horizontal scrolling
* Compressed text
* Excessive metadata

Information should remain readable without zooming.

Buttons may stack vertically where horizontal space is insufficient.

---

# 40. Motion System

Resume Intelligence uses restrained motion.

### Page Entry

Subtle fade/translate.

### Card Entry

Small staggered fade where useful.

### Upload

Progress animation only when meaningful.

### Processing

Active-step animation.

### Success

Short confirmation animation.

### Navigation

Smooth transition where appropriate.

Animations should communicate state rather than exist for decoration.

---

# 41. Animation Duration

Preferred range:

```text
150ms – 500ms
```

Longer animations should be reserved for meaningful state transitions.

Avoid animations that delay user interaction.

Respect reduced-motion preferences where supported.

---

# 42. Hover Effects

Cards:

```text
subtle border brightening
```

Buttons:

```text
slight background change
```

Interactive tags:

```text
subtle contrast change
```

Avoid large transforms.

Hover effects must not be required to understand functionality.

---

# 43. Accessibility

All interactive elements must have:

* Keyboard focus
* Visible focus state
* Accessible name
* Appropriate semantic element

Upload input must have an accessible label.

The dropzone must have a clickable and keyboard-accessible fallback.

Recommended keyboard behavior:

```text
Tab
↓
Focus upload control
↓
Enter / Space
↓
Open file picker
```

If a modal is opened:

```text
Focus enters modal
↓
User completes/cancels action
↓
Focus returns to triggering control
```

Do not rely on color alone to communicate:

* Active state
* Error state
* Processing state
* Success state

---

# 44. Contrast

Text hierarchy should remain readable against:

```text
#0a0a0a
#111111
```

Muted text should not become so dim that it becomes unreadable.

Important actions must have strong contrast.

Focus indicators must remain clearly visible.

---

# 45. Iconography

Use one icon system consistently.

Preferred:

* Existing TITAN icon components
* Lucide-style icons if already used
* Existing SVG icon patterns

Do not introduce multiple unrelated icon libraries.

Icons should support comprehension rather than replace labels.

---

# 46. Decorative Elements

Decorative elements should remain minimal.

Allowed:

* Subtle grid
* Faint gradients
* Tiny glow
* Fine borders

Avoid:

* Large background illustrations
* Floating 3D objects
* Excessive gradients
* Animated particles

The landing page can be more expressive.

The dashboard and Resume page should be more functional.

---

# 47. Visual Relationship With Landing Page

The Resume page should feel like the user has entered the same product.

Shared characteristics:

```text
Landing Page
     ↓
Dark monochrome theme
     ↓
Thin borders
     ↓
Subtle gradients
     ↓
Minimal typography
     ↓
Resume Page
```

The Resume page should not literally copy the landing page layout.

It should inherit its visual language.

---

# 48. Visual Relationship With Dashboard

The dashboard is the strongest reference.

Resume should reuse:

* Sidebar
* Navbar
* Card styles
* Button styles
* Typography
* Spacing
* Border treatment
* Motion system

This is more important than independently designing the Resume page.

Before implementing any new UI pattern, inspect the existing dashboard for an equivalent component or treatment.

---

# 49. Density

The page should avoid both extremes.

Too sparse:

```text
┌─────────────────────┐
        Resume
     [Upload]
└─────────────────────┘
```

Too dense:

```text
20 cards
12 charts
8 graphs
15 buttons
```

Preferred:

```text
Header
↓
Primary resume card
↓
Candidate profile
↓
Relevant information sections
↓
Interview CTA
```

The page should feel information-rich without becoming an analytics dashboard.

---

# 50. No Unnecessary Charts

Resume Intelligence is primarily an information-management interface.

Do not use charts for:

* Skills
* Education
* Experience
* Projects

A chart should only be introduced if it communicates information substantially better than text.

Do not add:

* Skill radar charts
* Resume score charts
* Decorative AI analytics
* Unrelated progress graphs

unless explicitly required by the PRD in a future iteration.

---

# 51. No Fake Data

The interface must never display fabricated resume information.

If the backend returns:

```text
skills: []
```

the UI should not invent:

```text
React
Node.js
Python
```

The UI displays actual candidate data only.

Loading placeholders are acceptable.

Fabricated candidate information is not.

---

# 52. AI Transparency

When TITAN processes the resume, communicate that AI is being used without making the interface feel gimmicky.

Acceptable:

```text
Understanding your profile
```

Optional:

```text
Powered by TITAN AI
```

Avoid:

```text
🤖 SUPER AI ANALYZING...
```

AI should feel like a product capability rather than a visual gimmick.

---

# 53. Loading Skeleton

If resume data is being fetched from the backend, use skeleton placeholders matching the actual content layout.

Example:

```text
████████████
████████
████████████████
████████████
```

Do not display a full-page spinner when only a few components are loading.

The skeleton should preserve the eventual layout to reduce visual movement.

---

# 54. Component Reuse

Before creating a new component, check whether the project already contains:

* Button
* Card
* Modal
* Input
* Badge
* Skeleton
* File upload
* Toast
* Page header

Reuse existing components whenever possible.

Do not create duplicate versions of existing TITAN components.

If an existing component requires a minor extension, prefer extending it over creating an isolated duplicate.

---

# 55. Suggested Component Structure

Potential structure:

```text
ResumePage
│
├── ResumeHeader
│
├── ResumeStateRouter
│
├── ResumeEmptyState
│   └── ResumeDropzone
│
├── ResumeSelectedFile
│
├── ResumeProcessing
│
├── ResumeErrorState
│
└── ResumeProfile
    ├── ResumeOverviewCard
    ├── CandidateProfile
    ├── SkillsSection
    ├── ExperienceSection
    ├── EducationSection
    ├── ProjectsSection
    ├── CertificationsSection
    ├── AchievementsSection
    └── InterviewCTA
```

The actual component architecture may be adjusted to match the existing codebase.

Delete confirmation may reuse the existing modal component rather than requiring a dedicated Resume-specific modal component.

---

# 56. State-Driven UI

The page should not duplicate entire layouts for every state.

Conceptually:

```text
resumeStatus
     │
     ├── none
     ├── selected
     ├── uploading
     ├── processing
     ├── ready
     └── failed
```

Then render the appropriate state.

The state progression should be:

```text
none
 ↓
selected
 ↓
uploading
 ↓
processing
 ↓
ready
```

or:

```text
processing
 ↓
failed
```

This keeps the implementation maintainable.

The UI should not create disconnected pages for every state.

---

# 57. UI Rules for Kiro

When implementing this specification:

1. Inspect the existing TITAN design system first.
2. Inspect the existing dashboard before creating new UI.
3. Reuse existing dashboard components.
4. Reuse existing CSS variables/classes.
5. Do not redesign the dashboard shell.
6. Do not introduce a new color palette.
7. Do not add unnecessary charts.
8. Do not invent resume information.
9. Do not add fake loading percentages.
10. Keep animations subtle.
11. Preserve responsive behavior.
12. Keep empty states intentional.
13. Avoid large unused spaces.
14. Keep the page visually consistent with the landing page.
15. Prefer existing components over creating duplicates.
16. Implement the complete state flow rather than only the ready state.
17. Ensure upload/dropzone behavior works with keyboard and mobile interaction.
18. Make CTA hierarchy state-dependent.
19. Do not render large empty optional sections.
20. Preserve historical interview associations when replacing/deleting resumes according to backend behavior.
21. Do not expose backend, AI provider, or implementation errors to users.
22. Never fabricate candidate data.
23. Respect the existing accessibility and reduced-motion patterns of the application.
24. Do not add functionality that is not supported by the Resume Intelligence PRD.

---

# 58. Definition of Visual Done

The UI is considered complete when:

```text
[✓] Looks like TITAN
[✓] Matches dashboard theme
[✓] Matches landing-page visual language
[✓] New-user state feels intentional
[✓] Empty state doubles as the upload interaction
[✓] Upload flow is clear
[✓] File selection is clear
[✓] File validation is clear
[✓] Processing state is understandable
[✓] No fake progress is shown
[✓] Errors are clear
[✓] Ready state is information-rich
[✓] Empty optional sections do not create dead space
[✓] Entry-level users can be represented naturally
[✓] Existing users can replace resumes
[✓] Delete requires confirmation
[✓] Historical interview associations are respected
[✓] CTA hierarchy changes by state
[✓] Interview CTA is visible
[✓] Mobile layout works
[✓] Upload works on mobile
[✓] Keyboard interaction works
[✓] Focus states are visible
[✓] Animations are restrained
[✓] No unnecessary charts
[✓] No fake data
[✓] Existing components are reused
[✓] Resume state is handled through a state-driven UI
```

---

# 59. Final Visual Principle

The Resume Intelligence page should feel like:

> **A professional candidate profile powered by AI.**

It should not feel like:

> **A file uploader with some AI decorations.**

The resume is the source of the user's TITAN identity, and the interface should communicate that clearly.

The complete experience should take the user naturally from:

```text
Upload
  ↓
Understand
  ↓
Review
  ↓
Practice
```

without unnecessary navigation, visual noise, or artificial complexity.

# TITAN — Resume Intelligence Wireframe

**Document:** Resume Intelligence Wireframe
**Version:** 1.1
**Status:** Revised
**Module:** Resume Intelligence
**Parent PRD:** `resume-intelligence-prd.md`

---

# 1. Wireframe Purpose

This document defines the structural layout, content hierarchy, user states, and interaction flow of the TITAN Resume Intelligence experience.

This is a structural specification, not a visual design specification.

Visual styling, colors, typography, spacing, animations, and responsive details are defined separately in:

```text
resume-ui-spec.md
```

The wireframe must remain consistent with:

```text
resume-intelligence-prd.md
resume-ui-spec.md
resume-userflow.md
```

---

# 2. Design Philosophy

Resume Intelligence should feel like a natural extension of the TITAN dashboard.

The experience should be:

* Clean
* Calm
* Structured
* Easy to understand
* Professional
* Lightweight
* Focused on the user's next action

The interface must not overwhelm first-time users with information they do not have yet.

The interface must also avoid making experienced users navigate through unnecessary onboarding every time they visit the page.

The experience should communicate that the resume is not merely a file upload. It is the source of the candidate context used throughout TITAN.

---

# 3. User States

The Resume page uses the following UI states:

```text
┌─────────────────────────┐
│       Resume Page       │
└────────────┬────────────┘
             │
       ┌─────┴─────┐
       │           │
   No Resume    Resume Exists
       │           │
       │      ┌────┴───────────┐
       │      │                │
       │    Ready          Processing
       │      │                │
       │   Replace             │
       │      │                │
       └── Upload               │
          │                    │
          ▼                    │
       Selected                │
          │                    │
          ▼                    │
       Uploading               │
          │                    │
          ▼                    │
       Processing ◄────────────┘
          │
      ┌───┴────┐
      │        │
    Ready    Failed
      │
      ▼
   Review
      │
      ▼
   Active
```

The UI state must not be treated as the source of truth for processing.

The backend resume status is authoritative.

---

# 4. Resume Lifecycle

A resume has a backend lifecycle separate from the visual UI state.

## 4.1 Backend Status

```text
uploaded
   ↓
processing
   ↓
ready
   ↓
failed
```

A resume may also be associated with an active/inactive version state:

```text
inactive
active
```

These concepts should not be conflated.

For example:

```text
Resume Version V2
status: ready
active: false
```

means the resume has processed successfully but has not yet replaced the currently active resume.

---

# 5. UI Processing Stages

The UI may expose more detailed conceptual stages while processing:

```text
uploading
    ↓
reading
    ↓
extracting
    ↓
understanding
    ↓
building_context
    ↓
complete
```

These stages are presentation states.

The backend may combine or skip internal processing stages.

The UI must never depend on every stage being implemented as a separate backend state.

---

# 6. Global Page Structure

The page should follow the existing TITAN dashboard shell.

```text
┌──────────────────────────────────────────────────────────────┐
│                       Dashboard Navbar                       │
├───────────────┬──────────────────────────────────────────────┤
│               │                                              │
│               │                 Page Header                  │
│   Dashboard   │                                              │
│   Sidebar     │        Resume Intelligence                   │
│               │        Your resume powers your                │
│   Navigation  │        personalized TITAN experience.         │
│               │                                              │
│               ├──────────────────────────────────────────────┤
│               │                                              │
│               │                 Page Content                 │
│               │                                              │
│               │                                              │
└───────────────┴──────────────────────────────────────────────┘
```

The Resume page should reuse the existing:

* Dashboard layout
* Navbar
* Sidebar
* Page container
* Design system
* Card components
* Button components

It should not introduce a completely different visual language.

---

# 7. Page Header

Every state should retain a consistent page header.

## New User

```text
Resume Intelligence

Your resume helps TITAN understand your
skills, experience, and projects.
```

## Existing User

```text
Resume Intelligence

Your active resume powers personalized
interviews and recommendations.

[Replace Resume]
```

The header should remain compact.

---

# 8. State A — New User / No Resume

This is the primary empty state.

The user has never uploaded a resume.

The page should not look unfinished or imply that the user is missing functionality.

---

## 8.1 Layout

```text
┌──────────────────────────────────────────────────────────────┐
│ Resume Intelligence                                          │
│ Your resume helps TITAN understand your background.          │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │                                                          │ │
│ │                     Resume Icon                          │ │
│ │                                                          │ │
│ │               Build your TITAN profile                   │ │
│ │                                                          │ │
│ │   Upload your resume so TITAN can personalize            │ │
│ │   your interview questions and feedback.                 │ │
│ │                                                          │ │
│ │              ┌────────────────────────┐                  │ │
│ │              │      Upload Resume     │                  │ │
│ │              └────────────────────────┘                  │ │
│ │                                                          │ │
│ │             PDF or DOCX · Maximum 5 MB                   │ │
│ │                                                          │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌────────────────────┐ ┌────────────────────┐ ┌────────────┐ │
│ │ Personalized       │ │ Resume-aware      │ │ Smarter    │ │
│ │ Interviews         │ │ Questions         │ │ Feedback   │ │
│ └────────────────────┘ └────────────────────┘ └────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 8.2 Empty State Content

Primary message:

```text
Build your TITAN profile
```

Supporting message:

```text
Upload your resume so TITAN can personalize
your interviews around your actual skills,
projects, and experience.
```

Primary CTA:

```text
Upload Resume
```

Supporting information:

```text
PDF or DOCX · Maximum 5 MB
```

---

# 9. Why Upload?

The empty state may include three lightweight benefit indicators.

```text
┌────────────────────┐
│ Personalized       │
│ Interviews         │
│                    │
│ Questions based    │
│ on your profile.   │
└────────────────────┘

┌────────────────────┐
│ Resume-Aware       │
│ Questions          │
│                    │
│ TITAN can ask      │
│ about your projects│
└────────────────────┘

┌────────────────────┐
│ Smarter Feedback   │
│                    │
│ Identify strengths │
│ and improvements.  │
└────────────────────┘
```

These are informational rather than interactive.

---

# 10. State B — File Selected

After the user selects a file but before processing begins.

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                     Resume selected                          │
│                                                              │
│   ┌────────┐                                                 │
│   │  PDF   │   Sher_Karthikeya_Resume.pdf                    │
│   └────────┘   2.4 MB                                        │
│                                                              │
│                PDF document                                  │
│                                                              │
│       [Remove]                    [Process Resume]            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

The user must be able to remove the selected file before processing.

Validation should occur before the processing request begins.

---

# 11. File Validation

The client should validate:

* File type
* File size

Supported formats:

```text
PDF
DOCX
```

Maximum file size:

```text
5 MB
```

If the selected file is invalid:

```text
┌──────────────────────────────────────────────┐
│ Unable to use this file                      │
│                                              │
│ Please upload a PDF or DOCX file under      │
│ 5 MB.                                        │
│                                              │
│ [Choose Another File]                        │
└──────────────────────────────────────────────┘
```

The error should appear near the upload interaction.

The backend must also validate the file independently.

Client-side validation must never be treated as the only security boundary.

---

# 12. State C — Uploading

Once the user begins processing, the interface transitions into an upload state.

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                    Uploading your resume                     │
│                                                              │
│              Sher_Karthikeya_Resume.pdf                      │
│                                                              │
│              ─────────────────────────                       │
│                                                              │
│                 Uploading your file...                       │
│                                                              │
│              Please keep this page open.                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Progress behavior

Do not display a fake percentage such as:

```text
64%
```

unless the application has access to real upload progress data.

If byte-level upload progress is available, the UI may display:

```text
Uploading...
64%
```

with the percentage based on actual bytes transferred.

Otherwise, use an indeterminate progress indicator.

The user should never be presented with a misleading progress value.

---

# 13. Upload Failure

If the file cannot be uploaded:

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                 Upload couldn't be completed                 │
│                                                              │
│      Your resume could not be uploaded. Please try again.   │
│                                                              │
│                       [Try Again]                            │
│                                                              │
│                  [Choose Different File]                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

Technical details should remain hidden from the user.

---

# 14. State D — Processing

After upload completes, TITAN processes the resume.

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                 Understanding your resume                    │
│                                                              │
│       ✓ Resume uploaded                                     │
│       ✓ Reading resume                                      │
│       ● Extracting information                              │
│       ○ Understanding your profile                          │
│       ○ Building interview context                          │
│                                                              │
│                 This may take a moment.                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

The processing state should communicate meaningful progress without exposing unnecessary technical details.

---

# 15. Processing Steps

The UI may use these conceptual stages:

### Stage 1

```text
Resume uploaded
```

### Stage 2

```text
Reading resume
```

### Stage 3

```text
Extracting information
```

### Stage 4

```text
Understanding your profile
```

### Stage 5

```text
Building interview context
```

### Stage 6

```text
Resume ready
```

The actual backend implementation may combine stages where appropriate.

The frontend must recover the correct state from the backend if the user:

* Refreshes the page
* Navigates away and returns
* Reopens the application
* Experiences a temporary connection interruption

The UI should not assume that processing stopped simply because the browser state was lost.

---

# 16. Processing Recovery

If the user returns while processing is still active:

```text
Backend:
status = processing

Frontend:
resumeStatus = processing
```

The Resume page should resume the appropriate processing experience.

If the backend reports:

```text
status = ready
```

the frontend should immediately render the ready/review state.

If the backend reports:

```text
status = failed
```

the frontend should render the processing failure state.

The backend remains the source of truth.

---

# 17. State E — Processing Failure

If processing fails:

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│              We couldn't process this resume                 │
│                                                              │
│  Your file was uploaded, but TITAN couldn't extract the      │
│  information successfully.                                   │
│                                                              │
│                      [Try Again]                             │
│                                                              │
│                [Upload Different Resume]                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

Do not expose:

* Stack traces
* API errors
* Internal server errors
* AI provider errors
* Database errors
* Internal processing details

Those belong in logs.

---

# 18. State F — Resume Ready / Review

A successfully processed resume should not necessarily become active immediately when it is a replacement.

For a new user, the processed resume may proceed directly to activation if the product flow does not require confirmation.

For an existing user replacing an active resume:

```text
Upload V2
   ↓
Process V2
   ↓
Review V2
   ↓
Confirm
   ↓
V2 becomes active
```

This prevents an accidentally uploaded or incorrectly parsed resume from immediately replacing the user's active profile.

---

# 19. Resume Ready — Existing User

This is the primary existing-user state.

```text
┌──────────────────────────────────────────────────────────────┐
│ Resume Intelligence                            [Replace]     │
│ Active resume · Updated recently                             │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Resume Overview                                          │ │
│ │                                                          │ │
│ │ ┌────────┐  Sher_Karthikeya_Resume.pdf                   │ │
│ │ │  PDF   │  2.4 MB · Active                              │ │
│ │ └────────┘                                               │ │
│ │                                                          │ │
│ │ Processed successfully                                   │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Candidate Profile                                        │ │
│ │                                                          │ │
│ │ Name          Sher Karthikeya Yadav                      │ │
│ │ Target Role   Software Engineer                           │ │
│ │ Experience    Entry Level                                │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌──────────────────────┐ ┌─────────────────────────────────┐ │
│ │ Skills               │ │ Education                       │ │
│ │                      │ │                                 │ │
│ │ React                │ │ B.Tech                          │ │
│ │ Node.js              │ │ Computer Science                 │ │
│ │ MongoDB              │ │ ...                             │ │
│ └──────────────────────┘ └─────────────────────────────────┘ │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Projects                                                 │ │
│ │                                                          │ │
│ │ Project 1                                               │ │
│ │ Description...                                          │ │
│ │                                                          │ │
│ │ Project 2                                               │ │
│ │ Description...                                          │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

# 20. Resume Overview Card

The resume overview card should communicate:

* Filename
* File type
* File size
* Processing status
* Active/inactive state
* Last updated
* Resume version
* Replace action

Example:

```text
Resume

Sher_Karthikeya_Resume.pdf

PDF · 2.4 MB
Version 1
● Active

Processed successfully
Updated recently

[Replace Resume]
```

The version number is useful internally and may be displayed where appropriate.

---

# 21. Candidate Profile Card

The candidate profile provides a quick summary of the currently active resume version.

Possible fields:

```text
Name
Target Role
Experience Level
Location
```

Only fields available from the candidate profile should be displayed.

Do not display empty labels unnecessarily.

---

# 22. Data Provenance

Resume-derived information and user-selected information should not be treated as identical.

For example:

```text
Name
→ Resume-derived

Skills
→ Resume-derived

Experience
→ Resume-derived

Projects
→ Resume-derived

Target Role
→ May be user-selected or system-derived
```

The UI and backend should maintain the distinction where required.

If the target role is selected separately by the user, replacing the resume should not silently overwrite that user selection unless explicitly intended by the product rules.

---

# 23. Skills Section

Skills should be presented as grouped tags rather than excessive charts.

```text
Skills

Languages
[JavaScript] [Python]

Frontend
[React] [HTML] [CSS] [Bootstrap]

Backend
[Node.js] [Express.js]

Databases
[MongoDB] [MySQL]
```

Avoid using a radar chart for resume skills.

The Resume page should prioritize readability and accurate extracted information.

---

# 24. Experience Section

Experience should be presented chronologically.

```text
Experience

Frontend Developer
Company Name
Jan 2026 — Present

• Built...
• Improved...
• Worked with...

────────────────────────────

Software Intern
Company Name
Jun 2025 — Aug 2025

• Developed...
```

If the user has no professional experience:

```text
Experience

No professional experience listed.
```

This should not appear as an error.

---

# 25. Education Section

Education should be presented simply.

```text
Education

B.Tech — Computer Science & Engineering
University Name
2022 — 2026
CGPA: 7.41
```

Multiple education entries should be supported.

---

# 26. Projects Section

Projects are highly important for interview personalization.

```text
Projects

┌──────────────────────────────────────────────────────────┐
│ TITAN                                                    │
│ AI Interview Preparation Platform                        │
│                                                          │
│ React · Node.js · Express · MongoDB                      │
│                                                          │
│ Built an AI-powered interview preparation platform...    │
└──────────────────────────────────────────────────────────┘
```

Each project should expose:

* Project name
* Description
* Technologies
* Highlights
* Optional URL

Project information should remain associated with the resume version from which it was extracted.

---

# 27. Certifications Section

If certifications exist:

```text
Certifications

AWS Cloud Practitioner
Amazon Web Services
2026
```

If none exist, the section may be omitted entirely.

---

# 28. Achievements Section

If achievements exist:

```text
Achievements

• Hackathon finalist
• Academic award
• Open-source contribution
```

If none exist, omit the section.

---

# 29. Resume Sections Rule

The page should not display large empty containers.

If a section has no data:

```text
DO NOT:

┌──────────────────────────┐
│ Certifications           │
│                          │
│ Nothing here             │
│                          │
└──────────────────────────┘
```

Instead:

```text
Do not render the section.
```

This keeps the page compact and avoids abandoned-looking areas.

---

# 30. Replace Resume Flow

When an existing user selects:

```text
Replace Resume
```

the user should be informed that the current active resume will remain intact until the new resume is successfully processed and confirmed.

```text
┌──────────────────────────────────────────────────────────────┐
│ Replace your active resume?                                  │
│                                                              │
│ Your current resume will remain active until the new resume │
│ is successfully processed and confirmed.                    │
│                                                              │
│ Your current resume will remain available for historical     │
│ interview records.                                           │
│                                                              │
│ Select a new resume to continue.                             │
│                                                              │
│                    [Choose Resume]                           │
│                                                              │
│                         [Cancel]                              │
└──────────────────────────────────────────────────────────────┘
```

---

# 31. Replacement Version Flow

The replacement flow is explicitly versioned.

```text
Current Active Resume
        │
        ▼
      V1 Active
        │
        │ Replace
        ▼
     Upload V2
        │
        ▼
    Process V2
        │
        ▼
     Review V2
        │
        ▼
  Confirm Replacement
        │
        ▼
     V2 Active
        │
        ▼
     V1 Historical
```

The old active resume must not be replaced destructively.

---

# 32. Replacement Review

Before V2 becomes active, the user should be able to verify the processed result.

The review state may display:

```text
Resume ready for review

Sher_Karthikeya_Resume_V2.pdf

Candidate Profile
Skills
Experience
Education
Projects

[Keep Current Resume]
[Activate New Resume]
```

The exact review depth may be defined by the PRD/UI specification.

The important rule is:

```text
Processed ≠ Automatically Active
```

for replacement flows.

---

# 33. Resume Version History

The main Resume page normally displays only the active version.

Conceptually:

```text
Resume V1
   ↓
Historical interviews
   ↓
Resume V2
   ↓
Active resume
```

Version history may be introduced as a dedicated feature later.

The backend must nevertheless maintain version identity from the beginning if historical records depend on it.

---

# 34. Historical Interview Integrity

Historical interviews must not change when the user replaces their resume.

Example:

```text
Interview #101
   ↓
Used Resume V1
   ↓
Resume Snapshot V1
```

After replacement:

```text
Active Resume → V2
```

Interview #101 must still reference the context used during that interview.

Conceptually:

```text
Interview
   │
   └── resumeVersionId
           │
           ▼
      Resume Version
```

or an equivalent immutable profile snapshot.

The system must never allow V2 to overwrite the context of an interview that was conducted using V1.

---

# 35. Delete Resume

Deletion should require confirmation.

```text
┌──────────────────────────────────────────────────────────────┐
│ Delete resume?                                                │
│                                                              │
│ This will remove your resume from your active profile.       │
│                                                              │
│ Historical interviews and reports will remain available and  │
│ retain the resume context used during those interviews.      │
│                                                              │
│ This action follows TITAN's data-retention policy.            │
│                                                              │
│ [Cancel]                     [Delete Resume]                  │
└──────────────────────────────────────────────────────────────┘
```

Deletion behavior must follow the backend data-retention policy.

The active resume should be removed from the user's active profile.

Historical records must remain readable.

A resume version that is still required by historical records must not be destructively removed unless the required historical context has been preserved independently.

---

# 36. Delete Result

After successful deletion:

```text
Resume
No active resume

Build your TITAN profile

[Upload Resume]
```

Historical interviews remain accessible through their existing records.

---

# 37. Interview Connection

Once the resume is ready and active, the page should provide a natural path toward interviews.

```text
Your profile is ready.

Start a personalized interview based on your
skills and experience.

[Start Personalized Interview]
```

The CTA should not dominate the page.

It should act as the natural next step.

The wording should communicate what the action does rather than simply saying:

```text
Start Interview
```

where a more descriptive CTA is possible.

---

# 38. New User → Interview Flow

```text
Dashboard
   ↓
Resume
   ↓
Upload Resume
   ↓
File Validation
   ↓
Upload
   ↓
Process
   ↓
Resume Ready
   ↓
Activate
   ↓
Start Personalized Interview
   ↓
Interview Setup
```

---

# 39. Existing User → Interview Flow

```text
Dashboard
   ↓
Resume
   ↓
View Candidate Profile
   ↓
Start Personalized Interview
   ↓
Interview Setup
```

---

# 40. Existing User → Replace Flow

```text
Resume
   ↓
Replace Resume
   ↓
Choose New Resume
   ↓
Validate
   ↓
Upload
   ↓
Process
   ↓
Review New Resume
   ↓
Confirm Replacement
   ↓
New Resume Active
   ↓
Old Resume Historical
```

---

# 41. Responsive Wireframe

The desktop layout should collapse cleanly on smaller screens.

## Desktop

```text
Sidebar │ Main Content
        │
        │ Two-column sections
```

## Mobile

```text
Navbar
────────────
Page Header
────────────
Resume Card
────────────
Candidate Profile
────────────
Skills
────────────
Experience
────────────
Education
────────────
Projects
────────────
CTA
```

Cards should stack vertically.

No important information should depend on horizontal scrolling.

---

# 42. Loading Behavior

Initial page load:

```text
Page Shell
    ↓
Fetch Resume State
    ↓
Render Appropriate State
```

A lightweight skeleton may be used while loading.

Avoid displaying a blank page.

The frontend should fetch the current backend resume state before deciding whether to render:

```text
No Resume
Processing
Ready
Failed
```

---

# 43. Refresh and Navigation Recovery

The Resume page must support recovery after:

* Browser refresh
* Route navigation
* Closing and reopening the application
* Temporary network interruption

Example:

```text
User uploads resume
       ↓
Processing begins
       ↓
User refreshes page
       ↓
Frontend fetches backend state
       ↓
Backend says "processing"
       ↓
Resume processing UI restored
```

The UI must not incorrectly return the user to the upload state.

---

# 44. Error Hierarchy

Errors should be classified by where they occur.

## File Error

```text
Invalid file
```

## Upload Error

```text
Upload failed
Please try again.
```

## Processing Error

```text
Resume could not be processed
Please try again or upload a different resume.
```

## Server Error

```text
Something went wrong
Please try again.
```

Technical details remain hidden from the user.

---

# 45. Accessibility Structure

The page should have:

```text
main
├── heading
├── resume status
├── upload control
├── profile sections
└── actions
```

Upload controls must have accessible labels.

Buttons must clearly describe their action.

Examples:

```text
Upload Resume
Replace Resume
Choose Different File
Try Again
Activate New Resume
Delete Resume
Start Personalized Interview
```

Avoid ambiguous labels such as:

```text
Continue
Go
Proceed
```

when a more descriptive label is possible.

Progress indicators should expose meaningful accessible status to assistive technologies.

---

# 46. Animation Boundaries

The wireframe intentionally limits animation.

Animations may be used for:

* Upload progress
* Processing transitions
* Card appearance
* State changes
* Success confirmation

Avoid:

* Constant floating elements
* Excessive graph animations
* Large entrance animations
* Distracting decorative motion

The Resume page should feel calmer than the landing page.

---

# 47. Information Hierarchy

The page should prioritize information in this order:

```text
1. Resume status
2. Primary action
3. Candidate identity
4. Skills
5. Experience
6. Education
7. Projects
8. Certifications
9. Achievements
10. Secondary actions
```

However, sections that do not contain data should not occupy space.

---

# 48. New User Principle

A new user should immediately understand:

```text
What is this?
        ↓
Why does TITAN need my resume?
        ↓
What should I do?
        ↓
What happens after I upload?
```

The page should answer all four without requiring documentation.

---

# 49. Existing User Principle

An existing user should immediately understand:

```text
Which resume is active?
        ↓
What does TITAN know about me?
        ↓
Is my profile correct?
        ↓
How can I use this information?
```

The user should be able to reach a personalized interview without unnecessary navigation.

---

# 50. State-Driven Implementation Principle

The implementation should be state-driven.

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

For replacement flows, an additional activation/review state may exist:

```text
replacementStatus
     │
     ├── idle
     ├── selecting
     ├── uploading
     ├── processing
     ├── ready_for_review
     ├── activating
     └── failed
```

The UI should render the appropriate experience based on the resume state rather than creating separate disconnected pages for every state.

Backend state remains authoritative for persisted resume processing status.

---

# 51. State Transition Rules

The following transitions are valid:

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

Failure can occur during upload or processing:

```text
selected
   ↓
uploading
   ↓
upload_failed

processing
   ↓
failed
```

Retry:

```text
upload_failed → uploading

failed → processing
```

Replacement:

```text
active V1
   ↓
upload V2
   ↓
processing V2
   ↓
ready V2
   ↓
review V2
   ↓
activate V2
   ↓
active V2
```

---

# 52. Implementation Invariants

The following rules must always hold:

### Invariant 1 — One Active Resume

A user should have at most one active resume version.

```text
User
 ↓
Active Resume
 ↓
Version V2
```

### Invariant 2 — Historical Context Is Immutable

Historical interviews must retain the resume context used when they were conducted.

```text
Interview → Resume Version / Snapshot
```

### Invariant 3 — Processing Does Not Equal Activation

A successfully processed replacement resume does not automatically replace the active resume.

```text
ready ≠ active
```

### Invariant 4 — Backend Is Source of Truth

The frontend must recover persisted state from the backend after refresh or navigation.

### Invariant 5 — Empty Sections Are Hidden

Sections without meaningful data should not render large empty containers.

### Invariant 6 — User Data Is Not Silently Overwritten

Replacing a resume should not unexpectedly overwrite independently user-selected profile information.

---

# 53. Wireframe Completion Criteria

The wireframe is complete when all primary states and flows are represented:

```text
[✓] New user
[✓] File selected
[✓] File validation
[✓] Uploading
[✓] Upload failure
[✓] Processing
[✓] Processing recovery
[✓] Processing failed
[✓] Resume ready
[✓] Existing user
[✓] Resume review
[✓] Replace resume
[✓] Resume versioning
[✓] Historical interview integrity
[✓] Delete confirmation
[✓] Delete behavior
[✓] Interview connection
[✓] Responsive layout
[✓] Loading state
[✓] Error states
[✓] Accessibility structure
[✓] State-driven implementation
```

---

# 54. Final UX Goal

The Resume Intelligence experience should make the user feel:

> "TITAN understands me."

Not:

> "I uploaded a PDF to a website."

The resume is the bridge between the user's background and TITAN's personalized interview engine.

The experience should therefore make three things clear:

```text
My resume
    ↓
TITAN understands my profile
    ↓
TITAN uses that context
    ↓
I get better interview preparation
```

The interface should remain simple on the surface while preserving the underlying structure required for reliable resume processing, versioning, personalization, and historical interview integrity.

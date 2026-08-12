# TITAN — Resume Intelligence User Flow

**Document:** Resume Intelligence User Flow
**Version:** 1.1
**Status:** Proposed
**Module:** Resume Intelligence

---

# 1. Purpose

This document defines the complete user journey through TITAN's Resume Intelligence module.

The flow must support two primary user types:

1. **New User** — has never uploaded a resume.
2. **Existing User** — already has an active or previously processed resume and may have interview history.

The experience must remain simple, predictable, and consistent across both states.

The Resume Intelligence flow must also preserve the relationship between resume versions and historical interviews.

---

# 2. Core Principle

The user should always understand:

* Where they are.
* What TITAN is doing.
* What they need to do next.
* What information TITAN has extracted.
* Whether a resume is active.
* How the resume affects their interview experience.

The UI must never leave the user wondering:

> "What am I supposed to do now?"

The system should clearly distinguish between:

```text
Uploaded Resume
      ↓
Processed Resume
      ↓
Reviewed Candidate Profile
      ↓
Active Resume
      ↓
Interview Context
```

---

# 3. Entry Points

Users can enter Resume Intelligence through:

```text
Dashboard
   │
   ├── Resume card
   │
   ├── Resume navigation item
   │
   ├── Start Interview CTA
   │
   └── Profile / Settings
```

The system should determine the appropriate Resume Intelligence state automatically.

---

# 4. High-Level Flow

```text
                    Resume Intelligence
                           │
                           ▼
                  Check Resume Status
                           │
              ┌────────────┴────────────┐
              │                         │
          No Resume                 Resume Exists
              │                         │
              ▼                         ▼
        Empty / Upload            Resume Overview
              │                         │
              ▼                         ├── View Profile
       Select Resume                   │
              │                         ├── Replace Resume
              ▼                         │
          Validate                      └── Start Interview
              │
              ▼
           Upload
              │
              ▼
      Extract Resume Text
              │
              ▼
       Parse Resume Data
              │
              ▼
        AI Analysis
              │
              ▼
      Candidate Profile
              │
              ▼
          Review
              │
              ▼
       Set as Active
              │
              ▼
       Resume Ready
              │
              ▼
       Start Interview
```

---

# 5. Resume Lifecycle

A resume progresses through the following conceptual lifecycle:

```text
NONE
  ↓
SELECTED
  ↓
UPLOADING
  ↓
PROCESSING
  ↓
READY_FOR_REVIEW
  ↓
ACTIVE
```

Failure can occur during selection, upload, extraction, parsing, or AI analysis:

```text
SELECTED / UPLOADING / PROCESSING
                │
                ▼
              FAILED
                │
          ┌─────┴─────┐
          ▼           ▼
        Retry     Choose Another
```

An existing active resume can also become an inactive historical version when replaced:

```text
ACTIVE V1
   ↓
Upload V2
   ↓
Process V2
   ↓
Review V2
   ↓
Activate V2
   ↓
V1 becomes historical
V2 becomes active
```

---

# 6. State Model

Resume Intelligence has the following major UI states:

```text
NONE
SELECTED
UPLOADING
PROCESSING
READY_FOR_REVIEW
ACTIVE
FAILED
```

These UI states represent the user-facing lifecycle.

The backend may maintain additional internal processing states where necessary.

---

# 7. State: NONE

## Meaning

The user has no active resume.

Typical user:

> First-time TITAN user.

## UI

Show:

```text
Resume Intelligence

Build your TITAN profile

Upload your resume so TITAN can understand
your experience and personalize your interviews.

[ Upload Resume ]

PDF or DOCX · Maximum 5 MB
```

## Available Actions

Primary:

```text
Upload Resume
```

No other major action should compete with the upload CTA.

The empty state must not contain:

* Empty graphs
* Empty reports
* Fake scores
* Fake skill data
* Artificial interview history

---

# 8. New User Flow

```text
User opens Resume Intelligence
          │
          ▼
       No Resume
          │
          ▼
      Empty State
          │
          ▼
   Click Upload Resume
          │
          ▼
      File Selection
```

The first-time experience should be reassuring and explain why uploading a resume matters.

The user should understand that the resume allows TITAN to personalize future interviews.

---

# 9. File Selection

After clicking upload:

```text
Upload Resume
      │
      ▼
System File Picker
      │
      ▼
File Selected
```

Supported formats:

```text
PDF
DOCX
```

The system must validate:

* File presence
* File extension
* MIME type
* File size

Maximum file size:

```text
5 MB
```

Frontend validation provides immediate feedback.

Backend validation remains authoritative.

---

# 10. Invalid File Flow

```text
File Selected
     │
     ▼
Validation
     │
     ├── Valid ─────────────► Selected State
     │
     └── Invalid
            │
            ▼
       Error Message
            │
            ▼
       Choose Another
```

Example:

```text
This file type isn't supported.
Please upload a PDF or DOCX resume.
```

The user remains on the same page.

The entire interface should not reset unnecessarily.

---

# 11. Selected State

After a valid file is selected:

```text
┌───────────────────────────────────────┐
│ Resume.pdf                            │
│ PDF · 2.4 MB                          │
│                                       │
│ [Remove]           [Process Resume]  │
└───────────────────────────────────────┘
```

Primary action:

```text
Process Resume
```

Secondary action:

```text
Remove
```

The selected file must not be uploaded repeatedly if the user has not requested processing.

---

# 12. Uploading State

When processing begins:

```text
Selected
   │
   ▼
Uploading
```

During upload:

* Disable duplicate submissions.
* Prevent accidental replacement.
* Show upload progress only when actual progress is available.
* Keep the user informed.

Example:

```text
Uploading your resume...
```

Do not display fake percentage progress.

---

# 13. Processing State

After successful upload:

```text
Uploading
    │
    ▼
Processing
```

TITAN should communicate the major processing stages.

Example:

```text
✓ Resume uploaded
✓ Reading resume
● Extracting information
○ Understanding your profile
○ Building interview context
```

The exact stages may change during implementation, but the user should always understand that meaningful work is occurring.

---

# 14. Processing Pipeline

The conceptual processing pipeline is:

```text
Resume File
     │
     ▼
Text Extraction
     │
     ▼
Structured Parsing
     │
     ▼
AI Analysis
     │
     ▼
Candidate Profile
     │
     ▼
Interview Context
```

Text extraction and deterministic parsing should be performed before AI analysis wherever possible.

AI should be used purposefully rather than for tasks that can be completed without it.

---

# 15. Processing Principles

The processing UI must:

* Explain what TITAN is doing.
* Avoid technical implementation details.
* Avoid fake progress percentages.
* Avoid pretending an operation is complete when it isn't.
* Prevent duplicate processing requests.
* Recover processing state from backend state when possible.

Do not expose:

```text
Calling OpenRouter API...
Running LLM...
Parsing JSON...
```

Instead use:

```text
Understanding your profile
```

---

# 16. Processing Success

When processing succeeds:

```text
Processing
    │
    ▼
Ready for Review
```

The user should transition naturally into the candidate profile review experience.

Avoid unexpectedly redirecting the user to an unrelated page.

---

# 17. Ready for Review State

A successfully processed resume should first enter a reviewable state.

The user should see the information TITAN extracted.

Recommended structure:

```text
Resume Review
      │
      ├── Personal Information
      ├── Education
      ├── Skills
      ├── Experience
      ├── Projects
      ├── Certifications
      ├── Achievements
      └── Other Extracted Information
```

Primary action:

```text
Use This Resume
```

The exact CTA label may be refined during UI implementation.

The purpose is to make it clear that the processed resume will become the user's active interview context.

---

# 18. Candidate Profile

The processed resume becomes the foundation of the candidate profile.

Potential extracted information:

```text
Name
Email
Phone
Location
LinkedIn
GitHub
Portfolio

Education

Skills

Experience

Projects

Certifications

Achievements
```

Only information actually supported by the resume should be displayed.

Missing information must remain unknown or empty.

The system must never invent:

* Experience
* Skills
* Projects
* Education
* Certifications
* Achievements
* Career history

---

# 19. Candidate Profile Confidence

Where practical, extracted information may distinguish between:

```text
Explicit
Inferred
Unknown
```

Example:

```text
React
Source: Resume
Confidence: Explicit
```

The initial UI does not need to expose this complexity if it reduces usability.

The underlying architecture should remain compatible with confidence metadata.

---

# 20. Activating a Resume

After the candidate profile is reviewed:

```text
Ready for Review
      │
      ▼
Review Profile
      │
      ▼
Use This Resume
      │
      ▼
Set as Active
      │
      ▼
Resume Ready
```

Once activated:

```text
active: true
```

The resume becomes the default source of context for future interviews.

---

# 21. Resume Ready / Active State

The active resume view should show:

```text
Resume Overview

Active Resume
Resume.pdf

Candidate Profile
Skills
Experience
Education
Projects
Certifications
Achievements
```

Primary action:

```text
Start Interview
```

Secondary actions may include:

```text
View Profile
Replace Resume
Delete Resume
```

The active state should clearly communicate that the resume is currently being used by TITAN.

---

# 22. Existing User Flow

If the user already has an active resume:

```text
User opens Resume Intelligence
          │
          ▼
    Active Resume
          │
          ▼
    Resume Overview
          │
      ┌───┼──────────┐
      │   │          │
      ▼   ▼          ▼
   Profile Replace  Interview
```

Existing users should never be forced through the initial upload experience again.

---

# 23. Existing User: Default View

Existing users should immediately see useful information.

Recommended order:

```text
Page Header
     ↓
Active Resume
     ↓
Candidate Profile
     ↓
Skills
     ↓
Experience / Education
     ↓
Projects
     ↓
Interview CTA
```

The interface should prioritize useful information over decorative visuals.

---

# 24. Resume Replacement Flow

Existing user:

```text
Active Resume V1
       │
       ▼
Replace Resume
       │
       ▼
Select New File
       │
       ▼
Validate
       │
       ▼
Upload
       │
       ▼
Process
       │
       ▼
Review New Profile
       │
       ▼
Activate V2
       │
       ▼
V2 becomes Active
V1 becomes Historical
```

The previous resume must not be destroyed immediately when a new file is selected.

---

# 25. Resume Replacement Confirmation

Before activation of a replacement resume, communicate the consequence when necessary.

Example:

```text
Replace your current resume?

Your new resume will become the active
resume used for future interviews.

Your previous resume will remain available
for historical interview context.

[Cancel] [Continue]
```

The confirmation should explain the important consequence without unnecessarily alarming the user.

---

# 26. Resume Versioning

TITAN should conceptually maintain resume versions:

```text
Resume
├── Version 1
├── Version 2
└── Version 3
```

Exactly one version should normally be active:

```text
Version 3
active: true
```

Historical versions remain associated with previous interviews when required.

---

# 27. Historical Consistency

Example:

```text
Resume V1
    │
    ▼
Interview A
```

Later:

```text
Resume V2
    │
    ▼
Becomes Active
```

Interview A must continue referencing:

```text
Resume V1
```

It must not silently switch to V2.

Therefore:

```text
Interview A → Resume V1
Interview B → Resume V2
```

Historical reports and scores must remain stable when a user replaces their resume.

---

# 28. Processing Failure

If processing fails:

```text
Processing
    │
    ▼
  Failed
    │
 ┌──┴───────────────┐
 ▼                  ▼
Retry        Choose Another Resume
```

Example:

```text
We couldn't process your resume.

Your file was uploaded, but TITAN couldn't
extract the information successfully.

[Retry] [Choose Another Resume]
```

Technical error details remain in server logs.

---

# 29. Network Failure

If the request fails because of connectivity:

```text
Upload / Processing
        │
        ▼
   Network Error
        │
        ▼
       Retry
```

The selected file should remain available when technically possible.

The user should not be forced to restart unnecessarily.

---

# 30. AI Processing Failure

If the AI provider or AI analysis fails:

```text
AI Analysis
     │
     ▼
Failure
     │
     ▼
Retry
```

User-facing message:

```text
TITAN couldn't finish analyzing your resume.

Your file is safe. Please try again.
```

Never expose:

* API keys
* Provider credentials
* Internal API errors
* Model-specific errors
* Server stack traces

---

# 31. Authentication Failure

If the user's session expires during processing:

```text
Processing
    │
    ▼
Session Expired
    │
    ▼
Login
    │
    ▼
Return to Resume
```

Where technically possible, the user's previous state should be restored.

All resume endpoints must enforce authentication and ownership.

---

# 32. Authorization Boundary

A user must only be able to access their own:

```text
Resume
Resume File
Candidate Profile
Extracted Information
Resume Versions
```

A user must never be able to access another user's resume data by modifying a resume ID or API request.

---

# 33. Start Interview Flow

Once an active resume exists:

```text
Resume Ready
     │
     ▼
Start Interview
     │
     ▼
Interview Configuration
     │
     ├── Target Role
     ├── Interview Type
     ├── Difficulty
     ├── Optional Job Description
     └── Active Resume Context
     │
     ▼
Start Interview
```

The user should not need to upload the resume again.

---

# 34. Resume → Interview Relationship

The core relationship is:

```text
Active Resume
      │
      ▼
Candidate Profile
      │
      ▼
Interview Context
      │
      ▼
AI Questions
      │
      ▼
AI Interview
      │
      ▼
Interview Report
```

This is one of TITAN's most important product flows.

---

# 35. Interview Context Reuse

The processed candidate profile should be reused.

The system should avoid:

```text
Every Interview
      ↓
Re-upload Resume
      ↓
Re-extract Text
      ↓
Re-analyze Resume
```

Instead:

```text
Resume
  ↓
Process Once
  ↓
Candidate Profile
  ↓
Reusable Interview Context
  ↓
Multiple Interviews
```

This reduces unnecessary AI requests and improves performance.

---

# 36. Resume → Dashboard Relationship

After processing:

```text
Resume Intelligence
        │
        ▼
Candidate Profile
        │
        ├──────────────► Dashboard
        │
        └──────────────► Interview
```

Dashboard states should reflect resume availability.

### No Resume

```text
Resume profile incomplete

Upload your resume to personalize
your interview experience.

[Upload Resume]
```

### Resume Ready

```text
Resume ready

Your interview profile is ready.

[Start Interview]
```

---

# 37. New User Dashboard Relationship

For a new user:

```text
Account Created
      │
      ▼
Dashboard
      │
      ▼
No Resume
      │
      ▼
Upload Resume
      │
      ▼
AI Processing
      │
      ▼
Candidate Profile
      │
      ▼
Review
      │
      ▼
Activate Resume
      │
      ▼
Configure Interview
      │
      ▼
First AI Interview
      │
      ▼
Report
      │
      ▼
Dashboard Updated
```

This represents the core TITAN activation loop.

---

# 38. Existing User Dashboard Relationship

For an existing user:

```text
Dashboard
   │
   ├── Active Resume
   ├── Interview History
   ├── Latest Report
   ├── Current Score
   └── Start Interview
```

The user should be able to start another interview without visiting Resume Intelligence first.

---

# 39. Navigation Rules

Resume Intelligence should be accessible through the main dashboard navigation.

Possible navigation:

```text
Dashboard
Interviews
Resume
Reports
History
Settings
```

The active navigation item should clearly indicate:

```text
Resume
```

Resume Intelligence should remain inside TITAN's existing dashboard shell.

It should not behave like a separate application.

---

# 40. Back Navigation

If the user came from Dashboard:

```text
Resume
  ↓
Back to Dashboard
```

The dashboard should preserve relevant state where possible.

---

# 41. Browser Refresh

Refreshing the page must not destroy persisted resume state.

Example:

```text
Resume Ready
    ↓
Browser Refresh
    ↓
Resume Ready
```

For processing:

```text
Processing
    ↓
Browser Refresh
    ↓
Check Backend Status
    ↓
Restore Correct Processing State
```

Critical resume state must not depend exclusively on React component state.

---

# 42. Direct URL Access

If the user directly visits the Resume route:

```text
Resume Route
     │
     ▼
Authentication Check
     │
 ┌───┴──────────────┐
 ▼                  ▼
Unauthenticated   Authenticated
 │                  │
 ▼                  ▼
Login          Check Resume Status
                   │
              ┌────┴─────┐
              ▼          ▼
          No Resume    Resume Exists
              │          │
              ▼          ▼
         Empty State   Overview
```

---

# 43. Unauthenticated User

If an unauthenticated user attempts to access Resume Intelligence:

```text
Resume Route
     │
     ▼
Authentication Check
     │
     ▼
Not Authenticated
     │
     ▼
Login
     │
     ▼
Return to Intended Resume Destination
```

Where technically possible, preserve the intended destination after authentication.

---

# 44. Delete Resume Flow

If deletion is supported:

```text
Active Resume
     │
     ▼
Delete
     │
     ▼
Confirmation
     │
 ┌───┴────┐
 │        │
Cancel   Confirm
 │        │
 ▼        ▼
Resume   No Active Resume
          │
          ▼
      Empty State
```

Deleting the active resume must not automatically delete:

```text
Historical Interviews
Historical Reports
Historical Scores
```

unless the product explicitly defines such behavior.

Historical resume versions may need to be retained when they are referenced by historical interviews.

---

# 45. Mobile User Flow

The mobile flow remains conceptually identical:

```text
Resume
  ↓
Status
  ↓
Upload / View
  ↓
Process
  ↓
Review
  ↓
Activate
  ↓
Profile
  ↓
Start Interview
```

Only the presentation and layout should change.

Drag-and-drop must not be required for mobile users.

---

# 46. Loading Navigation

During critical operations:

```text
Uploading
Processing
```

avoid allowing actions that could create:

* Duplicate requests
* Conflicting resume versions
* Inconsistent state

If navigation is allowed, the operation must continue safely in the background and its status must remain recoverable.

---

# 47. Toast / Notification Rules

Use notifications for lightweight events.

Examples:

```text
Resume uploaded successfully.
```

```text
Resume activated successfully.
```

```text
Resume replaced successfully.
```

```text
Resume deleted.
```

Errors that require user action should appear in the relevant UI state rather than only as a toast.

---

# 48. Data Persistence

The following should persist through navigation and refresh:

```text
Active Resume
Resume Processing Status
Extracted Profile
Resume Metadata
Resume Version Information
Candidate Profile
```

Temporary UI state may remain local:

```text
Drag-over state
Animation state
Selected tab
Expanded section
```

---

# 49. No Resume → First Interview

The intended first-time journey is:

```text
Create Account
      ↓
Dashboard
      ↓
Upload Resume
      ↓
Validate
      ↓
AI Processing
      ↓
Candidate Profile
      ↓
Review
      ↓
Activate Resume
      ↓
Configure Interview
      ↓
AI Interview
      ↓
Report
      ↓
Dashboard Updated
```

This represents the core TITAN activation loop.

---

# 50. Existing User → Next Interview

The intended returning-user journey is:

```text
Login
  ↓
Dashboard
  ↓
Start Interview
  ↓
Existing Active Resume Context
  ↓
Interview Configuration
  ↓
AI Interview
  ↓
Report
  ↓
Updated Dashboard
```

The user should not be forced through Resume Intelligence every time.

---

# 51. Resume Replacement → Historical Interview Flow

The complete version-aware workflow is:

```text
Resume V1
   │
   ├──────────► Interview A
   │                │
   │                ▼
   │          Report A
   │
   ▼
Upload Resume V2
   │
   ▼
Process V2
   │
   ▼
Review V2
   │
   ▼
Activate V2
   │
   ├──────────► Interview B
   │                │
   │                ▼
   │          Report B
   │
   ▼
V1 remains associated with Interview A
```

This prevents historical reports from changing when the active resume changes.

---

# 52. Resume Intelligence as a Foundation

Resume Intelligence is not an isolated feature.

It provides reusable context for:

```text
Resume
   ↓
Candidate Profile
   ├── Interviews
   ├── AI Questions
   ├── Reports
   ├── Recommendations
   └── Dashboard
```

Therefore, the module should be implemented as a foundational system rather than merely a resume viewer.

---

# 53. UX Guardrails

Never:

* Force existing users to upload again.
* Show fake resume data.
* Show empty charts without meaning.
* Lose selected files unnecessarily.
* Expose backend/API errors.
* Make users understand AI implementation details.
* Hide the next action.
* Create unnecessary confirmation dialogs.
* Delete historical interview data accidentally.
* Require repeated resume uploads for interviews.
* Re-analyze an unchanged resume unnecessarily.
* Replace an active resume before the new version has successfully processed.
* Change historical interview context when a new resume becomes active.

---

# 54. Free AI Optimization

Because TITAN initially uses free AI resources:

Prefer:

```text
PDF / DOCX
     ↓
Text Extraction
     ↓
Structured Parsing
     ↓
One Purposeful AI Analysis
     ↓
Candidate Profile
     ↓
Store
     ↓
Reuse
```

Avoid:

```text
Every Interview
     ↓
Full Resume
     ↓
New AI Analysis
```

The user flow should therefore support processing once and reusing the resulting candidate context.

---

# 55. Processing Recovery

If processing continues while the user navigates away or refreshes:

```text
Processing
    │
    ▼
Leave / Refresh
    │
    ▼
Return to Resume
    │
    ▼
Fetch Backend Status
    │
 ┌──┴───────────┐
 ▼              ▼
Processing     Complete
 │              │
 ▼              ▼
Resume UI     Ready / Review
```

The frontend must not assume that leaving the page cancels server-side processing.

---

# 56. Definition of Flow Completion

The Resume Intelligence flow is complete when:

```text
[✓] New user can upload a resume
[✓] PDF and DOCX are supported
[✓] File validation works
[✓] 5 MB file limit is enforced
[✓] Upload state works
[✓] Processing state works
[✓] Processing stages are communicated
[✓] Processing success works
[✓] Processing failure works
[✓] Candidate profile is created
[✓] Processed resume can be reviewed
[✓] Resume can become active
[✓] Existing active resume is displayed
[✓] Existing user can replace resume
[✓] Resume versions are preserved
[✓] Historical interviews retain their resume context
[✓] Resume data persists
[✓] Dashboard reflects resume state
[✓] Resume context is reusable for interviews
[✓] Authentication boundaries work
[✓] Authorization boundaries work
[✓] Refresh does not destroy resume state
[✓] Processing can recover after navigation
[✓] Mobile flow works
[✓] Errors are understandable
[✓] No fake data is presented
[✓] Historical data is protected
[✓] Unnecessary AI processing is avoided
```

---

# 57. Final Product Flow

The final intended experience is:

```text
                         ┌───────────────┐
                         │     USER      │
                         └───────┬───────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │   DASHBOARD   │
                         └───────┬───────┘
                                 │
                           Resume Status
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
              ┌───────────┐           ┌──────────────┐
              │ New User  │           │ Existing User│
              └─────┬─────┘           └──────┬───────┘
                    │                        │
                    ▼                        ▼
             Upload Resume             View Active Resume
                    │                        │
                    ▼                        ├── Profile
                Validate                    │
                    │                        ├── Replace
                    ▼                        │
                 Upload                     └── Interview
                    │
                    ▼
             Text Extraction
                    │
                    ▼
             Structured Parsing
                    │
                    ▼
               AI Analysis
                    │
                    ▼
            Candidate Profile
                    │
                    ▼
                 Review
                    │
                    ▼
             Activate Resume
                    │
                    ▼
              Active Resume
                    │
                    ▼
            Start Interview
                    │
                    ▼
              AI Interview
                    │
                    ▼
              AI Report
                    │
                    ▼
               Dashboard
                    │
                    ▼
            Continuous Practice
```

The historical relationship remains preserved:

```text
Resume V1 ───────► Interview A ───────► Report A
    │
    ▼
Resume V2 becomes active
    │
    └─────────────► Interview B ───────► Report B
```

This is the core:

```text
Resume
   ↓
Candidate Profile
   ↓
Interview Context
   ↓
AI Interview
   ↓
Report
   ↓
Dashboard
   ↓
Continuous Practice
```

Resume Intelligence is therefore the foundation that connects the user's professional background to TITAN's personalized interview engine.

# TITAN — Resume Intelligence PRD

**Document:** Resume Intelligence Product Requirements Document
**Version:** 1.1
**Status:** Implementation Ready
**Module:** Resume Intelligence
**Project:** TITAN — AI Interview Preparation Platform

---

# 1. Product Overview

Resume Intelligence allows TITAN users to upload their resume and have TITAN understand their professional and technical background.

The processed resume becomes a reusable source of candidate context for:

* Personalized interviews
* Interview question generation
* Technical question selection
* Behavioural questions
* Answer evaluation
* Performance reports
* Skill-gap detection
* Preparation recommendations

The resume should be processed once and reused wherever possible.

Each uploaded resume is treated as a distinct **Resume Version**. Resume versions must preserve historical consistency so that replacing an active resume does not alter previously completed interviews or reports.

---

# 2. Product Goal

The goal is to transform an unstructured resume into a structured candidate profile that TITAN's interview engine can understand.

Instead of repeatedly sending a raw resume to the AI, TITAN should create reusable structured data.

```text
Resume
   ↓
Resume Version
   ↓
Candidate Profile
   ↓
Interview Context
   ↓
Personalized Interview
```

Resume Intelligence is the candidate-context foundation of TITAN's personalized interview system.

---

# 3. Target Users

## New User

A user who has never uploaded a resume.

The experience should:

* Clearly explain why a resume is useful.
* Make uploading simple.
* Avoid overwhelming the user.
* Provide a clear first action.
* Show meaningful processing status.
* Explain what TITAN is doing.
* Guide the user toward completing their candidate profile.

A new user should not be exposed to unnecessary resume history or advanced version-management concepts.

---

## Existing User

A user who already has a processed active resume.

The experience should:

* Show the current active resume.
* Display parsed information.
* Allow viewing extracted information.
* Allow replacing the active resume.
* Preserve historical resume versions.
* Avoid unnecessary reprocessing.
* Make the resume's role in interviews obvious.

Replacing a resume must never silently destroy or alter historical interview context.

---

# 4. Core User Flow

## New User

```text
Dashboard
   ↓
Resume
   ↓
Upload Resume
   ↓
Validate File
   ↓
Create Resume Version
   ↓
Upload
   ↓
Process
   ↓
Extract Text
   ↓
Parse Resume
   ↓
AI Analysis
   ↓
Candidate Profile Created
   ↓
Interview Context Created
   ↓
Review
   ↓
Activate Resume
   ↓
Resume Ready
```

## Existing User — View

```text
Dashboard
   ↓
Resume
   ↓
Active Resume
   ↓
View Candidate Profile
   ↓
Start Interview
```

## Existing User — Replace

```text
Active Resume V1
      ↓
Replace Resume
      ↓
Upload V2
      ↓
Validate V2
      ↓
Process V2
      ↓
Extract / Parse / Analyze
      ↓
Review V2
      ↓
User Confirms
      ↓
Activate V2
      ↓
V1 becomes Historical
      ↓
V2 becomes Active
```

A newly uploaded resume must not become the active resume before processing and review are complete.

---

# 5. Supported Resume Formats

Initial version:

* PDF
* DOCX

Unsupported files should be rejected clearly.

Future support may include:

* TXT
* Other document formats
* OCR/image-based resumes

Future formats are not part of V1.

---

# 6. File Requirements

Initial limits:

* Maximum file size: 5 MB
* PDF and DOCX only
* One active resume per user
* Multiple historical Resume Versions may exist

If a file exceeds the limit:

```text
File too large
↓
Explain maximum size
↓
Allow another upload
```

The 5 MB limit must be enforced on both the client and server.

The server is authoritative.

---

# 7. Upload Experience

The upload interface should support:

## Drag and Drop

User can drag a resume into the upload area.

## File Picker

User can click the upload area and select a file.

Drag-and-drop must never be the only upload method.

## Selected File Preview

After selection:

```text
Resume.pdf
2.1 MB
PDF

[Remove] [Process Resume]
```

The selected file is not considered an active Resume Version merely because it has been selected.

---

# 8. Upload Validation

Validation must occur on both:

## Frontend

Used for immediate user feedback.

## Backend

Used for security and correctness.

Backend validation is authoritative.

Validation includes:

* File presence
* File extension
* MIME type
* File size
* Basic file integrity
* User authentication
* User authorization

The server must not trust client-provided MIME information alone.

---

# 9. Resume Version Lifecycle

Every uploaded resume must be represented as a distinct Resume Version.

Conceptually:

```text
User
 ├── Resume V1
 ├── Resume V2
 └── Resume V3
```

Only one Resume Version may be active at a time.

Example:

```text
V1 → historical
V2 → historical
V3 → active
```

---

## 9.1 New Resume

For a user with no active resume:

```text
Upload V1
   ↓
Validate
   ↓
Process
   ↓
Review
   ↓
Activate V1
```

---

## 9.2 Resume Replacement

For an existing user:

```text
V1 ACTIVE
   ↓
Upload V2
   ↓
Process V2
   ↓
Review V2
   ↓
User confirms
   ↓
V2 ACTIVE
   ↓
V1 HISTORICAL
```

The previous active version must not be destroyed during upload or processing of the new version.

---

## 9.3 Activation

Processing completion does not automatically mean activation.

A processed Resume Version must reach a review-ready state before becoming active.

Activation should be an explicit operation.

Conceptually:

```text
POST /api/resumes/:id/activate
```

The exact endpoint naming may follow the project's established API conventions.

---

# 10. Processing States

The backend should expose authoritative processing states:

```text
uploaded
processing
ready
failed
```

These states describe the server-side lifecycle.

---

## 10.1 UI Processing Stages

The UI may provide more descriptive stages:

```text
uploading
reading
extracting
understanding
building_context
complete
```

Backend status and UI stage are separate concepts.

Example:

```text
Backend:
status = processing

UI:
stage = extracting
```

The UI must not fabricate backend state.

After page refresh, the frontend should retrieve the current processing status from the backend.

---

# 11. Upload Progress

Progress percentages must represent real measurable progress.

Do not display fabricated progress such as:

```text
64%
73%
91%
```

unless those percentages correspond to actual measurable progress.

If accurate progress cannot be measured, use an indeterminate loading state:

```text
Uploading your resume...
```

During processing:

```text
Processing your resume...
```

The UI should never appear frozen.

---

# 12. Candidate Profile

The parsed resume should produce structured candidate information.

Initial profile structure:

```text
Candidate Profile
├── Personal
├── Education
├── Skills
├── Experience
├── Projects
├── Certifications
├── Achievements
└── Career Preferences
```

Candidate Profile data must be associated with the Resume Version from which it was generated.

Conceptually:

```text
Resume V1
 └── Candidate Profile V1

Resume V2
 └── Candidate Profile V2
```

---

# 13. Personal Information

Potential fields:

```json
{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "linkedin": "",
  "github": "",
  "portfolio": ""
}
```

Only information actually present in the resume should be stored.

Missing information should remain empty rather than being invented.

---

# 14. Education

Example structure:

```json
{
  "institution": "",
  "degree": "",
  "field": "",
  "startDate": "",
  "endDate": "",
  "grade": ""
}
```

Multiple education entries must be supported.

---

# 15. Skills

Skills should be grouped where possible.

Example:

```json
{
  "languages": [],
  "frontend": [],
  "backend": [],
  "databases": [],
  "tools": [],
  "other": []
}
```

The parser should preserve technologies even if they do not fit perfectly into predefined categories.

The system must not invent skills.

---

# 16. Experience

Each experience entry may contain:

```json
{
  "company": "",
  "role": "",
  "location": "",
  "startDate": "",
  "endDate": "",
  "description": [],
  "technologies": []
}
```

Multiple experiences must be supported.

---

# 17. Projects

Projects are particularly important for TITAN because they can become interview material.

Example:

```json
{
  "name": "",
  "description": "",
  "technologies": [],
  "url": "",
  "highlights": []
}
```

The interview engine should eventually be able to ask questions such as:

> "You mentioned building X. Why did you choose Y?"

Resume Intelligence should preserve enough structured project information for the future interview engine to do this.

---

# 18. Certifications

Example:

```json
{
  "name": "",
  "issuer": "",
  "date": "",
  "credentialUrl": ""
}
```

---

# 19. Achievements

The system should preserve notable achievements mentioned in the resume.

Examples:

* Awards
* Competitions
* Hackathons
* Publications
* Leadership
* Academic achievements

---

# 20. Career Preferences

Career preferences may come from the user's profile or future onboarding rather than the resume alone.

Potential fields:

```text
Target Role
Preferred Domain
Experience Level
Preferred Interview Type
```

These values must not be invented by AI from weak evidence.

Where applicable, the system should preserve the source of the value.

Possible internal provenance values include:

```text
resume
user
system
ai_inferred
```

Explicit user-provided values must take precedence over weak AI inference.

---

# 21. AI Resume Analysis

After text extraction, AI may be used to normalize and understand the resume.

The AI may identify:

* Skills
* Technologies
* Projects
* Experience
* Education
* Technical strengths
* Potential skill gaps
* Candidate role alignment

The AI must not invent:

* Experience
* Skills
* Projects
* Education
* Certifications
* Achievements

AI output must be treated as untrusted until validated by the server.

---

# 22. AI Confidence and Provenance

Where practical, extracted information should distinguish between:

## Explicit

Clearly stated in the resume.

## Inferred

Reasonably inferred from the resume.

## Unknown

Not available.

Example:

```json
{
  "skill": "React",
  "source": "resume",
  "confidence": "explicit"
}
```

The initial implementation may simplify confidence metadata where necessary, but provenance of important values such as target role should remain distinguishable.

---

# 23. AI Architecture

Resume Intelligence must never expose the AI provider secret to the client.

Required architecture:

```text
React Client
     ↓
TITAN Server
     ↓
AI Service
     ↓
Provider Adapter
     ↓
OpenRouter
     ↓
Selected Model
```

The OpenRouter API key must remain server-side.

The frontend must never call OpenRouter directly using the secret key.

AI provider-specific implementation should be isolated behind an application-level service or adapter so that providers/models can be changed without rewriting the rest of the application.

---

# 24. Resume-to-Interview Context

After processing, TITAN should create a compact Interview Context.

Example:

```text
Candidate:
Software Engineering Graduate

Primary Skills:
JavaScript, React, Node.js, MongoDB

Projects:
TITAN
ShopSphere

Experience:
...

Target Role:
MERN / Software Engineer
```

This context becomes an input to the interview engine.

Interview Context must be associated with the Resume Version that generated it.

Conceptually:

```text
Resume V1
 ├── Candidate Profile V1
 └── Interview Context V1

Resume V2
 ├── Candidate Profile V2
 └── Interview Context V2
```

---

# 25. Reuse Strategy

A processed resume should not be analyzed again every time an interview starts.

Preferred:

```text
Upload Resume
     ↓
Process Once
     ↓
Store Candidate Profile
     ↓
Store Interview Context
     ↓
Reuse
```

Instead of:

```text
Every Interview
     ↓
Upload/Analyze Resume
     ↓
AI Request
```

This saves AI requests, reduces cost, and improves performance.

Unchanged resume data should not be re-analyzed unnecessarily.

---

# 26. Resume Replacement

Existing users must be able to replace their active resume.

Required flow:

```text
Current Resume V1
      ↓
Replace Resume
      ↓
Upload New Resume V2
      ↓
Process V2
      ↓
Review V2
      ↓
Confirm
      ↓
Set V2 as Active
      ↓
V1 becomes Historical
```

The old resume must remain available as a historical Resume Version where required for historical integrity.

---

# 27. Resume Versioning

The architecture must support Resume Versions.

Conceptually:

```text
Resume
├── Version 1
├── Version 2
└── Version 3
```

Each version should have its own:

* File metadata
* Processing state
* Extracted text
* Candidate Profile
* Interview Context
* Processing metadata
* Creation timestamp

One version is active:

```text
isActive: true
```

Historical versions remain identifiable.

Only one version may be active at a time.

---

# 28. Historical Consistency

Suppose:

```text
Resume V1
   ↓
Interview A
```

The interview must retain:

```text
resumeVersionId = V1
```

If the user later uploads:

```text
Resume V2
```

Interview A must continue referencing V1.

Example:

```text
Interview A → Resume V1
Interview B → Resume V2
```

Old reports must not change simply because the user replaced their active resume.

---

# 29. Failure Handling

Possible failures:

* Unsupported file
* File too large
* Corrupted document
* Text extraction failure
* AI provider unavailable
* AI response invalid
* Processing timeout
* Network/server failure

The user should receive a useful message and an appropriate recovery action.

Example:

```text
We couldn't process this resume.

Your file was uploaded successfully, but
we couldn't extract its contents.

Try processing the resume again.
```

Technical error details should remain in server logs.

---

# 30. Retry Behavior

Retrying processing must not unintentionally create uncontrolled duplicate Resume Versions.

The system must distinguish between:

```text
Retry processing existing Resume Version
```

and:

```text
Upload a new Resume Version
```

A failed Resume Version must never automatically become active.

---

# 31. Security Requirements

Resume files are user data.

The backend must:

* Authenticate the user.
* Authorize access to the resume.
* Validate file type.
* Validate file size.
* Prevent unauthorized file access.
* Avoid trusting client-provided MIME information alone.
* Avoid exposing uploaded files publicly.
* Protect stored resume data.
* Keep AI provider secrets server-side.
* Avoid unnecessarily logging full resume contents.
* Avoid unnecessarily logging raw AI prompts/responses.
* Delete uploaded files according to the defined deletion/retention policy.

---

# 32. API Requirements

Initial API design:

## Upload / Create Resume Version

```http
POST /api/resumes
```

Creates a new Resume Version and begins or schedules processing.

It must not automatically activate a replacement resume.

---

## Get Active Resume

```http
GET /api/resumes/active
```

Returns the user's active Resume Version.

---

## Get Resume

```http
GET /api/resumes/:id
```

Returns a specific Resume Version owned by the authenticated user.

---

## Get Resume Status

```http
GET /api/resumes/:id/status
```

Returns the current processing status and, where appropriate, UI-relevant processing stage.

---

## Activate Resume Version

```http
POST /api/resumes/:id/activate
```

Activates a processed and review-ready Resume Version.

Activating a new version must make the previous active version historical.

---

## Delete Resume

```http
DELETE /api/resumes/:id
```

Deletes or deactivates the user's resume according to the retention policy while preserving any information required for historical interviews and reports.

---

## API Semantic Rule

Creating/uploading a new Resume Version and activating a Resume Version are separate operations.

The API must not treat:

```text
Upload new resume
```

as equivalent to:

```text
Activate new resume
```

---

# 33. Authorization

Every resume endpoint must verify ownership.

A user must never be able to access another user's:

* Resume
* Resume Version
* Candidate Profile
* Interview Context
* Resume file
* Extracted information

Authorization must be enforced server-side.

---

# 34. Database Requirements

The resume system should conceptually store:

```text
ResumeVersion
├── userId
├── fileName
├── fileType
├── fileSize
├── storageReference
├── version
├── status
├── processingStage
├── extractedText
├── candidateProfile
├── interviewContext
├── processingError
├── provenanceMetadata
├── createdAt
├── updatedAt
└── isActive
```

The exact MongoDB schema will be defined during backend implementation.

The schema must enforce or reliably maintain the invariant that a user has at most one active Resume Version.

---

# 35. Dashboard Integration

## New User

```text
Dashboard
     ↓
No Resume
     ↓
Helpful onboarding card
     ↓
"Upload your resume"
```

The dashboard should explain the benefit without making the user feel that the application is incomplete or broken.

---

## Existing User

```text
Dashboard
     ↓
Resume Ready
     ↓
Resume Summary
     ↓
Skills / Projects / Role
     ↓
"Start Interview"
```

The dashboard should not become overloaded with unnecessary resume analytics.

---

# 36. Empty State

New users should see an intentional empty state.

Bad:

```text
Resume
----------------
[blank space]
```

Good:

```text
Your interview profile starts here.

Upload your resume so TITAN can personalize
questions around your actual skills and projects.

[Upload Resume]
```

The empty state should communicate the next action clearly.

---

# 37. Interview Integration

The interview engine will consume:

```text
Active Resume Version
+
Candidate Profile
+
Interview Context
+
Target Role
+
Optional Job Description
+
Interview Settings
```

This enables personalized questions such as:

```text
Resume:
React + Node.js + MongoDB

↓

Interview:
"You built a MERN application.
How did you handle authentication?"
```

rather than generic questions.

The interview engine must reference the appropriate Resume Version for the interview being conducted.

---

# 38. Job Description Integration

Future versions may allow:

```text
Resume
+
Job Description
       ↓
Match Analysis
       ↓
Interview Focus
```

This can identify:

* Required skills
* Missing skills
* Relevant projects
* Likely technical topics

This feature should be designed so it can be added without rewriting the Resume Version architecture.

Job Description matching is not required for Resume Intelligence V1.

---

# 39. UX Principles

The resume experience must be:

* Simple
* Clear
* Professional
* Fast
* Reassuring
* Transparent

Avoid:

* Excessive animations
* Excessive graphs
* Technical terminology
* Long forms
* Unnecessary AI gimmicks
* Fabricated progress indicators

Animations should communicate meaningful state changes rather than decorate the interface.

---

# 40. Accessibility

The resume experience should support:

* Keyboard navigation
* Visible focus states
* Screen-reader-friendly labels
* Clear error messages
* Sufficient contrast
* Accessible upload controls
* Reduced-motion preferences

Drag-and-drop must not be the only upload method.

Processing state changes should be communicated accessibly.

---

# 41. Performance

The UI should immediately respond to upload actions.

Long-running processing should not block the browser.

The backend should process the resume asynchronously if processing becomes sufficiently expensive.

The architecture should therefore be compatible with:

```text
Upload
  ↓
Background Processing
  ↓
Status Updates
```

The initial implementation may use a simpler synchronous flow if processing time remains acceptable, provided that the API still exposes reliable processing state and can be evolved toward background processing.

---

# 42. Free AI Optimization

Because TITAN initially uses free AI resources:

## Do not:

* Re-analyze unchanged resumes.
* Send the entire resume unnecessarily.
* Make multiple AI requests for the same operation.
* Generate information that can be extracted without AI.
* Call the AI provider directly from the client.
* Depend permanently on one specific free model.

## Prefer:

```text
PDF/DOCX
   ↓
Local/server text extraction
   ↓
Structured parsing
   ↓
One purposeful AI analysis
   ↓
Validate structured output
   ↓
Store result
   ↓
Reuse
```

AI provider and model configuration should remain centralized and replaceable.

---

# 43. Delete and Retention Semantics

Deleting an active resume must not unintentionally destroy historical interview/report integrity.

The implementation must distinguish between:

```text
Active Resume Version
Historical Resume Version
Uploaded File
Candidate Profile
Interview Context
Historical Interview
Historical Report
```

If a historical interview depends on a Resume Version, the information required to preserve that interview's meaning must remain available.

The exact storage/retention strategy may preserve either:

* The required historical Resume Version and its context, or
* An immutable snapshot of the context used by the interview.

Historical interviews and reports must remain readable after resume replacement or deletion.

---

# 44. Success Criteria

Resume Intelligence is complete when:

* Users can upload supported resumes.
* Invalid files are rejected safely.
* PDF uploads work.
* DOCX uploads work.
* Files above 5 MB are rejected.
* Resume text can be extracted.
* Candidate information can be structured.
* AI can enrich/normalize the candidate profile.
* AI output is validated before persistence.
* The processed profile is stored.
* Candidate Profile is tied to its Resume Version.
* Interview Context is tied to its Resume Version.
* Users can view their processed resume information.
* Users can replace their active resume.
* New resume versions require review before activation.
* Only one Resume Version is active at a time.
* Previous versions remain historical.
* Historical interviews retain their original Resume Version.
* Historical reports remain intact.
* Resume data is protected by authentication and authorization.
* The interview engine can consume the candidate context.
* The system minimizes unnecessary AI requests.
* AI provider secrets remain server-side.
* New users receive a clear and useful empty state.
* Existing users receive a clean resume overview.
* Processing failures have recovery paths.
* Retry does not create uncontrolled duplicate versions.
* Delete behavior preserves historical integrity.

---

# 45. Definition of Done

The module is considered ready for integration when:

```text
[✓] Upload
[✓] PDF validation
[✓] DOCX validation
[✓] 5 MB file-size validation
[✓] Authentication
[✓] Authorization
[✓] Resume version creation
[✓] Extraction
[✓] Parsing
[✓] AI analysis
[✓] AI output validation
[✓] Candidate profile
[✓] Interview context
[✓] Persistence
[✓] Backend resume status
[✓] UI processing stages
[✓] Review before activation
[✓] Resume activation
[✓] Resume replacement
[✓] Historical versions
[✓] Historical interview references
[✓] Delete/retention behavior
[✓] Error handling
[✓] Retry handling
[✓] Dashboard integration
[✓] Interview integration
[✓] Server-side AI provider security
[✓] Free AI optimization
[✓] Accessibility
```

---

# 46. Future Enhancements

Not part of V1:

* Multiple simultaneous active resumes
* Resume scoring
* ATS optimization
* Resume rewriting
* Job matching
* Job-description comparison
* Resume recommendations
* Automatic resume improvement
* LinkedIn profile import
* OCR for image-based resumes
* Advanced Candidate Profile editing
* Advanced resume analytics

These may be added after the core interview workflow is stable.

---

# 47. Product Decision

**Resume Intelligence is the first AI-dependent TITAN module.**

The system will prioritize:

**Reliable extraction → structured candidate profile → reusable AI context → personalized interviews.**

The resume is not merely a file stored by TITAN.

It becomes the foundation of the user's personalized interview experience.

The core implementation principle is:

```text
Simple for the user
        ↓
Reliable for TITAN
        ↓
Safe for historical data
        ↓
Reusable for AI
        ↓
Extensible for future interviews
```

A visually polished Resume Intelligence implementation is not considered successful if it compromises data integrity, historical context, AI reliability, or user trust.

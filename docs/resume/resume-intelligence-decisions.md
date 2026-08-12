# TITAN — Resume Intelligence Decisions & Implementation Addendum

**Status:** Authoritative
**Purpose:** Resolve cross-document ambiguities and establish implementation decisions for Resume Intelligence V1.
**Applies to:** PRD, Wireframe, UI Specification, User Flow, Backend/API, AI integration, and implementation.

---

## 1. Purpose

This document defines the implementation decisions that must be treated as authoritative when the Resume Intelligence planning documents contain ambiguity, conflicting behavior, or insufficient implementation detail.

The four primary documents remain the foundation:

* `resume-intelligence-prd.md`
* `resume-wireframe.md`
* `resume-ui-spec.md`
* `resume-userflow.md`

This addendum does **not** replace those documents.

When a conflict exists, this document resolves the conflict for implementation purposes.

---

# 2. Core Product Model

Resume Intelligence follows this conceptual pipeline:

```text
Resume File
    ↓
Resume Version
    ↓
Extracted Resume Data
    ↓
Candidate Profile
    ↓
Interview Context
    ↓
AI Interview
    ↓
Interview Report
```

A resume is not merely an uploaded file.

It is the source from which TITAN builds structured candidate information that can later personalize interviews and reports.

---

# 3. New User vs Existing User

## 3.1 New User

A new user may have no active resume.

Expected experience:

```text
Dashboard
   ↓
Resume Intelligence
   ↓
No Resume Empty State
   ↓
Upload Resume
   ↓
Validate
   ↓
Process
   ↓
Review
   ↓
Activate
   ↓
Candidate Profile Ready
```

The experience must clearly explain what TITAN is doing and what the user should do next.

Do not expose advanced resume/history concepts unnecessarily to a first-time user.

---

## 3.2 Existing User

An existing user may already have an active resume and historical interview data.

Expected experience:

```text
Dashboard
   ↓
Resume Intelligence
   ↓
Active Resume
   ├── View Profile
   ├── Start Interview
   └── Replace Resume
```

Historical interviews and reports must remain accessible regardless of whether the user later replaces their active resume.

---

# 4. Resume Upload Requirements

## 4.1 Supported Formats

V1 supports:

* PDF
* DOCX

Other formats must be rejected.

---

## 4.2 Maximum File Size

Maximum accepted file size:

```text
5 MB
```

Validation must occur on both:

```text
Client
+
Server
```

Client validation improves UX.

Server validation is authoritative and mandatory for security and correctness.

---

## 4.3 Upload Validation

The server must validate:

* File presence
* File type
* File extension
* MIME type where applicable
* File size
* Basic file integrity

A client-side validation result must never be trusted as the final validation decision.

---

# 5. Resume Version Lifecycle

## 5.1 Core Rule

Every uploaded resume is treated as a **Resume Version**.

Uploading a new resume does not overwrite the existing resume record.

Example:

```text
Resume V1
Resume V2
Resume V3
```

Each version is independently identifiable.

---

## 5.2 New Resume

For a user without an active resume:

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

## 5.3 Resume Replacement

Replacing an active resume follows:

```text
V1 ACTIVE
    ↓
Replace Resume
    ↓
Upload V2
    ↓
Validate
    ↓
Process V2
    ↓
Review V2
    ↓
User Confirms
    ↓
V2 ACTIVE
    ↓
V1 HISTORICAL
```

A newly uploaded resume must **not automatically replace the active resume before processing and review are complete**.

This protects users from incorrect extraction or AI-generated profile data unexpectedly becoming their active interview context.

---

# 6. Candidate Profile Relationship

Candidate Profile data must be associated with the Resume Version from which it was generated.

Conceptually:

```text
ResumeVersion V1
 ├── Extracted Resume Data
 ├── Candidate Profile V1
 └── Interview Context V1

ResumeVersion V2
 ├── Extracted Resume Data
 ├── Candidate Profile V2
 └── Interview Context V2
```

Do not model historical interview context as only one mutable global profile.

This prevents replacing a resume from changing the historical meaning of previous interviews.

---

# 7. Historical Interview Preservation

Every interview that uses resume-derived context must retain a reference to the resume version used.

Example:

```text
Interview A
    ↓
resumeVersionId = V1

Interview B
    ↓
resumeVersionId = V2
```

Replacing the active resume must not modify the resume context associated with historical interviews.

Historical reports must remain understandable and reproducible even after the user uploads newer resume versions.

---

# 8. Candidate Profile Editing

Resume Intelligence V1 provides:

```text
View Profile
```

rather than a fully editable Candidate Profile.

The initial implementation should not introduce an unrestricted manual profile-editing system unless explicitly specified elsewhere.

This avoids creating a second complex source-of-truth system during V1.

Future versions may support controlled profile corrections.

---

# 9. Target Role Provenance

If TITAN displays a target role or similar candidate attribute, the system should distinguish where that value originated.

Possible sources:

```text
resume
user
system
ai_inferred
```

The source must be available internally even if it is not exposed prominently in the UI.

User-provided values must not be represented as AI-inferred values.

AI-inferred values should not silently override explicit user-provided values.

---

# 10. Processing Architecture

Resume processing follows:

```text
Upload
   ↓
Validation
   ↓
File Storage
   ↓
Text Extraction
   ↓
Structured Parsing
   ↓
AI Analysis
   ↓
Schema Validation
   ↓
Candidate Profile
   ↓
Interview Context
   ↓
Review
   ↓
Activation
```

Processing should be deterministic wherever possible.

AI should be used for tasks that genuinely benefit from semantic understanding rather than basic file parsing.

---

# 11. Processing Status vs UI Stage

Backend processing state and UI presentation stage are separate concepts.

## 11.1 Backend Status

The backend should expose a small set of authoritative states such as:

```text
uploaded
processing
ready
failed
```

---

## 11.2 UI Processing Stage

The UI may present more descriptive stages:

```text
uploading
reading
extracting
understanding
building_context
complete
```

Example:

```text
Backend:
status = processing

UI:
stage = extracting
```

The UI must not invent backend state.

If the page is refreshed, the frontend should be able to retrieve the current processing state from the backend.

---

# 12. Upload Progress

Progress percentages must represent real measurable progress.

Do not display fabricated values such as:

```text
64%
73%
91%
```

unless those values correspond to actual measurable upload/processing progress.

If accurate progress cannot be measured, use an indeterminate loading state:

```text
Uploading your resume...
```

or:

```text
Processing your resume...
```

with an appropriate animation.

---

# 13. AI Architecture

The AI provider must never be accessed directly from the browser using a secret API key.

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

The frontend must never contain the OpenRouter secret.

---

# 14. Provider Abstraction

AI provider-specific implementation should be isolated behind an application-level service or adapter.

Conceptually:

```text
AIService
    ↓
Provider Adapter
    ↓
OpenRouter
```

This allows TITAN to change providers or models without coupling the entire application to a single provider.

The rest of the application should request AI functionality through the internal AI service rather than directly calling OpenRouter.

---

# 15. Free-First AI Requirement

TITAN V1 should prioritize free or zero-cost AI options where technically practical.

The implementation should:

* Prefer available free model options/routes.
* Avoid unnecessary AI calls.
* Avoid repeated analysis of unchanged resume data.
* Reuse stored structured results when appropriate.
* Keep provider configuration centralized.
* Make model/provider changes possible without frontend changes.

Free model availability may change over time, so the model name must not be treated as permanently fixed product logic.

---

# 16. Structured AI Output

AI-generated resume analysis must produce structured data rather than arbitrary prose wherever the application needs to consume the result programmatically.

Conceptually:

```text
Resume Text
    ↓
AI Analysis
    ↓
Structured JSON
    ↓
Schema Validation
    ↓
Persist
```

The server must validate AI output before treating it as trusted application data.

Malformed or incomplete AI responses must result in controlled failure/retry behavior rather than silently storing invalid data.

---

# 17. Resume-to-Interview Context

Resume Intelligence must prepare structured information that can later be consumed by the interview system.

The interview system should be able to use relevant information such as:

* Candidate skills
* Technologies
* Projects
* Experience
* Education
* Achievements
* Relevant resume-derived strengths
* Relevant areas requiring deeper questioning

However, Resume Intelligence must not attempt to implement the complete interview engine.

Its responsibility is to produce reliable candidate context.

---

# 18. AI Interview Boundary

Resume Intelligence ends at:

```text
Candidate Profile
+
Interview Context
```

The actual interview system begins afterward:

```text
Interview Context
    ↓
Interview Configuration
    ↓
Question Generation
    ↓
AI Interview
    ↓
Conversation
    ↓
Evaluation
    ↓
Report
```

This separation keeps Resume Intelligence focused and prevents the module from becoming responsible for the entire AI interview system.

---

# 19. API Semantics

Creating a new resume version and activating a resume version are separate operations.

Conceptually:

```text
POST /api/resumes
```

creates/uploads a new Resume Version.

Activation is a separate action:

```text
POST /api/resumes/:id/activate
```

The exact final endpoint naming may follow the project's established API conventions, but the semantic distinction must remain.

Do not use a generic "replace resume" operation that silently overwrites the active version.

---

# 20. Delete Semantics

Deleting an active resume must be handled carefully because historical interviews may depend on it.

The system must distinguish between:

```text
Active Resume
Historical Resume Version
Historical Interview Context
Uploaded File
```

Deleting an active resume must not unintentionally destroy historical interview/report information.

If historical interviews depend on a resume version, either:

1. Preserve the required resume-version/context record, or
2. Preserve an immutable interview context snapshot.

The implementation must never create broken historical reports.

---

# 21. Error Handling

The following failures must have explicit user-facing states:

### Unsupported format

```text
This file type isn't supported.
Please upload a PDF or DOCX file.
```

### File too large

```text
Your resume must be 5 MB or smaller.
```

### Extraction failure

```text
We couldn't read this resume.
Please try another file.
```

### AI processing failure

```text
We couldn't finish analyzing your resume.
Please try again.
```

### Network/server failure

```text
Something went wrong.
Please try again.
```

Errors should provide an actionable recovery path wherever possible.

---

# 22. Retry Behavior

Retry must not accidentally create uncontrolled duplicate Resume Versions.

The implementation should distinguish between:

```text
Retry processing existing version
```

and:

```text
Upload a completely new version
```

A processing failure should not automatically activate the failed version.

---

# 23. Active Resume Invariant

At most one Resume Version may be active for a user at a time.

Conceptually:

```text
User
 ├── V1 → historical
 ├── V2 → historical
 └── V3 → ACTIVE
```

When V3 becomes active, the previously active version becomes historical.

---

# 24. UI Principles

Resume Intelligence must continue TITAN's established visual language:

* Dark interface
* Minimal premium aesthetic
* Clear hierarchy
* Subtle borders
* Restrained motion
* Consistent typography
* Consistent spacing
* Purposeful animation
* Strong empty states
* Responsive behavior

Do not introduce a visually unrelated design language.

---

# 25. Animation Principles

Animations should communicate state changes rather than exist purely for decoration.

Appropriate examples:

```text
Upload begins
Processing stage changes
Profile appears
Progress completes
Resume activation succeeds
```

Avoid excessive animation, especially during information-heavy profile/review states.

---

# 26. Accessibility

All Resume Intelligence interactions must remain keyboard accessible.

Important requirements include:

* Visible focus states
* Accessible upload controls
* Meaningful button labels
* Appropriate status announcements
* Sufficient contrast
* No information conveyed through animation alone
* Reduced-motion compatibility

---

# 27. Security

Resume files may contain sensitive personal information.

The implementation must:

* Validate uploads server-side.
* Never expose AI provider secrets to the client.
* Avoid logging full resume contents unnecessarily.
* Avoid logging raw AI prompts/responses unless required for controlled debugging.
* Protect resume-related API endpoints through authentication/authorization.
* Ensure users can only access their own resume data.

---

# 28. Implementation Guardrails for Kiro

When implementing Resume Intelligence:

### Kiro MUST

* Follow the finalized PRD.
* Follow the finalized user flow.
* Follow the finalized wireframe.
* Follow the finalized UI specification.
* Follow this addendum when resolving conflicts.
* Preserve existing TITAN design language.
* Preserve historical interview/report data.
* Keep AI provider secrets server-side.
* Treat Resume Versions as distinct records.
* Separate processing from activation.
* Validate AI output.
* Handle failure states explicitly.

### Kiro MUST NOT

* Automatically activate an unreviewed replacement resume.
* Overwrite historical resume context.
* Delete historical interview/report data when replacing a resume.
* Fabricate progress percentages.
* Put OpenRouter API keys in frontend code.
* Invent unsupported resume formats.
* Add unrestricted profile editing without specification.
* Add unnecessary animations or dashboard graphs.
* Introduce a new visual design system.
* Implement the full interview engine inside Resume Intelligence.

---

# 29. Source-of-Truth Hierarchy

When implementation questions arise, use this order:

```text
1. This Decisions & Implementation Addendum
2. resume-intelligence-prd.md
3. resume-userflow.md
4. resume-wireframe.md
5. resume-ui-spec.md
6. Existing TITAN architecture/design-system documentation
7. Existing implementation conventions
```

If a requirement remains genuinely unspecified, do not silently invent complex behavior.

Prefer the smallest implementation consistent with the product architecture.

---

# 30. Definition of Done — Resume Intelligence V1

Resume Intelligence V1 is considered implementation-ready when:

* [ ] New users can upload their first resume.
* [ ] Existing users can view their active resume.
* [ ] PDF uploads work.
* [ ] DOCX uploads work.
* [ ] Files above 5 MB are rejected.
* [ ] Unsupported file types are rejected.
* [ ] Client and server validation exist.
* [ ] Resume versions are distinct records.
* [ ] Resume processing has authoritative backend status.
* [ ] UI processing stages accurately represent the backend process.
* [ ] Upload progress is real or indeterminate.
* [ ] Resume text is extracted successfully.
* [ ] AI analysis produces validated structured data.
* [ ] Candidate Profile is generated.
* [ ] Interview Context is generated.
* [ ] New resume versions require review before activation.
* [ ] Only one Resume Version is active at a time.
* [ ] Previous versions remain historical.
* [ ] Historical interviews remain intact.
* [ ] Historical reports remain intact.
* [ ] Resume context used by historical interviews remains identifiable.
* [ ] AI provider secrets remain server-side.
* [ ] OpenRouter integration is provider-abstracted.
* [ ] Free-first model selection is supported.
* [ ] Processing failures have recovery paths.
* [ ] Retry does not create uncontrolled duplicates.
* [ ] Delete behavior preserves historical integrity.
* [ ] UI follows TITAN's established design system.
* [ ] Accessibility requirements are satisfied.
* [ ] Mobile behavior is usable.
* [ ] No unnecessary animations or decorative complexity are introduced.

---

# 31. Final Principle

Resume Intelligence is not simply a resume uploader.

It is the **candidate-context foundation of TITAN's personalized interview system**.

The implementation should therefore prioritize:

```text
Correctness
    ↓
Data integrity
    ↓
Reliable AI processing
    ↓
Clear user experience
    ↓
Future interview compatibility
    ↓
Visual polish
```

A visually impressive implementation that corrupts resume history or produces unreliable interview context is not considered successful.

The goal is a Resume Intelligence system that is **simple for the user, reliable for TITAN, and extensible for the AI interview system.**

# TITAN — Interview UI Specification

**Document:** `interview-ui-spec.md`
**Module:** Interview Intelligence
**Version:** V1.1
**Status:** Implementation-ready
**Depends on:**

* `interview-intelligence-prd.md`
* `interview-userflow.md`
* `interview-wireframe.md`
* `interview-data-model.md`
* `interview-api.md`
* `interview-architecture.md`
* `interview-backend-spec.md`

---

# 1. Purpose

This document defines the implementation-level UI specification for TITAN's Interview Intelligence module.

It translates approved product behavior, user flows, wireframes, backend contracts, and architectural decisions into:

* UI states
* component responsibilities
* layouts
* interaction behavior
* visual hierarchy
* voice interaction states
* question presentation
* answer/report presentation
* retry and explanation flows
* session progress
* final performance reporting
* responsive behavior
* accessibility requirements
* frontend state requirements
* loading and error states
* session recovery behavior

This document defines **how the interface behaves and appears**.

It does not redefine:

* interview intelligence rules
* AI prompting logic
* scoring algorithms
* database schemas
* API contracts
* backend processing rules
* model-selection logic

Those responsibilities belong to the corresponding PRD, data-model, API, architecture, and backend documents.

If a conflict exists between this document and an approved backend/API/data contract, the contract document must be resolved before implementation.

---

# 2. Product UI Philosophy

TITAN should not feel like:

> Question → Answer → Score → Next.

It should feel like:

> **Practice → Understand → Improve → Retry → Progress**

Every interaction should reinforce the feeling that the user is becoming a better interview candidate.

The interface should therefore prioritize:

1. clarity
2. confidence
3. actionable feedback
4. visible progress
5. low cognitive load
6. conversational interaction
7. professional interview realism

The UI must never make the user feel like they are being judged by a static grading system.

Performance data should be presented as a tool for improvement, not as a judgment of the user's worth or ability.

---

# 3. Core UX Principles

## 3.1 One Primary Action

Every major state should have one obvious primary action.

Examples:

* Setup → `Start Interview`
* Asking → `Start Answer`
* Listening → `Finish Answer`
* Report → `Continue`
* Retry → `Try Again`
* Explanation → `Continue Interview`
* Completion → `Practice Again`

Secondary actions must remain visually subordinate.

---

## 3.2 Feedback Before Progression

The intended flow is:

**Answer → Analysis → Feedback → Improvement opportunity → Continue**

The user should understand what happened before moving to the next question.

---

## 3.3 Improvement Must Be Actionable

Avoid vague feedback such as:

> "Communication could be better."

Instead:

> "Your answer was understandable, but you used several long pauses while explaining the project architecture."

Then:

> "Try answering in this order: problem → approach → technology → result."

Feedback should identify:

* what happened
* why it matters
* what to do differently

---

## 3.4 Retry Must Feel Optional

The user should never feel forced to retry.

The report should provide:

* `Try Again`
* `Continue`

Retry should be clearly available without interrupting the primary flow.

---

## 3.5 Evidence Over Encouragement

Prefer evidence-based reinforcement.

Good:

> "Your structure improved from 68 → 81 after the retry."

Avoid excessive generic encouragement such as:

> "Amazing! You're doing great!"

The interface should build confidence through measurable progress.

---

## 3.6 Never Fabricate Performance

The UI must only display values returned or explicitly calculated from supported backend data.

Never invent:

* scores
* confidence values
* filler-word counts
* improvement percentages
* technical accuracy
* communication metrics
* historical comparisons

Development mocks must be explicitly marked as mock data.

---

# 4. Visual Language

Interview Intelligence must inherit TITAN's existing design system.

Reuse:

* existing typography
* existing spacing scale
* existing border treatment
* existing card system
* existing icon system
* existing button styles
* existing dark-theme foundation
* existing form controls
* existing animation conventions
* existing responsive primitives

Do not introduce a separate visual language for interviews.

The interview experience should feel like a natural extension of TITAN.

Avoid excessive:

* glow
* gradients
* bouncing animations
* decorative illustrations
* gamification
* visual noise

---

# 5. Interview Module Routes

Recommended frontend routes:

```text
/interview
/interview/setup
/interview/session/:sessionId
/interview/session/:sessionId/report
```

Optional future routes:

```text
/interview/history
/interview/session/:sessionId/question/:questionId
```

V1 does not require a dedicated route for every question.

The live interview should primarily behave as a stateful session experience.

The URL must identify the session where applicable so that refresh/recovery behavior can be supported.

---

# 6. Interview Setup Screen

## 6.1 Purpose

Allows the user to define what they want to practice.

Supported context sources may include:

* Company
* Role
* Job Description
* Resume
* Mix

The exact available context sources must follow the approved PRD.

---

## 6.2 Layout

Recommended structure:

```text
------------------------------------------------
                    INTERVIEW
          Practice like the real thing.

        What do you want to practice for?

 [ Company ]          [ Role ]
 [ Job Description ] [ Resume ]
 [ Mix ]

------------------------------------------------

             Additional configuration

 Interview type
 [ Technical ] [ Behavioral ] [ Mixed ]

 Difficulty
 [ Easy ] [ Medium ] [ Hard ]

 Interview duration
 [ 15 min ] [ 30 min ] [ 45 min ]

------------------------------------------------

             [ Start Interview ]
------------------------------------------------
```

Only approved configuration options should be exposed.

Do not expose:

* internal model settings
* prompt configuration
* scoring weights
* backend identifiers
* internal AI parameters
* developer-only controls

---

# 7. Context Selection

Each context option must be represented as an interactive selectable card.

Example:

```text
┌─────────────────────────────┐
│ Resume                      │
│ Questions based on your     │
│ actual experience.          │
└─────────────────────────────┘
```

Selected state should use:

* stronger border
* elevated/background treatment
* clear selected indicator
* accessible selected semantics

Do not rely on color alone to communicate selection.

---

# 8. Context-Specific UI

## 8.1 Company

```text
Company
[ Google_____________________ ]

Target role
[ Software Engineer__________ ]
```

The exact fields must follow the approved context model.

---

## 8.2 Role

```text
Target role
[ Full Stack Developer_______ ]
```

---

## 8.3 Job Description

Provide a text input/paste area.

```text
Paste job description

┌───────────────────────────────┐
│                               │
│                               │
│                               │
└───────────────────────────────┘
```

The UI should provide clear validation for:

* empty input
* unsupported content
* excessive input where applicable

---

## 8.4 Resume

Display the currently active resume.

```text
Resume

Sher_Karthikeya_Yadav.pdf

✓ Active resume
```

If no active resume exists:

```text
No active resume

Upload a resume to practice
resume-based interviews.
```

The UI should not claim that a resume is active unless the backend/user profile confirms it.

---

## 8.5 Mix

Show the selected context sources.

```text
Interview context

✓ Company
✓ Role
✓ Resume
✓ Job Description
```

The selected context should be visually clear before starting.

---

# 9. Setup Validation

Before `Start Interview` becomes actionable, all required inputs must be valid.

Examples:

* required company provided
* required role provided
* required job description provided
* active resume available when required
* valid interview type
* valid difficulty
* valid duration

Validation should be:

* immediate where appropriate
* understandable
* specific
* accessible

Avoid generic errors such as:

> "Invalid input."

Prefer:

> "Add a target role before starting the interview."

---

# 10. Interview Start State

After the user selects `Start Interview`, transition into a dedicated starting state.

Example:

```text
Preparing your interview...

Building your interview context
Preparing your first question
```

The UI must prevent duplicate start actions while the session is being created.

The user should not be able to accidentally create multiple sessions by repeatedly clicking the start button.

---

# 11. Live Interview Screen

This is the primary experience of the module.

Recommended layout:

```text
┌───────────────────────────────────────────────┐
│ TITAN                         Question 4 / 10 │
│                                               │
│ ──────────────────────────────────────────── │
│                                               │
│ Interviewer                                   │
│                                               │
│ "Tell me about a challenging technical       │
│  problem you encountered while building      │
│  one of your projects."                      │
│                                               │
│                                               │
│                    ●                          │
│                 Listening                     │
│                                               │
│              [ Finish Answer ]               │
│                                               │
│ ──────────────────────────────────────────── │
│ Technical Interview · Medium                  │
└───────────────────────────────────────────────┘
```

The question should dominate the screen.

Secondary metadata should remain visually subtle.

---

# 12. Question Presentation

Question hierarchy:

```text
Question number
        ↓
Question text
        ↓
Optional context
        ↓
Voice interaction
```

Question text must remain readable across desktop, tablet, and mobile.

Do not allow metadata, navigation, or decorative elements to visually compete with the question.

---

# 13. Question Metadata

Metadata may include:

* question number
* total questions
* interview type
* difficulty
* question category

Example:

```text
Question 4 of 10
Technical · Medium
```

Metadata should be secondary information.

---

# 14. Interviewer States

The UI must distinguish between interviewer states.

## 14.1 Thinking

```text
Preparing your next question...
```

## 14.2 Asking

```text
Interviewer

[Question text]
```

## 14.3 User Turn

```text
Your turn
```

## 14.4 Listening

```text
● Listening
```

## 14.5 Processing

```text
Analyzing your answer...
```

Each state should have a distinct but consistent visual treatment.

The UI must not expose internal AI reasoning.

---

# 15. Voice Interaction

Voice is a core V1 capability.

The interview experience must support microphone-based answers.

Microphone state must always be understandable to the user.

---

# 16. Microphone States

## 16.1 Idle

```text
[ 🎙 Start Answer ]
```

---

## 16.2 Listening

```text
       ●

    Listening
```

---

## 16.3 Processing

```text
       ◌

   Analyzing...
```

---

## 16.4 Permission Denied

```text
Microphone access is required
to conduct a voice interview.

[ Enable microphone ]
```

---

## 16.5 Microphone Unavailable

```text
We couldn't access your microphone.

Check your browser permissions
and try again.
```

---

## 16.6 Recording Error

```text
We couldn't continue recording.

Please try again.

[ Try Again ]
```

The UI must not silently continue as though a recording exists when recording failed.

---

# 17. Recording Visualization

The recording indicator should provide subtle real-time feedback.

Recommended:

* microphone icon
* subtle pulse
* optional waveform
* elapsed time

Example:

```text
      ╭──────────────╮
      │ ~ ~ ~ ~ ~ ~  │
      ╰──────────────╯

          01:24

        Listening
```

The visualizer must not become the focal point of the screen.

The user should focus on answering.

---

# 18. Recording Controls

Primary control:

```text
[ Finish Answer ]
```

Secondary controls may include:

```text
[ Pause ]
```

Optional:

```text
[ Cancel ]
```

Avoid exposing technical recording controls.

Do not expose raw audio-processing terminology unless necessary for recovery/error messaging.

---

# 19. Recording Completion

When the user finishes an answer:

1. stop recording
2. preserve the captured answer state
3. disable duplicate submission
4. transition to processing
5. submit/process the answer through the approved API flow

The UI should clearly indicate that the answer was received.

Example:

```text
Your answer has been received.

Analyzing your response...
```

---

# 20. Answer Processing State

The processing state should feel intentional rather than like an unexplained spinner.

Example:

```text
Your answer has been received.

Analyzing:

✓ Response content
✓ Technical accuracy
✓ Communication
✓ Delivery
✓ Interview quality
```

Only display processing categories that correspond to supported backend analysis.

The UI must not imply that a metric was analyzed if the backend did not provide it.

---

# 21. Answer Transcript

After processing, show the transcript where supported.

Collapsed:

```text
Your answer

[ Show transcript ]
```

Expanded:

```text
Your answer

[ Hide transcript ]

"I used React and Node.js to build..."
```

For long transcripts:

* constrain height
* allow scrolling
* preserve readability
* avoid making the transcript dominate the report

If transcription fails, the report should still render if analysis is available.

Example:

```text
Transcript unavailable.

Your performance report is still available.
```

---

# 22. Per-Question Performance Report

Every supported answer should produce an actionable report.

Recommended structure:

```text
────────────────────────────────

ANSWER REPORT

Overall
78 / 100

────────────────────────────────

What went well

✓ Explained the project clearly
✓ Mentioned the technologies used
✓ Provided a relevant example

────────────────────────────────

What could improve

Communication

Your explanation became difficult to follow
when describing the backend flow.

Technical depth

You described what you built but did not explain
why you selected the architecture.

Language

You used several incomplete sentences.

────────────────────────────────

How to improve

Structure your response as:

Problem
→ Approach
→ Technical decision
→ Result

────────────────────────────────

Want to try this question again?

[ Try Again ]       [ Continue ]
```

The exact score and feedback fields must come from the approved interview analysis contract.

---

# 23. Performance Dimensions

Possible dimensions include:

* Technical Accuracy
* Relevance
* Communication
* Clarity
* Structure
* Completeness
* Confidence
* Filler Words
* Sentence Quality

Only dimensions supported by the interview engine should be displayed.

The frontend must not assume every report contains every dimension.

Missing dimensions should be omitted rather than displayed with fake values.

---

# 24. Score Visualization

Scores should be simple and readable.

Example:

```text
Technical Accuracy       84
█████████████████░░░

Communication            72
██████████████░░░░░

Structure                79
███████████████░░░░
```

Avoid:

* giant score animations
* gamified badges
* unnecessary colors
* competitive ranking
* excessive celebration

The goal is improvement.

---

# 25. Filler Word Feedback

When supported by the analysis engine:

```text
Filler words

You used approximately 8 filler words.

Common examples:

"um"
"like"
"actually"

Suggestion:

Pause briefly instead of filling silence.
```

Use objective language.

Never shame the user.

Avoid:

> "You speak badly."

Prefer:

> "Several filler words were detected during your response."

If filler-word analysis is unavailable, omit the section.

---

# 26. Sentence Formation Feedback

If supported:

```text
Language

Some sentences were incomplete or difficult
to follow.

Instead of:

"I was working on backend and then basically
we have..."

Try:

"I worked on the backend and implemented..."
```

Corrected examples should only be generated/displayed when supported by the analysis response.

---

# 27. Incorrect Answer Feedback

If the answer is technically incorrect:

```text
Technical accuracy

Your answer is partially incorrect.

You stated that JWT stores the user's password.
JWTs do not store passwords.

A better explanation:

JWTs contain signed claims used for authentication.
Passwords should be securely hashed and stored separately.
```

The explanation should teach rather than merely deduct points.

The UI should clearly distinguish:

* incorrect
* partially correct
* insufficient
* correct

---

# 28. Answer Classification

Supported classifications may include:

* Correct
* Mostly correct
* Partially correct
* Incorrect
* Insufficient answer

Example:

```text
Partially correct

You identified the main concept correctly,
but missed an important detail about token validation.
```

The frontend should render the classification supplied by the backend rather than independently deciding correctness.

---

# 29. Improvement Guidance

Every actionable improvement should ideally answer:

```text
What happened?
        ↓
Why does it matter?
        ↓
What should I do differently?
```

Example:

```text
Issue

Your answer listed technologies but did not
explain the reason behind your architecture.

Why it matters

Interviewers use this to evaluate technical
decision-making.

Try this

Explain the problem first, then the decision,
then the trade-off, and finally the result.
```

This structure should be reused across report components.

---

# 30. Retry Flow

If the user chooses:

```text
[ Try Again ]
```

The same question should be presented again.

The UI should indicate that this is an improvement attempt.

Example:

```text
Improvement attempt

Let's try that question again.

Focus on:

• Answer structure
• Technical explanation
• Concise delivery
```

The second attempt must produce a separate analysis result.

The original attempt must remain preserved.

---

# 31. Retry Comparison

When enough data exists, show comparison between attempts.

Example:

```text
IMPROVEMENT

First attempt        Second attempt

Communication
72                   84       ↑12

Structure
68                   81       ↑13

Technical Accuracy
78                   82       ↑4
```

Only display comparisons when the required metrics exist for both attempts.

Never manufacture an improvement value.

If comparison data is unavailable, omit the comparison section.

---

# 32. Retry State

The frontend must distinguish between:

* first attempt
* retry requested
* retry starting
* retry recording
* retry processing
* retry report

Example:

```text
Improvement attempt 2

Question 4 of 10
```

The retry should remain associated with the original question.

---

# 33. Explanation Intervention

At appropriate moments, TITAN may offer an explanation.

Example:

```text
You encountered:

"Database indexing"

Would you like a quick explanation?

[ Explain ]       [ Continue ]
```

The intervention should not interrupt the user unnecessarily.

The user must always be able to continue without viewing the explanation unless the product rules explicitly require otherwise.

---

# 34. Explanation UI

Explanation should appear inline.

Example:

```text
────────────────────────────

DATABASE INDEXING

An index is a data structure that helps
the database find records faster without
scanning every document.

Example:
...

Why interviewers ask this:
...

Key point to remember:
...

[ I understand — Continue ]
────────────────────────────
```

Keep explanations concise.

Provide deeper explanation only when explicitly requested and supported.

---

# 35. Learning Loop

The intended interaction is:

```text
Question
   ↓
Answer
   ↓
Analysis
   ↓
Report
   ↓
Understand mistake
   ↓
Optional explanation
   ↓
Optional retry
   ↓
Improved answer
   ↓
Continue
```

This loop is a defining interaction pattern of TITAN.

---

# 36. Session Progress

The user should always understand where they are.

Example:

```text
Question 6 of 10

████████████░░░░░░░░ 60%
```

Progress should represent meaningful interview progression.

Do not use:

* AI processing progress
* API loading progress
* token generation progress

as interview progress.

---

# 37. Question Transition

When moving to a new question:

1. finish current report
2. user chooses `Continue`
3. transition briefly
4. generate/show next question
5. reset recording state
6. focus the user on the new question

Avoid abrupt replacement.

Example:

```text
Preparing your next question...
```

followed by:

```text
Question 5 of 10

[Question]
```

---

# 38. Adaptive Follow-Up Questions

Follow-up questions should visually appear as normal interview questions.

Do not expose internal AI reasoning.

Never display:

```text
AI decided to ask this because...
```

Instead:

```text
Follow-up question

You mentioned that you used Redis
for caching.

Why did you choose Redis instead of
another caching strategy?
```

The UI may identify a follow-up using subtle context where useful, but it should still feel like a natural interview conversation.

---

# 39. Session Completion

When the final question has been completed and all required analysis is available:

```text
Interview complete.

Let's see how you performed.
```

Then transition to the final report.

Do not display the final report before required analysis has completed.

Avoid childish celebratory gamification.

---

# 40. Final Master Report

The final report summarizes the entire interview.

Recommended structure:

```text
────────────────────────────────────────

INTERVIEW PERFORMANCE

Overall Performance
82 / 100

Technical
86

Communication
79

Confidence
81

Structure
84

────────────────────────────────────────

WHAT YOU DID WELL

✓ Strong technical fundamentals
✓ Good use of project examples
✓ Clear explanation of architecture

────────────────────────────────────────

TOP AREAS TO IMPROVE

1. Reduce filler words
2. Structure answers more consistently
3. Give stronger measurable results
4. Improve technical depth in follow-up questions

────────────────────────────────────────

PROGRESS

Questions answered        10
Questions retried          3
Improved answers           2

────────────────────────────────────────

RECOMMENDED NEXT STEPS

• Practice system-design explanations
• Work on concise project introductions
• Reduce filler words
• Practice behavioral STAR responses

[ Practice Again ]
```

Only display sections for which actual data exists.

---

# 41. Master Report Philosophy

The final report should contain:

* performance data
* meaningful trends
* strongest areas
* weakest areas
* improvement suggestions
* retry/improvement information
* recommended next practice areas

It should not contain unnecessary motivational paragraphs.

The report should feel like a professional assessment.

---

# 42. Progress Tracking Across Sessions

If historical comparison data exists:

```text
Previous interview       Current interview

76                       82       +6
Communication 71         79       +8
Technical 81             86       +5
Confidence 73            81       +8
```

If no historical comparison exists:

```text
This is your first recorded interview.

Future interviews will show your progress here.
```

Never display a comparison using fabricated baseline values.

---

# 43. Session History

Future-compatible UI may support previous sessions.

Example:

```text
Interview
Full Stack Developer

Score
82

Communication
79

Technical
86

2 retries

12 Aug 2026
```

Session history does not need to be fully implemented in V1 unless included in the approved product scope.

---

# 44. Loading States

All loading states must use TITAN's existing loading/skeleton system where appropriate.

## Setup Loading

Show skeleton configuration cards where applicable.

## Interview Starting

```text
Preparing your interview...
```

## Question Generation

```text
Preparing your next question...
```

## Answer Analysis

```text
Analyzing your answer...
```

## Final Report

Use skeleton report sections where appropriate.

Avoid blank screens.

---

# 45. Error States

## 45.1 Question Generation Failure

```text
We couldn't prepare the next question.

[ Try Again ]
```

---

## 45.2 Answer Processing Failure

```text
We couldn't analyze your answer.

Your recording is still available.

[ Try Again ]
```

---

## 45.3 Session Recovery Failure

```text
We couldn't restore your interview session.

[ Return to Interview ]
```

---

## 45.4 Network Failure

Use a non-blocking error indicator where possible.

If the current operation cannot continue, provide:

* clear explanation
* retry action
* safe recovery path

---

## 45.5 Final Report Failure

```text
We couldn't prepare your final report.

Your interview data is still saved.

[ Try Again ]
```

Do not imply that session data was lost unless the backend confirms that it was lost.

---

# 46. Session Recovery

If the user refreshes the browser during an active interview, the UI should attempt to restore the session.

Possible state:

```text
Restoring your interview...
```

If restoration succeeds:

```text
Continue from Question 5
```

If restoration fails:

```text
We couldn't restore this interview.

[ Start New Interview ]
```

The UI must never silently create a new interview.

The restored state must come from the backend/session source of truth.

---

# 47. Browser Navigation Protection

If the user attempts to leave an active interview while unsaved or incomplete state could be lost:

```text
Leave interview?

Your current interview session is still in progress.

[ Stay ]     [ Leave ]
```

Use browser-level protection where appropriate.

Do not block navigation when the session has already been safely completed/saved.

---

# 48. Responsive Design

The interview experience must work on:

* desktop
* laptop
* tablet
* mobile

---

## 48.1 Desktop

Use a centered interview container.

Maintain a readable maximum content width.

Do not stretch the question interface unnecessarily across the entire screen.

---

## 48.2 Tablet

* reduce horizontal padding
* preserve question readability
* stack secondary information when necessary
* keep recording controls accessible

---

## 48.3 Mobile

Prioritize:

1. question
2. microphone interaction
3. answer controls
4. report

Example:

```text
Question 4 / 10

"Explain how you would..."



        🎙

     Listening

[ Finish Answer ]
```

Report sections should stack vertically.

Buttons should provide adequate touch targets.

---

# 49. Accessibility

The module must support:

* keyboard navigation
* visible focus states
* semantic buttons
* accessible labels
* sufficient contrast
* screen-reader-friendly status messages
* accessible microphone controls
* accessible form validation
* accessible error messages

Dynamic states such as:

```text
Listening
Analyzing
Question generated
Recording complete
```

should use appropriate live-region semantics where necessary.

Do not rely solely on:

* color
* animation
* waveform movement
* icon changes

to communicate important state.

---

# 50. Focus Management

Focus should move intentionally during major state changes.

Examples:

* setup validation → first invalid field
* new question → question heading
* report → report heading
* explanation → explanation heading
* error → error message/action

Do not steal focus during normal recording updates.

---

# 51. Motion

Animations should communicate state changes.

Use animation for:

* recording state
* processing
* question transitions
* score changes
* report appearance
* progress changes

Avoid:

* excessive bouncing
* constant movement
* unnecessary page transitions
* distracting background animations

---

# 52. Reduced Motion

Respect:

```text
prefers-reduced-motion
```

When enabled:

* remove pulsing
* reduce transitions
* disable waveform animation
* use instant state transitions where appropriate
* avoid animated score counting

Functionality must remain identical.

---

# 53. Component Inventory

Recommended component structure:

```text
interview/
├── InterviewSetup.jsx
├── InterviewSession.jsx
├── InterviewQuestion.jsx
├── InterviewerState.jsx
├── VoiceRecorder.jsx
├── RecordingIndicator.jsx
├── AnswerTranscript.jsx
├── AnswerAnalysis.jsx
├── QuestionReport.jsx
├── PerformanceMetric.jsx
├── ImprovementPanel.jsx
├── RetryQuestion.jsx
├── ExplanationPanel.jsx
├── SessionProgress.jsx
├── SessionComplete.jsx
├── MasterReport.jsx
├── ProgressComparison.jsx
└── InterviewError.jsx
```

Actual naming may follow existing TITAN frontend conventions.

Components should remain focused on presentation and interaction.

---

# 54. Frontend State Architecture

The interview module should use a dedicated centralized interview state layer.

Recommended conceptual states:

```text
setup
starting
asking
listening
processing_answer
showing_report
explaining
retrying
completed
error
```

The actual state machine must follow the approved architecture.

Individual UI components should not independently invent or maintain competing versions of interview state.

---

# 55. Interview Session State

Conceptually:

```js
{
  sessionId,
  status,
  question,
  questionNumber,
  totalQuestions,
  recordingState,
  transcript,
  currentReport,
  retryState,
  explanation,
  progress,
  finalReport
}
```

This is a conceptual UI representation only.

The exact API/data shape belongs to:

* `interview-data-model.md`
* `interview-api.md`
* `interview-architecture.md`

The frontend should map backend responses into its centralized UI state rather than exposing backend-specific structures throughout components.

---

# 56. Component Data Ownership

Preferred flow:

```text
Interview State Layer
        ↓
Interview Components
        ↓
UI
```

The state layer communicates with the approved interview API.

Components should not independently fetch interview data unless explicitly required by the architecture.

Avoid duplicated:

* API calls
* session state
* report state
* loading state
* retry state

---

# 57. Voice Architecture Boundary

Voice recording logic should remain isolated from presentation components.

Conceptually:

```text
Interview State
      ↓
Voice Controller
      ↓
Browser Microphone APIs
      ↓
Recording Data
      ↓
Interview API
```

The UI should not contain complex audio-processing logic.

The recording component should expose clean states/events such as:

```text
idle
requesting_permission
listening
paused
stopped
error
```

The exact implementation must follow the approved architecture.

---

# 58. API/UI Contract Rules

The frontend must:

1. use only approved API endpoints
2. use only approved request fields
3. use only approved response fields
4. never invent endpoints
5. never invent scoring fields
6. never assume unsupported metrics exist
7. handle optional response fields gracefully
8. distinguish loading from successful empty responses
9. handle API errors explicitly
10. preserve session identity throughout the interview

If the UI requires a field that does not exist in the API contract, the contract must be updated before implementation.

Do not solve contract gaps with frontend hardcoding.

---

# 59. No Fabricated Data

The UI must never display:

* fake scores
* fake confidence values
* fake filler-word counts
* fake improvement percentages
* fake technical analysis
* fake historical performance
* placeholder results presented as real results

During development, mocks must be explicitly identified.

Example:

```text
Development mock data
```

Mock data must never ship as production behavior.

---

# 60. Empty States

## 60.1 No Active Interview

```text
Ready to practice?

Start an interview tailored to your
role, company, job description, or resume.

[ Start Interview ]
```

---

## 60.2 No Historical Sessions

```text
No completed interviews yet.

Your performance history will appear here
after your first interview.
```

---

## 60.3 No Resume

```text
No active resume

Upload a resume to practice
resume-based interviews.
```

---

# 61. Interview Personality

TITAN's interviewer should feel:

* professional
* adaptive
* calm
* intelligent
* conversational

The UI should support this personality.

Avoid making the interviewer feel like:

* a chatbot
* a game
* a school examination
* a static questionnaire

---

# 62. Adaptive Question Experience

The user should never see internal reasoning.

Do not display:

```text
AI decided to ask this because...
```

Instead display only the resulting question.

Example:

```text
Follow-up question

You mentioned that you used Redis
for caching.

Why did you choose Redis instead of
another caching strategy?
```

The UI should preserve the illusion of a natural interview conversation without exposing internal generation mechanics.

---

# 63. Follow-Up Questions

Follow-up questions should visually appear as normal questions.

The user should not need to understand whether a question was:

* generated from the original interview plan
* adapted from the previous answer
* generated as a follow-up

unless the product explicitly chooses to expose that distinction.

---

# 64. Report-to-Question Transition

Example:

```text
Your answer has been analyzed.

[ Continue ]
```

After continue:

```text
Preparing your next question...
```

Then:

```text
Question 5 of 10

...
```

The transition should preserve the feeling of conversational continuity.

---

# 65. Knowledge Improvement

When the user makes a supported mistake, the UI should create a learning opportunity.

Flow:

```text
Mistake
  ↓
Explanation
  ↓
Correct understanding
  ↓
Optional retry
  ↓
Improved response
```

The purpose is not merely to show the user that they were wrong.

The purpose is to help them understand the concept and improve their next attempt.

---

# 66. Interview UI State Machine

Conceptual state flow:

```text
SETUP
  ↓
STARTING
  ↓
ASKING
  ↓
LISTENING
  ↓
PROCESSING ANSWER
  ↓
QUESTION REPORT
  ├── RETRY
  │     ↓
  │  RETRY / LISTENING
  │     ↓
  │  PROCESSING
  │     ↓
  │  QUESTION REPORT
  │
  ├── EXPLAIN
  │     ↓
  │  EXPLANATION
  │     ↓
  │  REPORT / CONTINUE
  │
  └── CONTINUE
        ↓
    NEXT QUESTION
        ↓
      ASKING

LAST QUESTION
  ↓
FINAL ANALYSIS
  ↓
MASTER REPORT
```

Error and recovery states may interrupt any network-dependent state.

The user must always have a safe recovery path.

---

# 67. V1 UI Scope

V1 includes:

* interview setup
* context selection
* voice interview
* dynamic questions
* adaptive follow-ups
* answer transcription where supported
* per-question analysis
* communication feedback where supported
* technical feedback where supported
* language feedback where supported
* filler-word feedback where supported
* retry flow
* explanation flow
* session progress
* final master report
* measurable improvement within a session where supported
* session recovery where backend support exists
* loading states
* error states
* responsive layouts
* accessibility support
* reduced-motion support

---

# 68. Explicitly Out of Scope for V1

Do not build these unless separately approved:

* avatar interviewer
* facial-expression analysis
* eye-tracking
* emotion recognition
* webcam-based body-language scoring
* multiplayer interviews
* live human interviewer integration
* social leaderboards
* gamification systems
* achievements/badges
* public profiles
* interview sharing
* recruitment marketplace

These can be considered future product opportunities.

---

# 69. Implementation Rules for Kiro

When implementing this specification:

1. Reuse existing TITAN components.
2. Reuse the existing design system.
3. Do not create duplicate UI primitives.
4. Do not invent backend endpoints.
5. Do not invent scoring fields.
6. Do not hardcode fake performance data.
7. Keep interview state centralized.
8. Keep voice-recording logic isolated from presentation components.
9. Keep report components reusable.
10. Keep the UI responsive.
11. Preserve accessibility.
12. Respect reduced-motion preferences.
13. Do not modify unrelated TITAN modules.
14. Do not introduce unnecessary dependencies.
15. Follow the existing project architecture.
16. Treat API/data contracts as the source of truth for available data.
17. Handle optional backend fields without breaking the UI.
18. Do not silently recover by creating a new session.
19. Prevent duplicate session creation/submission.
20. Preserve original attempts when retrying.
21. Do not expose internal AI reasoning.
22. Do not expose internal scoring mechanics.
23. Do not render unsupported metrics.
24. Keep loading, success, and error states explicit.
25. Keep accessibility behavior consistent across every interview state.

---

# 70. Definition of Done

The Interview UI is considered implementation-ready when:

* [ ] Setup screen matches the approved flow.
* [ ] Context selection works.
* [ ] Setup validation works.
* [ ] Active resume can be selected when available.
* [ ] Interview session can be started through the approved API.
* [ ] Duplicate session creation is prevented.
* [ ] Live interview screen supports dynamic questions.
* [ ] Question metadata is displayed correctly.
* [ ] Microphone permission states are handled.
* [ ] Recording state is clearly communicated.
* [ ] Recording failures are handled.
* [ ] Answer processing state is visible.
* [ ] Transcript can be displayed when available.
* [ ] Transcript failure does not unnecessarily block supported reports.
* [ ] Per-question report is readable.
* [ ] Technical feedback is distinguishable from communication feedback.
* [ ] Language issues can be displayed when supported.
* [ ] Filler-word feedback can be displayed when supported.
* [ ] Unsupported metrics are omitted.
* [ ] Retry flow works.
* [ ] Original attempts remain preserved.
* [ ] Retry results can show improvement when comparison data exists.
* [ ] Explanation flow works.
* [ ] Session progress is visible.
* [ ] Adaptive follow-up questions are presented naturally.
* [ ] Final master report is presented clearly.
* [ ] Historical comparison appears only when data exists.
* [ ] Empty states exist.
* [ ] Loading states exist.
* [ ] Error states exist.
* [ ] Session recovery is handled.
* [ ] Browser navigation protection works where necessary.
* [ ] Desktop layout works.
* [ ] Tablet layout works.
* [ ] Mobile layout works.
* [ ] Keyboard navigation works.
* [ ] Screen-reader labels exist for interactive controls.
* [ ] Dynamic state changes are accessible.
* [ ] Focus management is implemented.
* [ ] Reduced-motion behavior works.
* [ ] No fabricated performance data is displayed.
* [ ] No internal AI reasoning is exposed.
* [ ] No unapproved API endpoints are used.
* [ ] No unapproved backend fields are assumed.
* [ ] No unrelated TITAN modules are modified.

---

# 71. Final Product Principle

The Interview Intelligence UI should make the user feel:

> **"I didn't just finish an interview. I understand what I did wrong, I know how to improve it, and I can already see myself getting better."**

That is the core UI experience TITAN must deliver.

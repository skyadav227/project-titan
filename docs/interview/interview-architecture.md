# TITAN — Interview Architecture

**Document:** `interview-architecture.md`
**Module:** Interview Intelligence
**Version:** V1
**Status:** Implementation-Ready / Pre-API
**Depends on:**

* `interview-intelligence-prd.md`
* `interview-userflow.md`
* `interview-wireframe.md`
* `interview-ui-spec.md`
* `interview-data-model.md`

**Consumed by:**

* `interview-api.md`
* `interview-backend-spec.md`

---

# 1. Purpose

This document defines the technical architecture for TITAN's Interview Intelligence module.

The architecture translates the approved product, user-flow, UI, and data-model decisions into a technical system capable of:

1. Creating interview sessions from selected context.
2. Building normalized interview context.
3. Generating dynamic opening questions.
4. Generating adaptive follow-up questions.
5. Accepting spoken answers.
6. Processing and transcribing recorded answers.
7. Performing deterministic voice and language analysis.
8. Performing semantic answer evaluation through an AI abstraction layer.
9. Producing per-question performance reports.
10. Identifying knowledge gaps and communication weaknesses.
11. Providing contextual explanations.
12. Allowing users to retry questions.
13. Measuring improvement between attempts.
14. Adapting future questions based on actual performance.
15. Tracking session progress.
16. Recovering active sessions after refresh or temporary failures.
17. Producing a final master report based only on collected evidence.
18. Persisting interview history.
19. Supporting future evolution toward real-time voice interviews.

The architecture must preserve a strict separation between:

* product behavior
* UI presentation
* application orchestration
* persistence
* deterministic analysis
* AI reasoning
* external providers

---

# 2. Architectural Principle

TITAN is not a static question generator.

The architecture must support:

```text
Question
   ↓
Answer
   ↓
Understand
   ↓
Evaluate
   ↓
Teach
   ↓
Retry
   ↓
Measure Improvement
   ↓
Adapt
   ↓
Challenge
   ↓
Improve
```

The interview engine is therefore an:

> **Adaptive assessment + feedback + learning system.**

Every architectural decision should reinforce this loop.

---

# 3. Architecture Goals

The V1 architecture must prioritize:

1. Contextual relevance
2. Adaptive questioning
3. Reliable answer evaluation
4. Voice-first interaction
5. Actionable feedback
6. Measurable improvement
7. Persistent session state
8. Recoverability
9. Provider abstraction
10. Secure user isolation
11. Structured AI outputs
12. Low unnecessary complexity
13. Clear service boundaries
14. Future extensibility

---

# 4. Non-Goals

V1 architecture must not be unnecessarily designed around:

* Live human interviewers
* Multiplayer interviews
* Video interview analysis
* Facial-expression analysis
* Emotion recognition
* Psychological profiling
* Eye tracking
* Body-language scoring
* Real-time avatar interviews
* Autonomous career coaching
* Social leaderboards
* Public interview sharing
* Recruitment marketplace

These may be considered in future architecture revisions.

---

# 5. High-Level Architecture

```text
┌──────────────────────────────────────────────┐
│                 TITAN CLIENT                 │
│                                              │
│  Interview Setup                             │
│  Interview Session                           │
│  Voice Recorder                              │
│  Question / Report UI                        │
│  Explanation / Retry UI                      │
└──────────────────────┬───────────────────────┘
                       │
                       │ HTTPS / API
                       ▼
┌──────────────────────────────────────────────┐
│              INTERVIEW API LAYER             │
│                                              │
│ Controllers / Routes / Validation / Auth     │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│            INTERVIEW ORCHESTRATION           │
│                                              │
│          Interview Session Service           │
└──────────────┬───────────────┬───────────────┘
               │               │
       ┌───────┴───────┐ ┌─────┴────────────┐
       ▼               ▼ ▼                  ▼
┌─────────────┐ ┌──────────────┐ ┌────────────────┐
│   Question  │ │    Answer    │ │    Progress    │
│   Engine    │ │   Analysis   │ │     Engine     │
└──────┬──────┘ └──────┬───────┘ └────────────────┘
       │               │
       ▼               ├───────────────┐
┌─────────────┐        ▼               ▼
│  AI Service │  ┌──────────────┐ ┌──────────────┐
│ Abstraction │  │ Speech       │ │ Deterministic│
└──────┬──────┘  │ Service      │ │ Analysis     │
       │         └──────┬───────┘ └──────────────┘
       ▼                │
┌─────────────┐         ▼
│ AI Provider │  ┌──────────────┐
│  Adapter    │  │ Speech-to-   │
└─────────────┘  │ Text Provider│
                 └──────────────┘

                       │
                       ▼
              ┌──────────────────┐
              │   Persistence    │
              │                  │
              │ Sessions         │
              │ Questions        │
              │ Attempts         │
              │ Reports          │
              │ Final Reports    │
              └──────────────────┘
```

---

# 6. Architectural Layers

TITAN Interview Intelligence is divided into the following layers:

```text
Frontend
   ↓
API / Controller
   ↓
Application Services
   ↓
Domain / Interview Engines
   ↓
Provider Abstractions
   ↓
External Providers
   ↓
Persistence
```

Each layer must have a defined responsibility.

---

# 7. Frontend Responsibilities

The frontend is responsible for presentation and user interaction.

It owns:

* Interview setup UI
* Context selection
* Microphone permission
* Browser audio recording
* Recording state
* Recording controls
* Upload initiation
* Question presentation
* Session progress visualization
* Report presentation
* Retry interaction
* Explanation interaction
* Session recovery UI
* Loading states
* Error states
* Accessibility behavior

The frontend must not own interview intelligence.

It must not independently determine:

* question difficulty
* answer score
* technical correctness
* interview progression
* knowledge gaps
* final performance
* adaptive question selection

The backend remains the source of truth for persistent interview state.

---

# 8. API Layer Responsibilities

Controllers and routes are responsible for:

* HTTP request handling
* Authentication context
* Request validation
* Authorization checks
* Calling application services
* Returning structured responses
* Mapping domain errors to HTTP responses

Controllers must remain thin.

Avoid putting:

* AI prompts
* scoring logic
* question-generation logic
* transcription logic
* database orchestration
* retry logic

inside controllers.

---

# 9. Interview Session Service

The Interview Session Service is the primary orchestration layer.

It coordinates:

* session creation
* context construction
* session state transitions
* question generation
* answer submission
* report generation
* retry flow
* explanation flow
* question progression
* session completion
* recovery

Conceptually:

```javascript
createInterview()
getInterviewSession()
submitAnswer()
retryQuestion()
requestExplanation()
continueInterview()
completeInterview()
recoverInterview()
```

The service coordinates other specialized services rather than implementing every operation itself.

---

# 10. Interview Session as Source of Truth

The persistent interview session is the authoritative representation of an active interview.

The frontend may maintain temporary UI state, but it must not become the source of truth for:

* current question
* current attempt
* completed questions
* retry state
* session status
* final completion
* persisted reports

Conceptually:

```text
Frontend UI State
       ↓
Temporary interaction state

Backend Session State
       ↓
Persistent interview truth
```

---

# 11. Interview Session State Machine

The authoritative conceptual session lifecycle is:

```text
CREATED
   ↓
PREPARING
   ↓
READY
   ↓
QUESTIONING
   ↓
ANSWER_RECORDING
   ↓
TRANSCRIBING
   ↓
ANALYZING
   ↓
FEEDBACK
   ├── RETRY
   │     ↓
   │  ANSWER_RECORDING
   │
   ├── EXPLANATION
   │     ↓
   │  EXPLANATION
   │     ↓
   │  FEEDBACK / QUESTIONING
   │
   └── CONTINUE
         ↓
      QUESTIONING
```

At the final question:

```text
QUESTIONING
   ↓
FINAL_ANALYSIS
   ↓
FINAL_REPORT_GENERATED
   ↓
COMPLETED
```

Recoverable failure states may exist around:

```text
TRANSCRIBING
ANALYZING
FINAL_ANALYSIS
FINAL_REPORT_GENERATED
```

The exact persisted enum values must remain aligned with the Data Model.

---

# 12. State Transition Rules

State transitions must be controlled by the Interview Session Service.

Components must not arbitrarily change persistent session status.

Examples:

```text
READY → QUESTIONING
```

only when a question has been successfully prepared.

```text
ANSWER_RECORDING → TRANSCRIBING
```

only after an answer submission has been accepted.

```text
TRANSCRIBING → ANALYZING
```

only after transcription succeeds.

```text
ANALYZING → FEEDBACK
```

only after a valid answer report has been generated and persisted.

Invalid transitions must be rejected.

---

# 13. Interview Context Architecture

The system supports:

* Company
* Role
* Job Description
* Resume
* Mixed Context

The Context Builder converts selected sources into a normalized internal context.

Conceptually:

```javascript
{
  company,
  role,
  jobDescription,
  resume,
  candidate,
  interviewType,
  difficulty,
  objectives
}
```

Only relevant context is populated.

The normalized context should not simply mirror database records.

It should contain only the information required by the interview engine.

---

# 14. Resume Integration

Resume Intelligence remains the owner of resume data.

Interview Intelligence consumes:

```text
ResumeVersion
   ↓
candidateProfile
   ↓
interviewContext
   ↓
Interview Context Builder
   ↓
Question Engine
```

Interview Intelligence must not modify the ResumeVersion because of interview activity.

Interview-specific observations belong to Interview Intelligence.

Examples:

```text
Weak explanation of React architecture
Knowledge gap in authentication
Strong project communication
```

These belong to interview records, not the resume.

---

# 15. Context Isolation

The AI layer should receive a normalized context rather than unrestricted database objects.

Do not send:

```text
Entire User document
Entire ResumeVersion document
Entire InterviewSession document
```

unless explicitly required.

Instead provide:

```text
Candidate facts
Relevant resume information
Selected role
Relevant company information
Job description requirements
Interview objectives
Difficulty
Session summary
```

This reduces:

* token usage
* accidental information leakage
* prompt complexity
* irrelevant reasoning

---

# 16. Question Engine

The Question Engine is responsible for generating interview questions.

It receives:

```text
Interview Context
Candidate Context
Interview Objective
Interview Type
Difficulty
Session Progress
Previous Questions
Recent Answer Performance
Weak Areas
Retry History
Conversation State
```

It returns a structured question object.

Conceptually:

```javascript
{
  question,
  category,
  difficulty,
  intent,
  expectedSignals,
  isFollowUp
}
```

The exact persisted fields must follow the Data Model.

---

# 17. Opening Question Generation

The first question must be dynamically generated from the selected interview context.

Example:

```text
Resume + Full Stack Developer
        ↓
Candidate projects
        ↓
Relevant project question
```

The system must not depend on a fixed static question array.

Static question banks may optionally be used as supporting knowledge sources, but the interview engine remains responsible for contextual selection/generation.

---

# 18. Adaptive Question Generation

The next question should consider actual interview performance.

Example:

```text
Weak technical answer
       ↓
Foundational follow-up
       ↓
Improved response
       ↓
Moderate difficulty
       ↓
Scenario-based question
```

Another:

```text
Strong technical answer
       ↓
Increase challenge
       ↓
Deeper technical question
```

The engine should avoid repeatedly attacking the same weakness without progression.

---

# 19. Question Diversity

The engine should maintain appropriate question diversity.

Possible categories include:

* Introduction
* Behavioral
* Technical
* Project
* Problem Solving
* System Design
* Role Specific
* Company Specific
* Situational
* Follow-up
* Communication

The actual categories used depend on:

* interview type
* role
* context
* difficulty
* session progression

---

# 20. Follow-Up Questions

Follow-up questions should be generated from the candidate's previous response.

Example:

```text
Candidate:
"I used Redis for caching."

        ↓

TITAN:
"Why did you choose Redis instead of another
caching strategy?"
```

The system should treat follow-ups as normal interview questions.

The user should not see internal AI reasoning.

Do not expose:

```text
AI decided to ask this because...
```

---

# 21. Question Diversity and Repetition Control

The Question Engine should track recent question topics.

Before generating a new question, it should consider:

```text
Recent categories
Recent topics
Already-covered concepts
Repeated questions
Recent weaknesses
Retry questions
Interview progress
```

The system should avoid accidental repetition unless repetition is intentionally used for learning or follow-up.

---

# 22. Difficulty Adaptation

Difficulty must be treated as interview context rather than merely a static UI setting.

The selected difficulty establishes the initial target.

The engine may adjust practical question difficulty based on performance while remaining within the intended interview objective.

For example:

```text
Selected: Medium

Strong performance
      ↓
Medium → Medium/Hard

Weak performance
      ↓
Medium → Foundational Medium
```

Difficulty changes must remain explainable through actual session behavior.

---

# 23. Answer Input Architecture

Voice is the primary V1 answer mechanism.

The client flow is:

```text
User starts recording
        ↓
Browser microphone
        ↓
Audio capture
        ↓
Local recording state
        ↓
Audio upload
        ↓
Speech Service
        ↓
Transcript
        ↓
Answer Analysis
```

The frontend should retain enough temporary information to retry an upload when technically possible.

---

# 24. Voice Recording Boundary

Voice recording logic must remain isolated from presentation components.

Recommended conceptual separation:

```text
VoiceRecorder
      ↓
Recording Controller / Hook
      ↓
Audio Blob
      ↓
Upload Service
```

The UI should not contain:

* transcription logic
* AI calls
* provider-specific code
* scoring logic

This keeps voice infrastructure replaceable.

---

# 25. Speech Service

The Speech Service abstracts speech-to-text providers.

Architecture:

```text
Interview Service
       ↓
Speech Service
       ↓
Speech Provider Adapter
       ↓
Speech-to-Text Provider
```

Application code should call:

```javascript
speechService.transcribe(audio)
```

rather than:

```javascript
openai.transcribe(...)
```

inside controllers.

---

# 26. Speech Provider Abstraction

The provider implementation should be replaceable.

Conceptually:

```text
SpeechService
   ├── Provider A
   ├── Provider B
   └── Future Provider
```

Interview logic must not depend on provider-specific request or response formats.

Provider-specific data is normalized before entering the interview domain.

---

# 27. Audio Lifecycle

V1 should avoid unnecessary long-term raw-audio retention.

Preferred lifecycle:

```text
Audio Recorded
      ↓
Temporary Upload
      ↓
Transcription
      ↓
Voice Metrics
      ↓
Answer Analysis
      ↓
Temporary Audio Deleted
```

If raw audio retention is introduced later, it must have:

* explicit product behavior
* secure storage
* access control
* retention policy
* deletion behavior
* user expectations

The canonical persistent artifacts are:

* transcript
* derived metrics
* answer report

---

# 28. Audio Validation

Audio uploads must be validated server-side.

Validation should include:

* MIME type
* file extension where applicable
* file size
* duration
* upload integrity

Client-side validation may improve UX but must never replace server-side validation.

---

# 29. Answer Analysis Architecture

Answer analysis combines deterministic analysis with AI-based semantic evaluation.

```text
Audio
  ↓
Transcript
  │
  ├── Deterministic Analysis
  │
  └── AI Semantic Analysis
           ↓
      Combined Evaluation
           ↓
      Answer Report
```

The system must clearly distinguish measurable signals from AI interpretation.

---

# 30. Deterministic Analysis

Use deterministic processing where objective measurement is possible.

Potential metrics:

* word count
* speaking duration
* words per minute
* filler-word count
* filler-word frequency
* pause duration
* pause frequency
* sentence count
* repeated phrases
* transcript completeness

These measurements should not be invented by an AI model when they can be calculated reliably.

---

# 31. AI Semantic Analysis

AI may evaluate:

* technical correctness
* relevance
* completeness
* depth
* logical structure
* explanation quality
* missing concepts
* behavioral answer quality
* STAR structure
* improvement opportunities
* model-answer guidance

AI evaluation must use structured outputs.

---

# 32. No Fabricated Performance Data

TITAN must never manufacture unavailable measurements.

Bad:

```text
Confidence: 72%
```

when no validated confidence metric exists.

Better:

```text
Your response contained several long pauses
and frequent hesitation markers.
```

If a metric is unavailable:

```text
Unavailable
```

or omit it entirely.

---

# 33. Answer Evaluation Pipeline

The canonical pipeline is:

```text
Audio
 ↓
Speech-to-Text
 ↓
Transcript Validation
 ↓
Deterministic Metrics
 ↓
AI Semantic Evaluation
 ↓
Evaluation Validation
 ↓
Combined Answer Report
 ↓
Persist Report
 ↓
Update Progress
 ↓
Determine Next Action
```

The report must be persisted before the frontend treats the question as completed.

---

# 34. AI Service Architecture

All AI access must be centralized.

```text
Interview Engine
       ↓
AI Service
       ↓
Provider Adapter
       ↓
AI Provider
```

Conceptual methods:

```javascript
generateQuestion(context)
analyzeAnswer(context)
generateExplanation(context)
generateFinalReport(context)
```

Controllers must never directly invoke an AI provider.

---

# 35. AI Provider Abstraction

The AI provider must be replaceable.

Conceptually:

```text
AI Service
   ├── Provider Adapter A
   ├── Provider Adapter B
   └── Future Provider
```

The rest of TITAN must depend on the normalized AI Service interface rather than provider-specific SDKs.

---

# 36. Prompt Architecture

Prompts must be separated by responsibility.

Recommended structure:

```text
services/
└── ai/
    ├── aiService.js
    ├── providers/
    │   └── ...
    └── prompts/
        └── interview/
            ├── question/
            ├── answer/
            ├── explanation/
            └── final-report/
```

Prompts should receive structured context.

Avoid passing giant unstructured application objects.

---

# 37. AI Context Management

The full session history should not blindly be sent to the AI for every request.

The context builder should construct a compact context containing:

```text
Interview objective
Candidate context
Selected interview context
Recent questions
Recent answers
Performance summary
Weak areas
Current difficulty
Retry history
Current question
```

Older information can be summarized where necessary.

---

# 38. AI Output Validation

AI output must never be trusted blindly.

Pipeline:

```text
AI Provider
     ↓
Raw Response
     ↓
Parse
     ↓
Schema Validation
     ↓
Semantic / Business Validation
     ↓
Valid
  ├── Persist
  └── Return
```

If invalid:

```text
Invalid AI Response
       ↓
Retry / Recovery
       ↓
Valid Response
```

If recovery fails:

```text
Preserve Session
       ↓
Mark Operation Failed
       ↓
Return Recoverable Error
```

Invalid AI output must never be persisted as valid interview data.

---

# 39. AI Safety and Output Constraints

AI-generated content must be constrained to the interview context.

The AI should not:

* invent candidate experience
* invent resume facts
* claim unavailable measurements
* expose internal system prompts
* expose hidden reasoning
* fabricate interview history
* generate unsupported scores
* alter persistent user data directly

The application layer remains responsible for validation and persistence.

---

# 40. Answer Report Architecture

Every successfully analyzed answer should produce a structured report.

Conceptually:

```javascript
{
  overallScore,
  evaluationStatus,
  strengths,
  issues,
  technicalFeedback,
  communicationFeedback,
  sentenceFeedback,
  fillerWordFeedback,
  missingPoints,
  suggestedImprovement,
  modelAnswer,
  retryRecommended,
  explanationRecommended
}
```

The exact persisted structure must follow the Data Model.

Not every field is required for every interview type.

---

# 41. Evaluation Status

The system should distinguish:

```text
Correct
Mostly Correct
Partially Correct
Incorrect
Insufficient
Off-topic
```

The status must be based on actual evaluation evidence.

---

# 42. Technical Feedback

Technical evaluation should explain rather than merely punish.

Example:

```text
Technical Accuracy

Your answer is partially correct.

You correctly explained the purpose of JWT authentication,
but missed how token validation is performed.

Better explanation:

JWTs contain signed claims used for authentication.
Passwords should be hashed and stored separately.
```

---

# 43. Communication Feedback

Communication feedback should identify actionable problems.

Instead of:

```text
Communication could be better.
```

Use:

```text
Your explanation became difficult to follow when
describing the backend flow.

Try structuring the response as:

Problem
→ Approach
→ Technical Decision
→ Result
```

---

# 44. Sentence Formation Feedback

Sentence feedback should identify meaningful issues without treating conversational speech as an academic writing exercise.

Example:

```text
Some sentences were incomplete or difficult to follow.

Try using shorter complete sentences and clearer
transitions between ideas.
```

Harmless conversational language should not be excessively penalized.

---

# 45. Filler Word Analysis

Potential filler words include:

```text
um
uh
like
actually
basically
you know
so
```

The deterministic layer should calculate counts where supported.

Example:

```text
Filler words: 8

Observation:
Several filler words occurred while transitioning
between ideas.

Suggestion:
Pause briefly instead of filling silence.
```

Filler-word feedback should remain objective and non-shaming.

---

# 46. Voice Metrics vs Psychological Claims

TITAN must not claim to directly measure psychological states such as:

* confidence
* anxiety
* nervousness
* intelligence
* personality

unless a separately validated system is introduced.

Instead, TITAN may report observable signals:

```text
Speaking pace
Pause frequency
Long pauses
Filler frequency
Repeated words
Speech duration
```

The system may use those observations to provide coaching guidance without presenting subjective psychological states as measured facts.

---

# 47. Retry Architecture

A retry creates a new AnswerAttempt associated with the same InterviewQuestion.

Conceptually:

```text
InterviewQuestion
      │
      ├── Attempt 1
      │      └── Report
      │
      └── Attempt 2
             └── Report
```

The original question remains unchanged.

The retry must not overwrite the first attempt.

---

# 48. Retry Flow

```text
Answer Report
      ↓
User selects Try Again
      ↓
Create new AnswerAttempt
      ↓
Present same question
      ↓
Record new answer
      ↓
Transcribe
      ↓
Analyze
      ↓
Generate new report
      ↓
Compare attempts
```

The retry remains associated with the same interview question.

---

# 49. Retry Comparison

When sufficient data exists, TITAN should calculate improvement.

Example:

```text
Attempt 1: 58
Attempt 2: 76

Improvement: +18
```

Dimension-level comparison may include:

```text
Communication
72 → 84   +12

Structure
68 → 81   +13

Technical Accuracy
78 → 82   +4
```

Only comparable dimensions should be displayed.

---

# 50. Retry Recommendation

The system may recommend retry when evidence suggests meaningful improvement opportunity.

However:

> Retry must remain optional.

The UI should provide:

```text
Try Again
Continue
```

The system must never trap the user in a retry loop.

---

# 51. Explanation Architecture

When an answer reveals a knowledge gap, the system may recommend an explanation.

Flow:

```text
Answer
  ↓
Evaluation
  ↓
Knowledge Gap
  ↓
Explanation Recommendation
  ↓
User chooses Explain
  ↓
Explanation Generated
  ↓
Explanation Persisted if required
  ↓
Return to Interview
```

---

# 52. Explanation Scope

Explanations must remain focused on the current interview topic.

Example:

```text
Question:
Explain JWT authentication.

Detected gap:
Token validation.

Explanation:
How JWT validation works.

Optional:
Short example.

Return:
Continue / Retry
```

TITAN should not automatically turn a small knowledge gap into a long unrelated tutorial.

---

# 53. Progress Engine

The Progress Engine tracks meaningful session-level performance.

Potential signals:

```text
Overall performance
Technical performance
Communication
Relevance
Structure
Completeness
Knowledge gaps
Retry improvement
Question difficulty
```

The exact metrics must correspond to collected evidence.

---

# 54. Progress Calculation

Progress should be derived from persisted reports and attempts.

Example:

```text
Question 1 → 54
Question 2 → 61
Question 3 → 68
Question 4 → 74
```

The system may identify trends such as:

```text
Improving structure
Increasing technical depth
Reduced filler usage
```

Only trends supported by actual data should be presented.

---

# 55. Session Progress vs Interview Completion

Interview progress and AI processing progress are different concepts.

Interview progress:

```text
Question 6 of 10
60%
```

Processing state:

```text
Analyzing your answer...
```

AI processing must never be represented as interview completion progress.

---

# 56. Final Report Architecture

When the final interview question is completed:

```text
Session
  ↓
Question Reports
  ↓
Attempt Comparisons
  ↓
Voice Metrics
  ↓
Progress Data
  ↓
Pattern Detection
  ↓
Final Report Generation
  ↓
Validation
  ↓
Persist Final Report
  ↓
Completed Session
```

The final report must be based on actual session evidence.

---

# 57. Final Report Contents

Possible sections:

```text
Overall Performance
Technical Performance
Communication Performance
Answer Quality
Strong Areas
Weak Areas
Knowledge Gaps
Communication Patterns
Retry Improvements
Recommended Focus Areas
```

Not every section must exist for every interview.

The report should answer:

> How did I perform, what am I weak at, and what should I improve next?

---

# 58. Session-Level Scoring

Scores must be derived from available evidence.

Possible dimensions:

```text
Technical Accuracy
Answer Relevance
Completeness
Communication
Structure
Problem Solving
Voice Delivery
```

Different interview types may use different dimensions.

Technical interview example:

```text
Technical Accuracy
Problem Solving
Depth
Communication
```

Behavioral interview example:

```text
Relevance
Structure
Specificity
Communication
```

The scoring configuration should remain aligned with the product and Data Model.

---

# 59. No Universal Score Requirement

The architecture must not assume every interview can produce every score.

If a dimension is not supported:

```text
Do not fabricate it.
```

The final report should only display dimensions supported by actual evaluation data.

---

# 60. Interview Completion

A session is considered complete only after:

1. Final question is answered.
2. Final answer processing succeeds.
3. Required reports are persisted.
4. Final report is generated and validated.
5. Final report is persisted.
6. Session status is updated to completed.

This prevents partially processed sessions from being incorrectly marked complete.

---

# 61. Persistence Architecture

Conceptually:

```text
User
 │
 ├── ResumeVersion
 │
 └── InterviewSession
        │
        ├── InterviewQuestion
        │      │
        │      └── AnswerAttempt
        │              │
        │              └── AnswerReport
        │
        └── FinalReport
```

The exact schema and relationships are defined by:

`interview-data-model.md`

The architecture must not introduce duplicate persistence entities without updating the Data Model first.

---

# 62. Persistence Ownership

Each domain object has one primary owner.

```text
ResumeVersion
→ Resume Intelligence

InterviewSession
→ Interview Intelligence

InterviewQuestion
→ Interview Intelligence

AnswerAttempt
→ Interview Intelligence

AnswerReport
→ Interview Intelligence

FinalReport
→ Interview Intelligence
```

Cross-module data should be referenced rather than duplicated unnecessarily.

---

# 63. Database Source of Truth

The backend database is authoritative for persistent interview state.

The frontend must not assume a state transition succeeded until the backend confirms it.

For example:

```text
User clicks Continue
       ↓
API request
       ↓
Backend updates session
       ↓
Response
       ↓
Frontend advances
```

Avoid optimistic state changes that could leave the UI inconsistent with the backend.

---

# 64. Idempotency and Duplicate Submission Protection

Answer submission must protect against duplicate requests.

Possible causes:

* double-click
* network retry
* browser retry
* connection instability
* upload retry

The system should ensure that one logical answer submission does not accidentally create multiple attempts.

Where appropriate, use:

```text
client submission identifier
request identifier
attempt identifier
```

or equivalent idempotency mechanisms.

---

# 65. Session Recovery

If the browser refreshes:

```text
Browser Refresh
      ↓
GET Active Session
      ↓
Backend returns persisted state
      ↓
Restore Session
      ↓
Restore Current Question
      ↓
Restore Appropriate UI State
```

The frontend must not create a new interview automatically.

---

# 66. Recovery Rules

If recovery succeeds:

```text
Continue from Question 5
```

If recovery fails:

```text
We couldn't restore this interview.

Start New Interview
```

The backend remains the source of truth.

---

# 67. Network Failure Handling

Temporary network failures should not automatically destroy the session.

Example:

```text
Audio Upload
   ↓
Network Failure
   ↓
Retry Upload
```

If retry fails:

```text
Preserve session
Mark operation recoverable
Allow user to retry
```

The system should prefer recovery over session destruction.

---

# 68. Failure Categories

The architecture must account for:

```text
Audio upload failure
Speech transcription failure
AI provider failure
Malformed AI response
Database failure
Question generation failure
Answer analysis failure
Final report failure
Network interruption
Session recovery failure
```

Errors should be classified as recoverable or terminal where possible.

---

# 69. Failure Recovery Principles

General principle:

> **Never destroy valid interview state because a downstream provider temporarily failed.**

Example:

```text
Audio uploaded
      ↓
Transcription failure
      ↓
Retry transcription
```

Not:

```text
Transcription failure
      ↓
Delete interview
```

---

# 70. Asynchronous Operations

Potentially long-running operations include:

* audio processing
* speech transcription
* AI answer analysis
* final report generation

The architecture should support request-response processing for V1 while preserving the ability to introduce asynchronous processing later.

The UI must clearly communicate:

```text
Uploading...
Transcribing...
Analyzing...
Preparing feedback...
```

---

# 71. V1 Communication Strategy

V1 does not require persistent WebSockets for every interview operation.

Practical baseline:

```text
REST API
+
HTTP audio upload
+
request/response processing
```

Future real-time architecture may introduce:

```text
WebSocket
+
WebRTC
+
streaming speech recognition
+
streaming AI
```

The current service abstractions must not prevent this evolution.

---

# 72. API Evolution Principle

The architecture should allow:

```text
V1
REST + upload

        ↓

Future
Streaming voice + real-time conversation
```

Therefore:

* Speech Service must be provider-independent.
* AI Service must be provider-independent.
* Interview orchestration must not assume all responses are instantaneous.
* Frontend recording must remain independent from transcription provider.
* Question generation must remain separate from transport mechanism.

---

# 73. Security Architecture

All interview endpoints require authentication.

Every resource access must be scoped to the authenticated user.

Conceptually:

```javascript
req.user.id
```

must participate in authorization.

Users must never access another user's:

* InterviewSession
* InterviewQuestion
* AnswerAttempt
* AnswerReport
* FinalReport
* Transcript
* Audio
* Performance data

Resource IDs alone are never sufficient authorization.

---

# 74. Authorization Boundary

A request such as:

```text
GET /interviews/:sessionId
```

must verify:

```text
Authenticated User
        +
Session belongs to authenticated User
```

Not merely:

```text
Session ID exists
```

The same ownership check applies to nested resources.

---

# 75. Input Validation

Validate all client-controlled input.

Examples:

```text
Interview type
Company
Role
Job description
Resume reference
Difficulty
Question count
Session ID
Question ID
Answer attempt ID
```

Audio validation must include:

```text
MIME type
File size
Duration
```

Limits must be enforced server-side.

---

# 76. Sensitive Data Handling

Interview data may contain sensitive candidate information.

The system should minimize unnecessary exposure of:

* resume contents
* transcripts
* candidate information
* interview reports
* audio
* AI context

Logs must not contain unnecessary sensitive information.

Do not log:

* passwords
* authentication tokens
* raw audio
* unnecessary complete transcripts
* provider secrets

---

# 77. Observability

Important domain events should be observable.

Examples:

```text
Interview created
Context built
Question generated
Answer submitted
Audio uploaded
Transcription completed
Answer analysis completed
Report generated
Retry requested
Explanation requested
Question completed
Interview completed
Final report generated
AI failure
Speech failure
Recovery attempted
```

Logs should use identifiers where useful without exposing unnecessary user content.

---

# 78. Service-Level Error Logging

Provider failures should capture useful diagnostic metadata such as:

```text
operation
provider
request/session identifier
failure category
duration
retry count
```

Do not log provider secrets or unnecessary candidate content.

---

# 79. Recommended Backend Structure

The existing TITAN server can evolve toward:

```text
server/
└── src/
    ├── config/
    │
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── resume.controller.js
    │   └── interview.controller.js
    │
    ├── middleware/
    │   ├── auth.js
    │   ├── errorHandler.js
    │   └── upload.js
    │
    ├── models/
    │   ├── User.js
    │   ├── ResumeVersion.js
    │   ├── InterviewSession.js
    │   ├── InterviewQuestion.js
    │   ├── AnswerAttempt.js
    │   └── InterviewReport.js
    │
    ├── routes/
    │   ├── auth.routes.js
    │   ├── resume.routes.js
    │   └── interview.routes.js
    │
    ├── services/
    │   ├── resumeService.js
    │   ├── interviewService.js
    │   ├── contextService.js
    │   ├── questionService.js
    │   ├── answerAnalysisService.js
    │   ├── progressService.js
    │   ├── explanationService.js
    │   ├── speechService.js
    │   ├── audioService.js
    │   │
    │   └── ai/
    │       ├── aiService.js
    │       ├── providers/
    │       └── prompts/
    │           └── interview/
    │               ├── question/
    │               ├── answer/
    │               ├── explanation/
    │               └── final-report/
    │
    ├── validators/
    │   └── interview/
    │
    └── utils/
```

Exact filenames may follow the existing TITAN project conventions.

---

# 80. Responsibility Matrix

| Layer                   | Responsibility                   |
| ----------------------- | -------------------------------- |
| React UI                | Presentation and interaction     |
| Voice Recorder          | Browser audio capture            |
| API Routes              | HTTP routing                     |
| Controllers             | Validation + orchestration entry |
| Interview Service       | Session orchestration            |
| Context Service         | Normalized interview context     |
| Question Service        | Dynamic/adaptive questions       |
| Speech Service          | Speech provider abstraction      |
| Audio Service           | Temporary audio lifecycle        |
| Answer Analysis Service | Evaluation orchestration         |
| Progress Service        | Session-level metrics            |
| Explanation Service     | Knowledge-gap explanations       |
| AI Service              | AI abstraction                   |
| Provider Adapters       | External provider integration    |
| Models                  | Persistence                      |
| Middleware              | Auth, upload, errors             |
| Database                | Persistent source of truth       |

---

# 81. Frontend State Architecture

The UI specification defines the conceptual states:

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

The frontend should maintain these through a centralized Interview Context / state layer.

Individual components should not independently determine the complete interview state.

---

# 82. Frontend State Flow

Conceptually:

```text
InterviewContext
       ↓
Interview API
       ↓
Interview State
       ↓
UI Components
```

Example:

```text
InterviewContext
   ├── currentQuestion
   ├── questionNumber
   ├── totalQuestions
   ├── recordingState
   ├── transcript
   ├── currentReport
   ├── retryState
   ├── explanation
   ├── progress
   └── finalReport
```

The exact client shape may differ from the persisted Data Model.

---

# 83. Component Responsibility

Interview UI components should focus on presentation.

Examples:

```text
InterviewSetup
InterviewSession
InterviewQuestion
InterviewerState
VoiceRecorder
RecordingIndicator
AnswerTranscript
QuestionReport
PerformanceMetric
ImprovementPanel
RetryQuestion
ExplanationPanel
SessionProgress
SessionComplete
MasterReport
InterviewError
```

Components must not contain backend orchestration logic.

---

# 84. UI and Architecture State Alignment

The architecture must remain consistent with the UI state model.

Example:

```text
Backend:
TRANSCRIBING

Frontend:
Processing Answer
```

The UI may use more granular presentation states, but it must not contradict backend state.

---

# 85. Loading and Processing States

The architecture must expose enough operation state for the UI to communicate:

```text
Preparing your next question...
Uploading...
Transcribing...
Analyzing your answer...
Preparing feedback...
Generating final report...
```

Blank loading screens should be avoided.

---

# 86. Accessibility Architecture

The frontend must support:

* keyboard navigation
* visible focus
* semantic buttons
* accessible labels
* sufficient contrast
* screen-reader announcements
* microphone state announcements
* processing-state announcements

Dynamic states such as:

```text
Listening
Analyzing
Question generated
```

should use appropriate live-region behavior.

---

# 87. Reduced Motion

The UI architecture must respect:

```text
prefers-reduced-motion
```

When enabled:

* disable recording pulse animations
* reduce question transitions
* disable waveform animation
* reduce score animations
* use immediate state changes where appropriate

---

# 88. Session History

V1 supports persistent interview history at the data level.

A future UI may display:

```text
Interview
Full Stack Developer

Score: 82

Communication: 79
Technical: 86

2 retries

12 Aug 2026
```

History UI implementation may be limited according to the approved V1 product scope, but the architecture must not prevent it.

---

# 89. Cross-Session Progress

V1 should preserve enough data to support future cross-session progression.

Future system:

```text
Interview 1
      ↓
Interview 2
      ↓
Interview 3
      ↓
Skill Progression
```

Possible future metrics:

```text
Technical growth
Communication growth
Filler reduction
Structure improvement
Knowledge-gap resolution
```

Cross-session analytics must use persisted historical evidence.

---

# 90. Transaction and Consistency Principles

Operations that create dependent interview records should preserve consistency.

For example:

```text
AnswerAttempt
   ↓
AnswerReport
   ↓
Question Progress
```

The system should avoid leaving partially persisted data that falsely indicates a completed answer.

Where database transactions are supported and appropriate, use them for tightly coupled persistence operations.

External provider calls should not be held inside long database transactions unnecessarily.

---

# 91. External Provider Failure Boundary

External providers are untrusted dependencies.

```text
Interview Engine
       ↓
Provider Abstraction
       ↓
External Provider
```

Provider failures must be translated into domain-level recoverable errors.

The rest of TITAN should not depend on provider-specific failure formats.

---

# 92. Timeout and Retry Strategy

External AI and speech operations should have:

* reasonable timeout handling
* bounded retries
* provider error classification
* failure logging
* session preservation

Do not retry indefinitely.

Repeated provider failure should transition the operation into a recoverable failure state.

---

# 93. Performance Strategy

Latency-sensitive user operations should be prioritized.

Critical path:

```text
Question
 ↓
Record
 ↓
Transcribe
 ↓
Analyze
 ↓
Report
 ↓
Continue
```

Potential optimization strategies include:

* compact AI context
* structured AI responses
* provider timeouts
* bounded retries
* temporary audio storage
* avoiding unnecessary database reads
* caching appropriate static/context information

---

# 94. Interview Context Caching

Where appropriate, stable context can be reused during a session.

Examples:

```text
Normalized resume context
Role context
Job description extraction
Company context
Interview objectives
```

The system should avoid repeatedly rebuilding expensive context that has not changed.

---

# 95. Data Minimization

Only store information necessary for the approved interview experience.

The system should avoid storing:

* redundant AI prompts
* unnecessary raw provider responses
* temporary audio after processing
* duplicated resume data
* unnecessary full context snapshots

unless explicitly required for debugging, auditing, or product behavior.

---

# 96. V1 Technical Scope

V1 architecture supports:

### Interview Context

* Company-based interviews
* Role-based interviews
* Job-description-based interviews
* Resume-based interviews
* Mixed interviews

### Interview Engine

* Dynamic opening questions
* Adaptive follow-up questions
* Difficulty adaptation
* Question diversity
* Context-aware questioning

### Voice

* Browser microphone
* Audio capture
* Audio upload
* Speech-to-text
* Deterministic speech metrics
* Filler detection where supported

### Evaluation

* Technical evaluation
* Relevance
* Completeness
* Communication
* Sentence formation
* Structure
* Improvement suggestions
* Evidence-based scoring

### Learning

* Retry
* Attempt comparison
* Knowledge-gap detection
* Contextual explanations
* Measurable within-session improvement

### Session

* Persistent state
* Progress tracking
* Session recovery
* Error recovery
* Final master report
* Persistent interview history

---

# 97. Explicitly Out of V1 Architecture

Do not introduce architecture specifically for:

```text
Live human interviewer
Multiplayer interviews
Video analysis
Facial analysis
Emotion recognition
Psychological profiling
Eye tracking
Body-language scoring
Avatar interviewer
Social leaderboards
Achievements
Public interview sharing
Recruitment marketplace
Autonomous career coaching
```

These require separate product and architecture decisions.

---

# 98. Future Evolution

The architecture intentionally leaves room for:

```text
Streaming Speech Recognition
        ↓
Real-Time Voice Interview
        ↓
WebRTC / WebSocket
        ↓
Streaming AI
        ↓
Real-Time Adaptive Conversation
```

Other future capabilities:

* advanced speech analysis
* video interview analysis
* long-term skill progression
* company-specific interview simulation
* interview benchmarking
* personalized learning plans
* cross-session knowledge tracking

These must be added through future architecture revisions rather than prematurely complicating V1.

---

# 99. Architecture Dependency Graph

The final dependency direction should be:

```text
                 Resume Intelligence
                         │
                         ▼
                Context Construction
                         │
                         ▼
                  Interview Service
                    /     |      \
                   /      |       \
                  ▼       ▼        ▼
             Question   Answer   Progress
              Engine   Analysis   Engine
                │         │
                ▼         ├──────────────┐
            AI Service    │              │
                │         ▼              ▼
                ▼    Speech Service   Deterministic
           AI Provider      │          Analysis
                            ▼
                     Speech Provider
```

Persistence is accessed by the appropriate services/models rather than by UI components.

---

# 100. API Design Dependency

The next document, `interview-api.md`, must be derived from this architecture.

The API specification should define endpoints around these capabilities:

```text
Session Creation
Session Retrieval
Session Recovery
Question Retrieval
Answer Submission
Answer Processing
Retry
Explanation
Continue
Progress
Final Report
Interview History
```

The API document must not introduce capabilities that are unsupported by:

* PRD
* User Flow
* UI Spec
* Data Model
* Architecture

---

# 101. API Boundary Principle

The API should expose business operations rather than internal implementation details.

Prefer:

```text
Submit Answer
Retry Question
Request Explanation
Continue Interview
```

over exposing internal service calls such as:

```text
RunQuestionEngine
RunAIAnalysis
RunProgressEngine
```

The client should interact with the interview domain, not internal services.

---

# 102. Backend Implementation Principle

The backend implementation must follow:

```text
Route
  ↓
Controller
  ↓
Validation
  ↓
Interview Service
  ↓
Domain Service
  ↓
Provider / Model
```

Avoid:

```text
Route
  ↓
AI Provider
```

or:

```text
React
  ↓
AI Provider
```

All intelligence must remain behind the application architecture.

---

# 103. Architecture Rules for Kiro

When implementing Interview Intelligence:

1. Reuse existing TITAN architecture.
2. Reuse existing authentication.
3. Reuse existing database conventions.
4. Reuse existing UI components.
5. Do not duplicate shared utilities.
6. Do not invent unsupported fields.
7. Do not invent unsupported API endpoints.
8. Do not hardcode fake performance data.
9. Do not hardcode interview questions as the primary engine.
10. Keep interview state centralized.
11. Keep voice recording isolated from UI presentation.
12. Keep AI providers behind an abstraction.
13. Keep speech providers behind an abstraction.
14. Validate all AI outputs.
15. Validate all uploaded audio.
16. Scope every resource to the authenticated user.
17. Preserve session state during recoverable failures.
18. Do not silently create a new session during recovery.
19. Do not store raw audio unnecessarily.
20. Do not expose internal AI reasoning.
21. Do not expose unsupported psychological measurements.
22. Do not modify ResumeVersion because of interview activity.
23. Keep report components reusable.
24. Keep the implementation responsive.
25. Preserve accessibility.
26. Respect reduced-motion preferences.
27. Avoid unnecessary dependencies.
28. Avoid premature WebSocket/WebRTC complexity.
29. Do not modify unrelated TITAN modules.
30. Follow the finalized architecture before introducing new abstractions.

---

# 104. Architecture Definition of Done

The architecture is implementation-ready when:

* [ ] Session lifecycle is clearly defined.
* [ ] Session state transitions are controlled.
* [ ] Interview context construction is defined.
* [ ] Resume integration is defined.
* [ ] Question generation responsibilities are defined.
* [ ] Adaptive questioning responsibilities are defined.
* [ ] Voice architecture is defined.
* [ ] Audio lifecycle is defined.
* [ ] Speech provider abstraction is defined.
* [ ] Deterministic analysis is separated from AI analysis.
* [ ] AI provider abstraction is defined.
* [ ] AI output validation is defined.
* [ ] Answer report architecture is defined.
* [ ] Retry architecture is defined.
* [ ] Attempt comparison is defined.
* [ ] Explanation architecture is defined.
* [ ] Progress architecture is defined.
* [ ] Final report generation is defined.
* [ ] Persistence ownership is defined.
* [ ] Session recovery is defined.
* [ ] Failure handling is defined.
* [ ] Idempotency considerations are defined.
* [ ] Security boundaries are defined.
* [ ] Authorization requirements are defined.
* [ ] Observability requirements are defined.
* [ ] Performance considerations are defined.
* [ ] Frontend/backend responsibilities are separated.
* [ ] API design dependencies are clear.
* [ ] V1 scope is bounded.
* [ ] Future evolution is possible without overengineering V1.

---

# 105. Final Architectural Principle

TITAN must never become:

```text
Question
   ↓
Answer
   ↓
Score
   ↓
Next Question
```

The architecture exists to enable:

```text
              Interview Goal
                    ↓
             Dynamic Question
                    ↓
               Voice Answer
                    ↓
         Transcription + Metrics
                    ↓
            Answer Evaluation
                    ↓
             Immediate Report
                    ↓
          ┌─────────┴─────────┐
          ↓                   ↓
       Improve             Understand
          ↓                   ↓
        Retry            Explanation
          └─────────┬─────────┘
                    ↓
          Measure Improvement
                    ↓
          Adapt Next Question
                    ↓
               Challenge
                    ↓
                Improve
                    ↓
             Final Report
```

The architecture therefore exists to make one product promise technically possible:

> **TITAN should not merely tell candidates how they performed. It should use every answer, mistake, explanation, retry, and improvement to make the next part of the interview smarter and the candidate better.**

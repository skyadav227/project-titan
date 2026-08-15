# TITAN Interview Intelligence — Backend Specification

## 1. Purpose

This document defines the backend implementation requirements for TITAN's Interview Intelligence system.

The backend is responsible for:

* Creating and managing interview sessions
* Validating interview configuration
* Resolving and snapshotting candidate context
* Managing the interview lifecycle
* Generating adaptive interview questions
* Persisting interview conversation history
* Receiving candidate answers
* Processing voice/audio responses
* Transcribing spoken answers
* Extracting measurable speech and communication signals
* Evaluating answer quality
* Generating actionable feedback
* Supporting question retries
* Comparing retry attempts
* Providing contextual explanations
* Determining the next interview action
* Adapting question difficulty
* Completing interviews
* Generating final master reports
* Persisting interview history
* Measuring progress across sessions
* Maintaining strict user ownership and session isolation
* Recovering safely from AI/provider failures

The backend is the **source of truth for interview state and progression**.

The frontend must never independently determine:

* Which question comes next
* Whether an answer is considered evaluated
* Whether difficulty should increase or decrease
* Whether an interview is complete
* Which interview action should occur next

---

# 2. Core Product Principle

TITAN must behave like an adaptive interviewer and coach.

It must NOT behave like a predetermined questionnaire:

```text
Question
↓
Answer
↓
Question
↓
Answer
```

Instead, the backend must support:

```text
Question
↓
Candidate Answer
↓
Understand Answer
↓
Evaluate Answer
↓
Analyze Communication
↓
Generate Feedback
↓
Identify Strengths / Weaknesses
↓
Retry / Explanation / Continue
↓
Adapt Interview Strategy
↓
Generate Contextual Follow-up
↓
Measure Improvement
↓
Continue
↓
Master Report
```

The system therefore operates as a **stateful interview intelligence engine**.

---

# 3. Architectural Principles

The backend must follow these principles.

## 3.1 Backend-Owned Interview State

The backend owns the authoritative interview state.

The frontend may display state but must not create or infer state transitions.

---

## 3.2 Immutable Interview History

Once an interview question, answer attempt, evaluation, or context snapshot has been persisted, historical records must not be silently overwritten.

Corrections or new attempts must create new records where appropriate.

This is required for:

* Retry comparison
* Historical reporting
* Progress tracking
* Reproducibility
* Debugging

---

## 3.3 Snapshot-Based Interview Context

An interview must use a stable context snapshot.

If the user's resume changes after an interview begins, the running interview must continue using the original resume context.

The same principle applies to other context sources where appropriate.

Example:

```text
ResumeVersion
      ↓
Context Builder
      ↓
InterviewContextSnapshot
      ↓
Interview Engine
```

The interview must never unexpectedly switch to a newer resume during an active session.

---

## 3.4 Provider Independence

Controllers and core interview services must never directly depend on a specific:

* AI provider
* Speech-to-text provider
* Speech-analysis provider
* Object-storage provider

All external providers must be accessed through internal interfaces/adapters.

---

## 3.5 Deterministic State, Adaptive Intelligence

AI may determine:

* Question content
* Feedback
* Evaluation
* Explanation
* Suggested next action

But the backend must remain responsible for:

* State validation
* Ownership
* Persistence
* Ordering
* Idempotency
* Concurrency
* Lifecycle transitions

AI output must never directly mutate the database without validation.

---

# 4. Interview Modes

TITAN supports the following interview context modes.

## 4.1 Company-Based

The user selects a company.

The system may use reliable company information to influence:

* Interview style
* Expected technical areas
* Role expectations
* Difficulty
* Relevant topics

The system must not fabricate company-specific interview practices.

If reliable company information is unavailable, the engine should fall back to general role-based reasoning rather than inventing facts.

---

## 4.2 Role-Based

The user selects a target role.

Examples:

```text
MERN Stack Developer
Frontend Developer
Backend Developer
Software Engineer
Data Analyst
```

Questions are generated according to:

* Role expectations
* Relevant technologies
* Expected knowledge
* Experience level
* Selected difficulty

---

## 4.3 Job-Description-Based

The user provides a job description.

The backend extracts:

```text
Required skills
Preferred skills
Responsibilities
Technologies
Experience expectations
Domain knowledge
```

The extracted requirements become part of the interview context.

---

## 4.4 Resume-Based

The interview uses a specific resume version.

The backend may extract:

```text
Candidate profile
Skills
Projects
Experience
Education
Certifications
Achievements
Technologies
```

The selected `ResumeVersion` becomes the source of truth for the interview.

---

## 4.5 Mixed

Multiple sources may be combined.

Example:

```text
Company
+
Role
+
Job Description
+
Resume
```

The context builder must normalize these sources into one interview context.

Explicit user-provided information must take priority over inferred information.

---

# 5. Interview Session Lifecycle

The authoritative session lifecycle is:

```text
created
   ↓
starting
   ↓
in_progress
   ↓
evaluating
   ↓
awaiting_action
   ↓
in_progress
   ↓
...
   ↓
completing
   ↓
completed
```

Additional terminal or exceptional states may include:

```text
abandoned
failed
cancelled
```

The exact state names must be implemented consistently across:

* Database
* Services
* Controllers
* API responses
* Frontend integration

---

# 6. State Transition Rules

The backend must validate every state transition.

Example:

```text
created
  → in_progress

in_progress
  → evaluating

evaluating
  → awaiting_action

awaiting_action
  → in_progress

in_progress
  → completing

completing
  → completed
```

Invalid transitions must return:

```text
INVALID_INTERVIEW_STATE
```

Example:

```text
completed
  → in_progress
```

must never be allowed.

---

# 7. Session Creation

## Endpoint

```http
POST /api/interviews
```

Creates a new interview session.

The endpoint validates configuration and creates the session.

The interview should not be considered active until `/start` succeeds.

### Request

```json
{
  "mode": "mixed",
  "company": "Google",
  "role": "Software Engineer",
  "jobDescription": "...",
  "useResume": true,
  "resumeVersionId": "...",
  "difficulty": "adaptive",
  "durationMinutes": 30
}
```

---

## Session creation responsibilities

The backend must:

1. Authenticate the user.
2. Validate the requested mode.
3. Validate required sources.
4. Validate difficulty.
5. Validate duration.
6. Resolve the requested resume version if provided.
7. Verify resume ownership.
8. Build or prepare interview context.
9. Create the interview session.
10. Store the selected configuration.
11. Store references to source versions.
12. Initialize interview counters.
13. Set status to `created`.

The backend should not perform unnecessary expensive AI generation during basic session creation.

The first question is generated by the explicit `start` operation.

---

# 8. Start Interview

## Endpoint

```http
POST /api/interviews/:id/start
```

Starting the interview performs the expensive initialization.

The backend must:

1. Verify ownership.
2. Verify current state is `created`.
3. Resolve candidate context.
4. Build the normalized context.
5. Create the immutable context snapshot.
6. Initialize interview strategy.
7. Generate the first question.
8. Validate the generated question.
9. Persist the question.
10. Transition the session to `in_progress`.
11. Return the first question.

If question generation fails:

```text
created
   ↓
generation failure
   ↓
remain created
```

The session must remain recoverable.

---

# 9. Interview Context

The backend creates a normalized interview context.

Example:

```json
{
  "company": "Google",
  "role": "Software Engineer",
  "experienceLevel": "Fresher",
  "skills": [
    "JavaScript",
    "React",
    "Node.js",
    "MongoDB"
  ],
  "projects": [
    "TITAN",
    "ShopSphere"
  ],
  "jobRequirements": [],
  "candidateSummary": "...",
  "sourceReferences": {
    "resumeVersionId": "..."
  }
}
```

The context must be compact enough for repeated AI calls.

The complete resume or job description should not be repeatedly sent to every model call when a normalized representation is sufficient.

---

# 10. Interview Context Snapshot

At interview start, the backend must create an immutable snapshot of the relevant context.

Example:

```text
InterviewSession
      │
      └── contextSnapshot
            ├── candidate
            ├── resume
            ├── company
            ├── role
            ├── job requirements
            └── interview configuration
```

The snapshot guarantees historical reproducibility.

If the candidate later:

* edits their resume
* changes their profile
* uploads a new resume
* changes job preferences

the existing interview remains unchanged.

---

# 11. Interview Strategy

Each active interview maintains an internal strategy state.

Example:

```json
{
  "currentStage": "technical",
  "currentDifficulty": 3,
  "targetDifficulty": 3,
  "coveredTopics": [
    "javascript",
    "react"
  ],
  "weakTopics": [
    "authentication"
  ],
  "strongTopics": [
    "frontend"
  ],
  "remainingQuestions": 5,
  "questionsAnswered": 4
}
```

This strategy is controlled by the backend.

AI recommendations may influence the strategy, but state mutations must be validated by the interview service.

---

# 12. Question Generation Architecture

Question generation must not live directly inside controllers.

Recommended flow:

```text
Interview Controller
        ↓
Interview Service
        ↓
Question Service
        ↓
Interview Intelligence Orchestrator
        ↓
AI Provider Adapter
        ↓
Validated Question
        ↓
Question Repository
        ↓
Interview Session
```

The controller should only coordinate the request and response.

---

# 13. Question Generation Inputs

The question engine may receive:

```text
Interview configuration
Context snapshot
Interview strategy
Previous questions
Previous answer attempts
Previous evaluations
Current answer
Current evaluation
Covered topics
Weak areas
Strong areas
Current difficulty
Remaining questions
Interview stage
```

The engine must have enough context to behave conversationally.

---

# 14. Question Generation Contract

Internal AI contract:

```json
{
  "action": "question",
  "question": {
    "text": "How did you implement JWT authentication?",
    "category": "technical",
    "topic": "authentication",
    "difficulty": 3,
    "type": "follow_up",
    "source": "resume"
  },
  "reason": "weak_area"
}
```

Possible internal reasons:

```text
opening
follow_up
clarification
weak_area
strength_probe
difficulty_increase
difficulty_decrease
topic_transition
scenario
coverage
```

The `reason` is internal metadata and does not need to be exposed to the candidate.

---

# 15. Question Validation

AI-generated questions must be validated before persistence.

Validation must check:

* Question text exists
* Question is not empty
* Category is valid
* Difficulty is valid
* Question type is valid
* Topic is valid where required
* Question does not contain unsupported claims
* Question does not expose internal reasoning
* Question does not ask multiple unrelated questions
* Question is appropriate for the selected interview context

Invalid AI output must be rejected and handled as a recoverable generation failure.

---

# 16. Question Persistence

Every generated question must be persisted.

Example:

```json
{
  "questionId": "...",
  "sessionId": "...",
  "sequence": 4,
  "text": "...",
  "category": "technical",
  "topic": "React state management",
  "difficulty": 3,
  "type": "follow_up",
  "source": "resume",
  "parentQuestionId": "...",
  "createdAt": "..."
}
```

The conversation history must remain immutable.

---

# 17. Question Ordering

Each question must have a deterministic sequence.

Example:

```text
1
2
3
4
5
```

Retries must not create an entirely new interview question sequence.

Instead:

```text
Question 5
 ├── Attempt 1
 └── Attempt 2
```

This allows the system to distinguish between:

* New questions
* New answer attempts

---

# 18. Adaptive Questioning

The question engine must adapt based on performance.

## Strong answer

Possible actions:

* Increase difficulty
* Ask a deeper follow-up
* Probe reasoning
* Introduce a related advanced concept

## Weak answer

Possible actions:

* Simplify the next question
* Test the missing concept
* Clarify misunderstanding
* Revisit the topic from another angle

## Partially correct answer

Possible actions:

* Probe the missing portion
* Ask for justification
* Test conceptual understanding

## Excellent answer

The engine should avoid asking repetitive questions that provide little additional signal.

---

# 19. Difficulty Model

Difficulty uses:

```text
1 — Easy
2 — Basic
3 — Intermediate
4 — Advanced
5 — Expert
```

The initial difficulty comes from interview configuration.

For adaptive interviews, difficulty may change based on:

```text
Recent answer performance
Rolling performance
Topic difficulty
Interview stage
Consistency of performance
Remaining interview time
```

Difficulty must not automatically increase after every successful answer.

---

# 20. Question Categories

Supported categories include:

```text
behavioral
technical
coding
system_design
project
resume
company
role
job_description
follow_up
conceptual
scenario
problem_solving
```

Every question must store its category.

---

# 21. Answer Model

Every candidate response must be represented as an answer attempt.

An answer attempt belongs to:

```text
User
↓
InterviewSession
↓
Question
↓
AnswerAttempt
```

A retry creates another attempt.

Example:

```text
Question 5
 ├── AnswerAttempt 1
 │     └── Evaluation 1
 │
 └── AnswerAttempt 2
       └── Evaluation 2
```

The original attempt must never be overwritten.

---

# 22. Voice-First Answer Pipeline

Voice is a V1 capability.

The pipeline is:

```text
Microphone
   ↓
Audio Capture
   ↓
Upload
   ↓
Audio Validation
   ↓
Secure Storage
   ↓
Speech-to-Text
   ↓
Transcript
   ↓
Speech Analysis
   ↓
Content Analysis
   ↓
Evaluation
   ↓
Feedback
   ↓
Next Action
```

The frontend must not depend on a specific speech provider.

---

# 23. Answer Submission

## Endpoint

```http
POST /api/interviews/:id/questions/:questionId/answer
```

The preferred V1 implementation uses multipart form data.

Example:

```text
audio
durationMs
```

For transcript-based fallback:

```text
transcript
durationMs
```

The backend must associate the answer with:

* Authenticated user
* Interview session
* Question
* Sequence
* Attempt number

---

# 24. Answer Submission Validation

Before processing:

1. Verify session ownership.
2. Verify question belongs to the session.
3. Verify question is the current active question.
4. Verify the question is answerable.
5. Verify the question has not already been submitted.
6. Validate audio/transcript.
7. Validate duration.
8. Validate payload size.
9. Generate or validate idempotency key where required.
10. Create the answer attempt.

Duplicate submissions must not create duplicate answer attempts.

---

# 25. Answer Processing State

An answer attempt has its own processing lifecycle.

```text
received
   ↓
processing
   ↓
transcribing
   ↓
analyzing
   ↓
evaluated
```

Failure:

```text
processing
   ↓
processing_failed
```

A failed answer must remain stored.

It may be reprocessed without creating a duplicate logical attempt.

---

# 26. Speech-to-Text

The backend sends audio to the configured speech provider through an abstraction.

Internal interface:

```js
transcribeAudio(audioReference)
```

The resulting transcript should include:

```json
{
  "text": "I implemented JWT authentication...",
  "language": "en",
  "durationMs": 42000
}
```

If transcription fails:

* Preserve the answer attempt
* Mark processing failure
* Preserve the session
* Return a recoverable error
* Allow reprocessing or resubmission according to the failure type

---

# 27. Speech Analysis

The system may extract measurable communication signals.

Possible metrics:

```text
responseDurationMs
speakingRate
pauseCount
longPauseCount
fillerWordCount
fillerWordRate
wordCount
```

Additional communication signals may include:

```text
sentence completeness
repetition
rambling
conciseness
self-correction frequency
```

---

# 28. Confidence Indicators

TITAN must not claim to objectively measure psychological confidence.

The backend may instead store observable communication indicators such as:

```text
deliveryConfidence
speechConfidence
communicationConfidence
```

These should be described as indicators inferred from observable speech characteristics.

The system must never present these as:

* Medical assessments
* Psychological diagnoses
* Objective measurements of mental state

---

# 29. Answer Content Analysis

Every answer must be evaluated.

The evaluation considers:

```text
correctness
technicalAccuracy
relevance
completeness
reasoning
structure
clarity
communication
```

Possible correctness classifications:

```text
correct
mostly_correct
partially_correct
incorrect
```

---

# 30. Answer Evaluation Architecture

Recommended flow:

```text
Answer Service
      ↓
Transcript
      ↓
Speech Analysis Service
      ↓
Content Evaluation Service
      ↓
Evaluation Aggregator
      ↓
Feedback Generator
      ↓
Validated Evaluation
      ↓
Persist Evaluation
```

The answer evaluation must be persisted before the system proceeds to the next interview action.

---

# 31. Answer Evaluation Contract

Example:

```json
{
  "overallScore": 78,
  "correctness": 82,
  "technicalAccuracy": 80,
  "relevance": 90,
  "completeness": 70,
  "reasoning": 74,
  "structure": 70,
  "communication": 76,
  "strengths": [],
  "issues": [],
  "improvements": [],
  "idealAnswer": "...",
  "retryRecommended": true
}
```

Scores must use a consistent scale.

Recommended V1 scale:

```text
0–100
```

---

# 32. Feedback Philosophy

Feedback must be actionable.

Avoid:

```text
"Good answer."
```

Prefer:

```text
"You correctly explained X, but your answer missed Y.
Mentioning Y would demonstrate that you understand Z."
```

Feedback should identify:

1. What was good.
2. What was incorrect.
3. What was missing.
4. Why it matters.
5. How to improve.
6. What a stronger answer could look like.

---

# 33. Ideal Answer

The system may generate an ideal-answer reference.

However, it must be:

* Concise
* Relevant
* Technically accurate
* Appropriate to the candidate's level
* Based on the actual question

The ideal answer must not be used to artificially inflate evaluation scores.

---

# 34. Sentence Formation Feedback

TITAN should identify communication problems when they meaningfully affect interview performance.

Example:

```text
Issue:
Your explanation became difficult to follow because multiple
ideas were combined into one sentence.

Improvement:
Explain one idea at a time using shorter sentences.
```

Minor grammatical mistakes should not be heavily penalized when meaning remains clear.

The goal is interview communication improvement rather than academic grammar evaluation.

---

# 35. Interview Actions

After answer evaluation, the backend determines the next action.

Supported actions:

```text
question
explanation
retry
complete
```

The action must be determined by the backend.

---

# 36. Action Orchestration

Recommended flow:

```text
Answer Evaluation
       ↓
Interview Intelligence Orchestrator
       ↓
Determine Next Action
       ↓
┌────────────┬─────────────┬────────────┬───────────┐
│  question  │ explanation │   retry    │ complete  │
└────────────┴─────────────┴────────────┴───────────┘
```

The frontend receives the action and renders the appropriate UI.

---

# 37. Next Question

## Endpoint

```http
POST /api/interviews/:id/next
```

The endpoint generates the next interview action.

The backend uses:

```text
Interview Context
+
Interview Strategy
+
Question History
+
Answer History
+
Current Evaluation
+
Progress
+
Difficulty
+
Remaining Questions
```

The response may contain:

```json
{
  "action": "question",
  "question": {
    "id": "...",
    "number": 8,
    "text": "...",
    "type": "follow_up",
    "topic": "authentication",
    "difficulty": 3
  }
}
```

---

# 38. Retry Flow

Retry is candidate-controlled.

The evaluation may recommend retry:

```text
retryRecommended: true
```

The candidate chooses whether to retry.

## Endpoint

```http
POST /api/interviews/:id/questions/:questionId/retry
```

The backend must:

1. Verify ownership.
2. Verify the question belongs to the session.
3. Verify retry is allowed.
4. Determine the next attempt number.
5. Preserve previous attempts.
6. Reset the question to answerable state.
7. Return the question for another attempt.

---

# 39. Retry Evaluation

Every retry is independently evaluated.

Example:

```json
{
  "previousScore": 61,
  "newScore": 84,
  "improvement": 23,
  "improvedAreas": [
    "technical accuracy",
    "answer structure"
  ]
}
```

The comparison must be calculated from persisted evaluation data.

The system must not fabricate improvement.

---

# 40. Explanation Flow

## Endpoint

```http
POST /api/interviews/:id/explain
```

The candidate may request help understanding:

* A concept
* A term
* A technology
* A question
* A resume/project topic

The explanation must be grounded in the current interview context.

---

# 41. Explanation Safety

Explanations must not unnecessarily reveal the expected answer if doing so would compromise the interview.

For example, if the candidate asks:

```text
What does authorization mean?
```

the system may explain the concept.

It should not automatically provide:

```text
The exact answer you should give to this interview question is...
```

unless the product explicitly enters a coaching/explanation mode where this behavior is intended.

---

# 42. Continue After Explanation

After explanation, the backend may generate the next appropriate question.

The question may reference the explained concept.

Example:

```text
Explanation:
Authorization determines what an authenticated user
is allowed to access.

Next:
How would you implement authorization after authentication?
```

---

# 43. Interview Completion

An interview may complete when:

* Configured question count is reached
* Configured duration is reached
* Sufficient topic coverage is achieved
* Candidate manually ends the interview

The backend determines completion.

The frontend must never mark the interview complete by itself.

---

# 44. End Interview

## Endpoint

```http
POST /api/interviews/:id/end
```

The request may include:

```json
{
  "reason": "user_ended"
}
```

The backend must:

1. Verify ownership.
2. Validate current state.
3. Stop further question generation.
4. Persist completion metadata.
5. Transition the session to the correct terminal state.
6. Trigger report generation when appropriate.

---

# 45. Report Generation

## Endpoint

```http
POST /api/interviews/:id/report
```

The report aggregates persisted interview data.

The report must be based on:

```text
Interview Context
+
Questions
+
Answer Attempts
+
Evaluations
+
Speech Metrics
+
Retry Comparisons
+
Interview Progress
```

The report must never rely solely on a fresh AI interpretation of the raw interview.

---

# 46. Master Report

The report should contain:

## Overall Performance

```text
overallScore
technical
communication
clarity
problemSolving
confidence indicators
relevance
```

## Knowledge

```text
strongTopics
weakTopics
missingConcepts
```

## Communication

```text
averageSpeakingRate
fillerFrequency
pauseMetrics
clarity
conciseness
sentenceFormation
```

## Interview Behavior

```text
answerConsistency
reasoningQuality
responseStructure
recoveryAbility
```

## Improvement

```text
questionsRetried
improvedAttempts
scoreImprovement
recurringWeaknesses
```

## Recommendations

Only high-value recommendations should be included.

Avoid generic advice that is not supported by interview evidence.

---

# 47. Report Persistence

Generated reports should be persisted.

A report should include:

```text
interviewId
userId
generatedAt
reportVersion
overallScore
performanceMetrics
speechMetrics
strengths
weaknesses
recommendations
progressMetrics
```

The stored report acts as a historical snapshot.

If the report-generation algorithm changes later, previously completed interviews must remain historically consistent.

---

# 48. Report Regeneration

If report regeneration is required, the backend must create a new report version or explicitly replace the report according to the chosen persistence strategy.

Do not silently change historical reports without version tracking.

---

# 49. Progress Measurement

Progress must be based on actual persisted metrics.

Example:

```text
Session 1
Technical: 64
Communication: 58

Session 2
Technical: 73
Communication: 69
```

The backend may calculate:

```text
Technical +9
Communication +11
```

Progress must never be fabricated from motivational assumptions.

---

# 50. Session History

## Endpoint

```http
GET /api/interviews
```

Supports:

```text
page
limit
status
mode
```

The endpoint returns summaries rather than unnecessarily loading the complete conversation.

Example:

```json
{
  "id": "...",
  "role": "Software Engineer",
  "mode": "resume",
  "status": "completed",
  "overallScore": 76,
  "questionCount": 10,
  "completedAt": "..."
}
```

---

# 51. Session Detail

## Endpoint

```http
GET /api/interviews/:id
```

May return:

```text
Session configuration
Current state
Question history
Answer attempts
Evaluation summaries
Progress
Completion information
```

Large audio payloads must not be embedded in the ordinary response.

---

# 52. Current Question

## Endpoint

```http
GET /api/interviews/:id/current
```

The backend returns the current unanswered question.

The frontend should use this endpoint to recover after:

* Page refresh
* Network interruption
* Browser restart
* Temporary frontend failure

The backend remains the source of truth.

---

# 53. Ownership and Authorization

Every query must be scoped to the authenticated user.

Example:

```js
InterviewSession.findOne({
  _id: req.params.id,
  userId: req.user.id
});
```

The same ownership rule applies to:

```text
InterviewSession
InterviewQuestion
AnswerAttempt
Evaluation
Report
AudioReference
ResumeVersion
```

Never trust user-provided ownership identifiers.

---

# 54. Resume Ownership

Before using a resume:

```text
resumeVersionId
      ↓
Verify existence
      ↓
Verify user ownership
      ↓
Resolve version
      ↓
Snapshot context
```

A user must never be able to reference another user's resume version.

---

# 55. Audio Security

Uploaded audio must:

* Use generated storage identifiers
* Never trust original filenames
* Have strict size limits
* Have validated MIME types
* Be associated with the authenticated user/session
* Not be publicly accessible
* Be deleted according to the configured retention policy

Audio access should use secure storage references or signed access mechanisms where required.

---

# 56. Storage Abstraction

Audio storage must be accessed through a storage service.

Example:

```js
storageService.uploadAudio(...)
storageService.getAudioReference(...)
storageService.deleteAudio(...)
```

The interview service must not depend directly on a specific storage vendor.

---

# 57. AI Provider Abstraction

AI providers must be accessed through adapters.

Recommended structure:

```text
services/
└── ai/
    ├── aiService.js
    ├── interviewAIService.js
    └── providers/
        ├── providerAdapter.js
        └── ...
```

The interview engine should call internal interfaces rather than vendor SDKs directly.

---

# 58. Speech Provider Abstraction

Recommended structure:

```text
services/
└── speech/
    ├── speechService.js
    └── providers/
        ├── speechProvider.js
        └── ...
```

The interview system should call:

```js
speechService.transcribeAudio(audioReference)
```

rather than directly calling a vendor.

---

# 59. Interview Intelligence Orchestrator

A dedicated orchestration layer should coordinate the adaptive interview loop.

Recommended responsibility:

```text
InterviewIntelligenceService
```

It coordinates:

```text
Context
↓
Question generation
↓
Answer evaluation
↓
Strategy update
↓
Action determination
↓
Next-question generation
```

It should not own low-level database operations.

---

# 60. Recommended Service Responsibilities

### interviewService

Owns:

* Session creation
* Session retrieval
* Session lifecycle
* State transitions
* Completion

### contextService

Owns:

* Candidate context resolution
* Resume context
* Job description context
* Company context
* Context normalization
* Context snapshotting

### questionService

Owns:

* Question generation
* Question validation
* Question persistence
* Question history

### answerService

Owns:

* Answer submission
* Attempt creation
* Answer state
* Transcript persistence
* Answer processing

### speechService

Owns:

* Audio processing
* Transcription
* Speech metrics

### evaluationService

Owns:

* Content evaluation
* Scoring
* Evaluation persistence

### feedbackService

Owns:

* Actionable feedback
* Ideal answer generation
* Improvement suggestions

### strategyService

Owns:

* Difficulty adaptation
* Topic coverage
* Weak/strong area tracking
* Interview strategy state

### explanationService

Owns:

* Contextual explanations
* Explanation persistence where required

### reportService

Owns:

* Report aggregation
* Report generation
* Report persistence
* Report versioning

### progressService

Owns:

* Cross-session comparisons
* Improvement calculations
* Progress metrics

---

# 61. Recommended Backend Structure

```text
server/src/

├── controllers/
│   ├── auth.controller.js
│   ├── resume.controller.js
│   └── interview.controller.js
│
├── routes/
│   ├── auth.routes.js
│   ├── resume.routes.js
│   └── interview.routes.js
│
├── models/
│   ├── User.js
│   ├── ResumeVersion.js
│   ├── InterviewSession.js
│   ├── InterviewContextSnapshot.js
│   ├── InterviewQuestion.js
│   ├── InterviewAnswer.js
│   ├── AnswerEvaluation.js
│   └── InterviewReport.js
│
├── services/
│   ├── resume/
│   │   └── resumeService.js
│   │
│   ├── interview/
│   │   ├── interviewService.js
│   │   ├── contextService.js
│   │   ├── questionService.js
│   │   ├── answerService.js
│   │   ├── evaluationService.js
│   │   ├── feedbackService.js
│   │   ├── strategyService.js
│   │   ├── explanationService.js
│   │   ├── reportService.js
│   │   ├── progressService.js
│   │   ├── interviewIntelligenceService.js
│   │   └── providers/
│   │
│   ├── speech/
│   │   ├── speechService.js
│   │   └── providers/
│   │
│   ├── ai/
│   │   ├── aiService.js
│   │   └── providers/
│   │
│   └── storage/
│       ├── storageService.js
│       └── providers/
│
├── middleware/
│   ├── auth.js
│   ├── upload.js
│   ├── validation.js
│   └── errorHandler.js
│
├── validators/
│   ├── interview.validator.js
│   ├── answer.validator.js
│   └── report.validator.js
│
├── repositories/
│   ├── interviewRepository.js
│   ├── questionRepository.js
│   ├── answerRepository.js
│   └── reportRepository.js
│
├── utils/
│   ├── errors.js
│   ├── logger.js
│   └── idempotency.js
│
└── config/
```

---

# 62. Controller Responsibility

Controllers must remain thin.

A controller should primarily:

```text
Receive request
↓
Validate request
↓
Authenticate / authorize
↓
Call service
↓
Return standardized response
```

Controllers must NOT contain:

* AI prompts
* Question-generation logic
* Evaluation algorithms
* Speech processing logic
* Database orchestration
* Interview strategy logic

---

# 63. Repository Responsibility

Repositories isolate database access.

Example:

```js
interviewRepository.findOwnedById(
  interviewId,
  userId
);
```

Repositories should not contain interview intelligence.

This separation makes the system easier to test and change.

---

# 64. Idempotency

Important operations must support duplicate-request protection.

Especially:

```text
answer submission
question generation
retry
session completion
report generation
```

For answer submission:

```text
Client request
      ↓
Idempotency key
      ↓
Check existing operation
      ↓
Return previous result
```

A network retry must not create a second logical answer attempt.

---

# 65. Concurrency Control

The backend must prevent multiple operations from mutating the same interview simultaneously.

Example:

```text
Request A → generate next question
Request B → generate next question
```

Only one request should successfully advance the interview.

Possible mechanisms include:

```text
Atomic database updates
Optimistic locking
Session version numbers
Processing flags
Distributed locks when required
```

The implementation should use the simplest mechanism appropriate for the deployment architecture.

---

# 66. Session Versioning

The session may maintain a version counter.

Example:

```json
{
  "stateVersion": 12
}
```

State-changing operations validate the expected version before mutation.

This helps prevent stale requests from overwriting newer interview state.

---

# 67. AI Output Validation

AI output is untrusted application input.

Every AI response must be validated before being persisted or exposed.

Validation must check:

* Required fields
* Allowed enums
* Score ranges
* Maximum text lengths
* JSON structure
* Context consistency
* Unsupported claims
* Prompt leakage
* Candidate-data hallucination

Invalid output should produce a controlled recoverable failure.

---

# 68. AI Failure Recovery

AI failures must never corrupt the session.

## Question generation failure

```text
Generation failure
↓
Persist failure metadata
↓
Keep current interview state
↓
Return recoverable error
↓
Allow retry
```

## Answer analysis failure

```text
Answer preserved
↓
Evaluation marked failed
↓
Retry/reprocess available
```

## Report generation failure

```text
Session preserved
↓
Report remains unavailable
↓
Generation can be retried
```

Previously persisted answers and evaluations must never be deleted because of later AI failures.

---

# 69. Error Handling

All interview APIs must use the standardized response format.

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "INTERVIEW_NOT_FOUND",
    "message": "Interview session not found."
  }
}
```

Internal stack traces and provider-specific failures must never be exposed.

---

# 70. Error Codes

Recommended codes:

```text
INTERVIEW_NOT_FOUND
INVALID_INTERVIEW_MODE
INVALID_INTERVIEW_CONFIG
INTERVIEW_NOT_STARTED
INTERVIEW_ALREADY_STARTED
INTERVIEW_ALREADY_COMPLETED
INVALID_INTERVIEW_STATE

QUESTION_NOT_FOUND
QUESTION_ALREADY_ANSWERED
QUESTION_GENERATION_FAILED

ANSWER_NOT_FOUND
INVALID_ANSWER
ANSWER_PROCESSING_FAILED
DUPLICATE_ANSWER

AUDIO_REQUIRED
AUDIO_TOO_LARGE
UNSUPPORTED_AUDIO_FORMAT
AUDIO_PROCESSING_FAILED

TRANSCRIPTION_FAILED
SPEECH_ANALYSIS_FAILED
EVALUATION_FAILED
FEEDBACK_GENERATION_FAILED

RETRY_NOT_AVAILABLE
EXPLANATION_FAILED
REPORT_GENERATION_FAILED

RESUME_CONTEXT_UNAVAILABLE
UNAUTHORIZED
FORBIDDEN

IDEMPOTENCY_CONFLICT
CONCURRENT_OPERATION
```

---

# 71. Performance Architecture

V1 may process the answer pipeline synchronously where practical:

```text
Upload
↓
Transcription
↓
Speech analysis
↓
Evaluation
↓
Feedback
↓
Next action
```

However, the architecture must allow these operations to move to background workers later.

Potential asynchronous operations:

```text
Audio transcription
Speech analysis
Large AI evaluations
Report generation
Analytics aggregation
```

Correctness and state consistency take priority over raw latency.

---

# 72. Processing Jobs

If background processing is introduced, jobs must be associated with:

```text
userId
sessionId
questionId
answerId
operation
attempt
```

Jobs must be idempotent.

Example:

```text
AnswerProcessingJob
      ↓
Transcription
      ↓
Speech Analysis
      ↓
Evaluation
      ↓
Feedback
      ↓
Action
```

---

# 73. Logging

Structured logs should include:

```text
userId
sessionId
questionId
answerId
operation
duration
provider
success/failure
errorCode
```

Never log:

* Passwords
* JWTs
* API keys
* Raw private audio
* Sensitive authentication data

Large transcripts should not be unnecessarily logged.

---

# 74. Observability

The backend should make it possible to monitor:

```text
Question generation latency
Question generation failures
Transcription latency
Transcription failures
Speech analysis failures
Evaluation latency
AI provider failures
Report generation failures
Session state errors
Duplicate requests
Concurrency conflicts
```

Provider calls should record duration and success/failure metadata.

---

# 75. Security Requirements

The API must:

* Require authentication
* Verify resource ownership
* Validate all IDs
* Validate all request bodies
* Validate uploaded files
* Enforce request size limits
* Protect audio storage
* Never expose AI credentials
* Never expose internal prompts
* Sanitize user-provided job descriptions
* Validate state transitions
* Prevent duplicate answer submissions
* Prevent modifying completed sessions
* Prevent cross-user question access
* Prevent cross-user answer access
* Prevent cross-user report access

---

# 76. Data Retention

The system should define retention policies for:

```text
Audio
Transcripts
Interview sessions
Reports
AI processing metadata
Logs
```

Audio should not necessarily be retained forever.

The database should store secure references rather than raw audio binaries.

---

# 77. API-to-Service Mapping

The API contract maps to backend services as follows:

```text
POST /interviews
        ↓
interviewService.createInterview()

POST /interviews/:id/start
        ↓
interviewService.startInterview()

GET /interviews/:id
        ↓
interviewService.getInterview()

GET /interviews/:id/current
        ↓
interviewService.getCurrentQuestion()

POST /interviews/:id/questions/:questionId/answer
        ↓
answerService.submitAnswer()

POST /interviews/:id/next
        ↓
interviewIntelligenceService.determineNextAction()

POST /interviews/:id/questions/:questionId/retry
        ↓
answerService.createRetryAttempt()

POST /interviews/:id/explain
        ↓
explanationService.explain()

POST /interviews/:id/explain/continue
        ↓
interviewIntelligenceService.continueAfterExplanation()

POST /interviews/:id/end
        ↓
interviewService.endInterview()

POST /interviews/:id/report
        ↓
reportService.generateReport()

GET /interviews/:id/report
        ↓
reportService.getReport()

GET /interviews
        ↓
interviewService.getHistory()

GET /interviews/progress
        ↓
progressService.getProgress()
```

---

# 78. V1 Scope

## Required

```text
Interview session creation
Interview configuration
Resume integration
Role integration
Company integration
Job-description integration
Mixed context
Context snapshotting
Dynamic question generation
Question persistence
Voice input
Audio upload
Speech-to-text
Speech metrics
Answer evaluation
Communication analysis
Filler-word analysis
Actionable feedback
Retry questions
Retry comparison
Contextual explanations
Adaptive next-question generation
Interview completion
Final master report
Interview history
Progress tracking
Secure ownership
Idempotency
Concurrency protection
AI/provider failure recovery
```

## Not Required Initially

```text
Live video analysis
Facial expression analysis
Emotion detection
Human interviewer marketplace
Multiplayer interviews
Recruiter dashboards
Population-level benchmarking
Real-time interviewer avatar
Real-time conversational interruption
Advanced non-verbal analysis
```

These belong to future versions.

---

# 79. Recommended Implementation Order

Implementation should be incremental.

```text
1. Database models
2. Repositories
3. Authentication / ownership middleware
4. Interview session creation
5. Interview state machine
6. Context builder
7. Context snapshot
8. Interview start
9. Question service
10. Question persistence
11. Current-question recovery
12. Audio upload
13. Storage abstraction
14. Speech-to-text abstraction
15. Answer attempt persistence
16. Speech analysis
17. Answer evaluation
18. Feedback generation
19. Interview intelligence orchestrator
20. Adaptive question generation
21. Retry flow
22. Explanation flow
23. Interview completion
24. Master report
25. History
26. Progress
27. Idempotency
28. Concurrency protection
29. Observability
30. Failure recovery
31. Security hardening
32. Integration testing
```

Do not implement the entire intelligence engine inside one controller.

---

# 80. Definition of Done

The backend V1 is complete when:

* A user can create an interview.
* Interview configuration is validated.
* Selected resume/context is resolved securely.
* Interview context is snapshotted.
* A user can start an interview.
* The first question is generated dynamically.
* Questions are persisted.
* The current question can be recovered after a refresh.
* A candidate can answer using voice.
* Audio is securely processed.
* Audio is transcribed.
* Speech metrics are extracted.
* The answer is evaluated.
* Actionable feedback is generated.
* Communication issues can be identified.
* The candidate can retry a question.
* Retry attempts remain independently stored.
* Retry improvement can be calculated.
* The candidate can request an explanation.
* The next question adapts to actual performance.
* Interview difficulty can adapt.
* The backend controls all interview state transitions.
* The candidate can end the interview.
* A master report can be generated.
* Reports are persisted as historical snapshots.
* Interview history is available.
* Cross-session progress is measurable.
* All resources are scoped to the authenticated user.
* Duplicate requests do not create duplicate logical records.
* Concurrent requests cannot corrupt interview state.
* AI/provider failures are recoverable.
* No sensitive provider information is exposed.

---

# 81. Final Architecture Principle

TITAN's backend should ultimately behave as:

```text
                    ┌─────────────────────┐
                    │   Interview Context │
                    │ Resume / Role / JD   │
                    │ Company / Candidate  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Interview Strategy  │
                    │ State + Difficulty  │
                    │ Topics + Progress   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Question Engine     │
                    └──────────┬──────────┘
                               │
                               ▼
                         QUESTION
                               │
                               ▼
                         CANDIDATE
                           ANSWER
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
        Speech Processing              Content Analysis
                │                             │
                └──────────────┬──────────────┘
                               ▼
                       ANSWER EVALUATION
                               │
                               ▼
                         FEEDBACK ENGINE
                               │
                               ▼
                     INTERVIEW INTELLIGENCE
                               │
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
          RETRY          EXPLANATION         QUESTION
             │                 │                 │
             └─────────────────┴─────────────────┘
                               │
                               ▼
                      STRATEGY UPDATE
                               │
                               ▼
                     ADAPTIVE NEXT STEP
                               │
                               ▼
                         ... CONTINUE ...
                               │
                               ▼
                        MASTER REPORT
                               │
                               ▼
                     LONG-TERM PROGRESS
```

The backend's fundamental responsibility is therefore not simply to **serve interview APIs**.

It is to maintain a **reliable, stateful, adaptive interview intelligence loop** where every candidate response becomes new information that influences what TITAN does next.

The architecture must preserve that loop while keeping state management deterministic, AI providers replaceable, historical data reproducible, and every user/session securely isolated.

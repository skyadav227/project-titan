# TITAN — Interview API Specification

**Document:** `interview-api.md`
**Module:** Interview Intelligence
**Status:** Planning / Pre-Implementation
**Version:** V2

---

# 1. Purpose

This document defines the API contract for TITAN's Interview Intelligence module.

The API is responsible for:

* Creating interview sessions
* Configuring interview mode and interview sources
* Starting and managing interview sessions
* Generating contextual questions
* Receiving candidate answers
* Processing voice recordings
* Transcribing spoken answers
* Calculating deterministic speech metrics
* Evaluating answer quality
* Generating immediate feedback
* Supporting answer retries
* Providing contextual explanations
* Generating adaptive follow-up questions
* Ending interview sessions
* Generating final performance reports
* Retrieving interview history
* Tracking performance progression

The backend is the **source of truth for interview state**.

The frontend must never independently determine:

* interview progression
* question order
* answer completion
* scoring
* difficulty adaptation
* retry eligibility
* report generation
* session completion

The frontend is responsible for presenting the state returned by the backend and collecting user input.

---

# 2. API Design Principles

## 2.1 Backend-owned state

The backend owns the interview state machine.

The frontend may request an action, but the backend decides whether that action is valid.

Example:

```text
Frontend:
"Retry question 5"

        ↓

Backend:
Is session owned by user?
Is session active?
Does question 5 belong to session?
Has the question been answered?
Is retry allowed?
Is retry limit exceeded?

        ↓

Allow / Reject
```

---

## 2.2 One source of truth

Persistent interview state must come from the database.

The backend should not depend on frontend state for:

* current question
* attempt number
* question completion
* interview status
* evaluation status
* report availability

---

## 2.3 Immutable answer attempts

An answer attempt must never be overwritten.

Every retry creates another `AnswerAttempt`.

Example:

```text
Question 4
│
├── Attempt 1
│     └── Evaluation
│
└── Attempt 2
      └── Evaluation
```

This allows TITAN to measure improvement.

---

## 2.4 Deterministic metrics vs AI interpretation

Where objective computation is possible, the backend should calculate it deterministically.

Examples:

```text
word count
response duration
speaking rate
filler count
pause count
sentence count
```

AI should be used for semantic interpretation.

Examples:

```text
technical correctness
answer relevance
depth
completeness
structure
missing concepts
improvement suggestions
```

---

## 2.5 No fabricated metrics

TITAN must never expose a numerical metric unless the system actually calculated it.

If a metric is unavailable:

```json
{
  "speakingRate": null
}
```

rather than inventing a value.

---

# 3. Base API

Base URL:

```text
/api
```

Interview endpoints:

```text
/api/interviews
```

All interview endpoints require authentication unless explicitly stated otherwise.

Authentication:

```http
Authorization: Bearer <JWT>
```

---

# 4. Standard Response Format

## 4.1 Success

```json
{
  "success": true,
  "data": {}
}
```

---

## 4.2 Error

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

The API must never expose:

* stack traces
* provider API keys
* internal prompts
* database errors
* internal service architecture
* sensitive infrastructure information

---

# 5. HTTP Status Conventions

Recommended statuses:

```text
200 OK
201 Created
202 Accepted
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
413 Payload Too Large
415 Unsupported Media Type
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
502 Bad Gateway
503 Service Unavailable
```

Examples:

```text
Invalid request → 400
Unauthenticated → 401
Resource not owned → 404
Invalid state transition → 409
Invalid semantic input → 422
Audio too large → 413
Unsupported audio → 415
AI provider unavailable → 503
```

---

# 6. Authentication and Authorization

Every interview request must resolve the authenticated user from:

```javascript
req.user.id
```

Never trust a `userId` supplied by the frontend.

Every interview resource must be scoped to the authenticated user.

Example:

```javascript
InterviewSession.findOne({
  _id: req.params.id,
  userId: req.user.id
});
```

The same rule applies to:

* InterviewSession
* InterviewQuestion
* AnswerAttempt
* AnswerReport
* FinalReport
* audio references
* progress data

Resource IDs alone are never authorization.

---

# 7. Interview Resource Lifecycle

The interview lifecycle is:

```text
created
   ↓
preparing
   ↓
in_progress
   ↓
processing_answer
   ↓
feedback
   ↓
in_progress
   ↓
completed
   ↓
report_generating
   ↓
report_ready
```

Failure states should be recoverable.

Example:

```text
processing_answer
      ↓
transcription_failed
      ↓
retry processing
```

A temporary provider failure must not destroy the session.

---

# 8. Interview Creation

## POST `/api/interviews`

Creates a new interview session.

The session is created in `created` state.

The interview does not begin until the start endpoint is called.

---

## Request

```json
{
  "mode": "mixed",
  "company": "Google",
  "role": "Software Engineer",
  "jobDescription": null,
  "useResume": true,
  "resumeVersionId": "resume_version_id",
  "interviewType": "technical",
  "difficulty": "adaptive",
  "durationMinutes": 30,
  "questionLimit": 10
}
```

---

# 9. Interview Modes

Supported modes:

```text
company
role
job_description
resume
mixed
```

## Company

```text
company
```

Questions are primarily grounded in the selected company context.

---

## Role

```text
role
```

Questions are generated around the selected role.

---

## Job Description

```text
job_description
```

Questions are grounded in the supplied job description.

---

## Resume

```text
resume
```

Questions are grounded in the selected `ResumeVersion`.

---

## Mixed

```text
mixed
```

Multiple meaningful sources are combined.

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

---

# 10. Interview Types

The interview type determines the evaluation emphasis.

Possible V1 values:

```text
technical
behavioral
mixed
role_specific
```

The exact allowed values should remain centrally configurable.

Example:

### Technical

Emphasis:

```text
technical accuracy
problem solving
depth
relevance
communication
```

### Behavioral

Emphasis:

```text
relevance
specificity
structure
communication
situational reasoning
```

---

# 11. Difficulty

Supported values:

```text
easy
medium
hard
adaptive
```

`adaptive` allows the Question Engine to adjust difficulty according to performance.

---

# 12. Creation Validation

The backend must validate that the selected configuration contains enough information to generate an interview.

Examples:

```text
company mode
→ company required

role mode
→ role required

job_description mode
→ jobDescription required

resume mode
→ resumeVersionId required

mixed mode
→ at least two meaningful sources
```

If `useResume` is enabled:

1. Validate resume ownership.
2. Validate resume version.
3. Resolve the exact version.
4. Store its reference in the interview session.
5. Build interview context from that version.

An active resume must never silently change during an existing interview.

---

# 13. Interview Creation Response

```json
{
  "success": true,
  "data": {
    "interviewId": "interview_id",
    "status": "created",
    "mode": "mixed",
    "interviewType": "technical",
    "company": "Google",
    "role": "Software Engineer",
    "difficulty": "adaptive",
    "durationMinutes": 30,
    "questionLimit": 10
  }
}
```

HTTP:

```text
201 Created
```

---

# 14. Get Interview

## GET `/api/interviews/:id`

Returns the current interview session.

Example:

```json
{
  "success": true,
  "data": {
    "id": "interview_id",
    "status": "in_progress",
    "mode": "mixed",
    "interviewType": "technical",
    "company": "Google",
    "role": "Software Engineer",
    "questionLimit": 10,
    "questionsGenerated": 7,
    "questionsCompleted": 6,
    "currentQuestionId": "question_id",
    "startedAt": "2026-08-14T10:00:00.000Z"
  }
}
```

The response must contain only data belonging to the authenticated user.

---

# 15. Start Interview

## POST `/api/interviews/:id/start`

Starts an interview session.

Backend flow:

```text
Validate ownership
       ↓
Validate session state
       ↓
Resolve candidate context
       ↓
Build interview context
       ↓
Generate opening question
       ↓
Validate generated question
       ↓
Persist question
       ↓
Update session state
       ↓
Return question
```

---

## Request

No body required.

---

## Response

```json
{
  "success": true,
  "data": {
    "interviewId": "interview_id",
    "status": "in_progress",
    "question": {
      "id": "question_id",
      "number": 1,
      "text": "Tell me about yourself and your recent software development experience.",
      "type": "intro",
      "topic": "introduction",
      "difficulty": "easy",
      "expectedDurationSeconds": 120
    }
  }
}
```

---

# 16. Start Idempotency

Starting an already-started interview must not generate another opening question.

If the session is already `in_progress`, the API should either:

* return the existing current state, or
* return `INTERVIEW_ALREADY_STARTED`

The implementation must never accidentally create duplicate opening questions.

---

# 17. Get Current Question

## GET `/api/interviews/:id/current`

Returns the current question requiring an answer.

Example:

```json
{
  "success": true,
  "data": {
    "question": {
      "id": "question_id",
      "number": 4,
      "text": "You mentioned using JWT authentication. How did you implement token validation?",
      "type": "technical",
      "topic": "authentication",
      "difficulty": "medium",
      "expectedDurationSeconds": 120
    }
  }
}
```

If no question is awaiting an answer:

```json
{
  "success": true,
  "data": {
    "question": null
  }
}
```

---

# 18. Answer Attempt Model

Each answer submission creates an immutable `AnswerAttempt`.

Conceptually:

```text
InterviewQuestion
        │
        ├── AnswerAttempt 1
        │      └── AnswerReport
        │
        ├── AnswerAttempt 2
        │      └── AnswerReport
        │
        └── AnswerAttempt 3
               └── AnswerReport
```

The original answer is never overwritten.

---

# 19. Submit Answer

## POST `/api/interviews/:id/questions/:questionId/answers`

Submits an answer attempt.

The preferred voice request is:

```text
multipart/form-data
```

Possible fields:

```text
audio
durationMs
clientStartedAt
clientEndedAt
```

If client-side transcription is supported:

```text
transcript
```

may also be supplied.

However, the backend remains responsible for validating the final stored transcript.

---

# 20. Answer Submission Validation

Before accepting an answer:

```text
Authenticate user
        ↓
Validate interview ownership
        ↓
Validate question ownership
        ↓
Validate interview state
        ↓
Validate question state
        ↓
Check duplicate submission
        ↓
Validate audio/transcript
        ↓
Create AnswerAttempt
```

The backend must prevent:

* answering another user's question
* answering a question belonging to another interview
* answering completed questions accidentally
* duplicate submissions
* submissions after interview completion

---

# 21. Audio Requirements

When audio is submitted, validate:

```text
MIME type
file extension
file size
duration
```

The exact supported formats depend on the selected transcription provider.

The backend must enforce server-side limits regardless of frontend validation.

---

# 22. Answer Processing Pipeline

The complete processing flow is:

```text
Answer received
      ↓
Create AnswerAttempt
      ↓
Validate input
      ↓
Store temporary audio if required
      ↓
Transcribe
      ↓
Store transcript
      ↓
Calculate deterministic speech metrics
      ↓
AI answer evaluation
      ↓
Validate AI evaluation
      ↓
Generate performance feedback
      ↓
Determine retry / explanation signals
      ↓
Persist AnswerReport
      ↓
Update interview progress
      ↓
Return evaluation
```

---

# 23. Processing State

An answer attempt may use:

```text
received
transcribing
analyzing
evaluated
processing_failed
```

Example:

```text
received
   ↓
transcribing
   ↓
analyzing
   ↓
evaluated
```

Failure:

```text
transcribing
   ↓
processing_failed
```

The failed attempt should remain recoverable.

---

# 24. Asynchronous Processing

Answer processing may be asynchronous if transcription or AI evaluation takes significant time.

The API may return:

```http
202 Accepted
```

Example:

```json
{
  "success": true,
  "data": {
    "answerAttemptId": "attempt_id",
    "status": "processing"
  }
}
```

The frontend may then retrieve processing status.

---

# 25. Get Answer Processing Status

## GET `/api/interviews/:id/answers/:answerAttemptId`

Returns the current processing state.

Example:

```json
{
  "success": true,
  "data": {
    "id": "attempt_id",
    "status": "evaluated",
    "transcriptAvailable": true,
    "evaluationAvailable": true
  }
}
```

When evaluated, the response may include the evaluation data.

This allows TITAN to evolve from synchronous V1 processing toward background jobs without changing the conceptual answer lifecycle.

---

# 26. Speech-to-Text Layer

Speech transcription must be abstracted.

Architecture:

```text
Interview Service
       ↓
Speech Service
       ↓
Provider Adapter
       ↓
Speech-to-Text Provider
```

Interview controllers must never directly call the transcription provider.

Conceptual interface:

```javascript
speechService.transcribe(audio)
```

---

# 27. Speech Metrics

When audio is available, TITAN may calculate:

```text
responseDurationMs
speakingRate
wordCount
pauseCount
totalPauseDurationMs
fillerWordCount
fillerWordRate
sentenceCount
```

Unavailable values must be represented as:

```json
null
```

rather than estimated without evidence.

---

# 28. Filler Word Detection

The filler dictionary should be configurable.

Initial examples:

```text
um
uh
like
you know
actually
basically
so
```

The API should expose measured values rather than psychological interpretations.

Example:

```json
{
  "fillerWordCount": 8,
  "fillerWordRate": 0.64
}
```

---

# 29. Voice Confidence Language

TITAN must not claim to detect psychological confidence.

Allowed wording:

```text
speech delivery
delivery consistency
speech confidence indicator
communication confidence indicator
```

The system should clearly distinguish observable speech behavior from subjective psychological state.

---

# 30. Answer Evaluation

Every successfully processed answer receives an evaluation.

The evaluation may contain:

```text
overallScore
correctness
relevance
completeness
technicalDepth
clarity
structure
communication
problemSolving
```

Not every dimension is required for every interview type.

---

# 31. Answer Quality Classification

The system should classify answers using:

```text
correct
mostly_correct
partially_correct
incorrect
insufficient
off_topic
```

This classification supports:

* feedback
* retry recommendations
* explanation recommendations
* adaptive question generation

---

# 32. Answer Evaluation Response

Example:

```json
{
  "success": true,
  "data": {
    "answer": {
      "id": "answer_id",
      "attemptNumber": 1,
      "transcript": "I implemented JWT authentication by...",
      "durationMs": 8430
    },

    "evaluation": {
      "overallScore": 78,
      "correctness": 82,
      "relevance": 90,
      "completeness": 74,
      "technicalDepth": 72,
      "clarity": 76,
      "structure": 70,
      "communication": 79,

      "classification": "mostly_correct",

      "speech": {
        "speakingRate": 142,
        "fillerWordCount": 6,
        "fillerWordRate": 0.71,
        "pauseCount": 4
      },

      "issues": [
        {
          "type": "incomplete_explanation",
          "severity": "minor",
          "description": "The explanation did not clearly describe how the server validates the token."
        }
      ],

      "suggestions": [
        "Explain the JWT validation flow step by step.",
        "Use shorter pauses between major ideas."
      ]
    },

    "retry": {
      "available": true
    },

    "explanation": {
      "recommended": false
    }
  }
}
```

---

# 33. Immediate Feedback

Every evaluated answer should produce actionable feedback.

Feedback may contain:

```text
strengths
issues
technicalFeedback
communicationFeedback
sentenceFeedback
speechFeedback
missingPoints
suggestions
```

The backend should avoid generating unnecessary motivational text.

The primary objective is improvement.

---

# 34. Retry Endpoint

## POST `/api/interviews/:id/questions/:questionId/retry`

Requests another attempt at the same question.

The original attempt remains unchanged.

---

## Retry validation

The backend checks:

```text
Interview ownership
Question ownership
Interview state
Question completion
Retry availability
Retry limit
```

---

## Response

```json
{
  "success": true,
  "data": {
    "question": {
      "id": "question_id",
      "number": 5,
      "text": "Explain how you implemented JWT authentication.",
      "attemptNumber": 2
    }
  }
}
```

The frontend should now record another answer for the same question.

---

# 35. Retry Comparison

After multiple attempts, TITAN may expose:

```json
{
  "attemptComparison": {
    "previousScore": 58,
    "currentScore": 76,
    "improvement": 18
  }
}
```

Improvement is based on actual stored evaluation data.

---

# 36. Retry Limits

The backend should enforce a configurable retry limit.

Example:

```text
maxRetriesPerQuestion = 2
```

The limit prevents an interview from becoming an unlimited retry loop.

The exact limit should remain configurable.

---

# 37. Explanation Flow

## POST `/api/interviews/:id/explanations`

Allows the candidate to request a contextual explanation.

Request:

```json
{
  "questionId": "question_id",
  "topic": "JWT authentication"
}
```

The backend should validate that the topic is relevant to the current interview context.

---

# 38. Explanation Response

```json
{
  "success": true,
  "data": {
    "topic": "JWT authentication",
    "explanation": "JWT is a signed token format commonly used to carry claims between a client and server.",
    "keyPoints": [
      "JWT contains claims.",
      "The token is signed.",
      "The server verifies the signature before trusting the claims."
    ]
  }
}
```

Explanations should remain:

* concise
* relevant
* technically accurate
* grounded in the current interview topic

---

# 39. Continue After Explanation

## POST `/api/interviews/:id/explanations/continue`

Returns the next interview action.

Example:

```json
{
  "success": true,
  "data": {
    "action": "question",
    "question": {
      "id": "question_id",
      "number": 6,
      "text": "Now explain how you would securely validate a JWT on the server.",
      "type": "technical",
      "topic": "authentication"
    }
  }
}
```

The generated question may use the explanation topic to maintain continuity.

---

# 40. Interview Action Contract

The backend may return:

```text
question
explanation
complete
```

`retry` is primarily a candidate action rather than a generated next-question state.

Example:

```json
{
  "action": "question"
}
```

or:

```json
{
  "action": "explanation"
}
```

or:

```json
{
  "action": "complete"
}
```

---

# 41. Generate Next Question

## POST `/api/interviews/:id/next`

Requests the next interview action after the current answer has been processed.

The endpoint is backend-controlled.

It must not generate another question if the current answer is still processing.

---

# 42. Next Question Generation Context

The Question Engine receives structured context:

```json
{
  "interviewContext": {},
  "candidateContext": {},
  "currentQuestion": {},
  "currentAnswer": {},
  "evaluation": {},
  "recentHistory": [],
  "weakAreas": [],
  "difficulty": "adaptive",
  "questionsCompleted": 6,
  "questionsRemaining": 4
}
```

The complete database document must not be blindly sent to the AI provider.

---

# 43. Question Generator Output

Internal AI/service output:

```json
{
  "action": "question",
  "question": {
    "text": "How would you improve the authentication system you described?",
    "type": "follow_up",
    "topic": "authentication",
    "difficulty": "medium",
    "reason": "weak_area"
  }
}
```

The `reason` field is internal unless intentionally exposed by the product.

---

# 44. Question Generation Reasons

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
explanation_follow_up
```

---

# 45. Adaptive Question Rules

The Question Engine must:

1. Use previous answers when generating follow-ups.
2. Probe meaningful weaknesses.
3. Increase difficulty after consistently strong performance.
4. Reduce difficulty when the candidate is struggling.
5. Maintain topic diversity.
6. Avoid unnecessary repetition.
7. Preserve conversational continuity.
8. Avoid asking multiple unrelated questions.
9. Respect the selected interview type.
10. Respect the selected interview mode.
11. Ground resume questions in the stored resume version.
12. Avoid inventing candidate experience.
13. Respect the remaining interview duration.
14. Respect the question limit.
15. Avoid endlessly targeting the same weakness.

---

# 46. Interview Completion

The interview can complete when one of the configured completion conditions is reached.

Possible conditions:

```text
questionLimit reached
duration exceeded
candidate ends interview
interview engine determines completion
```

The backend decides whether the session can transition to completion.

---

# 47. End Interview

## POST `/api/interviews/:id/end`

Ends an interview early.

Request:

```json
{
  "reason": "user_ended"
}
```

Possible reasons:

```text
user_ended
time_limit
system_completed
```

Response:

```json
{
  "success": true,
  "data": {
    "interviewId": "interview_id",
    "status": "completed"
  }
}
```

If the interview is intentionally abandoned before completion, the implementation may use:

```text
abandoned
```

as a separate terminal status.

---

# 48. Final Report Generation

## POST `/api/interviews/:id/report`

Generates the final master report.

The report must use stored interview evidence.

Pipeline:

```text
Completed Answer Reports
        ↓
Aggregate Metrics
        ↓
Aggregate Scores
        ↓
Identify Trends
        ↓
Identify Knowledge Gaps
        ↓
Analyze Retry Improvement
        ↓
AI Report Synthesis
        ↓
Schema Validation
        ↓
Persist FinalReport
```

---

# 49. Final Report Generation State

Report generation may use:

```text
not_started
generating
ready
failed
```

If generation is asynchronous:

```http
202 Accepted
```

may be returned.

Example:

```json
{
  "success": true,
  "data": {
    "interviewId": "interview_id",
    "reportStatus": "generating"
  }
}
```

The client can then retrieve the report.

---

# 50. Final Report

Example:

```json
{
  "success": true,
  "data": {
    "interviewId": "interview_id",
    "overallScore": 81,

    "performance": {
      "technical": 84,
      "communication": 78,
      "clarity": 80,
      "problemSolving": 82,
      "relevance": 87
    },

    "speech": {
      "averageSpeakingRate": 139,
      "totalFillerWords": 31,
      "averageFillerRate": 0.74,
      "averageResponseDurationMs": 8420
    },

    "strengths": [
      "Strong technical fundamentals",
      "Good project familiarity",
      "Relevant answers"
    ],

    "improvements": [
      "Reduce filler words",
      "Structure technical explanations more clearly",
      "Provide deeper reasoning for architectural decisions"
    ],

    "knowledgeGaps": [
      "JWT validation flow"
    ],

    "progress": {
      "questionsAnswered": 10,
      "questionsRetried": 2,
      "improvedAttempts": 2
    }
  }
}
```

---

# 51. Final Report Requirements

The final report should answer:

> How did I perform, what am I weak at, and what should I improve next?

Recommended sections:

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

The report should avoid unsupported claims.

---

# 52. Get Final Report

## GET `/api/interviews/:id/report`

Returns an existing final report.

If the report does not exist:

```json
{
  "success": true,
  "data": null
}
```

If the report is being generated:

```json
{
  "success": true,
  "data": {
    "status": "generating"
  }
}
```

---

# 53. Interview History

## GET `/api/interviews`

Returns the authenticated user's previous interview sessions.

Query parameters:

```text
?page=1
&limit=20
&status=completed
&mode=mixed
&interviewType=technical
```

Response:

```json
{
  "success": true,
  "data": {
    "interviews": [
      {
        "id": "interview_id",
        "mode": "mixed",
        "interviewType": "technical",
        "company": "Google",
        "role": "Software Engineer",
        "status": "completed",
        "overallScore": 81,
        "questionCount": 10,
        "completedAt": "2026-08-14T11:10:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 8,
      "pages": 1
    }
  }
}
```

---

# 54. Progress API

## GET `/api/interviews/progress`

Returns aggregated interview performance progression.

Example:

```json
{
  "success": true,
  "data": {
    "sessionsCompleted": 8,

    "scores": [
      {
        "interviewId": "id1",
        "score": 64,
        "completedAt": "2026-08-01"
      },
      {
        "interviewId": "id2",
        "score": 71,
        "completedAt": "2026-08-05"
      },
      {
        "interviewId": "id3",
        "score": 79,
        "completedAt": "2026-08-10"
      }
    ],

    "current": {
      "overallScore": 79
    },

    "improvement": {
      "absolute": 15,
      "percentage": 23.4
    }
  }
}
```

Only completed sessions with valid final scores should be included in score progression.

---

# 55. Interview Progress Data

Progress may include:

```text
overall score
technical score
communication score
relevance
structure
problem solving
speech metrics
retry improvement
knowledge gaps
difficulty progression
```

The backend should calculate progress from stored session evidence.

---

# 56. Resume Integration

If a resume is selected:

```text
InterviewSession
       ↓
ResumeVersion
       ↓
CandidateProfile
       ↓
InterviewContext
       ↓
Question Engine
```

The interview must retain the exact:

```text
resumeVersionId
```

used during the session.

The interview must never silently switch to a newer resume.

---

# 57. Interview Context

The backend constructs a normalized interview context.

Conceptually:

```javascript
{
  company: {},
  role: {},
  jobDescription: {},
  resume: {},
  candidate: {},
  interviewType: {},
  difficulty: {},
  objectives: {}
}
```

Only relevant information should be provided to AI services.

Sensitive or irrelevant database fields must not be forwarded.

---

# 58. AI Provider Abstraction

Controllers must never directly call an AI provider.

Architecture:

```text
Controller
    ↓
Interview Service
    ↓
Interview Intelligence Service
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

---

# 59. Structured AI Responses

AI responses must be treated as untrusted external data.

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
Valid
  ↓
Persist
```

Invalid:

```text
Schema Validation
     ↓
Invalid
     ↓
Retry / Recovery
```

Invalid AI output must never be persisted directly.

---

# 60. AI Retry Policy

AI operations may be retried when failures are transient.

Possible retry conditions:

```text
timeout
temporary provider failure
rate limit
malformed structured response
```

Retries must be bounded.

The server must not enter infinite retry loops.

---

# 61. Idempotency

Critical mutation endpoints should protect against duplicate requests.

Especially:

```text
start interview
submit answer
retry question
end interview
generate report
```

For answer submission, an idempotency key may be accepted:

```http
Idempotency-Key: <unique-request-id>
```

A repeated request with the same key should not create duplicate answer attempts.

---

# 62. Concurrency Protection

The backend must prevent conflicting interview mutations.

Example:

```text
Request A:
Submit Answer

Request B:
Submit Answer

Both arrive simultaneously.
```

The system must not create two valid primary attempts accidentally.

Concurrency protection may use:

* database transactions
* atomic state updates
* unique constraints
* idempotency keys

depending on the operation.

---

# 63. Audio Storage

Raw audio should not automatically be stored permanently.

Preferred V1 flow:

```text
Audio
 ↓
Temporary storage
 ↓
Transcription
 ↓
Speech analysis
 ↓
Derived metrics stored
 ↓
Temporary audio deleted
```

If persistent audio is later introduced, it must use:

```text
secure storage
access controls
retention policy
explicit product behavior
```

Audio references must never be exposed publicly.

---

# 64. Security Requirements

The API must:

* Require authentication.
* Validate resource ownership.
* Validate uploaded audio.
* Enforce request size limits.
* Validate IDs.
* Validate interview state transitions.
* Prevent duplicate answer submissions.
* Prevent access to another user's resources.
* Prevent modifications to completed sessions.
* Never expose AI API keys.
* Never expose internal prompts.
* Sanitize user-provided job descriptions.
* Avoid logging sensitive data unnecessarily.

---

# 65. Input Validation

Validate:

```text
interview mode
interview type
company
role
job description
resume reference
difficulty
duration
question limit
session ID
question ID
answer attempt ID
topic
audio
```

Audio validation must include:

```text
file type
file size
duration
```

All validation must occur server-side.

---

# 66. Error Codes

Recommended error codes:

```text
INTERVIEW_NOT_FOUND
INVALID_INTERVIEW_MODE
INVALID_INTERVIEW_TYPE
INVALID_CONFIGURATION
INTERVIEW_ALREADY_STARTED
INTERVIEW_NOT_STARTED
INTERVIEW_ALREADY_COMPLETED
INTERVIEW_NOT_ACTIVE

QUESTION_NOT_FOUND
QUESTION_ALREADY_ANSWERED
QUESTION_NOT_CURRENT
INVALID_QUESTION_STATE

INVALID_ANSWER
DUPLICATE_ANSWER
ANSWER_PROCESSING
ANSWER_PROCESSING_FAILED

AUDIO_REQUIRED
AUDIO_TOO_LARGE
UNSUPPORTED_AUDIO_FORMAT
INVALID_AUDIO_DURATION

TRANSCRIPTION_FAILED
EVALUATION_FAILED
QUESTION_GENERATION_FAILED
EXPLANATION_FAILED
REPORT_GENERATION_FAILED

RETRY_NOT_AVAILABLE
RETRY_LIMIT_REACHED

RESUME_CONTEXT_UNAVAILABLE
INVALID_INTERVIEW_STATE

AI_PROVIDER_UNAVAILABLE
AI_RESPONSE_INVALID
RATE_LIMITED
```

---

# 67. Failure Handling

Failures must preserve previously valid interview state.

Example:

```text
Question 5
   ↓
Answer submitted
   ↓
Transcription fails
   ↓
Retry transcription
```

Not:

```text
Transcription fails
   ↓
Interview destroyed
```

Similarly:

```text
Answer evaluation fails
```

must not delete the answer attempt or previous evaluations.

---

# 68. Recovery Rules

The system should allow recovery from:

```text
transcription failure
AI failure
temporary network failure
audio upload failure
report generation failure
```

The frontend should receive a recoverable state whenever possible.

Example:

```json
{
  "success": false,
  "error": {
    "code": "TRANSCRIPTION_FAILED",
    "message": "We couldn't process your audio. Please try again."
  }
}
```

---

# 69. Refresh Recovery

After a browser refresh:

```text
Browser
   ↓
GET /api/interviews/:id
   ↓
Backend returns persistent session state
   ↓
Frontend restores UI
```

If an answer is being processed:

```text
status = processing
```

The frontend should continue polling or requesting the processing status.

The backend remains the source of truth.

---

# 70. Performance Requirements

The interview should feel conversational.

The primary processing path is:

```text
Answer
 ↓
Transcription
 ↓
Evaluation
 ↓
Feedback
```

Where possible, independent processing tasks may execute efficiently.

However:

> Correctness and state consistency take priority over raw latency.

The architecture must not sacrifice evaluation correctness simply to reduce response time.

---

# 71. API Endpoint Summary

| Method | Endpoint                                            | Purpose                          |
| ------ | --------------------------------------------------- | -------------------------------- |
| POST   | `/api/interviews`                                   | Create interview                 |
| GET    | `/api/interviews/:id`                               | Get interview                    |
| POST   | `/api/interviews/:id/start`                         | Start interview                  |
| GET    | `/api/interviews/:id/current`                       | Get current question             |
| POST   | `/api/interviews/:id/questions/:questionId/answers` | Submit answer                    |
| GET    | `/api/interviews/:id/answers/:answerAttemptId`      | Get answer processing/evaluation |
| POST   | `/api/interviews/:id/questions/:questionId/retry`   | Retry question                   |
| POST   | `/api/interviews/:id/next`                          | Generate next action/question    |
| POST   | `/api/interviews/:id/explanations`                  | Request explanation              |
| POST   | `/api/interviews/:id/explanations/continue`         | Continue after explanation       |
| POST   | `/api/interviews/:id/end`                           | End interview                    |
| POST   | `/api/interviews/:id/report`                        | Generate final report            |
| GET    | `/api/interviews/:id/report`                        | Get final report                 |
| GET    | `/api/interviews`                                   | Get interview history            |
| GET    | `/api/interviews/progress`                          | Get performance progression      |

---

# 72. Frontend API Mapping

The frontend service layer should expose:

```text
createInterview()
getInterview()
startInterview()
getCurrentQuestion()

submitAnswer()
getAnswerStatus()

retryQuestion()
getNextInterviewAction()

requestExplanation()
continueAfterExplanation()

endInterview()

generateInterviewReport()
getInterviewReport()

getInterviewHistory()
getInterviewProgress()
```

The frontend must not contain:

```text
question generation logic
scoring logic
difficulty adaptation
answer evaluation
progress calculation
report synthesis
```

---

# 73. Backend Responsibility Boundary

The API layer is responsible for:

```text
HTTP
authentication context
validation
resource ownership
state validation
request parsing
response formatting
```

The service layer is responsible for:

```text
interview orchestration
question generation
answer processing
evaluation
speech processing
progress calculation
report generation
```

The AI layer is responsible for:

```text
semantic evaluation
question generation
explanations
final report synthesis
```

The database layer is responsible for:

```text
persistence
relationships
indexes
constraints
```

---

# 74. V1 API Scope

V1 includes:

* Voice-first interviews
* Company-based interviews
* Role-based interviews
* Job-description interviews
* Resume-based interviews
* Mixed interviews
* Dynamic questions
* Adaptive follow-up questions
* Speech-to-text
* Speech metrics
* Answer evaluation
* Communication feedback
* Filler-word analysis
* Sentence-formation feedback
* Retry attempts
* Contextual explanations
* Session progress
* Final master reports
* Interview history
* Refresh/recovery
* Secure user-scoped resources

---

# 75. Explicitly Out of V1 API Scope

The following should not complicate the initial API:

```text
Live human interviewer
Video analysis
Facial emotion recognition
Advanced body-language analysis
Multi-user interviews
Collaborative interviews
Real-time interviewer avatar
Live coding environment
Real-time conversational interruption
WebRTC interviewer
Long-term autonomous coaching
```

These can receive separate APIs in future versions.

---

# 76. Future API Evolution

The API should remain extensible toward:

```text
streaming speech recognition
WebSocket / WebRTC sessions
real-time interviewer voice
live conversational interruption
video interview analysis
cross-session skill progression
company-specific interviewer simulations
interview benchmarking
personalized coaching plans
live coding interviews
```

V1 should not require these capabilities.

---

# 77. API State Machine

The API operates around the following lifecycle:

```text
                    ┌──────────┐
                    │  created │
                    └────┬─────┘
                         │
                       start
                         ↓
                  ┌──────────────┐
                  │ in_progress  │
                  └──────┬───────┘
                         │
                  submit answer
                         ↓
               ┌──────────────────┐
               │processing_answer │
               └────────┬─────────┘
                        │
                  evaluation
                        ↓
                  ┌──────────┐
                  │ feedback │
                  └────┬─────┘
                       │
             ┌─────────┼──────────┐
             ↓         ↓          ↓
           retry   explanation   next
             │         │          │
             │         ↓          │
             │      question      │
             │         │          │
             └─────────┴──────────┘
                       ↓
                  in_progress
                       │
                    complete
                       ↓
                  ┌───────────┐
                  │ completed │
                  └─────┬─────┘
                        │
                  generate report
                        ↓
              ┌──────────────────┐
              │ report_generating│
              └────────┬─────────┘
                       ↓
                ┌─────────────┐
                │ report_ready│
                └─────────────┘
```

Invalid transitions must be rejected by the backend.

---

# 78. Core API Principle

TITAN's API must not behave like:

```text
Question
   ↓
Answer
   ↓
Question
   ↓
Answer
```

It must support:

```text
Question
   ↓
Candidate Answer
   ↓
Transcription
   ↓
Understand Answer
   ↓
Evaluate Answer
   ↓
Immediate Feedback
   ↓
Identify Strength / Weakness
   ↓
Teach Missing Concepts
   ↓
Allow Retry
   ↓
Measure Improvement
   ↓
Adapt Difficulty
   ↓
Generate Contextual Follow-up
   ↓
Continue
   ↓
Final Master Report
```

The API therefore exists to support TITAN's core product loop:

> **Assess → Explain → Retry → Measure → Adapt → Improve.**

The objective is not merely to simulate an interview.

The objective is to make the candidate **measurably better at interviewing after every session.**

# TITAN — Interview Data Model

**Document:** `interview-data-model.md`
**Module:** Interview Intelligence
**Version:** V1
**Status:** Implementation-ready
**Last Updated:** 2026

---

# 1. Purpose

This document defines the persistent data model for TITAN's Interview Intelligence module.

It specifies:

* MongoDB collections
* Mongoose schemas
* relationships
* ownership rules
* lifecycle states
* indexes
* embedded vs referenced data
* interview context snapshots
* voice-answer metadata
* transcription data
* structured answer analysis
* retry attempts
* adaptive follow-up questions
* explanations
* session-level reporting
* final master reports
* AI metadata
* historical performance data
* processing and recovery state

The model must support TITAN's core learning loop:

```text
Interview Setup
      ↓
Interview Session
      ↓
Question
      ↓
Voice Answer
      ↓
Transcription
      ↓
Answer Analysis
      ↓
Performance Feedback
      ↓
┌─────┴──────┐
│            │
Retry      Continue
│            │
↓            ↓
New        Next
Attempt    Question
│            │
└─────┬──────┘
      ↓
Session Completion
      ↓
Final Report
      ↓
Historical Progress
```

The database must preserve the candidate's complete interview learning journey rather than merely storing final scores.

---

# 2. Design Principles

## 2.1 User ownership

Every interview-related persistent entity must belong to an authenticated user.

No user may access another user's:

* interview sessions
* questions
* answer attempts
* transcripts
* recordings
* reports
* explanations
* performance data

Authorization must always be enforced server-side.

Client-provided IDs must never be trusted without an ownership check.

---

## 2.2 Resume Intelligence remains the source of resume data

The Interview module must not duplicate the complete `ResumeVersion` candidate profile.

An interview may reference the `ResumeVersion` used to construct the interview context.

```text
User
 │
 ├── ResumeVersion
 │      ├── candidateProfile
 │      └── interviewContext
 │
 └── InterviewSession
        └── resumeVersionId
```

The interview stores only the context necessary to preserve the historical meaning of the interview.

---

## 2.3 Historical integrity

An interview must remain understandable even if the user later:

* uploads another resume
* activates another resume
* deletes a resume
* changes career preferences
* changes target roles
* modifies their profile

Therefore, the session stores an immutable:

```text
interviewContextSnapshot
```

captured when the interview is created.

The snapshot is the historical source of truth for the interview context.

---

## 2.4 Retry attempts are separate attempts

A retry never overwrites an earlier answer.

Example:

```text
Question 4
├── Attempt 1
├── Attempt 2
└── Attempt 3
```

Each attempt receives:

* its own document
* its own audio reference
* its own transcript
* its own analysis
* its own score
* its own processing lifecycle

The first attempt remains available permanently unless the user explicitly deletes the relevant interview data.

---

## 2.5 Retry is not a new question

A retry means:

```text
Same Question
      ↓
New AnswerAttempt
```

An adaptive follow-up means:

```text
Previous Question
      ↓
Previous Answer
      ↓
New InterviewQuestion
```

These must never be conflated.

---

## 2.6 Voice data is metadata + storage reference

Audio binaries must not be stored inside MongoDB.

MongoDB stores:

```js
audio: {
  storageReference: "...",
  mimeType: "audio/webm",
  durationMs: 48200,
  sizeBytes: 384921
}
```

Actual audio is stored using an external storage abstraction.

The data model must not depend on a specific storage provider.

---

## 2.7 AI output must be structured

AI-generated analysis must be stored as structured data.

The system must not depend on parsing arbitrary AI-generated text.

Structured data should support:

* scores
* strengths
* weaknesses
* suggestions
* corrections
* technical feedback
* filler-word statistics
* language metrics
* retry improvement
* answer quality

---

## 2.8 Database is the source of truth

The frontend must never calculate or invent:

* answer scores
* improvement scores
* final scores
* answer quality
* technical accuracy
* retry improvement classification

The frontend displays persisted server-generated data.

Derived UI values may be calculated from persisted source data when appropriate, but authoritative values must originate from the backend.

---

# 3. V1 Collections

V1 uses three primary interview collections:

```text
interviewSessions
interviewQuestions
answerAttempts
```

Existing collections:

```text
users
resumeVersions
```

Reports, explanations, analysis, and metadata are embedded inside their lifecycle owner where appropriate.

### Collection ownership

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
       │
       └── FinalReport
```

---

# 4. Entity Relationship

```text
User
 │
 ├──────────────────────────────────┐
 │                                  │
 ↓                                  ↓
ResumeVersion                 InterviewSession
                                     │
                                     ├── resumeVersionId
                                     ├── interviewContextSnapshot
                                     ├── configuration
                                     ├── progress
                                     ├── finalReport
                                     │
                                     ├── Question 1
                                     │      └── Attempt 1
                                     │
                                     ├── Question 2
                                     │      ├── Attempt 1
                                     │      └── Attempt 2
                                     │
                                     └── Question N
                                            └── Attempts
```

Questions and attempts are separate collections.

The final report is embedded in the session because it belongs exclusively to that session and is only produced once the session is finalized.

---

# 5. InterviewSession

## 5.1 Purpose

`InterviewSession` represents one interview practice session.

A session begins when interview creation starts and ends when it becomes:

```text
completed
```

or:

```text
abandoned
failed
```

---

# 6. InterviewSession Schema

```js
const interviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    resumeVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResumeVersion",
      default: null,
    },

    status: {
      type: String,
      enum: [
        "created",
        "starting",
        "active",
        "paused",
        "completing",
        "completed",
        "abandoned",
        "failed",
      ],
      default: "created",
      index: true,
    },

    configuration: {
      contextSources: {
        type: [String],
        enum: [
          "company",
          "role",
          "job_description",
          "resume",
        ],
        default: [],
      },

      company: {
        type: String,
        default: "",
        trim: true,
      },

      targetRole: {
        type: String,
        default: "",
        trim: true,
      },

      jobDescription: {
        type: String,
        default: "",
      },

      interviewType: {
        type: String,
        enum: [
          "technical",
          "behavioral",
          "mixed",
        ],
        default: "mixed",
      },

      difficulty: {
        type: String,
        enum: [
          "easy",
          "medium",
          "hard",
        ],
        default: "medium",
      },

      durationMinutes: {
        type: Number,
        enum: [15, 30, 45],
        default: 30,
      },

      questionCount: {
        type: Number,
        min: 1,
        max: 50,
        required: true,
      },
    },

    interviewContextSnapshot: {
      candidateSummary: {
        type: String,
        default: "",
      },

      primarySkills: {
        type: [String],
        default: [],
      },

      projects: {
        type: [String],
        default: [],
      },

      targetRole: {
        type: String,
        default: "",
      },

      experienceLevel: {
        type: String,
        default: "",
      },

      resumeVersionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ResumeVersion",
        default: null,
      },

      capturedAt: {
        type: Date,
        default: Date.now,
      },
    },

    progress: {
      currentQuestionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewQuestion",
        default: null,
      },

      currentQuestionNumber: {
        type: Number,
        default: 0,
      },

      questionsCompleted: {
        type: Number,
        default: 0,
        min: 0,
      },

      totalQuestions: {
        type: Number,
        default: 0,
        min: 0,
      },

      attemptsCount: {
        type: Number,
        default: 0,
        min: 0,
      },

      retryCount: {
        type: Number,
        default: 0,
        min: 0,
      },

      lastCompletedQuestionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewQuestion",
        default: null,
      },
    },

    processing: {
      operation: {
        type: String,
        enum: [
          null,
          "starting",
          "generating_question",
          "processing_answer",
          "generating_follow_up",
          "finalizing",
        ],
        default: null,
      },

      operationStartedAt: {
        type: Date,
        default: null,
      },

      operationId: {
        type: String,
        default: null,
      },

      errorCode: {
        type: String,
        default: null,
      },

      errorMessage: {
        type: String,
        default: null,
      },

      retryable: {
        type: Boolean,
        default: false,
      },
    },

    finalReport: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);
```

---

# 7. Why FinalReport Is Embedded

The final report is embedded directly inside `InterviewSession`.

```text
InterviewSession
└── finalReport
```

There is no separate `finalReportId` in V1.

Reasons:

1. A final report belongs to exactly one session.
2. It is generated only once during finalization.
3. It is always retrieved with the session.
4. It has no independent lifecycle.
5. Embedding prevents unnecessary reference lookups.
6. Historical reports remain attached to their source session.

A future analytics system may extract reports into a dedicated collection if required.

---

# 8. Interview Context Snapshot

At session creation, TITAN captures the context used to generate the interview.

Example:

```json
{
  "candidateSummary": "Full Stack Developer",
  "primarySkills": [
    "JavaScript",
    "React",
    "Node.js",
    "Express",
    "MongoDB"
  ],
  "projects": [
    "TITAN",
    "Cortex",
    "ShopSphere"
  ],
  "targetRole": "Full Stack Developer",
  "experienceLevel": "Fresher"
}
```

The snapshot must not automatically change when the user's resume changes.

---

# 9. Context Source Rules

The configuration records which sources influenced interview generation.

### Resume

```json
{
  "contextSources": ["resume"]
}
```

### Company + Role

```json
{
  "contextSources": [
    "company",
    "role"
  ]
}
```

### Resume + Role + Job Description

```json
{
  "contextSources": [
    "resume",
    "role",
    "job_description"
  ]
}
```

### Full context

```json
{
  "contextSources": [
    "company",
    "role",
    "job_description",
    "resume"
  ]
}
```

`contextSources` describes generation context only. It does not grant access to the underlying source documents.

---

# 10. InterviewQuestion

## 10.1 Purpose

`InterviewQuestion` represents one logical question presented during a session.

Questions are separate documents because they:

* are dynamically generated
* may depend on previous answers
* may contain generation metadata
* may form adaptive chains
* have their own lifecycle
* may have multiple answer attempts

---

# 11. InterviewQuestion Schema

```js
const interviewQuestionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewSession",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    questionNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "technical",
        "behavioral",
        "project",
        "resume",
        "company",
        "role",
        "job_description",
        "follow_up",
        "mixed",
      ],
      required: true,
    },

    difficulty: {
      type: String,
      enum: [
        "easy",
        "medium",
        "hard",
      ],
      default: "medium",
    },

    source: {
      type: String,
      enum: [
        "initial",
        "adaptive_follow_up",
      ],
      required: true,
    },

    parentQuestionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewQuestion",
      default: null,
    },

    generationContext: {
      previousQuestionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewQuestion",
        default: null,
      },

      previousAnswerAttemptId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AnswerAttempt",
        default: null,
      },

      reason: {
        type: String,
        default: "",
      },
    },

    status: {
      type: String,
      enum: [
        "generated",
        "asked",
        "answered",
        "skipped",
      ],
      default: "generated",
    },

    sequenceIndex: {
      type: Number,
      required: true,
      min: 0,
    },

    askedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    aiMetadata: {
      provider: {
        type: String,
        default: null,
      },

      model: {
        type: String,
        default: null,
      },

      promptVersion: {
        type: String,
        default: null,
      },

      generationLatencyMs: {
        type: Number,
        default: null,
      },

      generatedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);
```

---

# 12. Question Number vs Sequence Index

The system must distinguish logical question numbering from database ordering.

`sequenceIndex` represents the chronological position in the interview.

Example:

```text
sequenceIndex 0 → Q1
sequenceIndex 1 → Q2
sequenceIndex 2 → Q3
sequenceIndex 3 → Q4
```

Adaptive follow-ups are still ordinary questions in the chronological sequence.

This prevents adaptive branching from corrupting the question ordering.

`questionNumber` represents the user-facing logical number when applicable.

---

# 13. Adaptive Question Relationships

Example:

```text
Q1
 ↓
Attempt 1
 ↓
Q2
 ↓
Attempt 1
 ↓
Adaptive Q3
```

Q3 stores:

```json
{
  "source": "adaptive_follow_up",
  "parentQuestionId": "Q2_ID",
  "generationContext": {
    "previousQuestionId": "Q2_ID",
    "previousAnswerAttemptId": "ATTEMPT_ID",
    "reason": "Candidate mentioned Redis caching but did not explain the invalidation strategy."
  }
}
```

The `reason` is internal metadata and must never be exposed to the user.

---

# 14. AnswerAttempt

## 14.1 Purpose

`AnswerAttempt` represents one actual answer submitted for a question.

Every retry creates another attempt.

```text
Question
├── Attempt 1
├── Attempt 2
└── Attempt 3
```

Attempts have independent processing lifecycles.

---

# 15. AnswerAttempt Schema

```js
const answerAttemptSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewSession",
      required: true,
      index: true,
    },

    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewQuestion",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    isRetry: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: [
        "recording",
        "uploaded",
        "transcribing",
        "analyzing",
        "completed",
        "failed",
      ],
      default: "recording",
    },

    processing: {
      operationId: {
        type: String,
        default: null,
      },

      errorCode: {
        type: String,
        default: null,
      },

      errorMessage: {
        type: String,
        default: null,
      },

      retryable: {
        type: Boolean,
        default: false,
      },

      attempts: {
        type: Number,
        default: 0,
        min: 0,
      },

      lastProcessedAt: {
        type: Date,
        default: null,
      },
    },

    audio: {
      storageReference: {
        type: String,
        default: null,
      },

      mimeType: {
        type: String,
        default: null,
      },

      durationMs: {
        type: Number,
        default: null,
        min: 0,
      },

      sizeBytes: {
        type: Number,
        default: null,
        min: 0,
      },

      uploadedAt: {
        type: Date,
        default: null,
      },
    },

    transcript: {
      text: {
        type: String,
        default: "",
      },

      language: {
        type: String,
        default: "en",
      },

      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: null,
      },

      provider: {
        type: String,
        default: null,
      },

      model: {
        type: String,
        default: null,
      },

      generatedAt: {
        type: Date,
        default: null,
      },
    },

    analysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    answerQuality: {
      type: String,
      enum: [
        "excellent",
        "good",
        "mostly_correct",
        "partially_correct",
        "incorrect",
        "insufficient",
        null,
      ],
      default: null,
    },

    improvement: {
      previousAttemptId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AnswerAttempt",
        default: null,
      },

      scoreDelta: {
        type: Number,
        default: null,
      },

      communicationDelta: {
        type: Number,
        default: null,
      },

      technicalDelta: {
        type: Number,
        default: null,
      },

      structureDelta: {
        type: Number,
        default: null,
      },

      improved: {
        type: Boolean,
        default: null,
      },

      improvedAreas: {
        type: [String],
        default: [],
      },

      remainingIssues: {
        type: [String],
        default: [],
      },
    },

    explanation: {
      requested: {
        type: Boolean,
        default: false,
      },

      topic: {
        type: String,
        default: "",
      },

      trigger: {
        type: String,
        enum: [
          "user_request",
          "system_suggestion",
          null,
        ],
        default: null,
      },

      explanationText: {
        type: String,
        default: "",
      },

      keyPoints: {
        type: [String],
        default: [],
      },

      relatedQuestionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewQuestion",
        default: null,
      },

      createdAt: {
        type: Date,
        default: null,
      },
    },

    aiMetadata: {
      provider: {
        type: String,
        default: null,
      },

      model: {
        type: String,
        default: null,
      },

      promptVersion: {
        type: String,
        default: null,
      },

      analysisVersion: {
        type: String,
        default: null,
      },

      latencyMs: {
        type: Number,
        default: null,
      },

      tokenUsage: {
        input: {
          type: Number,
          default: null,
        },

        output: {
          type: Number,
          default: null,
        },

        total: {
          type: Number,
          default: null,
        },
      },

      generatedAt: {
        type: Date,
        default: null,
      },
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
```

---

# 16. Answer Analysis

The `analysis` object contains structured AI-generated evaluation.

Recommended structure:

```js
const answerAnalysisSchema = new mongoose.Schema(
  {
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    technicalAccuracy: {
      type: Number,
      min: 0,
      max: 100,
    },

    relevance: {
      type: Number,
      min: 0,
      max: 100,
    },

    communication: {
      type: Number,
      min: 0,
      max: 100,
    },

    clarity: {
      type: Number,
      min: 0,
      max: 100,
    },

    structure: {
      type: Number,
      min: 0,
      max: 100,
    },

    completeness: {
      type: Number,
      min: 0,
      max: 100,
    },

    confidence: {
      type: Number,
      min: 0,
      max: 100,
    },

    fillerWords: {
      total: {
        type: Number,
        default: 0,
        min: 0,
      },

      occurrences: [
        {
          word: {
            type: String,
            required: true,
          },

          count: {
            type: Number,
            min: 0,
            required: true,
          },
        },
      ],
    },

    language: {
      sentenceQuality: {
        type: Number,
        min: 0,
        max: 100,
      },

      grammarIssues: {
        type: Number,
        default: 0,
        min: 0,
      },

      incompleteSentences: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    strengths: {
      type: [String],
      default: [],
    },

    weaknesses: {
      type: [String],
      default: [],
    },

    suggestions: {
      type: [String],
      default: [],
    },

    corrections: [
      {
        original: {
          type: String,
          required: true,
        },

        improved: {
          type: String,
          required: true,
        },

        explanation: {
          type: String,
          required: true,
        },
      },
    ],

    technicalFeedback: {
      correctness: {
        type: String,
        default: "",
      },

      missingConcepts: {
        type: [String],
        default: [],
      },

      misconceptions: {
        type: [String],
        default: [],
      },

      improvedExplanation: {
        type: String,
        default: "",
      },
    },
  },
  {
    _id: false,
  }
);
```

The implementation should use this sub-schema rather than `Mixed` once the final Mongoose model is created.

---

# 17. Score Rules

All performance scores use:

```text
0–100
```

Example:

```json
{
  "overallScore": 82,
  "technicalAccuracy": 87,
  "communication": 74,
  "structure": 81
}
```

The backend/AI analysis system generates these values.

The frontend must never invent or modify authoritative scores.

---

# 18. Answer Quality

Every successfully analyzed answer receives a high-level classification:

```text
excellent
good
mostly_correct
partially_correct
incorrect
insufficient
```

This classification provides semantic meaning beyond a numerical score.

Example:

```text
Score: 68
Quality: mostly_correct
```

This is preferable to displaying only:

```text
Score: 68
```

---

# 19. Retry Model

Retry behavior:

```text
Question 5
│
├── Attempt 1
│     Score: 62
│
├── Attempt 2
│     Score: 78
│
└── Attempt 3
      Score: 86
```

The attempts remain immutable historical records after completion.

A retry must never modify:

```text
Attempt 1
```

to become:

```text
Attempt 2
```

---

# 20. Attempt Improvement

Improvement is calculated only after the new attempt has been analyzed.

Example:

```json
{
  "previousAttemptId": "ATTEMPT_1",
  "scoreDelta": 16,
  "communicationDelta": 9,
  "technicalDelta": 4,
  "structureDelta": 16,
  "improved": true,
  "improvedAreas": [
    "structure",
    "communication"
  ],
  "remainingIssues": [
    "technical depth"
  ]
}
```

The exact improvement threshold belongs to the intelligence layer.

The UI must not independently decide whether an answer improved.

---

# 21. Explanation Model

An explanation belongs to a specific answer/question context.

Example:

```json
{
  "requested": true,
  "topic": "Database indexing",
  "trigger": "user_request",
  "explanationText": "...",
  "keyPoints": [
    "Indexes speed up lookups.",
    "They reduce full collection scans.",
    "They introduce storage and write overhead."
  ],
  "relatedQuestionId": "QUESTION_ID"
}
```

Explanations are not a separate course system in V1.

They exist to help the candidate understand concepts encountered during an interview.

---

# 22. Explanation Rules

Explanations should be:

* concise
* relevant
* technically accurate
* tied to the interview context
* generated only when needed

Possible triggers:

```text
user_request
system_suggestion
```

---

# 23. FinalReport

The final report is embedded inside `InterviewSession`.

Recommended structure:

```js
finalReport: {
  overallScore: Number,

  dimensions: {
    technicalAccuracy: Number,
    communication: Number,
    clarity: Number,
    structure: Number,
    confidence: Number,
    relevance: Number,
  },

  strengths: [String],

  improvementAreas: [String],

  recommendations: [String],

  statistics: {
    questionsAnswered: Number,
    totalAttempts: Number,
    retryCount: Number,
    improvedAttempts: Number,
  },

  questionBreakdown: [
    {
      questionId: ObjectId,
      bestScore: Number,
      attempts: Number,
      improved: Boolean,
    }
  ],

  generatedAt: Date,

  aiMetadata: {
    provider: String,
    model: String,
    promptVersion: String,
    analysisVersion: String,
    latencyMs: Number,
    generatedAt: Date,
  }
}
```

The report should be persisted before the session becomes `completed`.

---

# 24. Final Report Source of Truth

The final report must be generated from persisted session data.

Conceptually:

```text
InterviewSession
      ↓
Completed Questions
      ↓
Completed Attempts
      ↓
Answer Analyses
      ↓
Session Aggregation
      ↓
FinalReport
```

The final report must not depend on transient frontend state.

---

# 25. Session Finalization

A session may only transition to:

```text
completed
```

after:

1. all required questions are completed
2. the final answer has been successfully analyzed
3. session-level aggregation succeeds
4. final report is generated
5. final report is persisted
6. session completion is committed

Lifecycle:

```text
active
   ↓
completing
   ↓
aggregate analyses
   ↓
generate final report
   ↓
persist report
   ↓
completed
```

If finalization fails, the session must remain recoverable.

It must not be marked `completed` prematurely.

---

# 26. Finalization Concurrency

Only one finalization operation may run for a session at a time.

The backend must use an operation identifier or equivalent concurrency mechanism to prevent:

```text
Request A → generate report
Request B → generate report
```

from producing conflicting reports.

Finalization must be idempotent.

If the same finalization request is retried after a network failure, the backend must not create duplicate final reports or corrupt the session.

---

# 27. Session Recovery

The database must contain sufficient state to restore an active interview after:

* browser refresh
* temporary network failure
* frontend crash
* backend restart

Recovery data includes:

* session status
* current question ID
* current question position
* completed question count
* total question count
* latest attempt
* answer-processing state
* operation ID
* last activity timestamp

Recovery flow:

```text
GET active session
       ↓
read session state
       ↓
read current question
       ↓
read latest attempt if processing
       ↓
restore recoverable UI state
       ↓
continue interview
```

---

# 28. Abandoned Sessions

A user may leave before completion.

The session may become:

```text
abandoned
```

Abandonment must not delete:

* questions
* completed attempts
* transcripts
* analyses
* audio references
* explanations

Historical data remains intact.

---

# 29. Failed Sessions

A session becomes `failed` only when the system cannot safely continue or recover.

An individual answer-processing failure must not automatically fail the entire session.

Example:

```text
Question 4
     ↓
Answer uploaded
     ↓
Transcription fails
     ↓
Retry transcription
     ↓
Continue
```

The attempt may temporarily enter:

```text
failed
```

while the session remains:

```text
active
```

if recovery is possible.

---

# 30. Answer Processing Lifecycle

```text
recording
    ↓
uploaded
    ↓
transcribing
    ↓
analyzing
    ↓
completed
```

Failure:

```text
any processing state
        ↓
      failed
```

A failed operation should retain enough metadata for safe retry.

---

# 31. Processing Idempotency

Audio upload, transcription, answer analysis, and report generation must support idempotent processing.

Each processing operation may have an `operationId`.

Example:

```text
AnswerAttempt
operationId: "analysis_abc123"
```

If the same request is received twice, the service must recognize the existing operation rather than generating duplicate records.

This is particularly important for:

* network retries
* worker retries
* browser retries
* webhook duplication
* server restarts

---

# 32. Audio Storage

Audio is stored outside MongoDB.

```text
InterviewSession
      ↓
AnswerAttempt
      ↓
audio.storageReference
      ↓
Object Storage
```

The application should use a storage abstraction such as:

```text
AudioStorageService
```

rather than coupling the model to S3, local filesystem, or another provider.

Possible V1:

```text
LocalStorageProvider
```

Future:

```text
S3StorageProvider
CloudStorageProvider
```

---

# 33. Audio Security

Clients must never receive raw internal storage paths unless explicitly required.

Instead, the backend should provide a controlled access mechanism such as:

```text
signed URL
```

or:

```text
authorized streaming endpoint
```

Storage references remain internal.

---

# 34. Audio Retention

Audio retention is configurable.

Possible policies:

```text
Keep audio
Delete after transcription
Delete after analysis
Delete after session completion
User-controlled deletion
```

Deleting audio must not automatically delete:

* transcript
* analysis
* score
* final report

unless the product's privacy policy explicitly requires it.

---

# 35. AI Metadata

AI metadata is internal system data.

Example:

```js
aiMetadata: {
  provider: "provider-name",
  model: "model-name",
  promptVersion: "answer-analysis-v1",
  analysisVersion: "v1",
  generatedAt: Date,
  latencyMs: 2400,
  tokenUsage: {
    input: 1200,
    output: 600,
    total: 1800
  }
}
```

Used for:

* debugging
* evaluation
* cost tracking
* model comparison
* prompt iteration
* quality monitoring

It must not automatically be exposed through user-facing API responses.

---

# 36. AI Versioning

AI-generated results must be versioned.

At minimum:

```text
promptVersion
analysisVersion
model
provider
```

This allows TITAN to determine which AI pipeline generated historical results.

Historical reports must not silently change when the AI system is upgraded.

---

# 37. Progress Across Interviews

No separate progress collection is required for V1.

Historical progress is derived from completed sessions:

```text
Session 1 → FinalReport → 71
Session 2 → FinalReport → 77
Session 3 → FinalReport → 83
```

Future analytics may introduce a dedicated aggregation collection if querying requirements justify it.

For V1:

```text
InterviewSession.finalReport
```

is the source of historical performance data.

---

# 38. Data Ownership

Every interview collection contains:

```text
userId
```

even when ownership can technically be derived from `sessionId`.

This provides:

* simpler authorization
* safer queries
* direct user filtering
* efficient cleanup
* easier analytics
* defense against accidental cross-user access

However, the duplicated `userId` must remain consistent.

Services creating child documents must copy the authenticated session owner's ID rather than accepting arbitrary client-provided ownership.

---

# 39. Authorization Rules

Every controller/service must verify ownership.

Example:

```js
const question = await InterviewQuestion.findOne({
  _id: req.params.id,
  userId: req.user.id,
});
```

For nested resources:

```js
const session = await InterviewSession.findOne({
  _id: req.params.sessionId,
  userId: req.user.id,
});
```

Never use:

```js
findById(req.params.id)
```

for sensitive interview resources without a subsequent ownership check.

---

# 40. Child Resource Ownership

For every child resource:

```text
AnswerAttempt
InterviewQuestion
```

the backend must validate both:

```text
userId
```

and the parent relationship where applicable.

Example:

```js
AnswerAttempt.findOne({
  _id: attemptId,
  userId: req.user.id,
  sessionId: sessionId,
});
```

This prevents malicious cross-session ID substitution.

---

# 41. Indexes

## InterviewSession

```js
interviewSessionSchema.index({
  userId: 1,
  createdAt: -1,
});

interviewSessionSchema.index({
  userId: 1,
  status: 1,
});

interviewSessionSchema.index({
  userId: 1,
  lastActivityAt: -1,
});
```

Only one active interview should normally be allowed if the product requirement enforces one active session per user.

If enforced, an application/service-level check should be used.

A partial unique MongoDB index may be introduced if the product definitively requires this constraint.

---

## InterviewQuestion

```js
interviewQuestionSchema.index({
  sessionId: 1,
  sequenceIndex: 1,
});

interviewQuestionSchema.index({
  sessionId: 1,
  questionNumber: 1,
});

interviewQuestionSchema.index({
  userId: 1,
  sessionId: 1,
});
```

---

## AnswerAttempt

```js
answerAttemptSchema.index({
  questionId: 1,
  attemptNumber: 1,
});

answerAttemptSchema.index({
  sessionId: 1,
  createdAt: 1,
});

answerAttemptSchema.index({
  userId: 1,
  createdAt: -1,
});
```

---

# 42. Uniqueness Constraints

For a logical question position:

```text
sessionId + sequenceIndex
```

must be unique.

```js
interviewQuestionSchema.index(
  {
    sessionId: 1,
    sequenceIndex: 1,
  },
  {
    unique: true,
  }
);
```

For an attempt:

```text
questionId + attemptNumber
```

must be unique.

```js
answerAttemptSchema.index(
  {
    questionId: 1,
    attemptNumber: 1,
  },
  {
    unique: true,
  }
);
```

This protects against duplicate attempts caused by concurrent requests.

---

# 43. Embedded vs Referenced Data

## Embedded

Embed data that:

* belongs exclusively to its parent
* has the same lifecycle
* is normally retrieved with the parent
* has no independent query requirement

Examples:

```text
Session configuration
Interview context snapshot
Session progress
Final report
Answer analysis
Audio metadata
Transcript metadata
Improvement data
Explanation
AI metadata
```

---

## Referenced

Reference entities with independent lifecycles:

```text
User
ResumeVersion
InterviewSession
InterviewQuestion
AnswerAttempt
```

---

# 44. Why Questions Are Separate Documents

Questions should not be embedded indefinitely inside `InterviewSession`.

Reasons:

1. Dynamic generation
2. Adaptive follow-ups
3. Independent state
4. Generation metadata
5. Question-level querying
6. Analytics
7. Debugging
8. Multiple attempts
9. Future branching

---

# 45. Why Attempts Are Separate Documents

Attempts should not be embedded indefinitely inside questions.

Reasons:

* transcripts can become large
* analysis can become large
* retries create multiple records
* processing has an independent lifecycle
* audio metadata grows with every attempt
* future analytics will query attempts
* failed processing requires independent recovery

---

# 46. Privacy

Interview data can contain sensitive personal and professional information.

The backend must:

* enforce ownership
* protect transcripts
* protect resume-derived context
* protect job descriptions
* protect audio
* avoid exposing internal storage references
* avoid exposing AI metadata unnecessarily
* avoid exposing internal generation reasoning
* sanitize user-visible errors

The internal adaptive-question `reason` must never be returned to the frontend.

---

# 47. API Response Separation

Internal database fields should not automatically become API response fields.

The API/service layer should explicitly map database documents to DTOs.

For example:

```text
Database
├── aiMetadata
├── processing
├── operationId
├── storageReference
└── generationContext.reason

API
├── question
├── status
├── transcript
├── analysis
└── feedback
```

This prevents accidental exposure of internal system information.

---

# 48. Deletion Behavior

Deleting an interview session must be treated as a deliberate data operation.

V1 should not perform uncontrolled cascading deletion.

If user deletion is implemented later, the cascade must account for:

```text
Session
 ↓
Questions
 ↓
Attempts
 ↓
Audio storage
 ↓
Transcripts
 ↓
Reports
```

External audio storage must be cleaned separately.

Deletion operations should be idempotent.

---

# 49. Transaction Boundaries

MongoDB transactions should be used where multiple documents must change atomically.

Examples:

### Creating an answer attempt

```text
Create AnswerAttempt
+
Update session progress
```

### Completing an answer

```text
Update AnswerAttempt
+
Update Question
+
Update Session progress
```

### Finalizing session

```text
Persist FinalReport
+
Set session status = completed
+
Set completedAt
```

The system should avoid long-running AI operations inside MongoDB transactions.

AI processing should happen outside the transaction, followed by a short persistence transaction.

---

# 50. Session State Machine

Valid lifecycle:

```text
created
   ↓
starting
   ↓
active
   ↓
paused
   ↓
active
   ↓
completing
   ↓
completed
```

Alternative exits:

```text
active → abandoned
active → failed

paused → abandoned
paused → failed

completing → failed
```

A completed session must be immutable except for explicitly supported metadata operations.

---

# 51. Question State Machine

Normal:

```text
generated
   ↓
asked
   ↓
answered
```

Alternative:

```text
generated → skipped
```

A question should not become `answered` until at least one successful answer attempt has completed.

---

# 52. Answer State Machine

```text
recording
   ↓
uploaded
   ↓
transcribing
   ↓
analyzing
   ↓
completed
```

Failure:

```text
recording → failed
uploaded → failed
transcribing → failed
analyzing → failed
```

A failed attempt may be reprocessed when `retryable = true`.

A retry of the answer itself creates a new `AnswerAttempt`.

These are two different concepts:

```text
Processing retry
= retry the same attempt's processing

Answer retry
= create a new attempt
```

---

# 53. Complete Session Example

```text
InterviewSession
│
├── configuration
│   ├── sources: resume + role
│   ├── role: Full Stack Developer
│   ├── type: mixed
│   └── difficulty: medium
│
├── contextSnapshot
│   ├── skills
│   ├── projects
│   └── targetRole
│
├── Question 1
│   └── Attempt 1
│       ├── audio
│       ├── transcript
│       └── analysis
│
├── Question 2
│   ├── Attempt 1
│   └── Attempt 2
│
├── Adaptive Question 3
│   └── Attempt 1
│
└── finalReport
    ├── overallScore
    ├── dimensions
    ├── strengths
    ├── improvementAreas
    └── recommendations
```

---

# 54. Retry Example

```text
Question 2
│
├── Attempt 1
│   ├── Score: 61
│   ├── Communication: 64
│   └── Structure: 55
│
└── Attempt 2
    ├── Score: 79
    ├── Communication: 77
    ├── Structure: 82
    └── Improvement: +18
```

The UI may truthfully display:

```text
Your answer improved by 18 points.
```

because both attempts are persisted independently.

---

# 55. Adaptive Follow-up Example

Question:

```text
How would you scale this Node.js application?
```

Answer:

```text
Candidate mentions caching but does not explain
cache invalidation.
```

TITAN generates:

```text
How would you handle cache invalidation
in the system you described?
```

The new question stores:

```text
source:
adaptive_follow_up

parentQuestionId:
Question 3

generationContext.previousAnswerAttemptId:
Answer 3
```

This creates a persistent interview conversation chain.

---

# 56. Historical Integrity Rules

Historical interview results must not change because of:

* new resumes
* changed profile data
* changed career preferences
* new AI models
* changed prompts
* changed scoring logic

Historical records preserve:

```text
context snapshot
+
question
+
answer
+
analysis
+
AI version metadata
+
final report
```

If TITAN later reprocesses an old answer, the new analysis must be versioned rather than silently replacing historical truth.

---

# 57. V1 Scope

V1 requires:

* `InterviewSession`
* `InterviewQuestion`
* `AnswerAttempt`
* answer analysis
* retry attempts
* transcript
* audio metadata
* explanation data
* final report
* interview context snapshot
* session progress
* adaptive question relationships
* AI metadata
* processing/recovery state
* ownership and authorization support
* indexes
* lifecycle states

---

# 58. Explicit V1 Non-Goals

V1 does not require:

* leaderboards
* badges
* achievements
* social profiles
* recruiter access
* multiplayer interviews
* human interviewer accounts
* webcam analysis
* emotion detection
* body-language analysis
* advanced long-term skill graphs
* separate learning-course infrastructure
* dedicated progress collection
* dedicated final-report collection

These may be introduced later without fundamentally changing the V1 model.

---

# 59. Future Extension Points

The model should support future additions for:

* video interviews
* webcam analysis
* emotion analysis
* body-language analysis
* advanced speech analytics
* interviewer personas
* interview templates
* company-specific interview tracks
* long-term skill progression
* personalized learning plans
* advanced interview history analytics

Future functionality must extend the current entities rather than unnecessarily replacing them.

---

# 60. Implementation Rules

When implementing the schemas:

1. Use Mongoose.
2. Follow existing TITAN model conventions.
3. Use MongoDB `ObjectId` references.
4. Include timestamps.
5. Include `userId` ownership.
6. Add compound indexes.
7. Use unique indexes for logical question sequence and attempt number.
8. Do not store audio binaries in MongoDB.
9. Do not duplicate the complete `ResumeVersion` candidate profile.
10. Snapshot interview context at session creation.
11. Never overwrite previous answer attempts.
12. Store structured answer analysis.
13. Store retry history.
14. Embed the final report inside the session for V1.
15. Keep internal AI metadata separate from user-facing data.
16. Validate enums at the model layer.
17. Enforce authorization at controller/service level.
18. Never trust client-supplied ownership IDs.
19. Support idempotent processing.
20. Support recoverable processing failures.
21. Keep AI processing outside long-running MongoDB transactions.
22. Use short transactions for multi-document state changes.
23. Preserve historical AI version metadata.
24. Do not expose internal generation reasons.
25. Do not expose raw storage references directly.
26. Treat the database as the source of truth for authoritative scores.
27. Do not mark a session `completed` until the final report is persisted.
28. Do not create a new question for an answer retry.
29. Do create a new `AnswerAttempt` for every answer retry.
30. Do create a new `InterviewQuestion` for every adaptive follow-up.

---

# 61. Definition of Done

The Interview Data Model is complete when:

* [ ] `InterviewSession` schema is defined.
* [ ] `InterviewQuestion` schema is defined.
* [ ] `AnswerAttempt` schema is defined.
* [ ] Answer analysis schema is defined.
* [ ] Retry attempts are preserved.
* [ ] Audio metadata is represented.
* [ ] Transcript data is represented.
* [ ] Explanation data is represented.
* [ ] Final master report is represented.
* [ ] Interview context snapshot is represented.
* [ ] Session progress is represented.
* [ ] Adaptive question relationships are represented.
* [ ] Processing state is represented.
* [ ] Recovery state is represented.
* [ ] AI metadata is represented.
* [ ] Ownership rules are defined.
* [ ] Authorization rules are defined.
* [ ] Indexes are defined.
* [ ] Uniqueness constraints are defined.
* [ ] Lifecycle states are defined.
* [ ] Historical integrity is preserved.
* [ ] Resume Intelligence data is reused rather than duplicated.
* [ ] Audio storage remains provider-independent.
* [ ] Processing operations are idempotent.
* [ ] Finalization is recoverable and idempotent.
* [ ] Future voice/video expansion remains possible.
* [ ] No UI-only concepts are incorrectly treated as database truth.

---

# 62. Core Data Principle

TITAN must preserve the complete learning journey:

```text
What was asked
      ↓
What the candidate said
      ↓
How the candidate performed
      ↓
What was wrong
      ↓
What TITAN taught
      ↓
How the candidate retried
      ↓
Whether the candidate improved
      ↓
How the candidate performed overall
```

Therefore:

> **The Interview Data Model represents progress, not merely answers.**

The database should allow TITAN to reconstruct not only what happened during an interview, but how the candidate improved through the process.

That is the foundation that allows TITAN to become an **interview improvement system rather than another question-generation platform.**

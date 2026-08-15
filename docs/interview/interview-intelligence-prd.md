# TITAN — Interview Intelligence PRD

**Document:** `interview-intelligence-prd.md`
**Product:** TITAN
**Module:** Interview Intelligence
**Version:** V1
**Status:** Implementation-Ready Product Definition

---

# 1. Product Vision

TITAN Interview Intelligence is a **voice-first AI interview simulator and training system** designed to behave like a capable human interviewer while continuously helping the candidate improve.

The system should:

1. Understand the interview context.
2. Generate an appropriate interview plan.
3. Ask relevant questions.
4. Listen to the candidate's spoken answer.
5. Transcribe and analyze the answer.
6. Evaluate the answer using applicable dimensions.
7. Provide concise, actionable feedback.
8. Decide whether to retry, explain, follow up, or continue.
9. Adapt question difficulty and topic selection based on demonstrated performance.
10. Preserve every attempt and improvement.
11. Produce a final performance report.
12. Make historical progress measurable across completed interviews.

The core philosophy is:

> **TITAN should train the candidate, not merely test the candidate.**

---

# 2. Problem

Most interview-preparation platforms primarily provide:

* predefined questions
* static answers
* coding challenges
* generic AI-generated questions
* isolated feedback

These systems often fail to reproduce the experience of an actual interview.

A real interview is dynamic.

An interviewer may:

* ask a follow-up based on an answer
* challenge an incorrect assumption
* ask for clarification
* change difficulty
* explore something mentioned by the candidate
* notice poor communication
* ask the candidate to explain something differently
* revisit a weak topic
* move away from an area that has already been sufficiently covered

TITAN should reproduce these behaviors while adding a learning loop that traditional interviews do not provide.

---

# 3. Core Differentiator

TITAN is not:

```text
Question
   ↓
Answer
   ↓
Score
   ↓
Next Question
```

TITAN is:

```text
Context
   ↓
Question
   ↓
Voice Answer
   ↓
Transcription
   ↓
Evaluation
   ↓
Feedback
   ↓
Teach / Retry / Adapt
   ↓
Follow-up or Next Question
   ↓
Measure Improvement
   ↓
Continue
   ↓
Master Report
```

The candidate should feel that TITAN is conducting an actual interview while simultaneously helping them become better at interviewing.

---

# 4. Interview Modes

TITAN supports four primary context sources that may be combined.

## 4.1 Company-Based

The candidate may provide a target company.

Company context may influence:

* relevant technical areas
* role expectations
* behavioral areas
* company-specific information available from trusted sources

TITAN must not claim that a particular question or process is used by a company unless supported by reliable data.

Company-specific information should be treated as contextual guidance rather than guaranteed prediction.

---

## 4.2 Role-Based

The candidate may select a target role.

Examples:

* Frontend Developer
* Backend Developer
* Full Stack Developer
* Software Engineer
* Data Analyst

Questions should be generated according to:

* role responsibilities
* expected technical knowledge
* expected skills
* experience level
* interview objective

---

## 4.3 Job Description-Based

The candidate may provide a job description.

TITAN should extract relevant:

* skills
* technologies
* responsibilities
* requirements
* experience expectations
* domain concepts

The extracted information should influence question generation and topic coverage.

The supplied job description remains part of the interview's historical context.

---

## 4.4 Resume-Based

If the candidate has an available resume, TITAN may consume the structured output of Resume Intelligence.

Primary inputs:

```text
ResumeVersion.candidateProfile
ResumeVersion.interviewContext
```

Questions may reference:

* projects
* technologies
* skills
* experience
* education
* achievements
* claimed capabilities
* career preferences

Example:

> "You mentioned building a MERN application. Why did you choose MongoDB instead of PostgreSQL?"

TITAN must never fabricate experience.

If the resume says the candidate used React but contains no evidence of Redis, TITAN must not state that the candidate used Redis.

---

## 4.5 Mixed Mode

The candidate may combine:

* Company
* Role
* Job Description
* Resume

Example:

```text
Company: Google
Role: Software Engineer
Resume: Selected ResumeVersion
Job Description: Provided JD
```

The question engine considers all available context.

---

# 5. Interview Configuration

Before starting an interview, TITAN must create an immutable session configuration.

## 5.1 Required Configuration

* interview context
* target role or interview objective
* experience level
* interview type
* difficulty
* question count or duration

## 5.2 Optional Configuration

* company
* job description
* resume
* interview focus

Supported interview types:

```text
technical
behavioral
mixed
```

Supported focus areas may include:

```text
technical
behavioral
system design
project discussion
HR
mixed
```

The selected focus is used by the question-generation and evaluation engines.

---

# 6. Interview Context Snapshot

At session creation, TITAN must capture the context used to generate the interview.

The session references the originating `ResumeVersion` where applicable but must not depend on the current active resume for historical interpretation.

The session snapshot should contain only the information required for interview context.

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

This ensures that future resume changes do not alter historical interviews.

---

# 7. Interview Session Lifecycle

The persistent session lifecycle is:

```text
created
   ↓
starting
   ↓
active
   ↓
completing
   ↓
completed
```

Alternative terminal states:

```text
active → abandoned
active → failed
```

`paused` may be used when the product explicitly supports resumable pausing.

The UI may expose more granular states such as:

```text
QUESTION
LISTENING
PROCESSING
FEEDBACK
```

but these are **interaction states**, not replacements for the persistent session lifecycle.

---

# 8. Voice-First Experience

Voice is a core V1 capability.

The candidate should be able to:

1. Start an interview.
2. Hear the AI interviewer.
3. Receive a question.
4. Speak naturally.
5. Stop speaking manually or through supported speech-end detection.
6. Submit the answer.
7. Have the answer processed.
8. Receive feedback.
9. Retry, request an explanation, or continue.
10. Hear the next question.

The experience should feel conversational rather than like a conventional form.

---

# 9. Voice Processing Pipeline

The conceptual pipeline is:

```text
Question
   ↓
Question Text
   ↓
Text-to-Speech
   ↓
Candidate Hears Question
   ↓
Audio Recording
   ↓
Speech-to-Text
   ↓
Transcript
   ↓
Speech / Audio Metrics
   ↓
Answer Intelligence
   ↓
Structured Analysis
   ↓
Feedback
   ↓
Decision Engine
   ↓
Retry / Explain / Follow-Up / Next Question
```

Audio binaries must not be stored in MongoDB.

MongoDB stores audio metadata and a storage reference.

---

# 10. Audio Analysis

Where technically reliable, TITAN may analyze:

* response duration
* speaking pace
* pause duration
* filler-word usage
* hesitation markers
* speech consistency
* interruption patterns
* other observable speech characteristics

Metrics must only be displayed when the underlying processing succeeded.

If a metric is unavailable, TITAN must not invent it.

---

# 11. Confidence Representation

TITAN must **not claim to directly measure psychological confidence**.

Instead, it may identify observable confidence indicators such as:

* hesitation markers
* long pauses
* repeated self-corrections
* uncertain language
* rushed delivery
* excessive filler usage
* low volume where reliably measurable

Preferred language:

> "Your answer contained frequent hesitation markers."

Avoid:

> "You have low confidence."

The distinction between observable speech behavior and psychological interpretation must be maintained throughout the product.

---

# 12. Filler Word Analysis

TITAN should identify common filler words and phrases where supported by transcription/audio analysis.

Examples:

* um
* uh
* like
* basically
* actually
* you know
* I mean
* so

The system may report:

* total filler count
* filler frequency
* most frequent fillers
* relevant examples
* improvement suggestions

Example:

```text
Filler words: 8
Most frequent: "like"

Suggestion:
Pause briefly when searching for your next thought instead of
automatically using a filler.
```

---

# 13. Answer Intelligence

Every completed answer should receive structured analysis.

The evaluation engine must select only the dimensions applicable to the question.

The data model supports the following primary dimensions:

* technical accuracy
* relevance
* communication
* clarity
* structure
* completeness
* confidence indicators

Additional evaluation concepts such as reasoning and technical vocabulary may influence these dimensions or be represented in structured feedback without requiring a separate persistent score in V1.

This prevents the product from creating scores that the persistence layer cannot consistently represent.

---

# 14. Evaluation Dimensions

## 14.1 Technical Accuracy

Measures whether the answer is technically correct.

Possible classification:

* excellent
* good
* mostly correct
* partially correct
* incorrect
* insufficient

---

## 14.2 Relevance

Measures whether the candidate actually answered the question.

A technically correct answer that does not address the question should receive lower relevance.

---

## 14.3 Completeness

Measures whether the candidate covered important expected aspects.

A candidate does not need to reproduce a perfect reference answer.

Completeness should be evaluated against the question's expected concepts and context.

---

## 14.4 Reasoning

For questions requiring reasoning, TITAN should evaluate:

* logic
* assumptions
* trade-offs
* decision making
* explanation of why a particular approach was chosen

Reasoning contributes to the answer's overall evaluation where applicable.

---

## 14.5 Communication

Measures:

* clarity
* organization
* conciseness
* sentence formation
* unnecessary repetition
* ability to explain ideas

---

## 14.6 Technical Vocabulary

Where relevant, TITAN may evaluate whether technical terminology is:

* appropriate
* correctly used
* sufficiently precise

Incorrect terminology should only reduce evaluation when it materially affects understanding.

---

## 14.7 Answer Structure

For suitable questions, TITAN evaluates whether the response has a useful structure.

Examples:

```text
Problem
→ Approach
→ Implementation
→ Trade-offs
→ Result
```

For behavioral questions, TITAN may recommend STAR-style organization.

Structure should not be penalized merely because the candidate did not explicitly use a named framework.

---

# 15. Answer Quality Classification

The persistent `answerQuality` classification is:

```text
excellent
good
mostly_correct
partially_correct
incorrect
insufficient
```

This classification is separate from the numerical score.

A numerical score should never be the only representation of answer quality.

---

# 16. Score Rules

All persisted scores use a consistent:

```text
0–100
```

scale.

Examples:

```text
overallScore: 82
technicalAccuracy: 87
communication: 74
structure: 81
```

The analysis system generates scores.

The frontend must never calculate, modify, or invent scores.

Scores should only be persisted when sufficient evidence exists.

---

# 17. Per-Answer Feedback

After an answer is analyzed, TITAN should provide concise feedback.

Example:

```text
ANSWER REVIEW

Overall: Mostly Correct

What you did well
• Correctly explained JWT authentication.
• Clearly described token-based authentication.

What needs improvement
• You did not explain token expiration.
• The explanation became repetitive.

Communication
• 3 filler words
• One long hesitation
• Generally clear delivery

Better approach
1. Login
2. Token generation
3. Client handling
4. Authorization
5. Expiration / refresh
```

An improved example answer may be provided where useful.

Feedback should remain concise and actionable.

---

# 18. Wrong Answer Handling

When an answer is incorrect, TITAN should not simply reveal the correct answer and immediately continue.

The default learning flow is:

```text
Identify error
   ↓
Explain why
   ↓
Provide correction
   ↓
Suggest improvement
   ↓
Offer retry
```

Example:

> "Your answer is partially incorrect because JWTs are encoded and signed, but they are not inherently encrypted."

The candidate may then retry the question.

---

# 19. Answer Severity

TITAN must distinguish between levels of correctness.

### Correct

The core answer is accurate.

Minor wording issues should not materially reduce the score.

### Mostly Correct

The core concept is correct but an important detail is missing.

### Partially Correct

Some important information is correct, but a significant gap or misconception exists.

### Incorrect

The central concept or conclusion is wrong.

### Insufficient

The response does not contain enough information to evaluate or answer the question meaningfully.

This prevents overly harsh evaluation.

---

# 20. Sentence and Communication Analysis

TITAN should identify communication problems without becoming a generic grammar checker.

Relevant signals include:

* incomplete sentences
* confusing phrasing
* excessive repetition
* unclear references
* overly long sentences
* grammar patterns that materially reduce clarity

The objective is:

> **Interview communication improvement**

not English-language examination.

---

# 21. Answer Attempt Model

Every answer is represented by an `AnswerAttempt`.

An attempt belongs to exactly one question.

```text
Question 5
   ├── Attempt 1
   ├── Attempt 2
   └── Attempt 3
```

A retry creates a **new AnswerAttempt**.

The previous attempt must never be overwritten.

Each attempt preserves:

* attempt number
* retry status
* processing status
* audio metadata
* transcript
* analysis
* timestamps
* optional improvement comparison

---

# 22. Retry Rules

Retry is a learning mechanism, not a new interview question.

When a candidate retries Question 5:

```text
Question 5
   ↓
Attempt 1
   ↓
Feedback
   ↓
Retry
   ↓
Attempt 2
```

The question remains the same.

The system must **not create a new `InterviewQuestion` merely because the candidate retried**.

This keeps retries and adaptive follow-up questions conceptually separate.

---

# 23. Retry Comparison

After a retry is analyzed, TITAN may compare it with the immediately relevant previous attempt.

Example:

```text
Attempt 1
Overall: 61

Attempt 2
Overall: 79
```

Derived improvement information may include:

* score delta
* communication delta
* technical delta
* structure delta
* improved areas
* remaining issues

Example:

```text
Improvement: +18 points

Improved:
• Structure
• Communication

Still needs work:
• Technical completeness
```

The raw attempts remain the source of truth.

TITAN must not fabricate improvement percentages.

---

# 24. Improvement Threshold

TITAN should not claim meaningful improvement for negligible changes.

The exact threshold belongs to the intelligence layer rather than the frontend.

For example, the analysis system may classify a change as:

```text
meaningful improvement
minimal change
decline
```

The threshold may evolve independently of the UI and database schema.

---

# 25. Explanation Mode

During an interview, the candidate may encounter an unfamiliar concept.

TITAN may offer:

> "Would you like me to explain this concept before continuing?"

The candidate may choose:

```text
Yes
No
```

If requested, TITAN generates a concise explanation appropriate to the candidate's context.

---

# 26. Explanation Rules

Explanations should:

* relate directly to the current question or answer
* match the candidate's experience level
* explain only what is necessary
* use examples when useful
* avoid unnecessary depth
* not become a separate course

An explanation may contain:

```text
Topic
Explanation
Key Points
Related Question
Trigger
```

The explanation should be persisted when required for historical context.

---

# 27. Explanation Lifecycle

An explanation may be triggered by:

```text
user_request
system_suggestion
```

After the explanation:

```text
Explanation
   ↓
Continue
   OR
Retry
```

The candidate should not be forced into a retry unless the interview mode explicitly requires it.

---

# 28. Adaptive Question Engine

The next question must not simply be selected randomly.

The question engine should consider:

* interview context
* target role
* interview type
* current difficulty
* experience level
* questions already asked
* topics covered
* previous answers
* answer quality
* weaknesses
* strengths
* retry history
* previous question relationships
* interview objectives
* available remaining question/time budget

The engine should select the next action first and then generate a suitable question when necessary.

---

# 29. Interview Decision Engine

After processing an answer, TITAN should conceptually determine:

```text
NEXT_QUESTION
FOLLOW_UP
RETRY
EXPLAIN
CLARIFY
END_INTERVIEW
```

The decision should consider both product configuration and observed candidate performance.

The decision engine must avoid creating unnecessary loops.

---

# 30. Follow-Up Questions

A strong or interesting answer may trigger a deeper follow-up.

Example:

**Question**

> "Explain how you implemented authentication."

**Candidate**

> "I used JWT authentication."

**Follow-up**

> "You mentioned JWT. How did you handle token expiration and authorization?"

The follow-up question is a **new InterviewQuestion**.

It should preserve its relationship to the parent question and the answer attempt that triggered it.

---

# 31. Adaptive Follow-Up Relationship

Adaptive follow-ups should store:

```text
source: adaptive_follow_up
parentQuestionId: previous question
generationContext.previousQuestionId
generationContext.previousAnswerAttemptId
generationContext.reason
```

Example:

```text
Q3
 ↓
Attempt 1
 ↓
Analysis identifies missing cache invalidation reasoning
 ↓
Q4
```

Q4 remains an independent question document while maintaining its parent relationship.

The internal generation reason must not be exposed to the candidate.

---

# 32. Weak Answer Handling

If the candidate demonstrates weak understanding, TITAN may:

1. ask a simpler clarification question
2. provide an explanation
3. offer a retry
4. revisit the topic later
5. move to another topic

The system should not endlessly punish the candidate for a single weak answer.

---

# 33. Difficulty Adaptation

V1 supports:

```text
easy
medium
hard
```

The intelligence layer may internally reason about more granular difficulty, but persisted session/question difficulty should remain within the supported model.

If the candidate consistently performs strongly:

```text
difficulty ↑
```

If the candidate struggles:

```text
difficulty ↓
```

Difficulty should change gradually.

A single weak answer should not automatically cause a major difficulty drop.

---

# 34. Topic Coverage

TITAN should maintain an internal understanding of:

* topics covered
* topics not yet covered
* strengths
* weaknesses
* repeated weaknesses
* relevant concepts mentioned by the candidate
* topics requiring follow-up

This prevents unnecessary repetition and improves interview coverage.

The database does not need a separate topic-tracking collection in V1.

Topic state may be derived from questions and answer analyses until future analytics justify dedicated persistence.

---

# 35. Question Numbering

`questionNumber` identifies the logical position of a question within a session.

The combination:

```text
sessionId + questionNumber
```

must be unique.

Retries do **not** consume a new question number.

Adaptive follow-ups are new questions and therefore receive their own question number.

Example:

```text
Q1 → Attempt 1
Q2 → Attempt 1
Q3 → Attempt 1
Q4 → Follow-up to Q3
Q5 → Attempt 1
```

The question number represents interview progression, not the retry count.

---

# 36. Interview Progress

The session maintains:

```text
currentQuestionNumber
questionsCompleted
totalQuestions
attemptsCount
retryCount
```

These are operational session-progress values.

They should be updated by backend services rather than calculated by the frontend.

Retries increment:

```text
attemptsCount
retryCount
```

but do not increment:

```text
questionsCompleted
```

unless product logic defines the question as completed after the retry decision.

---

# 37. Session Recovery

The system must support recovery after browser refresh or temporary interruption.

Required persistent state includes:

* session status
* current question
* question status
* completed question count
* latest answer attempt
* processing status
* last activity timestamp

Recovery flow:

```text
GET active session
      ↓
Restore session state
      ↓
Determine recoverable interaction state
      ↓
Continue interview
```

The backend must determine the authoritative recoverable state.

The client must not invent session state.

---

# 38. Processing Failure Handling

Individual processing failures must not automatically fail the entire interview.

Example:

```text
Answer uploaded
      ↓
Transcription failed
      ↓
Retry processing
      ↓
Continue
```

A session should become `failed` only when the system cannot safely recover or continue.

Processing failures should be observable internally for debugging and recovery.

---

# 39. Session Completion Rules

A session may reach its configured completion boundary because:

* configured question count is reached
* configured duration is reached
* candidate explicitly ends the interview
* the interview engine determines sufficient coverage has been achieved

However, reaching the final question does **not** immediately mark the session as completed.

The finalization sequence is:

```text
active
   ↓
final question answered
   ↓
final answer analysis succeeds
   ↓
completing
   ↓
session-level analysis generated
   ↓
final report persisted
   ↓
completed
```

The report must exist before the session is considered successfully completed.

---

# 40. Abandoned Sessions

A candidate may leave an interview before completion.

The session may become:

```text
abandoned
```

Abandonment must not automatically delete:

* questions
* answer attempts
* transcripts
* analyses
* audio references
* available reports

Historical data remains intact unless explicit deletion behavior is introduced.

---

# 41. Final Master Report

Every successfully completed interview should produce a persisted final report.

The report should summarize:

## Overall Performance

* overall score
* technical accuracy
* communication
* clarity
* structure
* confidence indicators
* relevance

## Technical Performance

* strongest areas
* weakest areas
* knowledge gaps
* technical accuracy

## Communication Performance

* clarity
* structure
* filler frequency where available
* speaking pace where available
* hesitation indicators where available
* sentence quality

## Answer Performance

* strongest answers
* weaker answers
* partially correct answers
* improved retry attempts

## Progress During Session

Where enough data exists, compare earlier and later performance.

Example:

```text
Beginning → End

Technical accuracy   62 → 81
Structure            55 → 78
Communication        68 → 82
Filler frequency      9 → 4
```

Only metrics supported by collected evidence may be displayed.

---

# 42. Final Report Question Breakdown

The final report should preserve a compact breakdown of each logical question:

```text
questionId
bestScore
attempts
improved
```

This allows the UI to answer:

* which questions were difficult?
* which questions were retried?
* which questions improved?
* what was the candidate's best performance?

The report should reference the persisted question/attempt data rather than duplicate complete answer data.

---

# 43. Final Recommendations

The report should provide a small number of high-value recommendations.

Example:

```text
TOP IMPROVEMENT AREAS

1. Strengthen database indexing concepts.
2. Reduce filler words during technical explanations.
3. Structure project answers more clearly.
4. Practice explaining technical trade-offs.
```

Avoid generic recommendations such as:

> "Practice more."

Recommendations must be grounded in observed session performance.

---

# 44. Historical Progress

Completed final reports become the source of historical interview progress.

Example:

```text
Session 1
Overall: 71

Session 2
Overall: 77

Session 3
Overall: 83
```

No separate progress collection is required for V1.

Historical progress should be derived from persisted final reports.

This prevents duplicate sources of truth.

---

# 45. Progress Integrity

TITAN must never manufacture progress.

Progress may only be shown when supported by:

* analyzed attempts
* persisted scores
* measurable communication data
* completed reports
* actual retry comparisons

Unavailable data must remain unavailable.

---

# 46. AI Metadata

Internal AI metadata may be persisted for debugging, evaluation, and cost tracking.

Examples:

```text
provider
model
promptVersion
analysisVersion
generatedAt
latencyMs
tokenUsage
```

AI metadata is internal and must not be exposed as normal user-facing interview feedback.

The metadata should be structured so that AI providers and models can be changed without changing the user-facing data model.

---

# 47. Anti-Fabrication Rules

TITAN must never:

* invent resume experience
* claim the candidate used an unmentioned technology
* fabricate performance metrics
* fabricate audio metrics
* claim psychological states as facts
* invent improvement percentages
* claim unsupported company-specific interview patterns
* present unavailable information as measured data
* modify historical attempts to make progress appear better

Unknown data must be represented as unavailable.

---

# 48. AI Interviewer Personality

The interviewer should feel:

* professional
* conversational
* attentive
* adaptive
* challenging when appropriate
* encouraging without being artificial

It should not feel:

* robotic
* excessively cheerful
* insulting
* overly verbose
* artificially motivational

TITAN should behave more like a competent human interviewer than a chatbot.

---

# 49. Interviewer Behavior Rules

TITAN should:

* ask one primary question at a time
* listen before evaluating
* maintain conversation context
* use follow-ups naturally
* avoid repeating already answered questions
* challenge strong candidates
* support struggling candidates
* recognize measurable improvement
* maintain interview continuity
* respect the configured interview objective
* avoid unnecessarily extending the interview

---

# 50. Feedback Personality

Feedback should be:

### Honest

Do not inflate performance.

### Constructive

Explain how the candidate can improve.

### Specific

Reference the actual answer.

### Concise

Do not turn every answer into a long lecture.

### Progressive

Help the candidate improve during the interview rather than only at the end.

---

# 51. Resume Intelligence Integration

Interview Intelligence consumes Resume Intelligence output.

Primary inputs:

```text
ResumeVersion.candidateProfile
ResumeVersion.interviewContext
```

When a resume is selected, the session stores:

```text
resumeVersionId
```

The interview also stores a session-level context snapshot.

This provides:

```text
ResumeVersion
     ↓
Interview context generation
     ↓
Session snapshot
     ↓
Interview questions
```

Future resume changes therefore do not alter completed interviews.

---

# 52. Context Construction

The interview engine should construct a normalized context containing:

```text
candidate
targetRole
experienceLevel
company
jobDescription
resumeProfile
resumeInterviewContext
interviewFocus
difficulty
sessionGoals
```

Not every field is required for every interview mode.

The normalized context is used for question generation and evaluation.

---

# 53. Security and Ownership

All interview-related persistent entities must belong to an authenticated user.

Ownership applies to:

* sessions
* questions
* attempts
* reports
* transcripts
* recordings
* explanations
* performance data

Authorization must always be enforced server-side.

A client-provided document ID is never sufficient authorization.

Example:

```js
InterviewQuestion.findOne({
  _id: req.params.id,
  userId: req.user.id
});
```

Where ownership is inherited through a parent session, the backend must still verify the session belongs to the authenticated user.

---

# 54. Privacy

Interview data may contain sensitive personal information.

The system should:

* protect transcripts
* protect resume-derived data
* protect job descriptions
* protect audio
* avoid exposing storage references
* avoid exposing internal prompts
* avoid exposing AI metadata unnecessarily
* avoid unnecessary data retention
* support future deletion policies

Clients should receive authorized audio access mechanisms rather than raw storage paths where applicable.

---

# 55. Audio Retention

Audio retention must remain configurable.

Possible future policies:

```text
Keep audio
Delete after transcription
Delete after analysis
Delete after session completion
User-controlled deletion
```

Deleting audio must not require deletion of:

* transcript
* answer analysis
* final report

unless the user explicitly requests full data deletion.

---

# 56. Deletion Behavior

V1 should preserve historical integrity.

Deleting a session should therefore not silently cascade into permanent deletion unless explicit product behavior exists.

Future deletion may involve:

```text
Session
   ↓
Questions
   ↓
Attempts
   ↓
Audio
   ↓
Reports
```

External object storage must be included in any permanent deletion workflow.

---

# 57. Data Model Alignment

The Interview Intelligence product behavior maps to the persistence layer as follows:

```text
InterviewSession
    ↓
InterviewQuestion
    ↓
AnswerAttempt
    ↓
Transcript
    ↓
Answer Analysis
    ↓
Retry / Follow-up Decision
    ↓
Next InterviewQuestion
    ↓
FinalReport
```

Important distinction:

```text
Retry
    = new AnswerAttempt

Follow-up
    = new InterviewQuestion
```

This distinction is fundamental to V1.

---

# 58. V1 Scope

V1 includes:

* voice-based interviews
* speech-to-text
* AI-generated questions
* dynamic follow-up questions
* resume-based interviews
* role-based interviews
* company-based interviews
* JD-based interviews
* mixed interviews
* structured per-answer evaluation
* communication analysis
* filler analysis where supported
* observable confidence indicators
* retry mechanism
* retry comparison
* explanation mechanism
* adaptive difficulty
* session recovery
* final master report
* historical session progress
* structured AI metadata
* interview context snapshots

---

# 59. V1 Exclusions

The following are explicitly excluded from V1:

* facial emotion detection
* eye tracking
* biometric emotion analysis
* lie detection
* personality diagnosis
* psychological profiling
* automated hiring decisions
* guaranteed company interview prediction
* real-time emotional-state classification
* webcam analysis
* recruiter access
* multiplayer interviews
* leaderboards
* badges
* achievements
* social profiles

---

# 60. Future Extension Points

The architecture should allow future additions without breaking the V1 model:

* video interviews
* advanced speech analytics
* body-language analysis
* interviewer personas
* interview templates
* company-specific interview tracks
* long-term skill progression
* personalized learning plans
* advanced interview-history analytics

Future capabilities must extend the existing entities rather than invalidate the V1 learning loop.

---

# 61. Success Criteria

TITAN Interview Intelligence is successful when a candidate can complete an interview and understand:

1. What they know.
2. What they do not know.
3. How well they communicate.
4. Which answers were weak.
5. Why those answers were weak.
6. How to improve them.
7. Whether they actually improved.
8. What they should practice next.

The final experience should leave the candidate thinking:

> **"I know exactly where I improved and exactly what I need to work on next."**

rather than:

> "I completed another AI interview."

---

# 62. Core Product Loop

The entire Interview Intelligence module is:

```text
PERSONALIZE
     ↓
ASK
     ↓
LISTEN
     ↓
TRANSCRIBE
     ↓
UNDERSTAND
     ↓
EVALUATE
     ↓
FEEDBACK
     ↓
TEACH
     ↓
RETRY / ADAPT
     ↓
ASK BETTER QUESTION
     ↓
MEASURE PROGRESS
     ↓
MASTER REPORT
```

This loop is the foundation for the Interview Intelligence user flow, wireframes, UI specification, API specification, AI specification, and implementation plan.

---

# 63. Definition of Done

The Interview Intelligence PRD is implementation-ready when:

* [ ] Interview modes are defined.
* [ ] Interview configuration is defined.
* [ ] Resume integration is defined.
* [ ] Historical context snapshot behavior is defined.
* [ ] Voice-first interaction is defined.
* [ ] Audio processing behavior is defined.
* [ ] Transcript behavior is defined.
* [ ] Answer evaluation dimensions are defined.
* [ ] Answer quality classification is defined.
* [ ] Score rules are defined.
* [ ] Feedback behavior is defined.
* [ ] Wrong-answer behavior is defined.
* [ ] Retry behavior is defined.
* [ ] Retry vs follow-up distinction is defined.
* [ ] Adaptive question behavior is defined.
* [ ] Difficulty adaptation is defined.
* [ ] Explanation behavior is defined.
* [ ] Session recovery is defined.
* [ ] Processing failure behavior is defined.
* [ ] Session completion behavior is defined.
* [ ] Abandoned session behavior is defined.
* [ ] Final report behavior is defined.
* [ ] Historical progress behavior is defined.
* [ ] Anti-fabrication rules are defined.
* [ ] Security and ownership rules are defined.
* [ ] Privacy and audio retention behavior are defined.
* [ ] V1 exclusions are defined.
* [ ] Future extension points are defined.
* [ ] Product behavior is aligned with the Interview Data Model.

---

# 64. Core Product Principle

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
What TITAN explained
      ↓
How the candidate retried
      ↓
Whether the candidate improved
      ↓
How the candidate performed overall
      ↓
What the candidate should practice next
```

The product therefore represents **progress, not merely answers**.

That is what makes TITAN an interview improvement system rather than another AI question-generation platform.

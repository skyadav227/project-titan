# TITAN — Interview User Flow

**Document:** `interview-userflow.md`
**Product:** TITAN
**Module:** Interview Intelligence
**Version:** V1.1
**Status:** Product Definition

---

# 1. Purpose

This document defines the complete user journey through TITAN Interview Intelligence.

It describes:

* how an interview is configured
* how interview context is collected and validated
* how the interview starts
* how questions are generated
* how voice interaction works
* how answers are processed
* how answers are analyzed
* how feedback is presented
* how clarification, retry, and explanation flows work
* how follow-up questions are generated
* how difficulty adapts
* how topics transition
* how session state is persisted and recovered
* how an interview ends
* how the Final Master Report is generated
* how interview history is updated

This document is the **behavioral source of truth for the Interview Intelligence user experience**.

---

# 2. Core User Journey

The primary journey is:

```text
Interview Landing
      ↓
Configure Interview
      ↓
Validate Configuration
      ↓
Review Configuration
      ↓
Microphone / Audio Check
      ↓
Interview Ready
      ↓
Question
      ↓
Listen
      ↓
Speak
      ↓
Answer Processing
      ↓
Answer Evaluation
      ↓
Feedback
      ↓
Decision
  ┌───┼───────────┬────────────┬────────────┐
  ↓   ↓           ↓            ↓            ↓
Retry Explain  Follow-up   Clarify     Continue
  ↓   ↓           ↓            ↓            ↓
Question        Question    Question   Next Question
  └───┴───────────┴────────────┴────────────┘
                       ↓
                 Adaptive Engine
                       ↓
                Next Question
                       ↓
                      ...
                       ↓
               Interview Complete
                       ↓
              Final Evaluation
                       ↓
              Master Report
                       ↓
              Interview History
```

---

# 3. Entry Points

The user may enter Interview Intelligence from:

* Dashboard
* Interview navigation item
* Resume page
* Interview history
* CTA after completing Resume Intelligence
* Future contextual CTAs from other TITAN modules

The system should preserve relevant context where possible.

Example:

If the user has an active resume and selects:

> Practice Interview

the interview configuration should automatically recognize that the active resume is available.

The system must still allow the user to remove or change the selected context before starting.

---

# 4. Interview Landing

The landing screen should immediately communicate that TITAN provides:

* live AI interviewing
* voice-based interaction
* adaptive questioning
* answer analysis
* actionable feedback
* retry and learning opportunities

Primary CTA:

> **Start Interview**

Secondary actions:

> Configure Interview

> View Previous Interviews

If the user has recently completed an interview, the landing page may also surface the latest session.

---

# 5. Configuration Flow

The user configures the interview before the session begins.

The configuration process should collect enough information for TITAN to construct a normalized `interviewContext`.

The configuration should support:

* Company
* Role
* Job Description
* Resume
* Mixed context
* Experience level
* Interview focus
* Difficulty
* Duration
* Session objective where applicable

---

# 6. Interview Source Selection

The user can choose the context used to personalize the interview.

Available sources:

```text
○ Company
○ Role
○ Job Description
○ Resume
○ Mixed
```

The system must clearly communicate which sources will influence question generation.

The selected sources should be displayed before the interview begins.

Example:

```text
Interview Context

✓ Resume
✓ Full Stack Developer
✓ Job Description
✓ Target Company
```

---

# 7. Company Mode

If Company is selected:

```text
Select Company
      ↓
Search / Enter Company
      ↓
Confirm Company
      ↓
Company Context Available
```

TITAN may use trusted/current information where available.

If reliable company-specific information is unavailable, TITAN must not imply that it knows proprietary interview practices.

The UI should distinguish between:

```text
Company Context
```

and:

```text
Verified Company Interview Pattern
```

The latter should only be presented when supported by reliable data.

---

# 8. Role Mode

If Role is selected:

```text
Select / Enter Role
        ↓
Confirm Role
        ↓
Role Context Available
```

Examples:

* Full Stack Developer
* Software Engineer
* Frontend Developer
* Backend Developer
* Data Analyst

Role context should influence:

* technical topics
* expected competencies
* question difficulty
* interview focus
* question distribution

---

# 9. Job Description Mode

If Job Description is selected:

```text
Paste JD
   OR
Upload JD
      ↓
Parse JD
      ↓
Extract Relevant Information
      ↓
Review Extracted Context
      ↓
Confirm
```

Relevant extracted information may include:

* skills
* technologies
* responsibilities
* requirements
* experience expectations
* domain knowledge

The user must be able to correct or remove extracted information before starting.

If extraction fails:

```text
We couldn't extract enough information from this job description.
```

Options:

> Edit Job Description

> Continue With Available Context

> Cancel

TITAN must not invent missing job-description information.

---

# 10. Resume Mode

If Resume is selected, TITAN checks for an active resume.

## 10.1 Active Resume Exists

```text
Active Resume
      ↓
Display Resume
      ↓
Use Resume Intelligence Context
```

The system should use:

```text
ResumeVersion.candidateProfile
ResumeVersion.interviewContext
```

by default.

The user may explicitly select another supported resume version where available.

---

## 10.2 No Active Resume

Show:

> You need an active resume to use Resume Interview mode.

CTA:

> Upload Resume

After upload and successful processing:

```text
Resume Upload
      ↓
Resume Intelligence
      ↓
Context Generated
      ↓
Return to Interview Configuration
```

If resume processing fails, the user must be informed and should not be given fabricated resume context.

---

# 11. Mixed Mode

Mixed mode allows multiple sources to influence the interview.

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

The system combines the available information into a normalized interview context.

Example:

```text
INTERVIEW CONTEXT

Role
Full Stack Developer

Experience
Fresher

Sources
✓ Resume
✓ Job Description
✓ Company
✓ Role
```

The user must be able to review the selected sources before starting.

---

# 12. Context Precedence

When multiple sources contain conflicting information, TITAN must apply deterministic precedence.

User-provided configuration should take precedence over inferred information.

Example:

```text
User-selected Experience Level
        ↓
Resume-inferred Experience Level
```

Similarly:

```text
Explicit User Configuration
        ↓
Extracted Context
        ↓
Inferred Context
```

TITAN must not silently overwrite explicit user selections with inferred resume information.

---

# 13. Experience Level

Available options:

```text
Fresher
Junior
Mid-level
Senior
```

If Resume Intelligence contains a reliable experience level, TITAN may prefill it.

The user must be able to change it.

User selection always takes precedence.

---

# 14. Interview Focus

Available focus options:

```text
Technical
Behavioral
System Design
Project Discussion
HR
Mixed
```

The selected focus controls question distribution.

For example:

```text
Technical
→ technical knowledge
→ problem solving
→ implementation concepts

Behavioral
→ teamwork
→ conflict
→ leadership
→ decision making

Project Discussion
→ architecture
→ implementation
→ challenges
→ trade-offs
→ decisions
```

---

# 15. Difficulty

Available difficulty:

```text
Adaptive
Easy
Medium
Hard
```

Default:

> Adaptive

If Adaptive is selected:

```text
Candidate Performance
        ↓
Performance State
        ↓
Difficulty Adjustment
        ↓
Next Question
```

Difficulty should increase or decrease gradually.

A single weak answer should not cause an extreme difficulty reduction.

A single strong answer should not cause an extreme difficulty increase.

---

# 16. Interview Duration

Available target durations may include:

```text
10 minutes
20 minutes
30 minutes
45 minutes
60 minutes
```

Duration is treated as a **session target**, not an absolute guarantee.

TITAN should also consider:

* current question state
* answer processing
* follow-ups
* retries
* topic coverage
* whether sufficient evaluation has been achieved

The system should never abruptly terminate while the candidate is actively answering.

---

# 17. Session Objective

Where applicable, the user may define an interview objective.

Examples:

* General interview practice
* Prepare for a specific role
* Practice technical communication
* Improve behavioral answers
* Practice project explanations
* Identify technical knowledge gaps

The objective becomes part of the session context and can influence question selection and final recommendations.

---

# 18. Configuration Validation

Before starting, TITAN validates the configuration.

Examples:

### Missing context

```text
Please select at least one interview source.
```

### Resume selected without active resume

```text
An active resume is required for resume-based interviews.
```

### Job Description selected without content

```text
Please provide a job description.
```

### Role-dependent configuration missing

```text
Please select a target role before continuing.
```

The user cannot start until required configuration is valid.

---

# 19. Configuration Review

Before starting, show a concise summary:

```text
INTERVIEW CONFIGURATION

Role
Full Stack Developer

Experience
Fresher

Focus
Technical + Behavioral

Sources
✓ Resume
✓ Job Description

Difficulty
Adaptive

Duration
30 minutes
```

Primary CTA:

> **Start Interview**

Secondary:

> Edit Configuration

---

# 20. Microphone Permission

Before the first question, TITAN checks microphone availability.

## Permission Granted

Continue to audio check / ready state.

## Permission Denied

Show:

> TITAN needs microphone access to conduct your voice interview.

CTA:

> Enable Microphone

The user cannot conduct a voice interview without microphone access.

---

# 21. Audio Device Check

Where technically supported, TITAN performs a lightweight microphone check.

Example:

```text
MICROPHONE

● Detected

Speak a few words to test your microphone.
```

Then:

> Continue

The setup should remain lightweight.

---

# 22. Interview Ready State

Before the first question:

```text
YOU'RE READY

Your interview will:

• adapt to your answers
• evaluate your responses
• provide feedback
• adjust difficulty
• allow retries when useful

Take a breath and answer naturally.
```

CTA:

> **Begin Interview**

---

# 23. Question Lifecycle

Each question follows:

```text
QUESTION GENERATION
        ↓
QUESTION READY
        ↓
QUESTION ASKING
        ↓
LISTENING
        ↓
ANSWER CAPTURED
        ↓
ANSWER PROCESSING
        ↓
ANSWER EVALUATION
        ↓
FEEDBACK
        ↓
NEXT ACTION
```

---

# 24. Question Generation

The question engine generates the next question using the current interview state.

Inputs may include:

* interview context
* candidate profile
* previous answers
* performance
* strengths
* weaknesses
* topics covered
* topics remaining
* difficulty
* retry history
* interview focus
* session objective
* time remaining

The question should be generated from the current state rather than selected randomly.

---

# 25. Question Presentation

The question appears on screen.

The AI interviewer may speak the question using text-to-speech.

Example:

> "Tell me about a project where you had to solve a difficult technical problem."

The interface should clearly indicate that the interviewer is speaking.

---

# 26. Asking State

During AI speech:

```text
AI INTERVIEWER

Speaking...
```

The candidate should not accidentally submit an answer while the interviewer is speaking.

If interruption is supported, the system must explicitly define how interrupted questions are handled.

An interrupted question should not automatically be treated as a candidate answer.

---

# 27. Listening State

Once the question has finished:

```text
YOUR TURN

● Listening
```

The system begins capturing candidate audio.

The candidate speaks naturally.

---

# 28. Candidate Answer

The primary interaction is:

```text
Question
   ↓
Speak
   ↓
Finish
```

Answer completion may occur through:

* manual stop
* silence detection
* maximum answer duration

A visible manual stop control must always be available.

---

# 29. Recording State

The UI should clearly communicate that audio is being captured.

Example:

```text
● Recording

00:42
```

The user must always know when their microphone is actively being captured.

---

# 30. Answer Processing

After the candidate stops speaking:

```text
Audio
  ↓
Speech-to-Text
  ↓
Transcript
  ↓
Speech Analysis
  ↓
Answer Evaluation
  ↓
Performance State Update
```

UI:

```text
Analyzing your answer...
```

The system must not display fabricated progress percentages.

---

# 31. Processing Failure

If speech processing fails:

```text
We couldn't process your answer.
```

Options:

> Try Again

> End Interview

The failed/unprocessed answer must **not** be classified as a poor answer.

The session should preserve the current question where possible.

---

# 32. Transcript Availability

After successful processing, the candidate may view the transcript.

Example:

```text
YOUR ANSWER

"I used JWT authentication because..."
```

The transcript must represent the actual spoken response.

If transcription quality is low:

```text
Transcription quality was low.
Some analysis may be unavailable.
```

TITAN must not treat uncertain transcription as confirmed candidate content.

---

# 33. Answer Evaluation

The evaluation engine determines which dimensions apply to the current question.

Possible dimensions:

* technical correctness
* relevance
* completeness
* reasoning
* communication
* technical vocabulary
* answer structure

Not every question requires every dimension.

Unavailable or unreliable metrics must be omitted or explicitly marked unavailable.

---

# 34. Feedback State

After successful evaluation, TITAN enters Feedback.

Example:

```text
ANSWER REVIEW

Overall
Mostly Correct

What you did well
• Correctly explained JWT authentication.
• Clearly described token-based authentication.

Improve
• You did not explain token expiration.
• The explanation became repetitive.

Communication
• 3 filler words
• One long hesitation
• Generally clear delivery

Better approach
Explain the flow in this order:
1. Login
2. Token generation
3. Client storage
4. Authorization
5. Expiration / refresh
```

Only relevant sections should be displayed.

---

# 35. Technical Answer Feedback

For technical questions:

```text
TECHNICAL ACCURACY

82%

Correct
✓ Authentication flow
✓ Token validation

Missing
• Token expiration

Correction
...
```

Numerical scores should only be displayed when sufficiently reliable.

Otherwise:

```text
Technical Accuracy
Mostly Correct
```

---

# 36. Communication Feedback

Where reliable speech analysis is available:

```text
COMMUNICATION

Clarity
Good

Structure
Needs improvement

Filler words
5

Pace
Slightly fast

Hesitation
Moderate
```

If a metric is unavailable, TITAN should not estimate it.

Example:

```text
Speaking pace
Unavailable
```

---

# 37. Observable Confidence Indicators

TITAN must not present psychological confidence as a measured fact.

Instead, it may surface observable indicators:

* hesitation
* long pauses
* filler usage
* repeated self-correction
* uncertain language
* rushed delivery
* low measurable volume where technically reliable

Example:

```text
OBSERVABLE DELIVERY INDICATORS

Frequent hesitation markers
Several self-corrections
Fast speaking pace
```

It should not say:

> You have low confidence.

---

# 38. Wrong Answer Flow

If the answer is incorrect:

```text
Your answer needs correction.

What was wrong
...

Why
...

Correct concept
...

How to remember it
...
```

Then:

> **Would you like to try this question again?**

Options:

> Try Again

> Continue

The system should teach the candidate rather than simply reveal the answer and immediately move on.

---

# 39. Partially Correct Answer

If partially correct:

```text
You're on the right track.

You correctly identified:
...

You missed:
...

To make this answer stronger:
...
```

Retry should be offered when meaningful.

---

# 40. Communication-Only Weakness

If the technical answer is correct but communication is weak:

```text
Your technical answer was correct.

Communication improvement:

• The main point appeared late.
• Several phrases were repeated.

Try:

Start with the direct answer,
then explain the reasoning.
```

Technical correctness and communication quality must remain separate.

---

# 41. Clarification Flow

TITAN may ask a clarification question when the candidate's answer is ambiguous, incomplete, or unclear.

Flow:

```text
Candidate Answer
      ↓
Ambiguity Detected
      ↓
CLARIFY
      ↓
Clarification Question
      ↓
Candidate Responds
      ↓
Evaluation Continues
```

Example:

Candidate:

> "I used Redis to make it faster."

TITAN:

> "What specifically were you caching with Redis, and how did that improve performance?"

Clarification should not be used unnecessarily.

---

# 42. Retry Flow

When the user selects:

> Try Again

the same question is presented again.

TITAN should provide a concise improvement target without revealing the complete answer.

Example:

> "Try to explain the authentication flow in a clear sequence and include token expiration."

Then:

```text
Question
   ↓
New Answer
   ↓
New Evaluation
   ↓
Compare Attempts
```

---

# 43. Retry Comparison

After the retry:

```text
RETRY REVIEW

Previous Attempt
...

New Attempt
...

Improved
✓ Structure
✓ Completeness
✓ Clarity

Still Improve
• Token expiration
```

If reliable numerical metrics exist:

```text
Overall
68 → 82
```

Otherwise:

```text
Overall
Improved
```

Improvement percentages must never be fabricated.

---

# 44. Learning Loop

Retry participates in the central learning loop:

```text
Answer
  ↓
Feedback
  ↓
Understand Weakness
  ↓
Improve
  ↓
Retry
  ↓
Compare
  ↓
Continue
```

The retry result becomes part of the session performance state.

---

# 45. Explanation Offer

If TITAN detects a meaningful knowledge gap, it may offer:

> **Would you like me to explain this concept before continuing?**

This should not appear after every mistake.

It should only appear when explanation is likely to help.

Options:

> Explain

> Continue

---

# 46. Explanation Flow

```text
Feedback
   ↓
Explanation Offer
   ↓
User Selects Explain
   ↓
Concise Explanation
   ↓
Example Where Useful
   ↓
Check Understanding
   ↓
Retry / Continue
```

The explanation should match the candidate's experience level.

It should not become an unrelated tutorial.

---

# 47. Follow-Up Flow

A strong or interesting answer may trigger a deeper follow-up.

```text
Candidate Answer
      ↓
Relevant Detail Detected
      ↓
Follow-Up Generated
      ↓
Follow-Up Asked
      ↓
Answer Evaluated
```

Example:

Candidate:

> "I solved the performance issue using Redis."

TITAN:

> "Why did you choose Redis for that part of the system?"

Follow-ups should be grounded in what the candidate actually said.

---

# 48. Strong Answer Flow

A strong answer may cause the system to increase challenge gradually.

```text
Strong Answer
      ↓
Performance State Updated
      ↓
Difficulty May Increase
      ↓
Deeper Question
```

The difficulty increase should consider the candidate's broader performance rather than a single answer alone.

---

# 49. Weak Answer Flow

A weak answer may cause:

```text
Weak Answer
      ↓
Feedback
      ↓
Retry / Explanation / Clarification
      ↓
Simpler Clarification
OR
Topic Transition
```

TITAN should avoid repeatedly attacking the same weakness.

---

# 50. Adaptive Decision Engine

After feedback, TITAN determines the next action.

Possible internal actions:

```text
RETRY
EXPLAIN
FOLLOW_UP
CLARIFY
NEXT_QUESTION
END_INTERVIEW
```

The user should not see the internal action classification.

The engine should consider:

* answer quality
* repeated weaknesses
* topic coverage
* difficulty
* retry history
* time remaining
* session objective
* interview focus
* candidate experience level

---

# 51. Topic Coverage

The interview engine maintains an internal understanding of:

```text
Topics Covered
Topics Remaining
Strengths
Weaknesses
Repeated Weaknesses
Unexplored Areas
```

This prevents unnecessary repetition.

The system should revisit important weak areas strategically rather than repeatedly asking identical questions.

---

# 52. Topic Transition

TITAN should transition naturally between topics.

Example:

```text
Authentication
      ↓
Database
      ↓
API Design
      ↓
Project Discussion
      ↓
Behavioral
```

Transitions should consider:

* interview focus
* role
* job description
* previous answers
* topic coverage
* candidate performance

The user should not feel like they are completing unrelated question categories.

---

# 53. Session Progress

The interface should provide lightweight progress information.

Examples:

```text
Question 6
```

or:

```text
Interview Progress
████████░░
```

Progress indicators should not become competitive gamification.

Their purpose is simply to communicate session progress.

---

# 54. Interview State Persistence

The interview session should maintain its current state.

Important state includes:

```text
Session
Current Question
Question History
Candidate Answers
Transcripts
Evaluations
Feedback
Retries
Explanations
Topic Coverage
Performance State
Difficulty
Current Action
Session Status
```

Already processed answers should not be lost because the browser refreshes.

---

# 55. Session Recovery

If the browser refreshes during an active interview, TITAN should attempt recovery.

Possible session states:

```text
ACTIVE
PROCESSING
FEEDBACK
COMPLETED
ABANDONED
```

The system should restore the latest confirmed state where technically possible.

Example:

```text
Interview Recovery

Your previous interview session was interrupted.

Resume Interview
Discard Session
```

---

# 56. Network Failure

If connectivity is lost:

```text
Connection interrupted.

We're trying to reconnect...
```

The system should preserve locally available state where possible.

After reconnection:

```text
Reconnect
   ↓
Validate Latest Session State
   ↓
Resume From Latest Confirmed State
```

The system must avoid duplicating answers or questions after recovery.

---

# 57. Microphone Failure During Interview

If microphone access is lost:

```text
MICROPHONE UNAVAILABLE

Check your microphone permissions
or device connection.
```

Options:

> Retry Microphone

> End Interview

The current question must not automatically be marked incorrect.

---

# 58. User Leaves Interview

If the user attempts to navigate away:

```text
Your interview is still in progress.

Leave anyway?
```

Options:

> Stay

> Leave

If the user leaves, the backend session should preserve the latest confirmed state and classify the session according to its recovery rules.

---

# 59. Ending Interview Early

The candidate may select:

> End Interview

Confirmation:

```text
END INTERVIEW?

Your completed answers will still be
included in your performance report.
```

Options:

> Continue Interview

> End Interview

Already processed answers remain part of the session.

---

# 60. Natural Completion

The interview may conclude when:

* target duration is reached
* sufficient questions have been completed
* required areas have been sufficiently evaluated
* session objectives have been adequately covered

The system should not abruptly terminate while the candidate is answering.

If the current answer is still being processed when the duration target is reached, TITAN should complete the current processing step before finalizing the session where possible.

---

# 61. Interview Completion Transition

```text
Final Question
      ↓
Final Answer
      ↓
Final Evaluation
      ↓
Close Session
      ↓
Aggregate Performance
      ↓
Generate Master Report
      ↓
Interview Complete
```

---

# 62. Master Report Generation

After the interview session closes, TITAN aggregates the observed session data.

The report must use actual collected information.

It should not manufacture:

* scores
* improvement percentages
* audio metrics
* confidence measurements
* achievements
* strengths
* weaknesses

Unavailable metrics should be omitted or marked unavailable.

---

# 63. Master Report Entry

After generation:

```text
INTERVIEW COMPLETE

Your performance report is ready.
```

Primary CTA:

> **View Master Report**

Secondary:

> Return to Dashboard

---

# 64. Master Report Structure

The report should contain:

```text
Overall Performance
        ↓
Technical Performance
        ↓
Communication
        ↓
Answer Quality
        ↓
Strengths
        ↓
Weaknesses
        ↓
Session Improvement
        ↓
Recommended Practice
```

---

# 65. Overall Performance

Where sufficient data exists:

```text
OVERALL PERFORMANCE

Overall Score
82

Technical
84

Communication
78

Reasoning
81

Consistency
80
```

Only applicable dimensions should be displayed.

---

# 66. Technical Performance

The report may include:

* strongest technical topics
* weakest technical topics
* accuracy
* knowledge gaps
* recurring misconceptions
* demonstrated strengths

Example:

```text
TECHNICAL PERFORMANCE

Strong
✓ REST APIs
✓ Authentication

Needs Practice
• Database indexing
• Caching strategies
```

---

# 67. Communication Performance

Where reliable data exists:

```text
COMMUNICATION

Clarity
Good

Structure
Needs Improvement

Filler Frequency
Improved

Speaking Pace
Slightly Fast
```

Psychological confidence must not be presented as a measured result.

---

# 68. Answer Performance

The report may summarize:

```text
ANSWER PERFORMANCE

Strong Answers
8

Mostly Correct
5

Partially Correct
3

Weak / Incorrect
2

Retried Answers
4
```

Counts must come from actual session data.

---

# 69. Session Improvement

Where enough data exists:

```text
SESSION PROGRESS

Beginning → End

Technical Accuracy
62 → 81

Answer Structure
55 → 78

Communication
68 → 82

Filler Frequency
9 → 4
```

If insufficient data exists, TITAN should explain that session-level comparison was unavailable rather than inventing progress.

---

# 70. Strength Summary

Example:

```text
TOP STRENGTHS

1. REST API knowledge
2. Project explanation
3. Authentication concepts
```

Strengths must be derived from observed performance.

---

# 71. Weakness Summary

Example:

```text
TOP WEAKNESSES

1. Database indexing
2. Explaining trade-offs
3. Answer structure
```

Weaknesses must be supported by actual answers and evaluation results.

---

# 72. Recommended Practice

Recommendations should directly connect to observed weaknesses.

Example:

```text
NEXT PRACTICE

• Practice explaining database indexing.
• Practice concise technical explanations.
• Practice explaining architecture trade-offs.
• Retry behavioral questions using a structured format.
```

Avoid generic recommendations such as:

> Practice more.

---

# 73. Interview History

After completion, the session becomes available in Interview History.

The history entry should contain:

* interview date
* target role
* interview type
* duration
* completion status
* overall performance where available

Selecting a session opens its Master Report.

---

# 74. Historical Session Integrity

Past interview reports should represent the state of the interview when it was completed.

Changing the user's current:

* resume
* role
* profile
* skills
* preferences

must not silently rewrite historical interview results.

Historical sessions should retain their relevant interview context and evaluation data.

---

# 75. Failure States

Important failure states include:

```text
CONFIGURATION_ERROR
MICROPHONE_ERROR
AUDIO_CAPTURE_ERROR
TRANSCRIPTION_ERROR
ANALYSIS_ERROR
QUESTION_GENERATION_ERROR
NETWORK_ERROR
SESSION_RECOVERY_ERROR
REPORT_GENERATION_ERROR
```

Each failure must have a user-safe recovery path.

---

# 76. Question Generation Failure

If a question cannot be generated:

```text
We couldn't prepare the next question.
```

Options:

> Try Again

> Continue With Another Question

> End Interview

The candidate's previous successful answers must remain preserved.

---

# 77. Analysis Failure

If answer analysis fails:

```text
We couldn't fully analyze this answer.

Your response has been preserved.
Some feedback may be unavailable.
```

The answer must not automatically receive a poor score.

The system may continue with limited evaluation if sufficient information is available.

---

# 78. Report Generation Failure

If the final report cannot be generated immediately:

```text
Your interview is complete.

We're still preparing your performance report.
```

The completed session should be preserved.

The user may return to the report later.

---

# 79. Core User-Facing State Machine

The complete state machine is:

```text
CONFIGURATION
      ↓
VALIDATION
      ↓
READY
      ↓
QUESTION_GENERATION
      ↓
QUESTION_ASKING
      ↓
LISTENING
      ↓
ANSWER_PROCESSING
      ↓
ANSWER_EVALUATION
      ↓
FEEDBACK
      ↓
  ┌────┼───────────┬───────────┬───────────┐
  ↓    ↓           ↓           ↓           ↓
RETRY EXPLAIN   FOLLOW_UP   CLARIFY   NEXT_QUESTION
  ↓    ↓           ↓           ↓           ↓
  └────┴───────────┴───────────┴───────────┘
                    ↓
              ADAPTIVE ENGINE
                    ↓
              NEXT QUESTION
                    ↓
                   ...
                    ↓
          INTERVIEW_COMPLETE
                    ↓
            FINAL_EVALUATION
                    ↓
            MASTER_REPORT
                    ↓
          INTERVIEW_HISTORY
```

---

# 80. Failure-State Recovery Model

Failures should follow:

```text
Failure
   ↓
Explain What Happened
   ↓
Preserve Confirmed State
   ↓
Offer Recovery
   ↓
Retry / Resume / Exit
```

The user should never lose a successfully processed answer merely because a later operation failed.

---

# 81. Important UX Principle

The user should never wonder:

> "What is TITAN doing?"

At every moment the UI should clearly communicate whether TITAN is:

* speaking
* listening
* recording
* processing
* transcribing
* analyzing
* giving feedback
* explaining
* preparing the next question
* waiting for the user's decision
* recovering a session

---

# 82. Important Interaction Principle

The candidate should always feel that their previous answer matters.

The next question should reflect, where appropriate:

* what they said
* how well they answered
* what they struggled with
* what they demonstrated
* what remains unexplored
* their interview objective

This is the core distinction between TITAN and a static question generator.

---

# 83. Anti-Fabrication UX Principle

If TITAN does not know something, it should communicate the limitation rather than guessing.

Examples:

```text
Audio analysis unavailable.

Company-specific interview pattern unavailable.

Insufficient data for session improvement comparison.

Transcription quality too low for reliable analysis.
```

The product should prefer:

> Unknown / Unavailable

over:

> Fabricated certainty.

---

# 84. Privacy and Data Behavior

Interview audio, transcripts, answers, and reports may contain sensitive information.

The user experience should provide appropriate behavior for:

* session ownership
* data isolation
* audio retention
* transcript retention
* session deletion
* report deletion
* abandoned session handling

The user should never see internal prompts, credentials, or system implementation details.

---

# 85. Core Learning Loop

The complete candidate learning loop is:

```text
QUESTION
   ↓
ANSWER
   ↓
ANALYSIS
   ↓
FEEDBACK
   ↓
UNDERSTAND
   ↓
RETRY / EXPLAIN
   ↓
IMPROVE
   ↓
COMPARE
   ↓
ADAPT
   ↓
BETTER QUESTION
   ↓
BETTER ANSWER
```

---

# 86. Final UX Goal

The user should finish an interview with three clear answers:

### What am I good at?

Their demonstrated strengths.

### What am I weak at?

Their actual knowledge and communication gaps.

### What should I do next?

Specific practice actions based on observed performance.

The experience should make the candidate feel:

> **"I became better during this interview."**

Not merely:

> **"I completed an interview."**

---

# 87. Document Alignment

This User Flow must remain aligned with the Interview Intelligence PRD.

The PRD defines **what Interview Intelligence must do**.

This document defines **how the user experiences those behaviors**.

The next specifications should derive from these two documents:

```text
Interview Intelligence PRD
          ↓
Interview User Flow
          ↓
Interview UI Specification
          ↓
Interview Data Model
          ↓
Interview API Specification
          ↓
Backend / AI Architecture
          ↓
Implementation
```

The User Flow should be updated whenever a behavioral requirement is added or removed from the Interview Intelligence PRD.

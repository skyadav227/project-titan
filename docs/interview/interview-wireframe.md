# TITAN — Interview Wireframe

**Document:** `interview-wireframe.md`
**Module:** Interview Intelligence
**Status:** Planning
**Version:** V1
**Last Updated:** 2026-08-14

---

## 1. Purpose

This document defines the structural wireframe for TITAN's Interview Intelligence experience.

It describes:

* screen hierarchy
* layout structure
* component placement
* user interaction zones
* interview state transitions
* voice interaction states
* feedback presentation
* retry and explanation flows
* adaptive interview behavior
* session completion
* master performance reporting
* error and recovery states
* accessibility and responsive behavior

This document intentionally avoids final visual styling, colors, typography, animations, and implementation details.

Those belong in:

* `interview-ui-spec.md`
* `interview-architecture.md`
* `interview-backend-spec.md`

The **Interview User Flow** defines the behavioral journey.

This document defines how that journey is structurally represented in the interface.

---

# 2. Core UX Principle

TITAN should not feel like:

> Question → Answer → Question → Answer

It should feel like:

> **Interviewer → Candidate → Analysis → Coaching → Improvement → Adaptive Interviewer**

Every answer should create useful feedback.

The system should continuously understand:

* what the candidate knows
* what they don't know
* how clearly they communicate
* observable confidence indicators
* where they struggle
* what concepts need reinforcement
* whether they are improving

The interview therefore behaves as an adaptive conversation rather than a fixed question list.

---

# 3. Core Product Loop

The primary TITAN interaction is:

```text
QUESTION
    ↓
VOICE ANSWER
    ↓
ANSWER PROCESSING
    ↓
FEEDBACK
    ↓
UNDERSTAND
    ↓
RETRY / CONTINUE
    ↓
ADAPTIVE ENGINE
    ↓
BETTER QUESTION
    ↓
REPEAT
    ↓
MASTER REPORT
```

The candidate should be able to see how their performance changes during the interview.

---

# 4. Core State Model

The UI state model and intelligence decision model must remain separate.

## 4.1 User-facing UI states

```text
SETUP
   ↓
CONFIGURATION_REVIEW
   ↓
READINESS
   ↓
INTERVIEW_READY
   ↓
QUESTION_GENERATING
   ↓
INTERVIEWER_SPEAKING
   ↓
LISTENING
   ↓
ANSWER_RECORDING
   ↓
ANSWER_PROCESSING
   ↓
FEEDBACK
   ↓
RETRY / EXPLANATION / NEXT_QUESTION
   ↓
INTERVIEW_COMPLETE
   ↓
REPORT_GENERATING
   ↓
MASTER_REPORT
```

Additional UI states:

```text
PAUSED
MICROPHONE_ERROR
NETWORK_ERROR
TRANSCRIPTION_ERROR
ANALYSIS_ERROR
QUESTION_GENERATION_ERROR
SESSION_RECOVERY_ERROR
```

## 4.2 Intelligence decisions

The adaptive engine may internally determine:

```text
RETRY
EXPLAIN
FOLLOW_UP
INCREASE_DIFFICULTY
DECREASE_DIFFICULTY
CHANGE_TOPIC
NEXT_QUESTION
END_INTERVIEW
```

These are **not necessarily screens**.

For example:

```text
AI Decision
FOLLOW_UP
      ↓
UI
INTERVIEWER_SPEAKING
```

This distinction prevents UI state and backend intelligence state from becoming incorrectly coupled.

---

# 5. Screen Map

```text
Interview Entry
      │
      ▼
Interview Setup
      │
      ▼
Configuration Review
      │
      ▼
Pre-Interview Readiness
      │
      ▼
Interview Ready
      │
      ▼
Live Interview
      │
      ├───────────────┐
      │               │
      ▼               ▼
Answer Processing   Session Pause
      │
      ▼
Feedback
      │
      ├───────────────┐
      │               │
      ▼               ▼
Retry            Explanation
      │               │
      ▼               ▼
Re-analysis     Understanding
      │               │
      └───────┬───────┘
              │
              ▼
       Adaptive Engine
              │
       ┌──────┼──────────┐
       │      │          │
       ▼      ▼          ▼
   Follow-up Next      End
       │    Question
       │      │
       └──┬───┘
          ▼
      Live Interview
          │
          ▼
   Interview Complete
          │
          ▼
    Report Generation
          │
          ▼
     Master Report
          │
          ▼
    Interview History
```

---

# 6. Screen 1 — Interview Setup

## Purpose

Allow the candidate to define what type of interview they want.

The setup screen determines the initial interview context.

---

## Wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ ← Back                                      Start Interview  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                  Prepare for your interview                  │
│                                                              │
│       Choose what you want TITAN to interview you on.        │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐                     │
│  │ Company        │  │ Role           │                     │
│  │ Based          │  │ Based          │                     │
│  └────────────────┘  └────────────────┘                     │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐                     │
│  │ Job            │  │ Resume         │                     │
│  │ Description    │  │ Based          │                     │
│  └────────────────┘  └────────────────┘                     │
│                                                              │
│             ┌────────────────────────┐                       │
│             │          Mixed         │                       │
│             └────────────────────────┘                       │
│                                                              │
│  Experience Level                                             │
│  ○ Fresher  ○ Junior  ○ Mid-level  ○ Senior                 │
│                                                              │
│  Interview Focus                                               │
│  ○ Technical                                                   │
│  ○ Behavioral                                                  │
│  ○ System Design                                               │
│  ○ Project Discussion                                          │
│  ○ HR                                                          │
│  ○ Mixed                                                       │
│                                                              │
│  Difficulty                                                    │
│  ○ Adaptive  ○ Easy  ○ Medium  ○ Hard                        │
│                                                              │
│  Duration                                                      │
│  ○ 10 min  ○ 20 min  ○ 30 min  ○ 45 min  ○ 60 min           │
│                                                              │
│                         [ Continue ]                           │
└──────────────────────────────────────────────────────────────┘
```

The available configuration must match the Interview User Flow exactly.

---

# 7. Interview Source Selection

The candidate can select one or multiple interview sources.

Supported sources:

* Company
* Role
* Job Description
* Resume
* Mixed

Mixed mode combines multiple available sources.

---

# 8. Company-Based Source

## Wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Company-Based Interview                                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Search or enter company                                       │
│                                                              │
│ [ Google                                      ]              │
│                                                              │
│ Suggested                                                     │
│ Google                                                        │
│ Microsoft                                                     │
│ Amazon                                                        │
│ TCS                                                           │
│ Infosys                                                       │
│                                                              │
│                    [ Confirm Company ]                        │
└──────────────────────────────────────────────────────────────┘
```

TITAN may use reliable public information where available.

TITAN must not imply access to proprietary interview questions, confidential interview processes, or internal company information.

Where reliable company-specific information is unavailable, TITAN must clearly fall back to general role/domain-based context.

---

# 9. Role-Based Source

## Wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Role-Based Interview                                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Select or enter target role                                  │
│                                                              │
│ [ Full Stack Developer                         ]             │
│                                                              │
│ Suggested                                                     │
│ Full Stack Developer                                          │
│ Frontend Developer                                            │
│ Backend Developer                                             │
│ Software Engineer                                             │
│ Data Analyst                                                  │
│                                                              │
│                      [ Confirm Role ]                         │
└──────────────────────────────────────────────────────────────┘
```

---

# 10. Job Description Source

The candidate may either paste or upload a job description.

## Wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Job Description                                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Paste your job description                                   │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │                                                          │ │
│ │                                                          │ │
│ │                                                          │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│                         OR                                   │
│                                                              │
│                    [ Upload JD ]                              │
│                                                              │
│                     [ Continue ]                             │
└──────────────────────────────────────────────────────────────┘
```

After parsing:

```text
┌──────────────────────────────────────────────────────────────┐
│ Review Job Description Context                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Extracted Skills                                             │
│ ✓ React                                                       │
│ ✓ Node.js                                                     │
│ ✓ MongoDB                                                     │
│                                                              │
│ Technologies                                                  │
│ ✓ REST APIs                                                   │
│                                                              │
│ Responsibilities                                              │
│ • Build web applications                                      │
│ • Maintain APIs                                               │
│                                                              │
│ Requirements                                                  │
│ • JavaScript                                                   │
│ • Full-stack development                                      │
│                                                              │
│ [ Edit Context ]                     [ Confirm ]              │
└──────────────────────────────────────────────────────────────┘
```

The candidate must be able to correct or remove extracted context.

---

# 11. Resume-Based Source

Resume interviews use the user's active Resume Intelligence context.

Potential interview areas include:

* projects
* technologies
* experience
* education
* achievements
* claims made on the resume

## Active Resume Exists

```text
┌──────────────────────────────────────────────────────────────┐
│ Resume-Based Interview                                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Active Resume                                                 │
│                                                              │
│ ✓ SHER-KARTHIKEYA-YADAV-RESUME.pdf                           │
│                                                              │
│ Resume Intelligence context available                        │
│                                                              │
│ [ Continue ]                                                  │
└──────────────────────────────────────────────────────────────┘
```

## No Active Resume

```text
┌──────────────────────────────────────────────────────────────┐
│ Resume-Based Interview                                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ No active resume found.                                      │
│                                                              │
│ Upload a resume to use Resume-based interview questions.    │
│                                                              │
│ [ Upload Resume ]                                             │
│                                                              │
│ [ Choose Another Source ]                                     │
└──────────────────────────────────────────────────────────────┘
```

---

# 12. Mixed Source

Mixed mode combines multiple context sources.

Example:

```text
Resume
+
Job Description
+
Role
+
Company
```

The system normalizes the sources into a single interview context.

## Context Review

```text
┌──────────────────────────────────────────────────────────────┐
│ Interview Context                                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ✓ Resume                                                      │
│ ✓ Full Stack Developer                                        │
│ ✓ Job Description                                             │
│ ✓ Target Company                                              │
│                                                              │
│ All selected sources will influence question generation.     │
│                                                              │
│ [ Edit Sources ]                        [ Continue ]          │
└──────────────────────────────────────────────────────────────┘
```

---

# 13. Experience Level

Supported values:

```text
Fresher
Junior
Mid-level
Senior
```

If Resume Intelligence contains a reliable experience level, TITAN may prefill it.

The candidate can always change it.

User-provided selection takes precedence over inferred information.

---

# 14. Interview Focus

Supported focus areas:

```text
Technical
Behavioral
System Design
Project Discussion
HR
Mixed
```

The selected focus influences question distribution.

Multiple focus areas may be selected where supported.

---

# 15. Difficulty

Supported values:

```text
Adaptive
Easy
Medium
Hard
```

Default:

```text
Adaptive
```

Adaptive difficulty may increase or decrease according to demonstrated performance.

---

# 16. Duration

Supported duration targets:

```text
10 minutes
20 minutes
30 minutes
45 minutes
60 minutes
```

Duration is a **target**, not a fixed number of questions.

The interview may conclude earlier or continue slightly beyond the target when sufficient evaluation requires it.

The UI must therefore avoid implying a predetermined question count.

---

# 17. Configuration Validation

Before proceeding, TITAN validates the configuration.

Examples:

```text
Please select at least one interview source.
```

```text
An active resume is required for resume-based interviews.
```

```text
Please provide a job description.
```

```text
Please select an interview focus.
```

The candidate cannot continue until required configuration is valid.

---

# 18. Screen 2 — Configuration Review

The candidate reviews the final configuration before entering readiness.

## Wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ ← Edit Configuration                         Interview Setup │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                  INTERVIEW CONFIGURATION                     │
│                                                              │
│ Role                                                         │
│ Full Stack Developer                                         │
│                                                              │
│ Experience                                                   │
│ Fresher                                                      │
│                                                              │
│ Focus                                                        │
│ Technical + Behavioral                                       │
│                                                              │
│ Sources                                                      │
│ ✓ Resume                                                     │
│ ✓ Job Description                                            │
│                                                              │
│ Difficulty                                                   │
│ Adaptive                                                     │
│                                                              │
│ Duration                                                     │
│ 30 minutes                                                   │
│                                                              │
│                                                              │
│                    [ Start Preparation ]                     │
└──────────────────────────────────────────────────────────────┘
```

---

# 19. Screen 3 — Pre-Interview Readiness

## Purpose

Prepare the candidate before voice recording begins.

## Wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ ← Interview Setup                                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                  You're almost ready                         │
│                                                              │
│ 🎙 Microphone                                                 │
│ ✓ Microphone detected                                        │
│                                                              │
│ 🎧 Audio                                                     │
│ ✓ Audio input available                                      │
│                                                              │
│ TITAN will evaluate:                                         │
│                                                              │
│ • Technical knowledge                                        │
│ • Answer quality                                              │
│ • Communication                                               │
│ • Clarity                                                    │
│ • Filler words                                               │
│ • Response structure                                         │
│ • Observable confidence indicators                           │
│ • Improvement over time                                      │
│                                                              │
│                    [ Test Microphone ]                       │
│                                                              │
│                    [ Start Interview ]                       │
└──────────────────────────────────────────────────────────────┘
```

---

# 20. Microphone Permission

If permission is unavailable:

```text
┌──────────────────────────────────────────────────────────────┐
│ Microphone Access Required                                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ TITAN needs microphone access to conduct your voice          │
│ interview.                                                   │
│                                                              │
│ Please allow microphone access in your browser settings.     │
│                                                              │
│                         [ Try Again ]                         │
└──────────────────────────────────────────────────────────────┘
```

---

# 21. Microphone Test

The microphone test should remain lightweight.

```text
┌──────────────────────────────────────────────────────────────┐
│ Microphone Test                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                         🎙                                   │
│                                                              │
│                    Speak normally                            │
│                                                              │
│                 ━━━━━━━●━━━━━━━━                              │
│                    Audio level                               │
│                                                              │
│              "Testing microphone..."                         │
│                                                              │
│                    [ Continue ]                              │
└──────────────────────────────────────────────────────────────┘
```

---

# 22. Screen 4 — Interview Ready

Before the first question:

```text
┌──────────────────────────────────────────────────────────────┐
│                    You're ready                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Your interview will:                                         │
│                                                              │
│ • Adapt to your answers                                      │
│ • Evaluate your responses                                    │
│ • Analyze communication                                      │
│ • Provide feedback                                            │
│ • Adjust difficulty                                          │
│ • Track improvement                                           │
│                                                              │
│ Take a breath and answer naturally.                          │
│                                                              │
│                    [ Begin Interview ]                       │
└──────────────────────────────────────────────────────────────┘
```

---

# 23. Screen 5 — Live Interview

This is the primary TITAN experience.

The interface should resemble a focused interview environment.

## Default Wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ TITAN Interview                              04:32           │
│ Question 4                                  ● LIVE           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                         TITAN                                 │
│                                                              │
│ "Can you explain how authentication works in the             │
│  MERN application you built?"                                │
│                                                              │
│                   ┌────────────────────┐                     │
│                   │                    │                     │
│                   │   🎙 Listening     │                     │
│                   │                    │                     │
│                   │   ● ● ● ● ●       │                     │
│                   │                    │                     │
│                   └────────────────────┘                     │
│                                                              │
│                   You're speaking...                         │
│                                                              │
│                                                              │
│ [ End Answer ]                         [ Pause Interview ]   │
├──────────────────────────────────────────────────────────────┤
│ Interview progress                         Question 4        │
│ ███████░░░░░░░░░                                             │
└──────────────────────────────────────────────────────────────┘
```

The UI must not imply that the interview contains a fixed number of questions.

---

# 24. Live Interview Zones

The live interview contains five primary zones.

## 24.1 Session Header

Contains:

* TITAN branding
* interview timer
* current question indicator
* session state
* pause/exit controls

---

## 24.2 Interviewer Question

The current question is displayed prominently.

Example:

```text
"Can you explain the difference between
authentication and authorization?"
```

The question may also be spoken using text-to-speech.

The visual question must remain available as an accessibility fallback.

---

## 24.3 Voice Interaction Area

Displays the current interaction state.

Possible states:

```text
Ready
Speaking
Listening
Recording
Processing
Paused
```

---

## 24.4 Live Transcript

Where technically supported, a live transcript may update while the candidate speaks.

Example:

```text
You are saying:

"I implemented JWT authentication..."
```

The live transcript is informational.

The final processed transcript is authoritative for evaluation.

---

## 24.5 Session Progress

Progress should communicate advancement without implying a fixed question count.

Preferred:

```text
Interview progress
████████░░░░
```

Optional supporting information:

```text
Question 4
```

Avoid displaying:

```text
Question 4 / 12
58%
```

unless the system has explicitly calculated those values from a reliable adaptive-progress model.

---

# 25. Voice Interaction States

## State A — Ready

```text
┌─────────────────────┐
│        🎙           │
│                     │
│    Start speaking   │
└─────────────────────┘
```

---

## State B — Interviewer Speaking

```text
┌─────────────────────┐
│       TITAN         │
│                     │
│    Speaking...      │
└─────────────────────┘
```

The candidate should not accidentally submit an answer while TITAN is speaking.

Interruption may be supported where technically available.

---

## State C — Listening

```text
┌─────────────────────┐
│     ● ● ● ●         │
│    ● ● ● ● ●        │
│     ● ● ● ●         │
│                     │
│     Listening...    │
└─────────────────────┘
```

---

## State D — Recording

```text
┌─────────────────────┐
│       ● REC         │
│                     │
│       00:42         │
│                     │
│    You're speaking  │
└─────────────────────┘
```

The candidate must always know when audio is being captured.

---

## State E — Processing

```text
┌─────────────────────┐
│          ◌          │
│                     │
│   Analyzing answer  │
└─────────────────────┘
```

No fake percentage should be displayed.

---

# 26. Answer Capture

The candidate should not need to type.

The primary interaction is:

```text
Question
   ↓
Speak
   ↓
Finish
```

Answer completion may be detected using:

* explicit stop action
* silence detection
* maximum answer duration

A visible manual stop control must always be available.

---

# 27. Answer Processing

After recording:

```text
Audio
 ↓
Speech-to-text
 ↓
Final transcript
 ↓
Speech analysis
 ↓
Question-answer evaluation
 ↓
Performance update
```

The UI displays:

```text
Analyzing your answer...
```

Do not show fabricated progress percentages.

---

# 28. Processing Failure

If processing fails:

```text
┌──────────────────────────────────────────────────────────────┐
│ Couldn't Process Answer                                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ We couldn't process your answer.                             │
│                                                              │
│ Your response has not been marked incorrect.                 │
│                                                              │
│ [ Try Again ]                         [ End Interview ]       │
└──────────────────────────────────────────────────────────────┘
```

Technical failure must never be treated as candidate failure.

---

# 29. Screen 6 — Answer Feedback

The feedback state is the primary coaching moment.

The processing stage should be treated as a transient system state.

Feedback is the user-facing result.

## Wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Question 4                                  Answer Feedback  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Your answer                                                  │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ "Authentication is basically checking whether the user  │ │
│ │ is allowed to access the application..."                │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ Performance                                                  │
│                                                              │
│ Knowledge          ████████░░  Good                         │
│ Relevance          █████████░  Strong                       │
│ Clarity            ██████░░░░  Needs improvement            │
│ Communication      ███████░░░  Good                         │
│                                                              │
│ Communication Insights                                        │
│ Filler words       4                                         │
│ Pace               Slightly fast                             │
│ Hesitation         Moderate                                  │
│                                                              │
│ What went well                                               │
│ ✓ Correctly identified the purpose of authentication.        │
│                                                              │
│ Improve                                                       │
│ ! Your explanation was incomplete.                           │
│                                                              │
│ Better answer direction                                       │
│ → Mention credential/token verification before access.       │
│                                                              │
│ [ Try This Question Again ]             [ Continue ]         │
└──────────────────────────────────────────────────────────────┘
```

Only relevant metrics should be displayed.

---

# 30. Feedback Structure

Every answer feedback screen should contain only useful information.

## Performance

Relevant dimensions may include:

* correctness
* relevance
* completeness
* clarity
* communication
* response structure
* observable confidence indicators

Metrics must only be displayed when sufficiently reliable.

---

## Communication

Where voice analysis is available:

* speaking pace
* excessive pauses
* filler words
* sentence clarity
* repetition
* unnecessary words
* response structure

Unavailable metrics should be omitted or explicitly marked unavailable.

---

## Knowledge

The system may classify the response as:

* correct
* mostly correct
* partially correct
* incomplete
* incorrect
* unsupported
* uncertain

---

## What Went Well

Maximum useful highlights.

Example:

```text
✓ Correctly explained JWT's role.
✓ Used a relevant project example.
```

---

## What Needs Improvement

Example:

```text
! Your explanation did not distinguish authentication
  from authorization.
```

---

## Better Answer Direction

TITAN should explain how to improve rather than simply display a score.

Example:

```text
A stronger answer would first define authentication,
then explain identity verification, and finally
contrast it with authorization.
```

---

# 31. Wrong Answer State

```text
┌──────────────────────────────────────────────────────────────┐
│                    Needs Improvement                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Knowledge         ███░░░░░░░                                  │
│                                                              │
│ Your answer contains an important misconception.             │
│                                                              │
│ What happened                                                │
│ You described authorization as authentication.                │
│                                                              │
│ Correct concept                                               │
│ Authentication verifies who the user is.                     │
│ Authorization determines what that user can access.          │
│                                                              │
│        Would you like to try this question again?             │
│                                                              │
│ [ Yes, Try Again ]                     [ Continue ]           │
└──────────────────────────────────────────────────────────────┘
```

TITAN should never shame the candidate.

---

# 32. Partially Correct State

```text
Your answer was mostly correct.

You understood the core concept, but missed an
important detail.

Improve by mentioning:

• token validation
• expiration
• authorization
```

---

# 33. Communication Feedback

Technical correctness and communication quality must remain separate.

Example:

```text
Technical Knowledge
█████████░ Strong

Communication
██████░░░░ Needs Improvement

Observation

Your answer contained several incomplete sentences
and repeated phrases.

Instead of:

"Basically like authentication is when, you know..."

Try:

"Authentication verifies the identity of a user
before granting access to the application."
```

---

# 34. Filler Word Feedback

Filler feedback should appear only when meaningful.

```text
Communication Insight

Filler words detected: 7

Common:

"like"       — 3
"basically"  — 2
"you know"   — 2

Suggestion:

Pause briefly instead of filling silence with
repeated filler words.
```

---

# 35. Confidence Indicators

TITAN must not claim to know the candidate's internal mental state.

Avoid:

```text
You are not confident.
```

Prefer:

```text
Confidence Indicators

Moderate

Observed:
• frequent hesitation
• several long pauses
• uncertain phrasing

Suggestion:

Start with a direct answer before explaining details.
```

These are observable communication indicators, not psychological diagnoses.

---

# 36. Retry Question Flow

When the candidate selects:

```text
[ Try Again ]
```

the same question is presented again.

The original attempt must remain preserved.

The candidate receives guidance without being given the answer.

---

## Retry Wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Improvement Attempt                                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Original Question                                            │
│                                                              │
│ "Explain authentication vs authorization."                    │
│                                                              │
│ Previous feedback                                             │
│                                                              │
│ • Clarify the distinction                                    │
│ • Give a practical example                                   │
│ • Reduce filler words                                        │
│                                                              │
│                         🎙                                   │
│                                                              │
│                Give your improved answer                     │
│                                                              │
│                  [ Start Speaking ]                          │
└──────────────────────────────────────────────────────────────┘
```

---

# 37. Retry Comparison

After the retry:

```text
┌──────────────────────────────────────────────────────────────┐
│ Improvement                                                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                  Attempt 1       Attempt 2                   │
│ Knowledge             62             88                     │
│ Clarity               58             81                     │
│ Communication         64             84                     │
│ Filler Words           7              2                     │
│                                                              │
│             ↑ Significant improvement                        │
│                                                              │
│ ✓ Clearer explanation                                        │
│ ✓ Correct distinction                                       │
│ ✓ Fewer filler words                                         │
│                                                              │
│                 [ Continue Interview ]                       │
└──────────────────────────────────────────────────────────────┘
```

Numerical comparison should only be shown when both evaluations are sufficiently reliable.

Otherwise use qualitative comparison.

This comparison is one of TITAN's primary differentiation mechanisms.

---

# 38. Explanation Offer

TITAN may offer an explanation when:

* the candidate explicitly asks for help
* the candidate repeatedly struggles with the same concept
* the candidate demonstrates a significant misconception
* clarification would meaningfully improve learning

It should not appear after every mistake.

Example:

```text
You seem to be struggling with this concept.

Would you like me to explain JWT authentication
before continuing?

[ Explain ]       [ Continue Without Explanation ]
```

---

# 39. Explanation Screen

```text
┌──────────────────────────────────────────────────────────────┐
│ Concept Explanation                                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ JWT Authentication                                           │
│                                                              │
│ JWT is a signed token commonly used to represent             │
│ authentication claims between a client and server.          │
│                                                              │
│ 1. User logs in                                              │
│ 2. Server verifies credentials                               │
│ 3. Server creates a token                                    │
│ 4. Client sends the token with future requests               │
│ 5. Server validates the token                                │
│                                                              │
│ Example                                                      │
│                                                              │
│ "After login, the server gives the client a signed token..." │
│                                                              │
│ Key takeaway                                                 │
│                                                              │
│ Authentication → Who are you?                                │
│ Authorization → What can you access?                         │
│                                                              │
│ [ Try Question Again ]                 [ Continue ]           │
└──────────────────────────────────────────────────────────────┘
```

Explanation should be concise and interview-relevant.

---

# 40. Explanation Follow-Up

After an explanation, TITAN may allow the candidate to retry.

```text
Would you like to answer the original question again?

[ Yes, Try Again ]       [ Continue ]
```

Retry is optional.

---

# 41. Adaptive Next Question

After feedback, the adaptive engine determines what happens next.

The decision may consider:

```text
Current question
       +
Candidate answer
       +
Knowledge assessment
       +
Communication performance
       +
Previous performance
       +
Resume context
       +
Job context
       +
Interview objective
       +
Previous weak areas
       ↓
Adaptive Decision
       ↓
Next Interaction
```

The candidate should not manually navigate through a fixed question list.

---

# 42. Adaptive Question Examples

## Strong Answer

```text
Strong JWT explanation
        ↓
Performance improves
        ↓
Difficulty increases
        ↓
Deeper question

"How would you handle JWT revocation
if a token is compromised?"
```

---

## Weak Answer

```text
Confused authentication and authorization
        ↓
Feedback
        ↓
Targeted follow-up or retry
```

Example:

```text
"Can you give me a real-world example that
distinguishes authentication from authorization?"
```

The system should avoid endlessly repeating the same weakness.

---

## Communication Problem

The next question may intentionally create a communication practice opportunity.

```text
"Explain your answer in two or three
clear sentences."
```

---

## Resume Claim

If the candidate says:

```text
"I implemented JWT authentication in my project."
```

TITAN may ask:

```text
"You mentioned implementing JWT authentication
in your project. Walk me through exactly how
you implemented it."
```

---

# 43. Dynamic Follow-Up Questions

Follow-ups reuse the normal Live Interview interface.

They do not require a separate screen.

Example:

```text
TITAN:

"Why did you choose MongoDB?"
```

Candidate:

```text
"Because it is easier to use with JavaScript."
```

TITAN:

```text
"What trade-offs did you consider before choosing it?"
```

The follow-up is generated from the candidate's response.

---

# 44. Topic Transition

TITAN should transition naturally between areas.

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

Transitions should feel conversational rather than like unrelated question categories.

---

# 45. Session Pause

The candidate may pause an active interview.

```text
┌──────────────────────────────────────────────────────────────┐
│ Interview Paused                                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Your progress is saved.                                      │
│                                                              │
│ Current session state is preserved.                          │
│                                                              │
│                 [ Resume Interview ]                          │
│                                                              │
│                 [ End Interview ]                             │
└──────────────────────────────────────────────────────────────┘
```

Pausing must preserve the latest confirmed session state.

---

# 46. End Interview Confirmation

```text
┌──────────────────────────────────────────────────────────────┐
│ End Interview?                                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Your completed answers will still be included                │
│ in your performance report.                                  │
│                                                              │
│ [ Continue Interview ]               [ End Interview ]        │
└──────────────────────────────────────────────────────────────┘
```

The interface should avoid presenting a misleading fixed question count.

---

# 47. Natural Interview Completion

The interview may conclude when:

* target duration is reached
* sufficient interview coverage has been achieved
* required areas have been evaluated
* the adaptive engine determines that additional questions provide limited value
* the candidate manually ends the interview

The system should not abruptly stop while the candidate is answering.

---

# 48. Screen 7 — Interview Completion

After the final answer:

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                    Interview Complete                        │
│                                                              │
│                           ✓                                  │
│                                                              │
│             You completed your interview.                    │
│                                                              │
│             TITAN is preparing your report...                 │
│                                                              │
│             Analyzing session results                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

No fake percentage progress should be displayed.

Where real processing stages are available, they may be shown:

```text
✓ Answers processed
✓ Performance aggregated
● Generating recommendations
```

---

# 49. Screen 8 — Master Performance Report

The final report is the primary output of the interview.

It should contain:

* actual performance data
* actionable insights
* observed strengths
* knowledge gaps
* communication analysis
* measurable improvement
* recommended practice

No unnecessary motivational content.

---

# 50. Report Header

```text
┌──────────────────────────────────────────────────────────────┐
│ Interview Performance                                        │
│                                                              │
│ Full Stack Developer Interview                               │
│ Resume + Role + Job Description                               │
│                                                              │
│ Completed: 14 Aug 2026                                       │
│ Duration: 31 min                                             │
│ Questions Asked: 12                                         │
│ Follow-ups: 3                                                │
│ Retries: 2                                                   │
└──────────────────────────────────────────────────────────────┘
```

Question, follow-up, and retry counts should represent actual session activity.

---

# 51. Overall Performance

```text
┌──────────────────────────────────────────────────────────────┐
│ Overall Performance                                          │
│                                                              │
│                       82 / 100                               │
│                                                              │
│ Knowledge          █████████░ 86                             │
│ Communication      ████████░░ 79                             │
│ Clarity            ████████░░ 81                             │
│ Relevance          █████████░ 88                             │
└──────────────────────────────────────────────────────────────┘
```

The exact scoring model belongs in the intelligence specification.

The wireframe defines presentation only.

Confidence should preferably be presented as observable indicators unless a validated numerical metric exists.

---

# 52. Knowledge Performance

```text
Knowledge

Strong

█████████░

Strong areas:
✓ JavaScript
✓ React
✓ REST APIs
✓ MongoDB

Needs improvement:
! Authentication architecture
! Database indexing
```

---

# 53. Communication Performance

```text
Communication

Clarity               81
Sentence Structure    76
Filler Control        68
Speaking Pace         84
Response Structure    79
```

Only metrics supported by reliable analysis should be shown.

---

# 54. Filler Word Summary

```text
Filler Words

Total: 31

Most frequent:

"like"        12
"basically"    8
"you know"     6

Trend:

Beginning     ███████
Middle        █████
End           ██

Improvement detected
```

The exact improvement percentage should only be displayed when calculated from valid session data.

---

# 55. Knowledge Gap Summary

```text
Knowledge Gaps

High priority
────────────────────────────
Authentication / Authorization

Medium priority
────────────────────────────
Database indexing
System design basics

Low priority
────────────────────────────
HTTP caching
```

---

# 56. Question-by-Question Report

```text
Question 1
✓ Strong

Question 2
⚠ Mostly Correct

Question 3
✓ Strong

Question 4
✕ Incorrect

Question 5
✓ Improved After Retry

Question 6
✓ Strong
```

Each question should be expandable.

---

# 57. Expanded Question Result

```text
Question 4

Question:
"Explain authentication vs authorization."

Initial result:
Partially incorrect

Knowledge:
62

Communication:
74

Issues:
• Conceptual confusion
• Incomplete explanation

Retry:
Completed

Improved result:
88

Improvement:
+26

Filler words:
7 → 2
```

The original attempt must remain preserved even after a retry.

---

# 58. Improvement Tracking

TITAN should explicitly show measurable progress during the session.

Possible metrics:

```text
                    Start       End

Knowledge             68         84
Clarity               61         81
Filler Control        54         73
Response Structure    63         82
```

Only dimensions with sufficient data should be compared.

Qualitative improvement may be used when numerical comparison is unreliable.

---

# 59. Strengths

Keep the section concise.

```text
Your Strengths

✓ Strong technical fundamentals
✓ Good use of project examples
✓ Relevant answers
✓ Improved communication during retries
```

---

# 60. Improvement Areas

```text
Focus Areas

1. Reduce filler words
2. Structure technical answers before speaking
3. Explain concepts with concrete examples
4. Avoid uncertain opening phrases
```

---

# 61. Recommended Practice

Recommendations must be derived from observed weaknesses.

```text
Recommended Practice

Priority 1
Authentication & Authorization
→ Practice explaining the distinction in 60 seconds.

Priority 2
Technical Communication
→ Use Definition → Explanation → Example structure.

Priority 3
Filler Control
→ Pause instead of using filler words.
```

---

# 62. Final Report Actions

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│ [ Practice Weak Areas ]                                      │
│                                                              │
│ [ Start Another Interview ]                                  │
│                                                              │
│ [ Return to Dashboard ]                                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

`Practice Weak Areas` should preserve relevant weaknesses as context for the next practice session where supported.

---

# 63. Interview State UI Matrix

| State                     | Primary UI                    |
| ------------------------- | ----------------------------- |
| setup                     | configuration                 |
| configuration_review      | configuration summary         |
| readiness                 | microphone/audio check        |
| interview_ready           | interview instructions        |
| question_generating       | question preparation          |
| interviewer_speaking      | question + speaking indicator |
| listening                 | listening interface           |
| answer_recording          | recording interface           |
| answer_processing         | analysis indicator            |
| feedback                  | answer report                 |
| retry                     | improvement attempt           |
| explanation               | concept explanation           |
| paused                    | resume/end controls           |
| completed                 | completion state              |
| report_generating         | report preparation            |
| report                    | master performance report     |
| microphone_error          | microphone recovery           |
| transcription_error       | answer recovery               |
| analysis_error            | analysis recovery             |
| question_generation_error | question retry                |
| network_error             | reconnect state               |
| session_recovery_error    | recovery options              |

---

# 64. Error States

## Microphone Permission Denied

```text
Microphone access is required for voice interviews.

Please allow microphone access in your browser settings.

[ Try Again ]
```

---

## Microphone Failure During Interview

```text
Microphone unavailable.

Your current answer has not been marked incorrect.

Check your microphone connection or browser permissions.

[ Retry Microphone ]
[ End Interview ]
```

---

## Speech Recognition Failure

```text
We couldn't capture your answer.

Your interview has not been marked incorrect.

[ Try Again ]
```

---

## Analysis Failure

```text
We couldn't analyze this answer.

Your response has not been marked incorrect.

[ Retry Analysis ]
[ Continue ]
```

---

## AI Question Generation Failure

```text
TITAN couldn't generate the next question.

Your previous answer has been saved.

[ Retry ]
```

---

## Network Failure

```text
Connection interrupted.

Your last confirmed progress has been preserved.

We're trying to reconnect...

[ Retry Connection ]
```

---

## Session Recovery Failure

```text
We couldn't restore your interview.

Your last confirmed progress is safe.

[ Resume From Last Saved Point ]
[ End Interview ]
```

Technical failures must never automatically become performance failures.

---

# 65. Empty / Recovery States

## No Interview History

```text
No interviews yet.

Start your first interview to begin building
your performance history.

[ Start Interview ]
```

---

## Interrupted Session

```text
You have an unfinished interview.

Your last confirmed progress is available.

[ Resume Interview ]
[ Start New Interview ]
```

---

# 66. Session Recovery

If the browser refreshes during an active interview, TITAN should attempt to restore the session where technically supported.

Possible session states:

```text
ACTIVE
PROCESSING
FEEDBACK
PAUSED
COMPLETED
ABANDONED
```

Already confirmed answers must not be lost because of a page refresh.

The restored session should resume from the latest confirmed state.

---

# 67. User Leaves Interview

If the candidate navigates away:

```text
Your interview is still in progress.

Leave anyway?
```

Options:

```text
[ Stay ]
[ Leave ]
```

If the candidate leaves, the backend session rules determine whether the session becomes recoverable or abandoned.

---

# 68. Accessibility Considerations

The wireframe must support:

* keyboard navigation
* visible focus states
* screen-reader labels
* accessible recording controls
* accessible progress indicators
* text alternative for spoken questions
* transcript visibility
* sufficient contrast
* non-audio fallback for important information
* clear state announcements

Voice is the primary interaction method, but critical information must remain visually available.

---

# 69. Responsive Behavior

## Desktop

Use the full interview layout.

```text
┌─────────────── Interview ───────────────┐
│                                         │
│              Question                   │
│                                         │
│              Voice UI                   │
│                                         │
│              Transcript                 │
│                                         │
│              Controls                   │
│                                         │
└─────────────────────────────────────────┘
```

---

## Tablet

Reduce secondary information.

Primary focus:

* question
* recording
* transcript
* controls
* essential progress

---

## Mobile

Use a vertically stacked layout.

```text
Question

↓

Voice Interaction

↓

Transcript

↓

Controls

↓

Progress
```

Feedback should become vertically scrollable.

---

# 70. Visual Hierarchy

## During Interview

```text
Question
   ↓
Candidate Response
   ↓
Voice Interaction
   ↓
Transcript
   ↓
Progress
```

---

## During Feedback

```text
Performance
   ↓
What Happened
   ↓
How To Improve
   ↓
Retry / Explanation / Continue
```

---

## During Final Report

```text
Overall Performance
   ↓
Dimension Scores
   ↓
Knowledge Gaps
   ↓
Communication Analysis
   ↓
Improvement
   ↓
Recommendations
```

---

# 71. Core Learning Loop

The most important interaction in the entire Interview Intelligence module is:

```text
             ┌───────────────────┐
             │      QUESTION     │
             └─────────┬─────────┘
                       │
                       ▼
             ┌───────────────────┐
             │   VOICE ANSWER    │
             └─────────┬─────────┘
                       │
                       ▼
             ┌───────────────────┐
             │     ANALYSIS      │
             └─────────┬─────────┘
                       │
                       ▼
             ┌───────────────────┐
             │     FEEDBACK      │
             └─────────┬─────────┘
                       │
              ┌────────┴─────────┐
              │                  │
              ▼                  ▼
        ┌───────────┐      ┌────────────┐
        │   RETRY   │      │ CONTINUE   │
        └─────┬─────┘      └──────┬─────┘
              │                   │
              ▼                   │
        ┌───────────┐             │
        │ IMPROVED  │             │
        │  ANSWER   │             │
        └─────┬─────┘             │
              │                   │
              ▼                   │
        ┌───────────┐             │
        │ RE-ANALYZE│             │
        └─────┬─────┘             │
              │                   │
              └─────────┬─────────┘
                        │
                        ▼
              ┌───────────────────┐
              │ ADAPTIVE ENGINE   │
              └─────────┬─────────┘
                        │
                        ▼
              ┌───────────────────┐
              │ NEXT INTERACTION  │
              └─────────┬─────────┘
                        │
                        ▼
                     REPEAT
```

The adaptive engine may produce:

```text
NEXT QUESTION
FOLLOW-UP
RETRY
EXPLANATION
DIFFICULTY CHANGE
TOPIC TRANSITION
INTERVIEW COMPLETION
```

---

# 72. Differentiating TITAN

Traditional interview platforms:

```text
Question
↓
Answer
↓
Score
↓
Next Question
```

TITAN:

```text
Question
↓
Answer
↓
Understand the answer
↓
Analyze knowledge
↓
Analyze communication
↓
Identify mistakes
↓
Explain when useful
↓
Give actionable feedback
↓
Allow improvement
↓
Measure improvement
↓
Adapt the interview
↓
Continue
↓
Generate performance history
```

The candidate should leave the session knowing:

> **What I know → What I don't know → How I communicate → What I need to improve → Whether I actually improved.**

---

# 73. Final UX Goal

The candidate should finish an interview with three clear answers:

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

This principle should guide the implementation of every screen, interaction, and state in TITAN Interview Intelligence.

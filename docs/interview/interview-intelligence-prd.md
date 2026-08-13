# TITAN — Interview Intelligence PRD

**Document:** Product Requirements Document
**Module:** Interview Intelligence
**Product:** TITAN
**Status:** Pre-Implementation Specification
**Version:** 1.0

---

# 1. Overview

Interview Intelligence is TITAN's adaptive AI interview preparation engine.

It is designed to simulate a realistic interview rather than provide a static question-and-answer experience.

The system should:

* understand the user's selected interview context
* generate relevant questions dynamically
* listen to each answer
* evaluate the answer
* identify correctness, completeness, reasoning quality, communication quality, and weaknesses
* adapt the next question based on the user's previous response
* provide actionable feedback after every question
* allow the user to retry questions after improving
* provide explanations when the user encounters knowledge gaps
* progressively adjust question difficulty
* track measurable improvement throughout the session
* generate a final master report at the end of the interview

The goal is not simply to test the user.

The goal is to make the user **better at interviewing after every session**.

---

# 2. Product Philosophy

Interview Intelligence must feel like an intelligent interviewer and coach rather than an exam platform.

The experience should follow this principle:

> **Ask → Listen → Understand → Evaluate → Teach → Adapt → Improve**

The system should never feel like:

> Question → Answer → Score → Next Question

Instead, the user should feel that TITAN is actively responding to them.

For example:

```text
Question
   ↓
User answers
   ↓
TITAN understands the answer
   ↓
Identifies strengths / weaknesses
   ↓
Provides feedback
   ↓
Determines what the user needs next
   ↓
Generates the next question
```

---

# 3. Problem Statement

Most interview preparation platforms rely heavily on:

* predefined question banks
* static quizzes
* fixed interview paths
* generic explanations
* isolated scoring
* limited personalization

These systems can test knowledge but often do not simulate how an actual interviewer behaves.

A real interviewer:

* asks questions based on previous answers
* asks follow-up questions
* changes difficulty
* probes weak areas
* asks for clarification
* notices poor communication
* explains concepts when appropriate
* evaluates reasoning rather than only final answers

TITAN should reproduce these behaviors through an adaptive AI interview engine.

---

# 4. Goals

## 4.1 Primary Goals

Interview Intelligence must:

1. Generate questions dynamically.
2. Personalize questions according to interview context.
3. Evaluate every answer.
4. Provide useful feedback after every answer.
5. Identify knowledge gaps.
6. Identify communication problems.
7. Adapt future questions according to performance.
8. Allow users to retry questions.
9. Allow users to request explanations.
10. Track improvement throughout the session.
11. Produce a final master report.
12. Preserve interview history for future progress tracking.

---

# 5. Non-Goals for V1

The following are outside the core V1 scope unless explicitly required by implementation planning:

* real-time human interviewer participation
* live human coaching
* job application automation
* automatic job applications
* guaranteed interview outcome prediction
* facial/emotion recognition
* personality diagnosis
* psychological profiling
* cheating detection
* proctoring
* webcam monitoring
* external recruiter integration

Voice interaction may be supported by the architecture, but the core interview engine must remain capable of processing text answers.

---

# 6. Interview Modes

The user must be able to choose the source of interview context.

## 6.1 Resume-Based

Questions are generated from the user's active resume.

Example:

```text
Resume:
React
Node.js
MongoDB
TITAN project
ShopSphere project

Question:
"Can you explain how authentication works in your TITAN project?"
```

The system should prioritize information actually present in the resume.

---

## 6.2 Role-Based

The user selects a target role.

Examples:

```text
Frontend Developer
Backend Developer
Full Stack Developer
Software Engineer
Data Analyst
```

Questions are generated according to expected knowledge for that role.

---

## 6.3 Company-Based

The user selects a company.

The interview should adapt to the company's known interview style, role expectations, and relevant technical/behavioral patterns where reliable information is available.

The system must avoid presenting uncertain company-specific information as fact.

---

## 6.4 Job Description-Based

The user provides a job description.

TITAN extracts relevant:

* skills
* technologies
* responsibilities
* requirements
* seniority
* domain
* keywords

and generates interview questions around them.

---

## 6.5 Mixed Mode

The user can combine multiple sources.

Example:

```text
Resume
+
Target Role
+
Job Description
+
Company
```

The system should prioritize information according to relevance.

Recommended priority:

```text
Job Description
      ↓
Resume
      ↓
Target Role
      ↓
Company context
```

The exact prioritization may be adjusted by the interview engine.

---

# 7. Interview Types

The user should be able to choose:

### Technical

Focuses on:

* technical knowledge
* coding concepts
* architecture
* debugging
* APIs
* databases
* frameworks
* tools
* project implementation

### Behavioral

Focuses on:

* communication
* teamwork
* leadership
* conflict resolution
* decision making
* adaptability
* ownership
* motivation

### Mixed

Combines technical and behavioral questions.

The engine should control the distribution rather than randomly switching between categories.

---

# 8. Interview Difficulty

Supported difficulty levels:

```text
Easy
Medium
Hard
Adaptive
```

### Adaptive

This is the recommended/default mode.

Difficulty should change based on demonstrated performance.

Example:

```text
Strong answer
    ↓
Increase difficulty

Weak answer
    ↓
Probe / simplify / teach

Improved retry
    ↓
Return to appropriate difficulty
```

The system should avoid punishing users excessively for a single weak answer.

---

# 9. Interview Setup

Before starting, the user configures:

* interview mode
* interview type
* target role
* company, if applicable
* job description, if applicable
* resume, if applicable
* difficulty
* number of questions and/or duration
* optional focus areas

The system validates the configuration before creating the interview session.

---

# 10. Interview Session Lifecycle

The session lifecycle is:

```text
SETUP
  ↓
CREATED
  ↓
ACTIVE
  ↓
QUESTION
  ↓
ANSWER
  ↓
EVALUATION
  ↓
FEEDBACK
  ↓
ADAPTATION
  ↓
NEXT QUESTION
  ↓
...
  ↓
COMPLETED
  ↓
FINAL REPORT
```

A session may also enter:

```text
PAUSED
ABANDONED
```

The system must support recovery after page refresh or temporary connection failure.

---

# 11. Dynamic Question Generation

Questions must be generated dynamically.

The system must NOT depend exclusively on a static question bank.

Every generated question should consider:

* interview mode
* interview type
* target role
* resume
* job description
* company context
* previous questions
* previous answers
* previous evaluations
* current difficulty
* identified weaknesses
* identified knowledge gaps
* previous retries
* session progress

---

# 12. Question Categories

The engine may generate:

* conceptual questions
* technical questions
* project questions
* resume questions
* behavioral questions
* situational questions
* problem-solving questions
* debugging questions
* architecture questions
* follow-up questions
* clarification questions
* knowledge-gap questions

---

# 13. Follow-Up Questions

Follow-up questions are a core feature.

Example:

```text
Interviewer:
"How did you implement authentication?"

User:
"I used JWT."

TITAN:
"What happens after the server verifies the JWT?"
```

The second question should be generated because of the first answer.

It should not simply select the next unrelated question.

---

# 14. Answer Submission

The user may provide an answer through supported input methods.

V1 must support text answers.

The architecture should remain compatible with future voice-based answers.

The submitted answer must be stored as an individual attempt.

---

# 15. Answer Evaluation

Every answer must be evaluated.

Evaluation should consider:

### Technical Accuracy

Is the information correct?

### Completeness

Did the user address the important aspects?

### Relevance

Did the answer actually address the question?

### Reasoning

Did the user demonstrate understanding and reasoning?

### Communication

Was the answer understandable and well structured?

### Sentence Quality

Detect significant issues such as:

* fragmented sentences
* unclear wording
* excessive repetition
* poor structure
* confusing explanations

Minor natural language imperfections should not be excessively penalized.

---

# 16. Answer Classification

The engine should classify answers into useful categories.

Examples:

```text
CORRECT
PARTIALLY_CORRECT
INCORRECT
INCOMPLETE
IRRELEVANT
UNCLEAR
NO_ANSWER
```

Classification must be accompanied by reasoning and structured evaluation data.

---

# 17. Per-Question Feedback

After each answer, TITAN should provide concise actionable feedback.

The feedback should include:

### What you did well

Specific strengths.

### What needs improvement

Specific weaknesses.

### Technical correction

What was incorrect or incomplete.

### How to improve

Concrete advice.

### Better answer

When useful, provide an example of a stronger answer.

The system must not fabricate facts about the user's answer.

---

# 18. Wrong Answers

If the answer is wrong, TITAN should not simply display:

```text
Wrong — 3/10
```

Instead:

```text
What was wrong
        ↓
Why it was wrong
        ↓
Correct understanding
        ↓
How to answer better
        ↓
Optional retry
```

The objective is learning, not punishment.

---

# 19. Partially Correct Answers

Partial answers are especially important.

Example:

```text
Score: 65%

You correctly explained X and Y.

You missed Z.

To make this answer interview-ready:
...
```

The user should clearly understand the difference between:

* what they know
* what they missed
* what they misunderstood

---

# 20. Communication Feedback

TITAN should identify meaningful communication issues.

Examples:

```text
Your technical explanation was correct, but the answer was difficult to follow because the ideas were presented out of order.

Try:

1. Define the concept.
2. Explain how it works.
3. Give an example.
```

Communication feedback must remain constructive.

The system must not shame the user.

---

# 21. Retry Mechanism

After feedback, TITAN should determine whether a retry would be useful.

The system may ask:

> "Would you like to try this question again after improving your answer?"

Possible actions:

```text
Try Again
Continue
```

A retry must create a new answer attempt while preserving the original attempt.

The system should measure improvement.

Example:

```text
Attempt 1
Score: 52

Retry
Score: 81

Improvement: +29
```

---

# 22. Retry Evaluation

A retry should be evaluated independently.

The system should compare:

```text
Previous attempt
        vs
Retry attempt
```

and identify:

* improvements
* remaining weaknesses
* newly introduced errors
* improvement score

---

# 23. Explanation System

If TITAN detects that the user lacks understanding of a relevant concept, it may offer an explanation.

Example:

> "It looks like JWT expiration is unclear here. Would you like me to explain how JWT expiration works before we continue?"

The user may choose:

```text
Explain
Skip
```

The explanation should be:

* relevant
* concise
* technically accurate
* appropriate to the user's level

---

# 24. Explanation Flow

```text
Knowledge Gap
      ↓
TITAN detects gap
      ↓
Offers explanation
      ↓
User accepts
      ↓
Explanation
      ↓
User continues
      ↓
Future question may test the concept
```

This allows TITAN to determine whether the user actually improved after learning.

---

# 25. Adaptive Interview Engine

The engine should decide what happens after every evaluation.

Possible decisions:

```text
NEXT_QUESTION
FOLLOW_UP
RETRY
EXPLAIN
EASIER
HARDER
FOCUS_WEAKNESS
```

The decision should be based on:

* answer quality
* knowledge gaps
* communication issues
* difficulty
* interview progress
* previous performance
* target role requirements
* remaining question budget

---

# 26. Difficulty Adaptation

Difficulty should gradually adapt.

Example:

```text
Strong → harder
Strong → harder

Weak → follow-up
Weak → explanation

Improved → medium/harder
```

The engine should avoid extreme difficulty changes based on one answer.

---

# 27. Topic Coverage

The interview engine should maintain topic coverage.

Example:

```text
JavaScript       ✓
React            ✓
Node.js          ✓
MongoDB          ✓
Authentication   ⚠ weak
System Design    ○ not tested
```

The engine should balance:

* required topics
* weak topics
* uncovered topics
* interview time

---

# 28. Progress Tracking

The system should track measurable progress during the session.

Possible metrics:

* overall performance
* technical accuracy
* communication
* completeness
* reasoning
* confidence proxy based on answer behavior
* topic mastery
* retry improvement
* knowledge gaps resolved

Metrics must be based on observable interview data.

The system must not claim to directly measure psychological confidence unless a reliable measurement mechanism exists.

---

# 29. Confidence

TITAN may provide a **confidence indicator** based on observable behavior such as:

* answer completeness
* hesitation markers, if voice data is available
* consistency
* retry improvement
* willingness to attempt difficult questions

However, it must be clearly presented as an estimate.

It must never claim:

> "Your psychological confidence is 83%."

Instead:

> "Interview confidence indicator: improving"

---

# 30. Final Master Report

At session completion, TITAN generates one final performance report.

The report must focus on useful performance information.

It should include:

## Overall Performance

```text
Overall Score
Technical Score
Communication Score
Reasoning Score
Completeness Score
```

## Strengths

The user's strongest areas.

## Weaknesses

The user's most important weaknesses.

## Knowledge Gaps

Topics that require further study.

## Communication Issues

Important communication improvements.

## Improvement During Session

Show measurable progress.

Example:

```text
First 3 questions: 61%
Last 3 questions: 78%

Session improvement: +17%
```

## Retry Improvements

Show meaningful improvements from retries.

## Recommended Next Steps

Only a few high-value recommendations.

---

# 31. Progress Across Sessions

TITAN should preserve completed interview results.

Future versions should allow comparison between sessions.

Example:

```text
Interview #1
Technical: 61

Interview #2
Technical: 69

Interview #3
Technical: 78
```

The product should make progress visible.

The user should feel:

> "I am becoming better at interviews."

---

# 32. Resume Intelligence Integration

Interview Intelligence must integrate with Resume Intelligence.

Resume Intelligence already produces:

```text
ResumeVersion
    ↓
candidateProfile
    ↓
interviewContext
```

The interview engine should consume the existing `interviewContext` rather than independently rebuilding the candidate profile.

This prevents duplicated processing and inconsistent candidate information.

---

# 33. Resume Version Integrity

An interview must record which resume version was used.

Example:

```text
Interview Session
        ↓
ResumeVersion V3
```

If the user later uploads V4, historical interviews using V3 must remain associated with V3.

Historical interview results must not silently change because the active resume changed.

---

# 34. Job Description Integration

When a job description is supplied, the system should extract:

* role
* required skills
* preferred skills
* responsibilities
* technologies
* experience requirements
* domain
* important keywords

These become interview context.

---

# 35. Company Context

Company-specific context must be treated carefully.

If reliable information is unavailable, TITAN should generate generally relevant questions rather than inventing company-specific interview behavior.

The system must avoid hallucinating:

* interview rounds
* company policies
* internal technologies
* recruiter behavior
* confidential information

---

# 36. AI Responsibilities

AI may be responsible for:

* question generation
* answer evaluation
* feedback generation
* explanation generation
* adaptive reasoning
* final report generation

However, deterministic application logic should remain responsible for:

* authentication
* authorization
* session ownership
* persistence
* session state
* retry counting
* question numbering
* limits
* lifecycle transitions
* data validation

AI output must be validated before persistence.

---

# 37. Structured AI Output

AI responses must use structured schemas.

The application must not depend on parsing arbitrary natural-language AI responses.

For example:

```text
AI
 ↓
Structured JSON
 ↓
Schema validation
 ↓
Application logic
 ↓
MongoDB
```

Invalid AI output must be handled safely.

---

# 38. Error Handling

The interview should survive:

* AI provider failure
* malformed AI response
* network interruption
* browser refresh
* duplicate answer submission
* expired session
* server restart

The user should never lose a completed answer because of a temporary AI failure.

---

# 39. Session Recovery

If the user refreshes the page:

```text
Frontend
   ↓
GET current session
   ↓
Backend restores state
   ↓
Frontend resumes
```

The system must know:

* current question
* previous answers
* current evaluation
* retry state
* session status
* remaining questions
* accumulated performance

---

# 40. Security

Every interview endpoint must require authentication.

Every interview resource must be scoped to the authenticated user.

A user must never be able to access another user's:

* sessions
* questions
* answers
* evaluations
* reports

by manipulating IDs.

Job descriptions and user-provided content must be treated as untrusted input.

---

# 41. Data Integrity

The system must preserve:

```text
Session
  ↓
Question
  ↓
Attempt
  ↓
Evaluation
```

Historical evaluations must never be overwritten by later retries.

A retry creates another attempt.

A completed report should remain reproducible from stored session data.

---

# 42. Performance Requirements

The interview experience should feel responsive.

The system should:

* return deterministic state quickly
* process AI operations asynchronously where appropriate
* minimize unnecessary repeated context
* avoid sending the entire session history to the AI when unnecessary
* maintain a compact interview context
* control token usage

---

# 43. AI Context Management

The AI should receive only relevant context.

Context may include:

```text
Candidate context
+
Interview configuration
+
Current topic
+
Relevant previous questions
+
Relevant previous answers
+
Recent evaluations
+
Known weaknesses
+
Topic coverage
```

The entire historical transcript should not automatically be sent on every request.

---

# 44. User Experience Principles

The experience must be:

### Adaptive

The interview reacts to the user.

### Educational

Every mistake becomes a learning opportunity.

### Measurable

The user can see improvement.

### Honest

No fabricated scores or claims.

### Encouraging

Feedback should build confidence without giving empty praise.

### Focused

Avoid unnecessary UI and excessive text.

---

# 45. Success Criteria

Interview Intelligence V1 is successful when a user can:

1. Create an interview.
2. Select interview context.
3. Start an interview.
4. Receive a dynamically generated question.
5. Submit an answer.
6. Receive structured evaluation.
7. Understand what they did well.
8. Understand what they did poorly.
9. Receive actionable improvement advice.
10. Retry a question.
11. See measurable retry improvement.
12. Receive an explanation when appropriate.
13. Continue through adaptive questions.
14. Complete the session.
15. Receive a final master report.
16. Refresh the page without losing session state.
17. Review previous interview performance.

---

# 46. Core Product Differentiator

Interview Intelligence must not become another AI question generator.

Its core differentiator is:

> **TITAN remembers how you answered, understands where you struggled, teaches you when necessary, adapts the interview around you, and measures whether you actually improved.**

The product loop is:

```text
             ┌─────────────────────┐
             │      QUESTION       │
             └──────────┬──────────┘
                        ↓
             ┌─────────────────────┐
             │       ANSWER        │
             └──────────┬──────────┘
                        ↓
             ┌─────────────────────┐
             │     EVALUATION      │
             └──────────┬──────────┘
                        ↓
             ┌─────────────────────┐
             │      FEEDBACK       │
             └──────────┬──────────┘
                        ↓
              ┌─────────┴─────────┐
              ↓                   ↓
          KNOWLEDGE GAP        WEAKNESS
              ↓                   ↓
          EXPLAIN              RETRY
              ↓                   ↓
              └─────────┬─────────┘
                        ↓
                 ADAPTIVE ENGINE
                        ↓
                  NEXT QUESTION
                        ↓
                       ...
                        ↓
                 MASTER REPORT
                        ↓
                   PROGRESS
```

This loop is the foundation of TITAN Interview Intelligence.

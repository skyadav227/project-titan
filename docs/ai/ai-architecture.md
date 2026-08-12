# TITAN — AI Architecture Specification

**Document:** AI Architecture
**Version:** 1.0
**Status:** Proposed
**Project:** TITAN — AI Interview Preparation Platform

---

## 1. Purpose

This document defines the architecture for TITAN's AI system.

The AI system will power:

* Resume intelligence
* Interview question generation
* Dynamic interview conversations
* Answer analysis
* Interview evaluation
* Performance reports
* Personalized preparation recommendations

The architecture must support TITAN's initial **₹0 development strategy** while remaining flexible enough to support different AI providers in the future.

---

# 2. Core Principles

### 2.1 Free-first development

TITAN v1 will use AI services that can be accessed without requiring paid API usage during development.

The initial provider will be **OpenRouter**, using its available free models/routes.

Paid AI providers may be introduced later if TITAN requires higher limits, reliability, or model quality.

---

### 2.2 Provider independence

Application features must not directly depend on a specific AI provider.

The application should communicate with an internal AI service layer.

```text
Application
     ↓
AI Service
     ↓
AI Provider Adapter
     ↓
AI Provider
```

This allows the provider to be changed without rewriting the interview engine.

---

### 2.3 Server-side AI access

AI API keys must never be exposed to the React frontend.

```text
React Client
     ↓
Express Server
     ↓
AI Service
     ↓
OpenRouter
```

The OpenRouter API key must exist only in server-side environment variables.

---

### 2.4 Structured AI output

AI responses used by application logic should use structured JSON wherever practical.

The backend must validate AI-generated structured data before storing or using it.

AI-generated text should not be treated as trusted application data without validation.

---

### 2.5 AI is an assistant, not an authority

AI-generated interview evaluations are recommendations and assessments, not objective measurements of a person's actual professional ability.

TITAN should present scores and feedback as practice-oriented guidance.

---

# 3. High-Level Architecture

```text
                         TITAN
                           │
                           ▼
                    React Frontend
                           │
                           ▼
                    Express Backend
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       Resume Service  Interview     Report
                          Service     Service
              │            │            │
              └────────────┼────────────┘
                           ▼
                       AI Service
                           │
                    Provider Adapter
                           │
                           ▼
                      OpenRouter
                           │
                           ▼
                    Free AI Model
```

MongoDB provides persistent storage for user, resume, interview, answer, evaluation, and report data.

---

# 4. AI Service Layer

The application should communicate with a centralized AI service instead of calling OpenRouter directly from individual controllers.

Conceptually:

```text
AIService
├── analyzeResume()
├── generateInterview()
├── generateNextQuestion()
├── evaluateAnswer()
├── evaluateInterview()
└── generateRecommendations()
```

The exact implementation may be split into multiple services as the application grows.

---

# 5. Provider Adapter

The AI service communicates with an abstraction representing an AI provider.

Conceptually:

```text
AIProvider
├── generate()
├── stream()
└── validateResponse()
```

Initial implementation:

```text
AIProvider
    ↓
OpenRouterProvider
    ↓
OpenRouter API
```

Future implementations may include:

```text
OpenRouterProvider
LocalModelProvider
OtherCloudProvider
```

The interview engine must not depend directly on OpenRouter-specific functionality.

---

# 6. Initial AI Provider

## OpenRouter

OpenRouter will be the initial AI provider for TITAN's development phase.

Primary goals:

* Use available free models/routes.
* Avoid development API costs.
* Maintain compatibility with OpenAI-style APIs.
* Support streaming where appropriate.
* Allow model experimentation without changing the application architecture.

The selected model should remain configurable through environment variables.

Example:

```env
AI_PROVIDER=openrouter
AI_MODEL=<selected-free-model>
OPENROUTER_API_KEY=<server-secret>
```

The actual model should not be hard-coded throughout the application.

---

# 7. Free Usage Constraints

TITAN's initial AI implementation must assume that free AI usage is limited.

The system should therefore minimize unnecessary AI calls.

Bad design:

```text
One answer
    ↓
Multiple unnecessary AI requests
```

Preferred design:

```text
User answer
    ↓
One purposeful AI operation
    ↓
Next action
```

AI usage should be tracked so the application can eventually enforce:

* Per-user limits
* Daily limits
* Session limits
* Provider limits

---

# 8. AI Request Lifecycle

A standard AI request should follow:

```text
Frontend Request
       ↓
Authentication
       ↓
Authorization
       ↓
Input Validation
       ↓
Rate / Usage Check
       ↓
AI Service
       ↓
Prompt Construction
       ↓
Provider Adapter
       ↓
OpenRouter
       ↓
AI Response
       ↓
Response Validation
       ↓
Application Logic
       ↓
Database
       ↓
Frontend Response
```

Failures at any stage must be handled gracefully.

---

# 9. Resume Intelligence

Resume processing will be divided into multiple stages.

```text
Resume File
    ↓
File Validation
    ↓
Text Extraction
    ↓
Text Normalization
    ↓
Resume Parsing
    ↓
Structured Candidate Profile
    ↓
Database
```

The AI should not repeatedly process the original PDF during every interview.

Instead, TITAN should create a structured candidate profile.

Example:

```json
{
  "skills": [],
  "education": [],
  "experience": [],
  "projects": [],
  "certifications": [],
  "technologies": []
}
```

The exact schema will be defined in the Resume module specification.

---

# 10. Resume Context

The AI should receive only the information necessary for the current operation.

For example:

```text
Candidate:
Skills: React, Node.js, MongoDB

Projects:
TITAN — AI interview platform

Target Role:
Frontend Developer
```

The entire raw resume should not automatically be included in every request.

This reduces:

* Token usage
* Latency
* Cost
* Privacy exposure
* Prompt complexity

---

# 11. Interview Generation

Interview generation should consider:

```text
Candidate Profile
+
Target Role
+
Job Description (optional)
+
Interview Type
+
Difficulty
+
Interview Duration
```

Result:

```text
Interview Configuration
        ↓
Question Generation
        ↓
Interview Session
```

The generated interview should contain enough structure for the application to manage the session.

---

# 12. Dynamic Interview Engine

TITAN should not rely exclusively on a pre-generated list of questions.

The preferred model is:

```text
Question
   ↓
Candidate Answer
   ↓
AI Analysis
   ↓
Decision
   ├── Follow-up
   ├── Clarification
   ├── New Topic
   └── Difficulty Adjustment
   ↓
Next Question
```

This makes the experience more similar to an actual interview.

The AI should consider:

* Previous questions
* Previous answers
* Candidate profile
* Current topic
* Interview type
* Difficulty
* Interview progress

---

# 13. Interview State

The server must maintain authoritative interview state.

Conceptually:

```text
InterviewSession
├── userId
├── resumeId
├── targetRole
├── interviewType
├── difficulty
├── currentQuestion
├── questionCount
├── transcript
├── status
├── startedAt
└── completedAt
```

The frontend should not be responsible for determining whether an interview is actually completed.

---

# 14. Conversation Context

The AI requires enough conversation context to produce relevant follow-ups.

However, the entire transcript should not blindly grow forever.

The system should eventually support context management such as:

```text
Recent conversation
+
Interview summary
+
Candidate profile
+
Current objective
```

This keeps prompts manageable as interviews become longer.

---

# 15. AI Evaluation

After an interview, TITAN should evaluate the complete session.

Inputs:

```text
Candidate Profile
+
Interview Questions
+
Candidate Answers
+
Interview Type
+
Target Role
```

Output:

```text
Overall Evaluation
├── Overall Score
├── Technical Score
├── Communication Score
├── Problem Solving Score
├── Strengths
├── Weaknesses
├── Question Feedback
└── Recommendations
```

---

# 16. Structured Evaluation

Evaluation responses should follow a predictable schema.

Conceptually:

```json
{
  "overallScore": 84,
  "technicalScore": 88,
  "communicationScore": 79,
  "problemSolvingScore": 85,
  "strengths": [],
  "improvements": [],
  "questionFeedback": [],
  "recommendations": []
}
```

The final schema will be defined before implementing the Report module.

---

# 17. Prompt Architecture

Prompts should not be scattered randomly throughout controllers.

Prompts should have a dedicated structure.

Conceptually:

```text
AI
├── prompts/
│   ├── resume/
│   ├── interview/
│   ├── evaluation/
│   └── recommendations/
```

Prompt construction should separate:

```text
System Instructions
+
Application Rules
+
Candidate Context
+
Current Task
+
Conversation Context
```

User-controlled data must never be allowed to override system instructions.

---

# 18. Prompt Injection Protection

Resume text, job descriptions, and user answers are untrusted input.

A resume could contain text such as:

```text
Ignore previous instructions...
```

TITAN must treat this as candidate data rather than an instruction to the AI.

The system prompt should explicitly establish the boundary between:

```text
System Instructions
```

and:

```text
Untrusted Candidate Content
```

---

# 19. Privacy

TITAN may process personal information contained in resumes.

Therefore:

* Do not expose AI API keys.
* Do not log raw resumes unnecessarily.
* Do not log full interview transcripts in production logs.
* Minimize unnecessary personal information sent to AI providers.
* Avoid sending information that is irrelevant to the current AI operation.
* Provide appropriate deletion behavior for user data.
* Document third-party AI data handling before production deployment.

Free-model/provider policies must be reviewed before TITAN is used with real users or sensitive production data.

---

# 20. Error Handling

AI requests can fail.

Possible failures include:

```text
Provider unavailable
Rate limit exceeded
Timeout
Invalid response
Malformed JSON
Model unavailable
Network error
Token/context limit
```

The application should never crash because an AI request failed.

Instead:

```text
AI Error
   ↓
Log technical error
   ↓
Return safe user-facing message
   ↓
Allow retry where appropriate
```

---

# 21. AI Response Validation

AI output must be validated before application use.

For structured responses:

```text
AI JSON
   ↓
Schema Validation
   ↓
Valid → Continue
Invalid → Retry / Fail Safely
```

The backend should never assume that an LLM will always return valid JSON.

---

# 22. Streaming

Streaming should be considered for conversational interview responses.

Preferred experience:

```text
Candidate submits answer
        ↓
AI starts generating
        ↓
Response streams to frontend
```

Streaming should be implemented only where it improves the user experience and is supported reliably by the selected provider/model.

Non-streaming requests remain acceptable for:

* Resume parsing
* Interview generation
* Final evaluation
* Report generation

---

# 23. Rate Limiting

AI endpoints should have stricter protection than ordinary endpoints.

Examples:

```text
POST /api/ai/*
POST /api/interviews/*
POST /api/resume/analyze
```

Potential controls:

```text
Authentication
+
Per-user rate limit
+
Daily usage limit
+
Interview/session limit
```

Exact limits will be decided during implementation based on the available free AI allowance.

---

# 24. Usage Tracking

TITAN should eventually track AI usage.

Conceptually:

```text
AIUsage
├── userId
├── requestCount
├── tokenUsage
├── date
├── operation
└── provider
```

Operations may include:

```text
resume_analysis
interview_generation
follow_up
answer_evaluation
final_evaluation
recommendations
```

This allows TITAN to understand where AI resources are being consumed.

---

# 25. Fallback Strategy

If the selected free model becomes unavailable:

```text
Primary Free Model
        ↓
Unavailable
        ↓
Alternative Free Model
```

The provider adapter should make model switching configurable.

The application should not require source-code changes just to change the model.

---

# 26. Development vs Production

### Development

Priority:

```text
₹0 cost
Fast experimentation
Easy debugging
Free model testing
```

### Production

Priority changes to:

```text
Reliability
Latency
Privacy
Model quality
Scalability
Predictable limits
Cost control
```

The architecture must support this transition without requiring a complete rewrite.

---

# 27. Database Responsibility

AI-generated information should be persisted only when it has application value.

Examples:

```text
Resume Profile
Interview Session
Interview Transcript
Evaluation
Report
Recommendations
```

Temporary prompts and intermediate data should not automatically be stored permanently.

---

# 28. Frontend Responsibility

The React frontend is responsible for:

* User interaction
* Upload UI
* Interview UI
* Streaming display
* Loading states
* Error states
* Report visualization

The frontend should **not**:

* Store provider API keys
* Call OpenRouter directly
* Decide final interview state
* Trust unvalidated AI output
* Perform security-sensitive AI operations

---

# 29. Backend Responsibility

The Express backend is responsible for:

* Authentication
* Authorization
* Input validation
* Resume processing
* Interview state
* AI requests
* Prompt construction
* AI response validation
* Usage tracking
* Persistence
* Error handling
* Rate limiting

---

# 30. Initial TITAN AI Stack

```text
Frontend
React

Backend
Node.js + Express

Database
MongoDB

AI Gateway
OpenRouter

Initial AI
OpenRouter free model(s)

AI Integration
Server-side API

Streaming
Supported where useful

Validation
Server-side schema validation

Authentication
Existing TITAN authentication system
```

---

# 31. Future Architecture

The long-term architecture may become:

```text
                         AI Service
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
    OpenRouter          Local Model       Other Provider
          │                  │                  │
      Free/Paid          Local GPU/CPU      Paid/Free
```

The application remains unaware of the underlying provider.

---

# 32. Implementation Order

AI development should follow this sequence:

```text
1. AI architecture
        ↓
2. Provider configuration
        ↓
3. AI service abstraction
        ↓
4. OpenRouter adapter
        ↓
5. Resume extraction
        ↓
6. Resume intelligence
        ↓
7. Interview configuration
        ↓
8. Interview generation
        ↓
9. Dynamic interview engine
        ↓
10. Answer evaluation
        ↓
11. Final evaluation
        ↓
12. Reports
        ↓
13. Dashboard integration
        ↓
14. Usage limits
        ↓
15. Production hardening
```

---

# 33. Success Criteria

The AI architecture will be considered successful when:

* TITAN can communicate with the AI through the backend.
* The React frontend never exposes the AI API key.
* The AI provider can be changed without rewriting application features.
* Resume information can be transformed into structured candidate context.
* Interviews can be generated from candidate context.
* The interview can dynamically react to answers.
* Evaluations return validated structured data.
* Reports can consume AI evaluation data reliably.
* AI failures are handled gracefully.
* Free usage is protected by application-level limits.
* The system can later migrate to a paid or local model without architectural redesign.

---

# 34. Architecture Decision

**TITAN v1 will use OpenRouter's available free AI models as the initial AI integration strategy.**

The implementation will use a provider abstraction so that:

```text
OpenRouter today
        ↓
Different model tomorrow
        ↓
Local / paid provider later
```

without requiring the interview engine or frontend to be rewritten.

This architecture prioritizes:

**₹0 development cost + modularity + security + future scalability.**

/**
 * interviewService.js
 *
 * Primary Interview Intelligence orchestration service.
 *
 * Coordinates all interview operations:
 *   - Session creation + validation
 *   - Session lifecycle / state transitions
 *   - Context construction + snapshotting
 *   - Question generation (initial + adaptive)
 *   - Answer submission + processing pipeline
 *   - Speech metrics + evaluation
 *   - Retry management
 *   - Explanation generation
 *   - Interview completion
 *   - Final report generation
 *   - History + progress
 *
 * Architecture (per interview-architecture.md §9, interview-backend-spec.md §60):
 *   Controller → Interview Service → Domain Services → AI/Speech → DB
 *
 * State machine enforcement: every mutation validates current state first.
 * The frontend never determines interview progression.
 */
"use strict";

const mongoose   = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const InterviewSession  = require("../models/InterviewSession");
const InterviewQuestion = require("../models/InterviewQuestion");
const AnswerAttempt     = require("../models/AnswerAttempt");

const { resolveResumeVersion, buildNormalizedContext, buildContextSnapshot } = require("./interview/contextService");
const { createInitialStrategy, updateStrategy, getStrategyContext } = require("./interview/strategyService");
const aiService    = require("./ai/aiService");
const speechService = require("./speech/speechService");
const { MAX_RETRIES_PER_QUESTION } = require("../config/env");
const { deleteStoredFile } = require("../utils/fileUtils");


// ── ObjectId validation helper ────────────────────────────────────────────────
const OBJECT_ID_RE = /^[a-fA-F0-9]{24}$/;

/**
 * Safely validate a MongoDB ObjectId string.
 * Throws a 404 domain error if invalid — prevents Mongoose CastError → 500.
 */
function assertValidObjectId(id, resourceName = "Resource") {
  if (!id || !OBJECT_ID_RE.test(String(id))) {
    const err = new Error(`${resourceName} not found.`);
    err.code   = resourceName.includes("Interview") ? "INTERVIEW_NOT_FOUND"
               : resourceName.includes("Question")  ? "QUESTION_NOT_FOUND"
               : "INTERVIEW_NOT_FOUND";
    err.status = 404;
    throw err;
  }
}

// ── Valid state transitions ───────────────────────────────────────────────────
// Per interview-data-model.md §50, interview-api.md §7
const VALID_TRANSITIONS = {
  created:    ["starting", "abandoned"],
  starting:   ["active", "failed"],
  active:     ["completing", "paused", "abandoned", "failed"],
  paused:     ["active", "abandoned", "failed"],
  completing: ["completed", "failed"],
  completed:  [], // terminal — no further transitions
  abandoned:  [], // terminal
  failed:     [], // terminal
};

/**
 * Validate and apply a session status transition.
 * Throws if the transition is invalid.
 *
 * @param {object} session  - InterviewSession document
 * @param {string} newStatus
 */
function assertValidTransition(session, newStatus) {
  const allowed = VALID_TRANSITIONS[session.status] || [];
  if (!allowed.includes(newStatus)) {
    const err = new Error(`Invalid state transition: ${session.status} → ${newStatus}`);
    err.code   = "INVALID_INTERVIEW_STATE";
    err.status = 409;
    throw err;
  }
}

// ── Session DTO ───────────────────────────────────────────────────────────────
// Maps internal session document to the public API response shape.
// NEVER exposes internal AI metadata, generation reasons, or raw DB fields.
function sessionToDto(session) {
  return {
    id:                   session._id,
    status:               session.status,
    mode:                 session.configuration?.contextSources?.join("+") || "mixed",
    interviewType:        session.configuration?.interviewType,
    company:              session.configuration?.company,
    role:                 session.configuration?.targetRole,
    difficulty:           session.configuration?.difficulty,
    durationMinutes:      session.configuration?.durationMinutes,
    questionLimit:        session.configuration?.questionLimit,
    questionsGenerated:   (session.progress?.currentQuestionNumber || 0),
    questionsCompleted:   session.progress?.questionsCompleted || 0,
    currentQuestionId:    session.progress?.currentQuestionId || null,
    startedAt:            session.startedAt,
    completedAt:          session.completedAt,
    lastActivityAt:       session.lastActivityAt,
    resumeVersionId:      session.resumeVersionId,
    hasReport:            !!session.finalReport && session.finalReport.status === "ready",
    reportStatus:         session.finalReport?.status || "not_started",
  };
}

function questionToDto(q, attemptNumber = null) {
  return {
    id:                      q._id,
    number:                  q.questionNumber,
    text:                    q.text,
    type:                    q.source === "adaptive_follow_up" ? "follow_up" : "initial",
    topic:                   q.generationContext?.topic || q.category,
    category:                q.category,
    difficulty:              q.difficulty,
    expectedDurationSeconds: 120,
    attemptNumber:           attemptNumber,
    maxRetries:              q.maxRetries,
    attemptCount:            q.attemptCount,
    status:                  q.status,
  };
}

// ── Phase 3: Session Creation ─────────────────────────────────────────────────

/**
 * Create a new interview session.
 * Does NOT start the interview — that happens via startInterview().
 *
 * @param {string} userId
 * @param {object} body - Validated request body
 * @returns {Promise<object>} Session DTO
 */
async function createInterview(userId, body) {
  const {
    mode,
    company,
    role,
    jobDescription,
    useResume,
    resumeVersionId,
    interviewType = "mixed",
    difficulty    = "adaptive",
    durationMinutes = 30,
    questionLimit   = 10,
  } = body;

  // Resolve resume ownership if requested (interview-api.md §12)
  if (useResume && resumeVersionId) {
    // Validates existence + ownership + ready status
    await resolveResumeVersion(resumeVersionId, userId);
  }

  // Derive context sources from mode
  const contextSources = [];
  if (mode === "company"         || mode === "mixed") { if (company)        contextSources.push("company"); }
  if (mode === "role"            || mode === "mixed") { if (role)           contextSources.push("role"); }
  if (mode === "job_description" || mode === "mixed") { if (jobDescription) contextSources.push("job_description"); }
  if (mode === "resume"          || mode === "mixed") { if (useResume)      contextSources.push("resume"); }
  // Ensure at least the chosen mode is represented
  if (contextSources.length === 0 && mode !== "mixed") contextSources.push(mode);

  const session = new InterviewSession({
    userId,
    resumeVersionId: (useResume && resumeVersionId) ? resumeVersionId : null,
    status:          "created",
    configuration: {
      contextSources,
      company:        company?.trim()        || "",
      targetRole:     role?.trim()           || "",
      jobDescription: jobDescription?.trim() || "",
      interviewType,
      difficulty,
      durationMinutes: Number(durationMinutes),
      questionLimit:   Number(questionLimit),
    },
    interviewContextSnapshot: null, // set on start
    lastActivityAt: new Date(),
  });

  await session.save();
  return sessionToDto(session);
}

// ── Phase 3: Start Interview ──────────────────────────────────────────────────

/**
 * Start an interview session.
 * Builds context, creates snapshot, generates first question.
 * Idempotent: if already active, returns current state.
 *
 * Per interview-api.md §15–16.
 *
 * @param {string} sessionId
 * @param {string} userId
 * @returns {Promise<object>} { session, question }
 */
async function startInterview(sessionId, userId) {
  assertValidObjectId(sessionId, "Interview session");
  const session = await InterviewSession.findOne({ _id: sessionId, userId });
  if (!session) {
    const err = new Error("Interview session not found.");
    err.code = "INTERVIEW_NOT_FOUND"; err.status = 404;
    throw err;
  }

  // Idempotency: already started (interview-api.md §16)
  if (session.status === "active") {
    const currentQ = session.progress?.currentQuestionId
      ? await InterviewQuestion.findOne({ _id: session.progress.currentQuestionId, userId })
      : null;
    return {
      session:  sessionToDto(session),
      question: currentQ ? questionToDto(currentQ, 1) : null,
      alreadyStarted: true,
    };
  }

  assertValidTransition(session, "starting");

  // Mark as starting
  session.status = "starting";
  session.processing.operation = "starting";
  session.processing.operationStartedAt = new Date();
  session.processing.operationId = uuidv4();
  session.startedAt = new Date();
  session.lastActivityAt = new Date();
  await session.save();

  try {
    // Resolve resume version if applicable
    let resumeVersion = null;
    if (session.resumeVersionId) {
      resumeVersion = await resolveResumeVersion(session.resumeVersionId.toString(), userId);
    }

    // Build normalized context + immutable snapshot
    const normalizedCtx = buildNormalizedContext({
      mode:          session.configuration.contextSources.join("+"),
      company:       session.configuration.company,
      role:          session.configuration.targetRole,
      jobDescription:session.configuration.jobDescription,
      resumeVersion,
      interviewType: session.configuration.interviewType,
      difficulty:    session.configuration.difficulty,
    });

    const snapshot = buildContextSnapshot(normalizedCtx, session.resumeVersionId);

    // Initialize adaptive strategy
    const strategy = createInitialStrategy(session.configuration);

    // Generate opening question
    const strategyCtx = getStrategyContext(strategy, session.configuration.questionLimit);
    const qResult = await aiService.generateQuestion({
      interviewContext: normalizedCtx,
      candidateContext: normalizedCtx.candidate,
      strategyContext:  strategyCtx,
      previousQuestions:[],
      isFirstQuestion:  true,
      isFollowUp:       false,
    });

    if (qResult.action !== "question") {
      throw new Error("AI did not return a question for session start.");
    }

    // Persist question
    const question = new InterviewQuestion({
      sessionId:      session._id,
      userId,
      questionNumber: 1,
      sequenceIndex:  0,
      text:           qResult.question.text,
      category:       qResult.question.category,
      difficulty:     qResult.question.difficulty,
      source:         "initial",
      generationContext: {
        reason: qResult.reason || "opening",
        topic:  qResult.question.topic || qResult.question.category,
      },
      status:    "asked",
      maxRetries: MAX_RETRIES_PER_QUESTION,
      askedAt:   new Date(),
    });
    await question.save();

    // Update session — transition to active
    session.status = "active";
    session.interviewContextSnapshot = snapshot;
    session.progress.currentQuestionId     = question._id;
    session.progress.currentQuestionNumber = 1;
    session.progress.totalQuestions        = session.configuration.questionLimit;
    session.processing.operation = null;
    session.processing.operationId = null;
    session.processing.errorCode   = null;
    session.processing.errorMessage = null;
    session.lastActivityAt = new Date();
    // Persist strategy in session (as Mixed field or embedded in processing metadata)
    // Store compactly in a session-level field for use by next question generation
    session._strategyCache = strategy; // Not persisted directly — rebuilt from questions on recovery
    await session.save();

    return {
      session:  sessionToDto(session),
      question: questionToDto(question, 1),
      alreadyStarted: false,
    };

  } catch (err) {
    // Preserve session — mark as failed (recoverable)
    session.status = "failed";
    session.processing.operation     = null;
    session.processing.errorCode     = err.code    || "START_FAILED";
    session.processing.errorMessage  = err.message || "Failed to start interview.";
    session.processing.retryable     = true;
    await session.save();
    throw err;
  }
}

// ── Phase 3: Get Interview ────────────────────────────────────────────────────

/**
 * Get a session by ID (scoped to authenticated user).
 *
 * @param {string} sessionId
 * @param {string} userId
 * @returns {Promise<object>} Session DTO
 */
async function getInterview(sessionId, userId) {
  assertValidObjectId(sessionId, "Interview session");
  const session = await InterviewSession.findOne({ _id: sessionId, userId });
  if (!session) {
    const err = new Error("Interview session not found.");
    err.code = "INTERVIEW_NOT_FOUND"; err.status = 404;
    throw err;
  }
  return sessionToDto(session);
}

// ── Phase 3: Get Current Question ─────────────────────────────────────────────

/**
 * Return the current unanswered question for session recovery.
 * Per interview-api.md §17.
 *
 * @param {string} sessionId
 * @param {string} userId
 * @returns {Promise<object|null>} Question DTO or null
 */
async function getCurrentQuestion(sessionId, userId) {
  assertValidObjectId(sessionId, "Interview session");
  const session = await InterviewSession.findOne({ _id: sessionId, userId });
  if (!session) {
    const err = new Error("Interview session not found.");
    err.code = "INTERVIEW_NOT_FOUND"; err.status = 404;
    throw err;
  }

  if (!session.progress?.currentQuestionId) return null;

  const question = await InterviewQuestion.findOne({
    _id:       session.progress.currentQuestionId,
    sessionId: session._id,
    userId,
  });

  if (!question || question.status === "answered") return null;

  // ── Pending-attempt recovery ───────────────────────────────────────────────
  // If a prior submission failed (AI evaluation error) the questionId is held in
  // pendingFailedAttemptId so the frontend can reevaluate instead of resubmitting.
  // We load transcript.text only — never analysis or scores from a failed attempt.
  let pendingAttempt = null;
  if (question.pendingFailedAttemptId) {
    const pa = await AnswerAttempt.findOne(
      { _id: question.pendingFailedAttemptId,
        sessionId: session._id,
        userId,
        status: "failed",
        "processing.retryable": true },
      { "transcript.text": 1, "processing.retryable": 1, "processing.attempts": 1 }
    ).lean();
    if (pa) {
      pendingAttempt = {
        id:             pa._id,
        transcriptText: pa.transcript?.text || null,
        retryable:      pa.processing?.retryable ?? true,
        reevalCount:    pa.processing?.attempts  ?? 0,
      };
    } else {
      // Reference stale (attempt may have been reevaluated and succeeded in another tab)
      // Clear it to avoid polluting future requests — save asynchronously, non-blocking
      InterviewQuestion.findByIdAndUpdate(question._id, { pendingFailedAttemptId: null })
        .catch(() => {});
    }
  }

  return { ...questionToDto(question, question.attemptCount + 1), pendingAttempt };
}

// ── Phase 5: Submit Answer ────────────────────────────────────────────────────

/**
 * Submit an answer attempt for the current question.
 * Creates AnswerAttempt, processes audio/transcript, evaluates, updates session.
 *
 * Returns either a final evaluation (synchronous) or processing state.
 * Per interview-api.md §19–25.
 *
 * @param {string} sessionId
 * @param {string} questionId
 * @param {string} userId
 * @param {object} params
 * @param {object|null} params.file          - Multer file (audio upload)
 * @param {number|null} params.durationMs    - Client-reported duration
 * @param {string|null} params.idempotencyKey
 * @returns {Promise<object>} Answer attempt result
 */
async function submitAnswer(sessionId, questionId, userId, { file, durationMs, idempotencyKey, textAnswer }) {
  // ── Ownership + state validation ──────────────────────────────────────────
  assertValidObjectId(sessionId, "Interview session");
  assertValidObjectId(questionId, "Question");
  const session = await InterviewSession.findOne({ _id: sessionId, userId });
  if (!session) {
    const err = new Error("Interview session not found.");
    err.code = "INTERVIEW_NOT_FOUND"; err.status = 404;
    throw err;
  }

  if (session.status !== "active" && session.status !== "paused" && session.status !== "completing") {
    const err = new Error(`Interview is not active (status: ${session.status}).`);
    err.code = "INTERVIEW_NOT_ACTIVE"; err.status = 409;
    throw err;
  }

  const question = await InterviewQuestion.findOne({
    _id: questionId, sessionId: session._id, userId,
  });
  if (!question) {
    const err = new Error("Question not found.");
    err.code = "QUESTION_NOT_FOUND"; err.status = 404;
    throw err;
  }
  if (question.status === "answered") {
    const err = new Error("This question has already been answered.");
    err.code = "QUESTION_ALREADY_ANSWERED"; err.status = 409;
    throw err;
  }

  // ── Idempotency: prevent duplicate submissions ─────────────────────────────
  if (idempotencyKey) {
    const existing = await AnswerAttempt.findOne({ idempotencyKey });
    if (existing) {
      return answerAttemptToResult(existing, question);
    }
  }

  // ── Concurrency guard: prevent simultaneous submissions ───────────────────
  if (session.processing?.operation === "processing_answer") {
    const err = new Error("An answer is already being processed for this session.");
    err.code = "ANSWER_PROCESSING"; err.status = 409;
    throw err;
  }

  // ── Failed-attempt guard: route to reevaluation instead of a new attempt ──
  // If pendingFailedAttemptId is set, a prior submission failed (AI evaluation
  // error, rate limit, etc.) but its AnswerAttempt was persisted. The correct
  // recovery path is POST /answers/:id/reevaluate, NOT a new submission.
  //
  // Without this guard the caller would compute attemptNumber = attemptCount + 1 = 1,
  // try to insert a new AnswerAttempt with { questionId, attemptNumber: 1 }, and
  // hit E11000 because that document already exists in "failed" status.
  if (question.pendingFailedAttemptId) {
    const err = new Error("A previous answer attempt needs reevaluation. Use the reevaluate endpoint.");
    err.code = "EVALUATION_PENDING_REEVALUATION"; err.status = 409;
    err.attemptId = question.pendingFailedAttemptId.toString();
    throw err;
  }

  // ── Compute the next attempt number from persisted data, not in-memory state ──
  // question.attemptCount is only incremented in the success path. If a prior
  // attempt failed (evaluation or transcription) the in-memory count is stale.
  // Count actual persisted attempts so attemptNumber is always unique, even when
  // attemptCount was not incremented by the previous failure.
  //
  // Using countDocuments is safe here because:
  //  - We are the only writer for this questionId (session ownership + status check above)
  //  - The unique index { questionId, attemptNumber } will still catch any race
  //  - If a race somehow produces the same number, E11000 is the hard safety net
  const existingAttemptCount = await AnswerAttempt.countDocuments({ questionId: question._id });
  const attemptNumber = existingAttemptCount + 1;
  const isRetry = attemptNumber > 1;

  // Get previous attempt for improvement comparison
  let previousAttempt = null;
  if (isRetry) {
    previousAttempt = await AnswerAttempt.findOne(
      { questionId: question._id, attemptNumber: attemptNumber - 1 },
      { "analysis.overallScore": 1, "analysis.communication": 1, "analysis.technicalAccuracy": 1, "analysis.structure": 1 }
    );
  }

  // ── Determine answer input type ───────────────────────────────────────────
  // Three valid paths (per interview-api.md §19, interview-backend-spec.md §22):
  //   text  → submitted text IS the transcript; no STT needed
  //   audio → send to speechService for STT
  //   neither → proceed with empty transcript (dev_echo / future async)
  const cleanTextAnswer = typeof textAnswer === "string" ? textAnswer.trim() : "";
  const hasText  = cleanTextAnswer.length > 0;
  const hasAudio = !!file;

  // Validate: at least one answer source required
  if (!hasText && !hasAudio) {
    const err = new Error("An answer is required. Submit either audio or a text answer.");
    err.code = "INVALID_ANSWER"; err.status = 400;
    throw err;
  }

  // ── Create answer attempt ─────────────────────────────────────────────────
  const attempt = new AnswerAttempt({
    sessionId:    session._id,
    questionId:   question._id,
    userId,
    attemptNumber,
    isRetry,
    // Text answers skip "uploaded"; audio starts at "uploaded" before STT
    status:       hasAudio ? "uploaded" : "transcribing",
    idempotencyKey: idempotencyKey || null,
    submittedAt:  new Date(),
    audio: hasAudio ? {
      storageReference: file.filename,
      mimeType:         file.mimetype,
      durationMs:       durationMs ? Number(durationMs) : null,
      sizeBytes:        file.size,
      uploadedAt:       new Date(),
    } : {},
  });
  await attempt.save();

  // Mark session as processing
  session.processing.operation          = "processing_answer";
  session.processing.operationStartedAt = new Date();
  session.processing.operationId        = attempt._id.toString();
  session.progress.attemptsCount        = (session.progress.attemptsCount || 0) + 1;
  if (isRetry) session.progress.retryCount = (session.progress.retryCount || 0) + 1;
  session.lastActivityAt = new Date();
  await session.save();

  // ── Process synchronously (V1) — lifecycle matches async contract ─────────
  try {
    // 1. Transcription — three-way branch
    attempt.status = "transcribing";
    await attempt.save();

    let transcriptResult;

    if (hasText) {
      // ── Path A: text answer — submitted text IS the transcript ─────────────
      // No STT call. The text the candidate typed is used directly.
      // This enables full AI evaluation testing without an STT API key.
      console.log("[interviewService] Text answer received — bypassing STT pipeline.");
      transcriptResult = {
        text:      cleanTextAnswer,
        language:  "en",
        confidence: null,   // not measurable from text input
        provider:  "text_input",
        model:     "none",
        available: true,
      };

    } else {
      // ── Path B: audio answer — use existing STT pipeline ──────────────────
      try {
        transcriptResult = await speechService.transcribeAudio(file.filename, file.mimetype);
      } catch (sttErr) {
        console.error("[interviewService] Transcription failed:", sttErr.message);
        attempt.status = "failed";
        attempt.processing.errorCode    = sttErr.code    || "TRANSCRIPTION_FAILED";
        attempt.processing.errorMessage = sttErr.message || "Transcription failed.";
        attempt.processing.retryable    = true;
        await attempt.save();

        session.processing.operation    = null;
        session.processing.errorCode    = "TRANSCRIPTION_FAILED";
        session.processing.retryable    = true;
        await session.save();

        // Record the failed attempt so the frontend can discover it after refresh
        // and offer reevaluation instead of a duplicate submission.
        // Note: for TRANSCRIPTION_FAILED the transcript is empty, so reevaluateAnswer
        // will reject this attempt (INVALID_ANSWER) — but pendingFailedAttemptId
        // still ensures the frontend shows the correct error path rather than
        // silently permitting a resubmission that would hit E11000.
        await InterviewQuestion.updateOne(
          { _id: question._id },
          { pendingFailedAttemptId: attempt._id }
        ).catch(() => {});

        const err = new Error("We couldn't transcribe your audio. Please try again.");
        err.code = "TRANSCRIPTION_FAILED"; err.status = 502;
        err.attemptId = attempt._id.toString();
        throw err;
      } finally {
        // Cleanup runs on both success and failure paths.
        // deleteAudioAfterProcessing is already idempotent (deleteStoredFile checks
        // fs.existsSync before unlinking and swallows ENOENT — confirmed in fileUtils.js).
        try {
          speechService.deleteAudioAfterProcessing(file.filename);
          attempt.audio.deleted = true;
        } catch (cleanupErr) {
          console.error("[interviewService] Audio cleanup error (non-fatal):", cleanupErr.message);
        }
      }

      // Validate STT result — only for audio path (hasAudio === true)
      const malformed = !transcriptResult || typeof transcriptResult !== "object";
      const empty     = !malformed && (!transcriptResult.text || !transcriptResult.text.trim());

      if (malformed || empty) {
        const code    = malformed ? "SPEECH_MALFORMED_RESPONSE" : "SPEECH_EMPTY_TRANSCRIPT";
        const message = malformed
          ? "Speech provider returned a malformed response."
          : "No speech was detected in your recording. Please try again.";
        const status  = malformed ? 502 : 422;

        // Follow the same failure lifecycle as catch(sttErr) above.
        // Note: pendingFailedAttemptId is set so the frontend's reevaluateFailedAttempt
        // path is triggered on "Try Again". reevaluateAnswer will reject an attempt with
        // an empty transcript (the INVALID_ANSWER guard already exists). That is
        // intentional — the user will need to re-record.
        attempt.status = "failed";
        attempt.processing.errorCode    = code;
        attempt.processing.errorMessage = message;
        attempt.processing.retryable    = true;
        await attempt.save();

        session.processing.operation    = null;
        session.processing.errorCode    = code;
        session.processing.retryable    = true;
        await session.save();

        await InterviewQuestion.updateOne(
          { _id: question._id },
          { pendingFailedAttemptId: attempt._id }
        ).catch(() => {});

        const err = new Error(message);
        err.code      = code;
        err.status    = status;
        err.attemptId = attempt._id.toString();
        throw err;
      }
    }

    // Store transcript (same structure regardless of input path)
    attempt.transcript = {
      text:        transcriptResult.text        || "",
      language:    transcriptResult.language    || "en",
      confidence:  transcriptResult.confidence  ?? null,
      provider:    transcriptResult.provider    || "none",
      model:       transcriptResult.model       || "none",
      generatedAt: new Date(),
    };

    // 2. Deterministic speech metrics (calculated from transcript text; never fabricated)
    // For text answers: duration and audio-derived metrics are null (not measurable)
    const speechMetrics = speechService.computeSpeechMetrics({
      transcript:     transcriptResult.text || "",
      durationMs:     durationMs ? Number(durationMs) : null,
      audioDurationMs: hasAudio ? (attempt.audio?.durationMs ?? null) : null,
    });

    // 3. AI evaluation
    attempt.status = "analyzing";
    await attempt.save();

    // Load session context for evaluation
    const snapshot = session.interviewContextSnapshot || {};
    const evalCtx = {
      question: {
        text:       question.text,
        category:   question.category,
        topic:      question.generationContext?.topic || question.category,
        difficulty: question.difficulty,
      },
      transcript:     attempt.transcript,
      speechMetrics,
      interviewContext: {
        interviewType: session.configuration?.interviewType,
        role:          snapshot.targetRole || session.configuration?.targetRole,
        company:       snapshot.company   || session.configuration?.company,
      },
      candidateContext: {
        experienceLevel: snapshot.experienceLevel || "",
      },
    };

    let evaluation;
    try {
      evaluation = await aiService.evaluateAnswer(evalCtx);
    } catch (evalErr) {
      console.error("[interviewService] Evaluation failed:", evalErr.message);
      attempt.status = "failed";
      attempt.processing.errorCode    = evalErr.code    || "EVALUATION_FAILED";
      attempt.processing.errorMessage = evalErr.message || "Evaluation failed.";
      attempt.processing.retryable    = true;
      await attempt.save();

      session.processing.operation = null;
      session.processing.errorCode = "EVALUATION_FAILED";
      await session.save();

      // Record the failed attempt on the question so the frontend can discover it
      // after a page refresh (getCurrentQuestion returns pendingAttempt).
      // Use updateOne so we don't reload the full question document.
      await InterviewQuestion.updateOne(
        { _id: question._id },
        { pendingFailedAttemptId: attempt._id }
      );

      const err = new Error("We couldn't evaluate your answer. Please try again.");
      err.code = "EVALUATION_FAILED"; err.status = 502;
      // Attach the attempt ID so the controller can include it in the error response.
      // The frontend uses this to route Try Again to reevaluateAnswer instead of
      // creating a new submission — preventing the E11000 duplicate key error.
      err.attemptId = attempt._id.toString();
      err.transcript = attempt.transcript?.text || null;
      throw err;
    }

    // 4. Merge speech metrics into analysis
    const mergedAnalysis = {
      ...evaluation,
      speech: speechMetrics,
      fillerWords: {
        total:       speechMetrics.fillerWordCount ?? 0,
        occurrences: speechMetrics.fillerWordOccurrences || [],
      },
    };

    // 5. Improvement comparison (if retry)
    let improvement = {};
    if (isRetry && previousAttempt?.analysis?.overallScore !== undefined) {
      const prevScore  = previousAttempt.analysis.overallScore;
      const newScore   = evaluation.overallScore;
      const scoreDelta = newScore !== null && prevScore !== null ? newScore - prevScore : null;
      improvement = {
        previousAttemptId:  previousAttempt._id,
        scoreDelta,
        communicationDelta: _delta(evaluation.communication, previousAttempt.analysis?.communication),
        technicalDelta:     _delta(evaluation.technicalAccuracy, previousAttempt.analysis?.technicalAccuracy),
        structureDelta:     _delta(evaluation.structure, previousAttempt.analysis?.structure),
        improved:           scoreDelta !== null ? scoreDelta > 0 : null,
        improvedAreas:      _identifyImprovedAreas(evaluation, previousAttempt.analysis),
        remainingIssues:    evaluation.weaknesses || [],
      };
    }

    // 6. Persist completed attempt
    attempt.analysis     = mergedAnalysis;
    attempt.answerQuality = _qualityFromClassification(evaluation.classification);
    attempt.improvement  = improvement;
    attempt.status       = "completed";
    attempt.completedAt  = new Date();
    attempt.aiMetadata   = {
      provider:        "openrouter",
      model:           process.env.AI_MODEL || "",
      promptVersion:   "evaluation-v1",
      analysisVersion: "v1",
      generatedAt:     new Date(),
    };
    await attempt.save();

    // 7. Update question
    question.attemptCount  = attemptNumber;
    question.latestAttemptId = attempt._id;
    // Clear any stale pending-failed reference — this attempt succeeded.
    // Do NOT touch latestAttemptId on the failure path; this is the only place
    // latestAttemptId is assigned, preserving its "most recent successful attempt" semantics.
    question.pendingFailedAttemptId = null;
    question.status        = "answered";
    question.completedAt   = new Date();
    await question.save();

    // 8. Update session progress
    session.processing.operation = null;
    session.processing.errorCode = null;
    session.processing.operationId = null;
    session.progress.questionsCompleted = (session.progress.questionsCompleted || 0) + 1;
    session.progress.lastCompletedQuestionId = question._id;
    session.lastActivityAt = new Date();
    await session.save();

    return answerAttemptToResult(attempt, question);

  } catch (err) {
    // If we haven't already set the error state, do it now
    if (attempt.status !== "failed") {
      attempt.status = "failed";
      attempt.processing.errorCode = err.code || "PROCESSING_FAILED";
      attempt.processing.retryable = true;
      await attempt.save().catch(() => {});
    }
    if (session.processing?.operation) {
      session.processing.operation = null;
      await session.save().catch(() => {});
    }
    throw err;
  }
}

// ── Phase 5: Get Answer Status ────────────────────────────────────────────────

/**
 * Get the current processing state of an answer attempt.
 * Per interview-api.md §25.
 */
async function getAnswerStatus(sessionId, answerAttemptId, userId) {
  assertValidObjectId(sessionId, "Interview session");
  assertValidObjectId(answerAttemptId, "Answer attempt");
  const session = await InterviewSession.findOne({ _id: sessionId, userId });
  if (!session) {
    const err = new Error("Interview session not found.");
    err.code = "INTERVIEW_NOT_FOUND"; err.status = 404;
    throw err;
  }

  const attempt = await AnswerAttempt.findOne({
    _id: answerAttemptId, sessionId: session._id, userId,
  });
  if (!attempt) {
    const err = new Error("Answer attempt not found.");
    err.code = "ANSWER_NOT_FOUND"; err.status = 404;
    throw err;
  }

  // Fetch the owning question so retry.available is accurate
  const question = attempt.questionId
    ? await InterviewQuestion.findOne({ _id: attempt.questionId, sessionId: session._id, userId })
    : null;

  return answerAttemptToResult(attempt, question);
}

// ── Phase 5b: Reevaluate Failed Answer Attempt ───────────────────────────────

/**
 * Re-run AI evaluation on an existing failed AnswerAttempt, reusing its saved
 * transcript without creating a new document or consuming the user's deliberate
 * answer-retry quota (question.attemptCount / question.maxRetries).
 *
 * Bounded by attempt.processing.attempts (unused until now) to prevent infinite
 * reevaluation loops. The bound uses AI_MAX_RETRIES from env (default 3) — this
 * is the same value that bounds automatic provider-level retries in withRetry(),
 * so total evaluation attempts for one answer are at most AI_MAX_RETRIES
 * (automatic) × AI_MAX_RETRIES (manual reevaluation) before the user is told
 * to submit a fresh answer. No .env change required.
 *
 * Atomic session + attempt claims via findOneAndUpdate prevent concurrent
 * reevaluation from double-running the AI call. Lock is released in all paths
 * (success, failure, unexpected error).
 *
 * @param {string} sessionId
 * @param {string} attemptId
 * @param {string} userId
 * @returns {Promise<object>} Answer attempt result (same shape as submitAnswer)
 */
async function reevaluateAnswer(sessionId, attemptId, userId, { isCheckpoint = false } = {}) {
  assertValidObjectId(sessionId, "Interview session");
  assertValidObjectId(attemptId,  "Answer attempt");

  // ── 1. Atomic session lock claim ────────────────────────────────────────────
  // findOneAndUpdate with { "processing.operation": null } in the filter is
  // atomic at the document level — MongoDB guarantees exactly one of two
  // concurrent requests gets the lock; the other gets null and a 409.
  // Accepts status: "active", "paused", or "completing" (checkpoint state).
  const session = await InterviewSession.findOneAndUpdate(
    { _id: sessionId, userId, status: { $in: ["active", "paused", "completing"] }, "processing.operation": null },
    {
      $set: {
        "processing.operation":          "processing_answer",
        "processing.operationStartedAt": new Date(),
        "processing.operationId":        attemptId,
        "processing.errorCode":          null,
      },
    },
    { new: true }
  );
  if (!session) {
    // Either session not found/not active, or another operation holds the lock.
    // Distinguish for a clearer error:
    const existing = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!existing) {
      const err = new Error("Interview session not found.");
      err.code = "INTERVIEW_NOT_FOUND"; err.status = 404;
      throw err;
    }
    if (!["active", "paused", "completing"].includes(existing.status)) {
      // Abandoned/completed/failed sessions cannot be reevaluated.
      const err = new Error(`Interview is not active (status: ${existing.status}).`);
      err.code = "INTERVIEW_NOT_ACTIVE"; err.status = 409;
      throw err;
    }
    const err = new Error("An answer is already being processed for this session.");
    err.code = "ANSWER_PROCESSING"; err.status = 409;
    throw err;
  }

  // ── 2. Atomic attempt claim: failed → analyzing ─────────────────────────────
  // Filter on status:"failed" + retryable:true + attempts < AI_MAX_RETRIES so
  // a concurrent reevaluate call on the same attempt gets null (already claimed)
  // or gets rejected (exhausted retries). $inc processing.attempts is atomic.
  const { AI_MAX_RETRIES, CHECKPOINT_REEVAL_LIMIT } = require("../config/env");
  const maxReeval = isCheckpoint ? CHECKPOINT_REEVAL_LIMIT : AI_MAX_RETRIES;

  const attemptFilter = isCheckpoint
    ? {
        _id: attemptId,
        sessionId: session._id,
        userId,
        status: "failed",
        "processing.retryable": true,
        "processing.checkpointAttempts": { $lt: maxReeval },
      }
    : {
        _id: attemptId,
        sessionId: session._id,
        userId,
        status: "failed",
        "processing.retryable": true,
        "processing.attempts": { $lt: maxReeval },
      };

  const attemptInc = isCheckpoint
    ? { $inc: { "processing.checkpointAttempts": 1 } }
    : { $inc: { "processing.attempts": 1 } };

  const attempt = await AnswerAttempt.findOneAndUpdate(
    attemptFilter,
    {
      $set: {
        status: "analyzing",
        "processing.errorCode":   null,
        "processing.errorMessage": null,
      },
      ...attemptInc,
    },
    { new: true }
  );
  if (!attempt) {
    // Release the session lock — we claimed it but can't proceed.
    await InterviewSession.updateOne(
      { _id: session._id },
      { $set: { "processing.operation": null, "processing.operationId": null } }
    ).catch(() => {});

    // Determine the reason for a clearer error
    const existingAttempt = await AnswerAttempt.findOne({ _id: attemptId, sessionId: session._id, userId });
    if (!existingAttempt) {
      const err = new Error("Answer attempt not found.");
      err.code = "ANSWER_NOT_FOUND"; err.status = 404;
      throw err;
    }
    if (existingAttempt.status === "completed") {
      const err = new Error("This answer has already been evaluated successfully.");
      err.code = "QUESTION_ALREADY_ANSWERED"; err.status = 409;
      throw err;
    }
    const exhausted = isCheckpoint
      ? (existingAttempt.processing?.checkpointAttempts || 0) >= maxReeval
      : (existingAttempt.processing?.attempts || 0) >= maxReeval;
    if (exhausted) {
      // Clear the question lock so the checkpoint can surface this question cleanly.
      // The failed attempt stays in DB — only the lock is released.
      await InterviewQuestion.updateOne(
        { _id: existingAttempt.questionId },
        { $unset: { pendingFailedAttemptId: 1 } }
      ).catch(() => {});
      const err = new Error("Maximum reevaluation attempts reached. Please submit a new answer.");
      err.code = "RETRY_LIMIT_REACHED"; err.status = 409;
      throw err;
    }
    // Already being reevaluated by another request
    const err = new Error("This answer is already being reevaluated.");
    err.code = "ANSWER_PROCESSING"; err.status = 409;
    throw err;
  }

  // ── 3. Validate transcript exists ──────────────────────────────────────────
  const transcriptText = attempt.transcript?.text || "";
  if (!transcriptText.trim()) {
    // No transcript to reevaluate — release locks and tell the user to resubmit.
    await AnswerAttempt.updateOne(
      { _id: attempt._id },
      { $set: { status: "failed", "processing.errorCode": "NO_TRANSCRIPT",
                    "processing.errorMessage": "No transcript saved for this attempt.",
                    "processing.retryable": false } }
    ).catch(() => {});
    await InterviewSession.updateOne(
      { _id: session._id },
      { $set: { "processing.operation": null, "processing.operationId": null } }
    ).catch(() => {});
    const err = new Error("No saved answer was found to reevaluate. Please submit your answer again.");
    err.code = "INVALID_ANSWER"; err.status = 400;
    throw err;
  }

  // ── 4. Load question + rebuild evaluation context ───────────────────────────
  const question = await InterviewQuestion.findOne({
    _id: attempt.questionId, sessionId: session._id, userId,
  });
  if (!question) {
    // Orphaned attempt — release and fail safely
    await AnswerAttempt.updateOne(
      { _id: attempt._id },
      { $set: { status: "failed", "processing.errorCode": "QUESTION_NOT_FOUND" } }
    ).catch(() => {});
    await InterviewSession.updateOne(
      { _id: session._id },
      { $set: { "processing.operation": null, "processing.operationId": null } }
    ).catch(() => {});
    const err = new Error("Question not found.");
    err.code = "QUESTION_NOT_FOUND"; err.status = 404;
    throw err;
  }

  try {
    // Recompute speech metrics from the saved transcript (deterministic)
    const speechMetrics = speechService.computeSpeechMetrics({
      transcript:     transcriptText,
      durationMs:     attempt.audio?.durationMs ?? null,
      audioDurationMs: attempt.audio?.durationMs ?? null,
    });

    const snapshot = session.interviewContextSnapshot || {};
    const evalCtx = {
      question: {
        text:       question.text,
        category:   question.category,
        topic:      question.generationContext?.topic || question.category,
        difficulty: question.difficulty,
      },
      transcript: { text: transcriptText, language: attempt.transcript?.language || "en" },
      speechMetrics,
      interviewContext: {
        interviewType: session.configuration?.interviewType,
        role:          snapshot.targetRole || session.configuration?.targetRole,
        company:      snapshot.company   || session.configuration?.company,
      },
      candidateContext: {
        experienceLevel: snapshot.experienceLevel || "",
      },
    };

    // ── 5. Run AI evaluation (withRetry inside aiService.evaluateAnswer) ────────
    const evaluation = await aiService.evaluateAnswer(evalCtx);

    // ── 6. Merge + persist success ─────────────────────────────────────────────
    const mergedAnalysis = {
      ...evaluation,
      speech: speechMetrics,
      fillerWords: {
        total:       speechMetrics.fillerWordCount ?? 0,
        occurrences: speechMetrics.fillerWordOccurrences || [],
      },
    };

    // Improvement comparison: if this is a retry attempt (attemptNumber > 1),
    // compare against the previous completed attempt.
    let improvement = {};
    if (attempt.isRetry) {
      const prevAttempt = await AnswerAttempt.findOne(
        { questionId: question._id, attemptNumber: attempt.attemptNumber - 1, status: "completed" },
        { "analysis.overallScore": 1, "analysis.communication": 1,
          "analysis.technicalAccuracy": 1, "analysis.structure": 1 }
      );
      if (prevAttempt?.analysis?.overallScore !== undefined) {
        const prevScore = prevAttempt.analysis.overallScore;
        const newScore  = evaluation.overallScore;
        const scoreDelta = newScore !== null && prevScore !== null ? newScore - prevScore : null;
        improvement = {
          previousAttemptId:  prevAttempt._id,
          scoreDelta,
          communicationDelta: _delta(evaluation.communication,    prevAttempt.analysis?.communication),
          technicalDelta:     _delta(evaluation.technicalAccuracy, prevAttempt.analysis?.technicalAccuracy),
          structureDelta:     _delta(evaluation.structure,         prevAttempt.analysis?.structure),
          improved:           scoreDelta !== null ? scoreDelta > 0 : null,
          improvedAreas:      _identifyImprovedAreas(evaluation, prevAttempt.analysis),
          remainingIssues:    evaluation.weaknesses || [],
        };
      }
    }

    attempt.analysis      = mergedAnalysis;
    attempt.answerQuality = _qualityFromClassification(evaluation.classification);
    attempt.improvement   = improvement;
    attempt.status        = "completed";
    attempt.completedAt   = new Date();
    attempt.aiMetadata    = {
      provider:        "openrouter",
      model:           process.env.AI_MODEL || "",
      promptVersion:   "evaluation-v1",
      analysisVersion: "v1",
      generatedAt:     new Date(),
    };
    await attempt.save();

    // ── 7. Update question + session ───────────────────────────────────────────
    // latestAttemptId is set ONLY here (success path) — preserves its semantics.
    // pendingFailedAttemptId is cleared because this attempt now succeeded.
    // attemptCount is NOT incremented — we reused the existing attempt.
    // The question may have been counted as completed before (if a previous
    // attempt succeeded then the user retried). Track whether this question was
    // already counted before we flip status to "answered".
    const wasAlreadyAnswered = question.status === "answered";
    const wasAlreadyCounted  = wasAlreadyAnswered ||
      (session.progress.lastCompletedQuestionId &&
       session.progress.lastCompletedQuestionId.equals(question._id));

    question.latestAttemptId         = attempt._id;
    question.pendingFailedAttemptId  = null;
    question.status                   = "answered";
    question.completedAt               = new Date();
    await question.save();

    // Only increment questionsCompleted if this question wasn't already counted.
    // For the common case (first attempt failed, reevaluation succeeds), the
    // question was never "answered" so questionsCompleted wasn't incremented.
    if (!wasAlreadyCounted) {
      session.progress.questionsCompleted = (session.progress.questionsCompleted || 0) + 1;
    }
    session.progress.lastCompletedQuestionId = question._id;
    session.processing.operation             = null;
    session.processing.operationId            = null;
    session.processing.errorCode              = null;
    session.lastActivityAt                    = new Date();
    await session.save();

    return answerAttemptToResult(attempt, question);

  } catch (evalErr) {
    // ── 8. Evaluation failed again — release locks, mark attempt failed ──────
    console.error("[interviewService] Reevaluation failed:", evalErr.message);
    attempt.status = "failed";
    attempt.processing.errorCode    = evalErr.code    || "EVALUATION_FAILED";
    attempt.processing.errorMessage = evalErr.message || "Reevaluation failed.";
    // Still retryable if we haven't exhausted attempts
    attempt.processing.retryable    = isCheckpoint
      ? (attempt.processing.checkpointAttempts || 0) < maxReeval
      : (attempt.processing.attempts || 0) < maxReeval;
    await attempt.save().catch(() => {});

    // Release the session lock
    await InterviewSession.updateOne(
      { _id: session._id },
      { $set: { "processing.operation": null, "processing.operationId": null } }
    ).catch(() => {});

    const err = new Error("We couldn't evaluate your answer. Please try again.");
    err.code = "EVALUATION_FAILED"; err.status = 502;
    err.attemptId = attempt._id.toString();
    throw err;
  }
}

// ── Phase 5c: Checkpoint State ────────────────────────────────────────────────

/**
 * Return all unresolved questions for the final evaluation checkpoint.
 * A question is "unresolved" when it was asked but is not yet answered or skipped.
 *
 * @param {string} sessionId
 * @param {string} userId
 * @returns {Promise<{ resolved: boolean, unresolvedQuestions: Array }>}
 */
async function getCheckpointState(sessionId, userId) {
  assertValidObjectId(sessionId, "Interview session");
  const session = await InterviewSession.findOne({ _id: sessionId, userId });
  if (!session) {
    const err = new Error("Interview session not found.");
    err.code = "INTERVIEW_NOT_FOUND"; err.status = 404;
    throw err;
  }

  const { CHECKPOINT_REEVAL_LIMIT } = require("../config/env");
  // Fetch all asked questions that are not yet resolved
  const unresolvedDocs = await InterviewQuestion.find({
    sessionId: session._id,
    userId,
    status: { $nin: ["answered", "skipped"] },
    askedAt: { $ne: null },
  }).lean();

  const unresolvedQuestions = [];
  for (const q of unresolvedDocs) {
    let attemptId = null, errorCode = null, hasTranscript = false,
        transcriptText = null, retriesUsed = 0;

    if (q.pendingFailedAttemptId) {
      const attempt = await AnswerAttempt.findOne(
        { _id: q.pendingFailedAttemptId, sessionId: session._id, userId },
        { "transcript.text": 1, "processing.attempts": 1,
          "processing.errorCode": 1, status: 1 }
      ).lean();
      if (attempt) {
        attemptId     = attempt._id;
        errorCode     = attempt.processing?.errorCode || null;
        hasTranscript = !!(attempt.transcript?.text?.trim());
        transcriptText = attempt.transcript?.text || null;
        retriesUsed   = attempt.processing?.checkpointAttempts || 0;
      }
    }

    const retriesRemaining = Math.max(0, CHECKPOINT_REEVAL_LIMIT - retriesUsed);
    unresolvedQuestions.push({
      id:               q._id,
      text:             q.text,
      attemptId,
      errorCode,
      hasTranscript,
      transcriptText,
      retriesUsed,
      retriesRemaining,
      canReevaluate:    hasTranscript && retriesRemaining > 0,
      canReAnswer:      !hasTranscript,
    });
  }

  const resolved = unresolvedQuestions.length === 0;
  return { resolved, unresolvedQuestions };
}

// ── Phase 5d: Skip Question ───────────────────────────────────────────────────

/**
 * Permanently skip an unresolved question at the checkpoint.
 * Atomic — cannot race with reevaluation or answer submission.
 * The original attempt and transcript are preserved; only the question status changes.
 *
 * @param {string} sessionId
 * @param {string} questionId
 * @param {string} userId
 * @returns {Promise<{ questionId: ObjectId, status: string }>}
 */
async function skipQuestion(sessionId, questionId, userId) {
  assertValidObjectId(sessionId,  "Interview session");
  assertValidObjectId(questionId, "Question");

  const session = await InterviewSession.findOne({ _id: sessionId, userId });
  if (!session) {
    const err = new Error("Interview session not found.");
    err.code = "INTERVIEW_NOT_FOUND"; err.status = 404;
    throw err;
  }
  if (!["completing", "active"].includes(session.status)) {
    const err = new Error(`Interview is not in a skippable state (status: ${session.status}).`);
    err.code = "INTERVIEW_NOT_ACTIVE"; err.status = 409;
    throw err;
  }

  // Atomic: only transitions from 'asked' — prevents race with reevaluation
  const question = await InterviewQuestion.findOneAndUpdate(
    { _id: questionId, sessionId: session._id, userId, status: "asked" },
    { $set: { status: "skipped", completedAt: new Date() },
      $unset: { pendingFailedAttemptId: 1 } },
    { new: true }
  );
  if (!question) {
    // Either not found, or already answered/skipped — check which
    const existing = await InterviewQuestion.findOne({
      _id: questionId, sessionId: session._id, userId,
    });
    if (!existing) {
      const err = new Error("Question not found."); err.code = "QUESTION_NOT_FOUND"; err.status = 404; throw err;
    }
    const err = new Error("This question cannot be skipped (already resolved).");
    err.code = "QUESTION_ALREADY_ANSWERED"; err.status = 409; throw err;
  }

  // Increment questionsCompleted so getNextAction bookkeeping stays accurate
  await InterviewSession.updateOne(
    { _id: session._id },
    { $inc: { "progress.questionsCompleted": 1 }, $set: { lastActivityAt: new Date() } }
  );

  return { questionId: question._id, status: "skipped" };
}

// ── Phase 6: Generate Next Action ─────────────────────────────────────────────

/**
 * Determine and generate the next interview action after an answer is processed.
 * Per interview-api.md §41–45.
 *
 * @param {string} sessionId
 * @param {string} userId
 * @returns {Promise<object>} { action, question? }
 */
async function getNextAction(sessionId, userId) {
  assertValidObjectId(sessionId, "Interview session");
  const session = await InterviewSession.findOne({ _id: sessionId, userId });
  if (!session) {
    const err = new Error("Interview session not found.");
    err.code = "INTERVIEW_NOT_FOUND"; err.status = 404;
    throw err;
  }

  if (session.status !== "active") {
    const err = new Error(`Interview is not active (status: ${session.status}).`);
    err.code = "INTERVIEW_NOT_ACTIVE"; err.status = 409;
    throw err;
  }

  // Check completion conditions
  const questionsCompleted = session.progress?.questionsCompleted || 0;
  const questionLimit      = session.configuration?.questionLimit  || 10;

  if (questionsCompleted >= questionLimit) {
    // Check for unresolved questions before declaring completion
    const checkpointData = await getCheckpointState(sessionId, userId);
    if (!checkpointData.resolved) {
      // Transition session to 'completing' (checkpoint state)
      await InterviewSession.updateOne(
        { _id: session._id, status: "active" },
        { $set: { status: "completing", lastActivityAt: new Date() } }
      );
      return { action: "checkpoint", unresolvedQuestions: checkpointData.unresolvedQuestions };
    }
    return { action: "complete" };
  }

  // Check timing (rough estimate)
  if (session.startedAt && session.configuration?.durationMinutes) {
    const elapsedMs = Date.now() - new Date(session.startedAt).getTime();
    const limitMs   = session.configuration.durationMinutes * 60 * 1000;
    // Give a 20% grace period before forcing completion
    if (elapsedMs >= limitMs * 1.2) {
      return { action: "complete" };
    }
  }

  // Generate next question
  session.processing.operation = "generating_question";
  session.lastActivityAt = new Date();
  await session.save();

  try {
    // Build context for question generation
    const previousQs = await InterviewQuestion.find(
      { sessionId: session._id, userId },
      { text: 1, category: 1, "generationContext.topic": 1, difficulty: 1, status: 1 }
    ).sort({ sequenceIndex: 1 }).limit(10);

    // Get latest completed attempt for follow-up context
    const lastCompletedQ = session.progress?.lastCompletedQuestionId
      ? await InterviewQuestion.findOne({ _id: session.progress.lastCompletedQuestionId })
      : null;
    const lastAttempt = lastCompletedQ?.latestAttemptId
      ? await AnswerAttempt.findOne({ _id: lastCompletedQ.latestAttemptId })
      : null;

    const snapshot = session.interviewContextSnapshot || {};
    const questionsRemaining = questionLimit - questionsCompleted;

    // Rebuild strategy context from session data
    const strategyCtx = {
      // Adaptive difficulty: if configured as "adaptive", derive the current
      // difficulty from the candidate's recent performance rather than hardcoding "medium".
      // Uses the last attempt's overall score:
      //   score >= 75 → candidate is performing well → increase to hard
      //   score >= 50 → moderate performance → keep medium
      //   score < 50  → struggling → drop to easy
      // For non-adaptive difficulty, use the configured value directly.
      currentDifficulty: (() => {
        if (session.configuration?.difficulty !== "adaptive") {
          return session.configuration?.difficulty || "medium";
        }
        const lastScore = lastAttempt?.analysis?.overallScore ?? null;
        if (lastScore === null) return "medium"; // no prior data yet — start medium
        if (lastScore >= 75)   return "hard";
        if (lastScore >= 50)   return "medium";
        return "easy";
      })(),
      coveredTopics:     previousQs.map(q => q.generationContext?.topic || q.category).filter(Boolean),
      weakTopics:        [],
      strongTopics:      [],
      recentScores:      [],
      questionsAnswered: questionsCompleted,
      questionsRemaining,
      interviewStage:    questionsCompleted === 0 ? "opening" : questionsCompleted >= questionLimit * 0.8 ? "closing" : "core",
    };

    // Enrich strategy with last evaluation data
    if (lastAttempt?.analysis) {
      const score = lastAttempt.analysis.overallScore;
      if (score !== null) strategyCtx.recentScores = [score];
      if (score < 55) strategyCtx.weakTopics = [lastCompletedQ?.generationContext?.topic || ""].filter(Boolean);
    }

    const qResult = await aiService.generateQuestion({
      interviewContext: {
        interviewType:  session.configuration?.interviewType,
        company:        snapshot.company    || session.configuration?.company,
        role:           snapshot.targetRole || session.configuration?.targetRole,
        jobDescription: snapshot.jobDescription || session.configuration?.jobDescription,
        resumeContext:  _buildResumeContextFromSnapshot(snapshot),
      },
      candidateContext: {
        name:            snapshot.candidateSummary || "",
        experienceLevel: snapshot.experienceLevel  || "",
      },
      strategyContext:  strategyCtx,
      previousQuestions: previousQs.map(q => ({ text: q.text, topic: q.generationContext?.topic || q.category, category: q.category })),
      currentAnswer:    lastAttempt,
      currentEvaluation: lastAttempt?.analysis,
      isFirstQuestion:  false,
      isFollowUp:       !!lastAttempt,
    });

    if (qResult.action === "complete") {
      session.processing.operation = null;
      await session.save();
      return { action: "complete" };
    }

    // Persist new question
    const nextNumber = (session.progress.currentQuestionNumber || 0) + 1;
    const nextIndex  = await InterviewQuestion.countDocuments({ sessionId: session._id });

    const newQuestion = new InterviewQuestion({
      sessionId:      session._id,
      userId,
      questionNumber: nextNumber,
      sequenceIndex:  nextIndex,
      text:           qResult.question.text,
      category:       qResult.question.category,
      difficulty:     qResult.question.difficulty,
      source:         lastAttempt ? "adaptive_follow_up" : "initial",
      parentQuestionId: lastCompletedQ?._id || null,
      generationContext: {
        previousQuestionId:      lastCompletedQ?._id     || null,
        previousAnswerAttemptId: lastAttempt?._id         || null,
        reason: qResult.reason || "follow_up",
        topic:  qResult.question.topic || qResult.question.category,
      },
      status:    "asked",
      maxRetries: MAX_RETRIES_PER_QUESTION,
      askedAt:   new Date(),
    });
    await newQuestion.save();

    // Update session progress
    session.progress.currentQuestionId     = newQuestion._id;
    session.progress.currentQuestionNumber = nextNumber;
    session.processing.operation = null;
    session.lastActivityAt = new Date();
    await session.save();

    return {
      action:   "question",
      question: questionToDto(newQuestion, 1),
    };

  } catch (err) {
    session.processing.operation = null;
    session.processing.errorCode = err.code || "QUESTION_GENERATION_FAILED";
    await session.save().catch(() => {});
    throw err;
  }
}

// ── Phase 7: Retry ────────────────────────────────────────────────────────────

/**
 * Request a retry for a question.
 * Per interview-api.md §34–36.
 *
 * @param {string} sessionId
 * @param {string} questionId
 * @param {string} userId
 * @returns {Promise<object>} { question, attemptNumber }
 */
async function retryQuestion(sessionId, questionId, userId) {
  assertValidObjectId(sessionId, "Interview session");
  assertValidObjectId(questionId, "Question");
  const session = await InterviewSession.findOne({ _id: sessionId, userId });
  if (!session || (!["active", "completing"].includes(session.status))) {
    const err = new Error("Interview session not found or not active.");
    err.code = "INTERVIEW_NOT_ACTIVE"; err.status = 409;
    throw err;
  }

  const question = await InterviewQuestion.findOne({ _id: questionId, sessionId: session._id, userId });
  if (!question) {
    const err = new Error("Question not found.");
    err.code = "QUESTION_NOT_FOUND"; err.status = 404;
    throw err;
  }

  // Check retry eligibility
  const currentRetries = question.attemptCount > 0 ? question.attemptCount - 1 : 0;
  if (currentRetries >= question.maxRetries) {
    const err = new Error("Retry limit reached for this question.");
    err.code = "RETRY_LIMIT_REACHED"; err.status = 409;
    throw err;
  }

  // Reset question status to allow another answer
  question.status    = "asked";
  question.completedAt = null;
  // Clear any stale pending-failed reference — the user is choosing to give a
  // fresh answer via retryQuestion (deliberate answer retry), not reevaluating
  // the AI's failure on the previous one.
  question.pendingFailedAttemptId = null;
  await question.save();

  // Decrement questionsCompleted so the retry answer is not skipped
  // (the question was counted as complete when the first attempt finished;
  // we un-count it now so getNextAction() doesn't advance past it)
  if (session.progress.questionsCompleted > 0) {
    session.progress.questionsCompleted -= 1;
  }

  // Update current question in session
  session.progress.currentQuestionId = question._id;
  session.lastActivityAt = new Date();
  await session.save();

  return {
    question:      questionToDto(question, question.attemptCount + 1),
    retriesUsed:   question.attemptCount > 0 ? question.attemptCount - 1 : 0,
    retriesRemaining: question.maxRetries - currentRetries,
  };
}

// ── Phase 7: Explanation ──────────────────────────────────────────────────────

/**
 * Generate a contextual explanation for a concept.
 * Per interview-api.md §37–38.
 */
async function requestExplanation(sessionId, userId, { questionId, topic }) {
  assertValidObjectId(sessionId, "Interview session");
  if (questionId) assertValidObjectId(questionId, "Question");
  const session = await InterviewSession.findOne({ _id: sessionId, userId });
  if (!session) {
    const err = new Error("Interview session not found.");
    err.code = "INTERVIEW_NOT_FOUND"; err.status = 404;
    throw err;
  }

  const question = await InterviewQuestion.findOne({ _id: questionId, sessionId: session._id, userId });
  if (!question) {
    const err = new Error("Question not found.");
    err.code = "QUESTION_NOT_FOUND"; err.status = 404;
    throw err;
  }

  const snapshot = session.interviewContextSnapshot || {};

  const explanation = await aiService.generateExplanation({
    topic,
    questionText: question.text,
    interviewContext: {
      interviewType: session.configuration?.interviewType,
      role:          snapshot.targetRole || session.configuration?.targetRole,
    },
    candidateContext: {
      experienceLevel: snapshot.experienceLevel || "",
    },
  });

  // Persist explanation on the latest answer attempt
  if (question.latestAttemptId) {
    await AnswerAttempt.findByIdAndUpdate(question.latestAttemptId, {
      $set: {
        "explanation.requested":       true,
        "explanation.topic":           topic,
        "explanation.trigger":         "user_request",
        "explanation.explanationText": explanation.explanation,
        "explanation.keyPoints":       explanation.keyPoints || [],
        "explanation.relatedQuestionId": question._id,
        "explanation.createdAt":       new Date(),
      },
    });
  }

  return {
    topic:        explanation.topic || topic,
    explanation:  explanation.explanation,
    keyPoints:    explanation.keyPoints || [],
    example:      explanation.example || "",
    interviewTip: explanation.interviewTip || "",
  };
}

/**
 * Continue after explanation — generate next question.
 * Per interview-api.md §39.
 */
async function continueAfterExplanation(sessionId, userId) {
  return getNextAction(sessionId, userId);
}

// ── Phase 8: End Interview ────────────────────────────────────────────────────

/**
 * End an interview session.
 * Per interview-api.md §47.
 *
 * @param {string} sessionId
 * @param {string} userId
 * @param {string} reason
 * @returns {Promise<object>} Session DTO
 */
async function endInterview(sessionId, userId, reason = "user_ended") {
  assertValidObjectId(sessionId, "Interview session");
  const session = await InterviewSession.findOne({ _id: sessionId, userId });
  if (!session) {
    const err = new Error("Interview session not found.");
    err.code = "INTERVIEW_NOT_FOUND"; err.status = 404;
    throw err;
  }

  if (session.status === "completed" || session.status === "abandoned") {
    // Already ended — return current state
    return sessionToDto(session);
  }

  if (!["active", "paused", "starting", "created", "failed"].includes(session.status)) {
    const err = new Error("Interview cannot be ended from its current state.");
    err.code = "INVALID_INTERVIEW_STATE"; err.status = 409;
    throw err;
  }

  const terminalStatus = reason === "user_ended" ? "abandoned" : "completed";
  session.status      = terminalStatus;
  session.completedAt = new Date();
  session.lastActivityAt = new Date();
  session.processing.operation = null;
  await session.save();

  return sessionToDto(session);
}

// ── Phase 8: Generate Final Report ───────────────────────────────────────────

/**
 * Generate the final performance report.
 * Aggregates all persisted evidence — never invents data.
 * Per interview-api.md §48–50.
 *
 * @param {string} sessionId
 * @param {string} userId
 * @returns {Promise<object>} Report DTO
 */
async function generateReport(sessionId, userId) {
  assertValidObjectId(sessionId, "Interview session");
  const session = await InterviewSession.findOne({ _id: sessionId, userId });
  if (!session) {
    const err = new Error("Interview session not found.");
    err.code = "INTERVIEW_NOT_FOUND"; err.status = 404;
    throw err;
  }

  // Only allow report generation for sessions that have meaningful answer data.
  // "completed"  → normal path after all questions answered.
  // "active"     → early exit / force-complete path (answers exist, session ongoing).
  // "completing" → checkpoint in progress — allowed so the report step can finalize.
  // "abandoned"  → user explicitly left — no report should be generated (they
  //               chose to end without a report; generating one here would
  //               contradict that intent and potentially produce misleading data).
  // "failed"     → session errored — answers may be partial/corrupt; no report.
  if (!["completed", "active", "completing"].includes(session.status)) {
    const err = new Error("A report can only be generated for a completed interview session.");
    err.code = "INTERVIEW_NOT_ACTIVE"; err.status = 409;
    throw err;
  }

  // Pre-flight: reject if any asked questions remain unresolved
  if (session.status !== "completed") {
    const unresolvedCount = await InterviewQuestion.countDocuments({
      sessionId: session._id,
      status: { $nin: ["answered", "skipped"] },
      askedAt: { $ne: null },
    });
    if (unresolvedCount > 0) {
      const err = new Error("All questions must be resolved (answered or skipped) before generating the report.");
      err.code = "INTERVIEW_NOT_RESOLVED"; err.status = 409; throw err;
    }
  }

  // If report already exists and is ready, return it
  if (session.finalReport?.status === "ready") {
    return reportToDto(session);
  }

  // Mark as generating
  if (!session.finalReport) session.finalReport = {};
  session.finalReport.status = "generating";
  await session.save();

  try {
    // Aggregate all completed questions and their best attempts
    const questions = await InterviewQuestion.find(
      { sessionId: session._id, userId, status: { $in: ["answered", "skipped"] } },
    ).sort({ sequenceIndex: 1 });

    // Separate answered from skipped — skipped are excluded from scoring
    const answeredQuestions = questions.filter(q => q.status === "answered");
    const skippedQuestionsData = questions.filter(q => q.status === "skipped");

    const attemptSummaries = [];
    const allScores = { overallScore: [], technicalAccuracy: [], communication: [], clarity: [], structure: [], relevance: [], problemSolving: [] };
    const speechTotals = { totalFillerWords: 0, totalDurationMs: 0, totalSpeakingRate: 0, countSpeaking: 0 };
    const retryImprovements = [];

    for (const q of answeredQuestions) {
      const attempts = await AnswerAttempt.find(
        { questionId: q._id, status: "completed" },
        { analysis: 1, answerQuality: 1, attemptNumber: 1, improvement: 1 }
      ).sort({ attemptNumber: 1 });

      if (!attempts.length) continue;

      const best = attempts.reduce((a, b) => {
        const aScore = a.analysis?.overallScore ?? 0;
        const bScore = b.analysis?.overallScore ?? 0;
        return bScore > aScore ? b : a;
      });

      const bestAn = best.analysis || {};

      attemptSummaries.push({
        questionId:    q._id,
        questionNumber: q.questionNumber,
        questionText:  q.text.slice(0, 100),
        topic:         q.generationContext?.topic || q.category,
        category:      q.category,
        bestScore:     bestAn.overallScore ?? null,
        classification: bestAn.classification || null,
        attempts:      attempts.length,
        improved:      attempts.length > 1 && (attempts[attempts.length-1].analysis?.overallScore ?? 0) > (attempts[0].analysis?.overallScore ?? 0),
        weaknesses:    bestAn.weaknesses || [],
        missingPoints: bestAn.missingPoints || [],
      });

      // Aggregate scores
      for (const dim of Object.keys(allScores)) {
        if (bestAn[dim] !== null && bestAn[dim] !== undefined) {
          allScores[dim].push(bestAn[dim]);
        }
      }

      // Aggregate speech
      const speech = bestAn.speech || {};
      if (speech.fillerWordCount !== null) speechTotals.totalFillerWords += speech.fillerWordCount;
      if (speech.speakingRate !== null) { speechTotals.totalSpeakingRate += speech.speakingRate; speechTotals.countSpeaking++; }
      if (speech.responseDurationMs !== null) speechTotals.totalDurationMs += speech.responseDurationMs;

      // Retry improvements
      if (attempts.length > 1) {
        const firstScore = attempts[0].analysis?.overallScore ?? null;
        const lastScore  = attempts[attempts.length - 1].analysis?.overallScore ?? null;
        if (firstScore !== null && lastScore !== null) {
          retryImprovements.push({
            questionNumber: q.questionNumber,
            previousScore:  firstScore,
            newScore:       lastScore,
            delta:          lastScore - firstScore,
          });
        }
      }
    }

    const avg = (arr) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

    const aggregatedScores = {
      questionsAnswered: answeredQuestions.length,
      retryCount:        session.progress?.retryCount || 0,
      overallScore:      avg(allScores.overallScore) ?? 0,
      dimensions: {
        technicalAccuracy: avg(allScores.technicalAccuracy),
        communication:     avg(allScores.communication),
        clarity:           avg(allScores.clarity),
        structure:         avg(allScores.structure),
        relevance:         avg(allScores.relevance),
        problemSolving:    avg(allScores.problemSolving),
      },
    };

    const speechSummary = {
      averageSpeakingRate:       speechTotals.countSpeaking > 0 ? Math.round(speechTotals.totalSpeakingRate / speechTotals.countSpeaking) : null,
      totalFillerWords:          speechTotals.totalFillerWords || null,
      averageFillerRate:         null, // calculated from totals if needed
      averageResponseDurationMs: answeredQuestions.length > 0 ? Math.round(speechTotals.totalDurationMs / answeredQuestions.length) : null,
    };

    // AI synthesis (qualitative insights from the evidence)
    const aiSynthesis = await aiService.generateFinalReport({
      session,
      questions: answeredQuestions,
      attemptSummaries,
      aggregatedScores,
      speechSummary,
      retryImprovements,
    });

    // Build skipped questions list for the report
    const skippedQuestions = skippedQuestionsData.map(q => ({
      questionId:   q._id,
      questionText: q.text || "",
      attemptId:    q.pendingFailedAttemptId || null,
    }));

    // Build final report
    const finalReport = {
      overallScore:  aggregatedScores.overallScore,
      dimensions:    aggregatedScores.dimensions,
      speech:        speechSummary,
      strengths:     aiSynthesis.strengths     || [],
      improvements:  aiSynthesis.improvements  || [],
      knowledgeGaps: aiSynthesis.knowledgeGaps || [],
      recommendations: aiSynthesis.recommendations || [],
      statistics: {
        questionsAnswered: aggregatedScores.questionsAnswered,
        totalAttempts:     session.progress?.attemptsCount || 0,
        retryCount:        aggregatedScores.retryCount,
        improvedAttempts:  retryImprovements.filter(r => r.delta > 0).length,
      },
      questionBreakdown: attemptSummaries.map(s => ({
        questionId:   s.questionId,
        questionText: s.questionText,
        bestScore:    s.bestScore,
        attempts:     s.attempts,
        improved:     s.improved,
      })),
      skippedQuestions,
      evaluationCoverage: {
        total:     questions.length,
        evaluated: answeredQuestions.length,
        skipped:   skippedQuestions.length,
      },
      status:      "ready",
      generatedAt: new Date(),
      aiMetadata: {
        provider:       "openrouter",
        model:          process.env.AI_MODEL || "",
        promptVersion:  "finalReport-v1",
        analysisVersion:"v1",
        generatedAt:    new Date(),
      },
    };

    // Persist + complete session
    session.finalReport = finalReport;
    session.status      = ["active", "completing"].includes(session.status) ? "completed" : session.status;
    session.completedAt = session.completedAt || new Date();
    session.lastActivityAt = new Date();
    await session.save();

    return reportToDto(session);

  } catch (err) {
    session.finalReport = session.finalReport || {};
    session.finalReport.status = "failed";
    await session.save().catch(() => {});

    const domainErr = new Error("We couldn't generate your performance report. Please try again.");
    domainErr.code = "REPORT_GENERATION_FAILED"; domainErr.status = 502;
    throw domainErr;
  }
}

/**
 * Get an existing final report.
 * Per interview-api.md §52.
 */
async function getReport(sessionId, userId) {
  assertValidObjectId(sessionId, "Interview session");
  const session = await InterviewSession.findOne({ _id: sessionId, userId });
  if (!session) {
    const err = new Error("Interview session not found.");
    err.code = "INTERVIEW_NOT_FOUND"; err.status = 404;
    throw err;
  }

  if (!session.finalReport) return null;
  if (session.finalReport.status !== "ready") {
    return { status: session.finalReport.status };
  }

  return reportToDto(session);
}

// ── Phase 9: History + Progress ───────────────────────────────────────────────

/**
 * Get paginated interview history for a user.
 * Per interview-api.md §53.
 */
async function getInterviewHistory(userId, { page = 1, limit = 20, status, mode, interviewType } = {}) {
  const filter = { userId };
  if (status) filter.status = status;
  if (interviewType) filter["configuration.interviewType"] = interviewType;

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await InterviewSession.countDocuments(filter);
  const sessions = await InterviewSession.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .select("configuration status finalReport startedAt completedAt createdAt progress resumeVersionId interviewContextSnapshot");

  return {
    interviews: sessions.map(s => ({
      id:            s._id,
      mode:          s.configuration?.contextSources?.join("+") || "mixed",
      interviewType: s.configuration?.interviewType,
      company:       s.configuration?.company,
      role:          s.configuration?.targetRole || s.interviewContextSnapshot?.targetRole,
      status:        s.status,
      overallScore:  s.finalReport?.overallScore ?? null,
      questionCount: s.progress?.questionsCompleted || 0,
      startedAt:     s.startedAt,
      completedAt:   s.completedAt,
      createdAt:     s.createdAt,
    })),
    pagination: {
      page:  Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  };
}

/**
 * Get aggregated performance progression across sessions.
 * Per interview-api.md §54–55.
 */
async function getInterviewProgress(userId) {
  const completedSessions = await InterviewSession.find(
    { userId, status: "completed", "finalReport.status": "ready", "finalReport.overallScore": { $ne: null } },
    { finalReport: 1, completedAt: 1 }
  ).sort({ completedAt: 1 }).limit(50);

  if (!completedSessions.length) {
    return {
      sessionsCompleted: 0,
      scores: [],
      current: null,
      improvement: null,
    };
  }

  const scores = completedSessions.map(s => ({
    interviewId: s._id,
    score:       s.finalReport.overallScore,
    completedAt: s.completedAt,
  }));

  const first   = scores[0].score;
  const current = scores[scores.length - 1].score;
  const improvement = current !== null && first !== null
    ? { absolute: current - first, percentage: Math.round(((current - first) / first) * 100 * 10) / 10 }
    : null;

  return {
    sessionsCompleted: completedSessions.length,
    scores,
    current: { overallScore: current },
    improvement,
  };
}

// ── Private helpers ───────────────────────────────────────────────────────────

function _delta(newVal, oldVal) {
  if (newVal === null || newVal === undefined || oldVal === null || oldVal === undefined) return null;
  return newVal - oldVal;
}

function _identifyImprovedAreas(newEval, oldEval) {
  if (!oldEval) return [];
  const areas = [];
  const dims = ["communication", "structure", "technicalAccuracy", "clarity"];
  for (const d of dims) {
    const nv = newEval[d];
    const ov = oldEval[d];
    if (nv !== null && ov !== null && nv > ov + 5) areas.push(d);
  }
  return areas;
}

function _qualityFromClassification(classification) {
  const map = { correct: "excellent", mostly_correct: "mostly_correct", partially_correct: "partially_correct", incorrect: "incorrect", insufficient: "insufficient", off_topic: "incorrect" };
  return map[classification] || null;
}

function _buildResumeContextFromSnapshot(snapshot) {
  if (!snapshot || !snapshot.primarySkills?.length) return null;
  return {
    candidateSummary: snapshot.candidateSummary || "",
    primarySkills:    snapshot.primarySkills    || [],
    projects:         (snapshot.projects || []).map(name => ({ name })),
  };
}

function answerAttemptToResult(attempt, question) {
  const an = attempt.analysis || {};
  return {
    id:                  attempt._id,
    status:              attempt.status,
    attemptNumber:       attempt.attemptNumber,
    isRetry:             attempt.isRetry,
    transcript:          attempt.transcript?.text
      ? { text: attempt.transcript.text, available: true }
      : { available: false },
    evaluation: attempt.status === "completed" ? {
      overallScore:      an.overallScore,
      technicalAccuracy: an.technicalAccuracy,
      relevance:         an.relevance,
      communication:     an.communication,
      clarity:           an.clarity,
      structure:         an.structure,
      completeness:      an.completeness,
      problemSolving:    an.problemSolving,
      classification:    an.classification,
      speech: {
        speakingRate:    an.speech?.speakingRate    ?? null,
        fillerWordCount: an.speech?.fillerWordCount ?? null,
        fillerWordRate:  an.speech?.fillerWordRate  ?? null,
        pauseCount:      an.speech?.pauseCount      ?? null,
        wordCount:       an.speech?.wordCount       ?? null,
      },
      issues:       an.weaknesses    || [],
      suggestions:  an.suggestions   || [],
      missingPoints: an.missingPoints || [],
      strengths:    an.strengths     || [],
      technicalFeedback:    an.technicalFeedback     || null,
      communicationFeedback: an.communicationFeedback || null,
      fillerWords:  an.fillerWords   || null,
    } : null,
    improvement: attempt.isRetry && attempt.improvement?.scoreDelta !== null ? {
      previousScore:      null,
      currentScore:       an.overallScore,
      improvement:        attempt.improvement.scoreDelta,
      improved:           attempt.improvement.improved,
      improvedAreas:      attempt.improvement.improvedAreas || [],
      remainingIssues:    attempt.improvement.remainingIssues || [],
    } : null,
    retry: {
      available:         question ? (question.attemptCount - 1 < question.maxRetries) : false,
    },
    explanation: {
      recommended: an.explanationRecommended || false,
    },
    processingError: attempt.status === "failed" ? {
      code:     attempt.processing?.errorCode,
      retryable:attempt.processing?.retryable,
    } : null,
  };
}

function reportToDto(session) {
  const r = session.finalReport;
  if (!r) return null;
  return {
    interviewId:     session._id,
    status:          r.status,
    overallScore:    r.overallScore,
    performance:     r.dimensions,
    speech:          r.speech,
    strengths:       r.strengths,
    improvements:    r.improvements,
    knowledgeGaps:   r.knowledgeGaps,
    recommendations: r.recommendations,
    progress: {
      questionsAnswered: r.statistics?.questionsAnswered,
      questionsRetried:  r.statistics?.retryCount,
      improvedAttempts:  r.statistics?.improvedAttempts,
    },
    questionBreakdown:   r.questionBreakdown,
    skippedQuestions:    r.skippedQuestions    || [],
    evaluationCoverage:  r.evaluationCoverage  || null,
    generatedAt:         r.generatedAt,
  };
}

module.exports = {
  createInterview,
  getInterview,
  startInterview,
  getCurrentQuestion,
  submitAnswer,
  getAnswerStatus,
  reevaluateAnswer,
  getCheckpointState,
  skipQuestion,
  getNextAction,
  retryQuestion,
  requestExplanation,
  continueAfterExplanation,
  endInterview,
  generateReport,
  getReport,
  getInterviewHistory,
  getInterviewProgress,
};

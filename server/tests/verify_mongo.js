/**
 * verify_mongo.js
 * Direct MongoDB state verification for the e2e test session.
 * Run: node tests/verify_mongo.js
 */
"use strict";

const mongoose = require("mongoose");
require("dotenv").config();

const SESSION_ID = "6a8342ac13f267da6ba8c920";
const Q1_ID      = "6a8342dd13f267da6ba8c924";
const ATT1_ID    = "6a8342dd13f267da6ba8c92c";
const ATT1R_ID   = "6a83431513f267da6ba8c93c";
const Q2_ID      = "6a83436213f267da6ba8c94f";
const ATT2_ID    = "6a83436213f267da6ba8c955";

const oid = (s) => new mongoose.Types.ObjectId(s);

let pass = 0; let fail = 0;

function check(label, actual, expected) {
  const ok = expected === undefined
    ? !!actual
    : actual === expected;
  if (ok) {
    console.log(`  ✓ ${label}: ${JSON.stringify(actual)}`);
    pass++;
  } else {
    console.log(`  ✗ ${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
    fail++;
  }
}

function checkRange(label, val, min, max) {
  const ok = typeof val === "number" && val >= min && val <= max;
  if (ok) { console.log(`  ✓ ${label}: ${val} (in [${min},${max}])`); pass++; }
  else     { console.log(`  ✗ ${label}: ${val} not in [${min},${max}]`); fail++; }
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const cols = (await mongoose.connection.db.listCollections().toArray()).map(c => c.name);
  console.log("Collections:", cols.join(", "));

  const IS = mongoose.connection.db.collection("interviewsessions");
  const IQ = mongoose.connection.db.collection("interviewquestions");
  // Find the attempts collection
  const attColName = cols.find(c => c.toLowerCase().includes("answerat")) || "answeattempts";
  const AA = mongoose.connection.db.collection(attColName);
  console.log("Using attempts collection:", attColName);

  // ── 1. Session ────────────────────────────────────────────────────────────
  const session = await IS.findOne({ _id: oid(SESSION_ID) });
  console.log("\n[1. InterviewSession]");
  check("exists",                          !!session);
  check("status",                          session?.status, "abandoned");
  check("configuration.targetRole",        session?.configuration?.targetRole, "Full Stack Developer");
  check("configuration.interviewType",     session?.configuration?.interviewType, "technical");
  check("configuration.questionLimit",     session?.configuration?.questionLimit, 2);
  check("progress.questionsCompleted",     session?.progress?.questionsCompleted, 2);
  check("progress.retryCount >= 1",        session?.progress?.retryCount >= 1);
  check("progress.attemptsCount >= 3",     session?.progress?.attemptsCount >= 3);
  check("interviewContextSnapshot exists", !!session?.interviewContextSnapshot);
  check("snapshot.targetRole",             session?.interviewContextSnapshot?.targetRole, "Full Stack Developer");
  check("finalReport.status",             session?.finalReport?.status, "ready");
  checkRange("finalReport.overallScore",  session?.finalReport?.overallScore, 0, 100);
  check("finalReport.strengths count",    session?.finalReport?.strengths?.length >= 1);
  check("finalReport.improvements count", session?.finalReport?.improvements?.length >= 1);
  check("finalReport.stats.questionsAnswered", session?.finalReport?.statistics?.questionsAnswered, 2);
  check("finalReport.stats.retryCount >= 1",   session?.finalReport?.statistics?.retryCount >= 1);
  check("startedAt set",                  !!session?.startedAt);

  // ── 2. Questions ──────────────────────────────────────────────────────────
  const questions = await IQ.find({ sessionId: oid(SESSION_ID) }).sort({ sequenceIndex: 1 }).toArray();
  console.log("\n[2. InterviewQuestions]");
  check("total questions == 2", questions.length, 2);

  const q1 = questions.find(q => q._id.toString() === Q1_ID);
  const q2 = questions.find(q => q._id.toString() === Q2_ID);

  check("Q1 exists",             !!q1);
  check("Q1 sequenceIndex",      q1?.sequenceIndex, 0);
  check("Q1 questionNumber",     q1?.questionNumber, 1);
  check("Q1 status == answered", q1?.status, "answered");
  check("Q1 source == initial",  q1?.source, "initial");
  check("Q1 attemptCount == 2",  q1?.attemptCount, 2);
  check("Q1 userId set",         !!q1?.userId);
  check("Q1 sessionId matches",  q1?.sessionId?.toString(), SESSION_ID);

  check("Q2 exists",             !!q2);
  check("Q2 sequenceIndex",      q2?.sequenceIndex, 1);
  check("Q2 questionNumber",     q2?.questionNumber, 2);
  check("Q2 status == answered", q2?.status, "answered");
  check("Q2 userId set",         !!q2?.userId);
  check("Q2 text non-empty",     q2?.text?.length > 10);

  // ── 3. Answer Attempts ─────────────────────────────────────────────────────
  const attempts = await AA.find({ sessionId: oid(SESSION_ID) }).sort({ createdAt: 1 }).toArray();
  console.log("\n[3. AnswerAttempts] total:", attempts.length);
  check("total attempts == 3", attempts.length, 3);

  const att1  = attempts.find(a => a._id.toString() === ATT1_ID);
  const attR  = attempts.find(a => a._id.toString() === ATT1R_ID);
  const att2  = attempts.find(a => a._id.toString() === ATT2_ID);

  // Q1 Attempt 1 (original)
  console.log("\n  [Q1 Attempt 1 — original]");
  check("exists",                    !!att1);
  check("attemptNumber",             att1?.attemptNumber, 1);
  check("isRetry",                   att1?.isRetry, false);
  check("status == completed",       att1?.status, "completed");
  check("transcript.provider",       att1?.transcript?.provider, "text_input");
  check("transcript.model",          att1?.transcript?.model, "none");
  check("transcript.confidence null",att1?.transcript?.confidence, null);
  check("transcript text non-empty", att1?.transcript?.text?.length > 0);
  check("audio.storageRef is null",  att1?.audio?.storageReference ?? null, null);
  check("analysis exists",           !!att1?.analysis);
  checkRange("analysis.overallScore", att1?.analysis?.overallScore, 0, 100);
  check("analysis.classification set",!!att1?.analysis?.classification);
  check("idempotencyKey set",        !!att1?.idempotencyKey);
  check("userId matches session",    att1?.userId?.toString() === session?.userId?.toString());
  check("questionId matches Q1",     att1?.questionId?.toString(), Q1_ID);

  // Q1 Attempt 2 (retry) — ORIGINAL MUST BE UNCHANGED
  console.log("\n  [Q1 Attempt 2 — retry, immutability verification]");
  check("exists",                       !!attR);
  check("attemptNumber",                attR?.attemptNumber, 2);
  check("isRetry",                      attR?.isRetry, true);
  check("status == completed",          attR?.status, "completed");
  check("transcript.provider",          attR?.transcript?.provider, "text_input");
  check("improvement.improved",         attR?.improvement?.improved, true);
  check("improvement.scoreDelta >= 0",  attR?.improvement?.scoreDelta >= 0);
  check("improvement.previousAttemptId matches ATT1",
    attR?.improvement?.previousAttemptId?.toString(), ATT1_ID);
  // Verify att1 was NOT modified (still has attemptNumber=1)
  const att1Reread = await AA.findOne({ _id: oid(ATT1_ID) });
  check("Original att1 still attemptNumber=1 (not overwritten)",
    att1Reread?.attemptNumber, 1);
  check("Original att1 score unchanged",
    att1Reread?.analysis?.overallScore, att1?.analysis?.overallScore);

  // Q2 Attempt
  console.log("\n  [Q2 Attempt]");
  check("exists",               !!att2);
  check("attemptNumber",        att2?.attemptNumber, 1);
  check("isRetry",              att2?.isRetry, false);
  check("status == completed",  att2?.status, "completed");
  check("questionId matches Q2",att2?.questionId?.toString(), Q2_ID);
  check("transcript non-empty", att2?.transcript?.text?.length > 0);

  // ── 4. Unique index compliance ─────────────────────────────────────────────
  console.log("\n[4. Unique constraint checks]");
  const q1AttemptNumbers = attempts
    .filter(a => a.questionId?.toString() === Q1_ID)
    .map(a => a.attemptNumber);
  check("Q1 has exactly 2 attempts",          q1AttemptNumbers.length, 2);
  check("Q1 attempt numbers are [1,2]",       JSON.stringify(q1AttemptNumbers.sort()), "[1,2]");

  const q2AttemptNumbers = attempts
    .filter(a => a.questionId?.toString() === Q2_ID)
    .map(a => a.attemptNumber);
  check("Q2 has exactly 1 attempt",           q2AttemptNumbers.length, 1);
  check("Q2 attempt number is [1]",           JSON.stringify(q2AttemptNumbers), "[1]");

  // ── 5. Security: ownership isolation ─────────────────────────────────────
  console.log("\n[5. Ownership isolation]");
  const ownerId = session?.userId?.toString();
  const allSameOwner = attempts.every(a => a.userId?.toString() === ownerId)
                    && questions.every(q => q.userId?.toString() === ownerId);
  check("All records scoped to same userId", allSameOwner);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${"═".repeat(55)}`);
  console.log(`  MongoDB Verification: ${pass} PASS, ${fail} FAIL`);
  console.log(`${"═".repeat(55)}`);

  await mongoose.disconnect();
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => { console.error("FATAL:", e.message); process.exit(1); });

/**
 * openRouterAdapter.js
 *
 * OpenRouter-specific AI provider implementation.
 * This is the ONLY file in the codebase that knows about OpenRouter.
 * Changing the AI provider means replacing or adding a file here —
 * not changing controllers, services, or the rest of the application.
 *
 * Per the spec: "AI provider-specific implementation should be isolated
 * behind an application-level service or adapter."
 */
"use strict";

const { OPENROUTER_API_KEY, AI_MODEL, APP_URL, AI_TIMEOUT_MS } = require("../../../config/env");

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Send a chat completion request to OpenRouter.
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {object} [options]
 * @param {number} [options.maxTokens=4096]
 * @param {number} [options.temperature=0.1]  Low temp for deterministic JSON output
 * @returns {Promise<string>} The assistant's raw text response
 * @throws {Error} With code 'AI_PROVIDER_ERROR' on failure
 */
async function generate(systemPrompt, userPrompt, options = {}) {
  const { maxTokens = 4096, temperature = 0.1 } = options;

  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === "placeholder") {
    const err = new Error(
      "OpenRouter API key is not configured. Set OPENROUTER_API_KEY in .env."
    );
    err.code = "AI_CONFIG_ERROR";
    throw err;
  }

  const body = {
    model: AI_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt   },
    ],
    max_tokens:  maxTokens,
    temperature,
  };

  // ── Timeout via AbortController ───────────────────────────────────────────
  // AI_TIMEOUT_MS defaults to 30000 (30s) from env.js.
  // Without this, a slow free model could hold the request open indefinitely,
  // leaving the user on the "Processing" screen forever.
  const timeoutMs = AI_TIMEOUT_MS || 30000;
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(OPENROUTER_API_URL, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer":  APP_URL,
        "X-Title":       "TITAN",
      },
      body:   JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (netErr) {
    clearTimeout(timeoutId);
    if (netErr.name === "AbortError") {
      console.error(`[openRouterAdapter] Request timed out after ${timeoutMs}ms`);
      const err = new Error(`AI provider timed out after ${timeoutMs / 1000}s. Please try again.`);
      err.code = "AI_NETWORK_ERROR";
      throw err;
    }
    console.error("[openRouterAdapter] Network error:", netErr.message);
    const err = new Error("Could not reach the AI provider. Please try again.");
    err.code = "AI_NETWORK_ERROR";
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error(`[openRouterAdapter] HTTP ${response.status}:`, text.slice(0, 200));

    // ── HTTP 429: rate limit exceeded ─────────────────────────────────────
    // The free-tier OpenRouter plan has a hard daily request cap. Retrying
    // immediately wastes the remaining quota. We throw a distinct error code
    // so the retry wrapper does NOT retry, and the frontend can show an
    // actionable message instead of a generic 502.
    if (response.status === 429) {
      const retryAfterSec = parseInt(response.headers.get("Retry-After") || "0", 10) || null;
      console.warn(
        "[openRouterAdapter] HTTP 429 rate limit — not retrying.",
        retryAfterSec ? `Retry-After: ${retryAfterSec}s` : "(no Retry-After header)"
      );
      const err = new Error(
        "The AI provider's free-tier daily limit has been reached. Your answer is saved — please try again later."
      );
      err.code          = "AI_RATE_LIMIT";
      err.status        = 429;
      err.retryAfterMs  = retryAfterSec ? retryAfterSec * 1000 : null;
      throw err;
    }

    const err = new Error(`AI provider returned HTTP ${response.status}.`);
    err.code  = "AI_PROVIDER_ERROR";
    err.status = response.status;
    throw err;
  }

  const json = await response.json();

  const _choice      = json?.choices?.[0];
  const _msg         = _choice?.message;
  const content      = _msg?.content;
  const finishReason = _choice?.finish_reason;
  // Record which model was actually selected by the router. For openrouter/free
  // this changes per-request; logging it is the only way to correlate failures
  // with specific underlying models. We never log reasoning text or candidate answers.
  const actualModel  = json?.model || "(unknown)";

  // ── Compute visible (non-reasoning) output tokens ─────────────────────────
  // For reasoning/thinking models, the model spends completion tokens on its
  // internal chain-of-thought before writing final content. When reasoning_tokens
  // equals completion_tokens, zero tokens were available for the actual response.
  const completionTokens = json?.usage?.completion_tokens ?? null;
  const reasoningTokens  = json?.usage?.completion_tokens_details?.reasoning_tokens ?? 0;
  const visibleTokens    = completionTokens !== null ? completionTokens - reasoningTokens : null;

  // ── Detect non-string content (reasoning model or empty completion) ───────
  // Some free-tier models return message.content as null or an object,
  // and place the actual text in message.reasoning — we do NOT use reasoning
  // as a substitute for the JSON output because it is the model's internal
  // chain-of-thought, not the structured response TITAN expects.
  // Treat any non-string content as an empty response.
  if (typeof content !== "string" || !content.trim()) {
    const contentType = typeof content;
    // Detect reasoning overflow: the model spent all available tokens on
    // internal reasoning and produced no final content. Retrying the identical
    // request on the same model will produce the same outcome — it is not a
    // transient error. Throw AI_REASONING_OVERFLOW (non-retryable) so the
    // withRetry loop exits immediately and preserves the user's answer for
    // manual reevaluation rather than burning quota on futile retries.
    const isReasoningOverflow = reasoningTokens > 0 && visibleTokens !== null && visibleTokens <= 0;
    console.error(
      "[openRouterAdapter] Non-string or empty content:",
      JSON.stringify({
        model:         actualModel,
        finish_reason: finishReason,
        contentType,
        messageFields: _msg ? Object.keys(_msg) : [],
        usage:         json?.usage || null,
        visibleTokens,
        isReasoningOverflow,
      })
    );
    if (isReasoningOverflow) {
      const err = new Error(
        "The AI model used its entire token budget on internal reasoning and produced no response. " +
        "Your answer is saved — please try again. If this persists, a different model may be selected."
      );
      err.code = "AI_REASONING_OVERFLOW";
      throw err;
    }
    const err = new Error("AI returned an empty response.");
    err.code = "AI_EMPTY_RESPONSE";
    throw err;
  }

  // ── Detect truncated output from token-limit cutoff ───────────────────────
  // finish_reason:"length" means the model ran out of output tokens mid-response.
  // The content string exists but is almost certainly incomplete JSON.
  //
  // Special case: if visible_tokens is also 0 or near-0 with finish_reason:length,
  // the reasoning model consumed all tokens before writing any final content.
  // This is the same reasoning-overflow condition as above and is equally
  // unrecoverable via identical retry — throw AI_REASONING_OVERFLOW.
  //
  // Otherwise throw AI_EMPTY_RESPONSE to let withRetry attempt again; a retry
  // may select a different model that can complete the response.
  if (finishReason === "length") {
    const isReasoningOverflow = reasoningTokens > 0 && visibleTokens !== null && visibleTokens <= 20;
    console.warn(
      "[openRouterAdapter] finish_reason=length — output truncated:",
      JSON.stringify({
        model:        actualModel,
        usage:        json?.usage || null,
        visibleTokens,
        isReasoningOverflow,
      })
    );
    if (isReasoningOverflow) {
      const err = new Error(
        "The AI model used its entire token budget on internal reasoning and produced no response. " +
        "Your answer is saved — please try again. If this persists, a different model may be selected."
      );
      err.code = "AI_REASONING_OVERFLOW";
      throw err;
    }
    const err = new Error("AI response was truncated (finish_reason: length). Please try again.");
    err.code = "AI_EMPTY_RESPONSE";
    throw err;
  }

  // Log the actual model on every successful response for diagnostics.
  // This is the only way to correlate which model handled each request when
  // using the openrouter/free meta-router that selects randomly.
  console.info("[openRouterAdapter] Response OK:", JSON.stringify({
    model:        actualModel,
    finish_reason: finishReason,
    completion_tokens: completionTokens,
    reasoning_tokens:  reasoningTokens > 0 ? reasoningTokens : undefined,
  }));

  return content;
}

module.exports = { generate };

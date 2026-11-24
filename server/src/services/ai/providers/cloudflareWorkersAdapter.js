/**
 * cloudflareWorkersAdapter.js
 *
 * Cloudflare Workers AI provider implementation — DEVELOPMENT ONLY.
 * Routes requests through the Cloudflare AI Gateway for observability.
 *
 * Safety rules:
 *  - Disabled in production and when NODE_ENV is unset (enforced here AND in env.js).
 *  - cf-aig-collect-log-payload is hardcoded to "false" — never driven by env.
 *  - Never logs: tokens, URLs, prompts, response content, or the headers object.
 */
"use strict";

const {
  CF_AI_GATEWAY_ENABLED,
  CF_ACCOUNT_ID,
  CF_API_TOKEN,
  CF_AI_GATEWAY_ID,
  AI_MODEL,
  AI_TIMEOUT_MS,
  IS_PRODUCTION,
} = require("../../../config/env");

/**
 * Send a chat completion request via the Cloudflare Workers AI REST API.
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {object} [options]
 * @param {number} [options.maxTokens=4096]
 * @param {number} [options.temperature=0.1]
 * @param {string} [options.model]
 * @returns {Promise<string>} The assistant's raw text response
 * @throws {Error} With an AI_* error code on failure
 */
async function generate(systemPrompt, userPrompt, options = {}) {
  // ── Production + NODE_ENV guard (defense in depth) ────────────────────────
  if (IS_PRODUCTION || !process.env.NODE_ENV) {
    const err = new Error("Cloudflare Workers AI adapter cannot run in production or when NODE_ENV is unset.");
    err.code = "AI_CONFIG_ERROR";
    throw err;
  }
  if (!CF_AI_GATEWAY_ENABLED) {
    const err = new Error("Cloudflare Workers AI is not enabled. Set CF_AI_GATEWAY_ENABLED=true in your .env file.");
    err.code = "AI_CONFIG_ERROR";
    throw err;
  }

  // ── Credential validation (before any network call) ───────────────────────
  if (!CF_ACCOUNT_ID) {
    const err = new Error("Cloudflare account ID is not configured. Set the account ID in your .env to use the Cloudflare Workers AI provider.");
    err.code = "AI_CONFIG_ERROR";
    throw err;
  }
  if (!CF_API_TOKEN) {
    const err = new Error("Cloudflare API token is not configured. Set the API token in your .env to use the Cloudflare Workers AI provider.");
    err.code = "AI_CONFIG_ERROR";
    throw err;
  }
  if (!CF_AI_GATEWAY_ID) {
    const err = new Error("Cloudflare AI Gateway ID is not configured. Set CF_AI_GATEWAY_ID in your .env to use the Cloudflare Workers AI provider.");
    err.code = "AI_CONFIG_ERROR";
    throw err;
  }

  // ── Model selection ───────────────────────────────────────────────────────
  const model = options.model || AI_MODEL;
  if (!model) {
    const err = new Error("No model configured for Cloudflare Workers AI. Set AI_MODEL or pass model in options.");
    err.code = "AI_CONFIG_ERROR";
    throw err;
  }

  // ── Build request ─────────────────────────────────────────────────────────
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/v1/chat/completions`;

  const headers = {
    "Content-Type":               "application/json",
    "Authorization":              `Bearer ${CF_API_TOKEN}`,
    "cf-aig-gateway-id":          CF_AI_GATEWAY_ID,
    "cf-aig-collect-log-payload": "false",   // hardcoded — never driven by env
  };

  const body = JSON.stringify({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt   },
    ],
    max_completion_tokens: options.maxTokens  || 4096,
    temperature:           options.temperature ?? 0.1,
  });

  // ── Timeout via AbortController ───────────────────────────────────────────
  const timeoutMs  = AI_TIMEOUT_MS || 30000;
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(url, {
      method:  "POST",
      headers,
      body,
      signal:  controller.signal,
    });
  } catch (netErr) {
    clearTimeout(timeoutId);
    if (netErr.name === "AbortError") {
      console.error(`[cloudflareWorkersAdapter] Request timed out after ${timeoutMs}ms`);
      const err = new Error(`AI provider timed out after ${timeoutMs / 1000}s. Please try again.`);
      err.code = "AI_NETWORK_ERROR";
      throw err;
    }
    console.error("[cloudflareWorkersAdapter] Network error:", netErr.message);
    const err = new Error("Could not reach the AI provider. Please try again.");
    err.code = "AI_NETWORK_ERROR";
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    if (response.status === 401) {
      console.error(`[cloudflareWorkersAdapter] HTTP 401`);
      const err = new Error("Cloudflare Workers AI authentication failed. Check your Cloudflare API token in your .env file.");
      err.code   = "AI_AUTH_ERROR";
      err.status = 401;
      throw err;
    }

    if (response.status === 429) {
      const retryAfterSec = parseInt(response.headers.get("Retry-After") || "0", 10) || null;
      console.warn(
        "[cloudflareWorkersAdapter] HTTP 429 rate limit — not retrying.",
        retryAfterSec ? `Retry-After: ${retryAfterSec}s` : "(no Retry-After header)"
      );
      const err = new Error(
        "The AI provider's rate limit has been reached. Your answer is saved — please try again later."
      );
      err.code         = "AI_RATE_LIMIT";
      err.status       = 429;
      err.retryAfterMs = retryAfterSec ? retryAfterSec * 1000 : null;
      throw err;
    }

    console.error(`[cloudflareWorkersAdapter] HTTP ${response.status}`);
    const err = new Error(`AI provider returned HTTP ${response.status}.`);
    err.code   = "AI_PROVIDER_ERROR";
    err.status = response.status;
    throw err;
  }

  let json;
  try {
    json = await response.json();
  } catch {
    console.error("[cloudflareWorkersAdapter] Failed to parse response as JSON");
    const err = new Error("AI returned an unparseable response.");
    err.code = "AI_EMPTY_RESPONSE";
    throw err;
  }

  const _choice      = json?.choices?.[0];
  const _msg         = _choice?.message;
  const content      = _msg?.content;
  const finishReason = _choice?.finish_reason;

  if (typeof content !== "string" || !content.trim()) {
    console.error("[cloudflareWorkersAdapter] Non-string or empty content:", JSON.stringify({
      finish_reason: finishReason,
      usage:         json?.usage || null,
    }));
    const err = new Error("AI returned an empty response.");
    err.code = "AI_EMPTY_RESPONSE";
    throw err;
  }

  console.info("[cloudflareWorkersAdapter] Response OK:", JSON.stringify({
    provider:      "cloudflare_workers",
    model,
    finish_reason: finishReason,
    usage:         json?.usage || null,
  }));

  return content;
}

module.exports = { generate };

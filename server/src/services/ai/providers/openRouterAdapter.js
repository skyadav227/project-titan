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

const { OPENROUTER_API_KEY, AI_MODEL, APP_URL } = require("../../../config/env");

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

  let response;
  try {
    response = await fetch(OPENROUTER_API_URL, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer":  APP_URL,
        "X-Title":       "TITAN Resume Intelligence",
      },
      body: JSON.stringify(body),
    });
  } catch (netErr) {
    console.error("[openRouterAdapter] Network error:", netErr.message);
    const err = new Error("Could not reach the AI provider. Please try again.");
    err.code = "AI_NETWORK_ERROR";
    throw err;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error(`[openRouterAdapter] HTTP ${response.status}:`, text.slice(0, 200));
    const err = new Error(`AI provider returned HTTP ${response.status}.`);
    err.code  = "AI_PROVIDER_ERROR";
    err.status = response.status;
    throw err;
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    console.error("[openRouterAdapter] Empty or unexpected response shape:", JSON.stringify(json).slice(0, 300));
    const err = new Error("AI returned an empty response.");
    err.code = "AI_EMPTY_RESPONSE";
    throw err;
  }

  return content;
}

module.exports = { generate };

/**
 * parsingService.js
 *
 * Deterministic pre-parsing of extracted resume text.
 * Runs BEFORE AI analysis to extract obvious fields via regex,
 * reducing AI token usage and making the AI's job cleaner.
 *
 * The AI spec says: "Text extraction and deterministic parsing should be
 * performed before AI analysis wherever possible."
 *
 * Returns a partial candidateProfile. Fields the parser cannot reliably
 * extract are left empty for the AI to fill.
 */
"use strict";

/**
 * Parse common fields from raw resume text using regex heuristics.
 *
 * @param {string} text - Raw extracted text
 * @returns {object} Partial candidate profile (safe defaults for all fields)
 */
function parseResumeText(text) {
  return {
    personal: {
      name:      extractName(text),
      email:     extractEmail(text),
      phone:     extractPhone(text),
      location:  extractLocation(text),
      linkedin:  extractLinkedIn(text),
      github:    extractGitHub(text),
      portfolio: extractPortfolio(text),
    },
  };
}

// ── Field extractors ──────────────────────────────────────────────────────────

function extractEmail(text) {
  const match = text.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
  return match ? match[0].toLowerCase() : "";
}

function extractPhone(text) {
  // Matches: +91-9876543210, (123) 456-7890, 123.456.7890, 9876543210
  const match = text.match(/(?:\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
  return match ? match[0].trim() : "";
}

function extractLinkedIn(text) {
  const match = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+\/?/i);
  return match ? match[0] : "";
}

function extractGitHub(text) {
  const match = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+\/?/i);
  return match ? match[0] : "";
}

function extractPortfolio(text) {
  // Any URL that is not linkedin/github
  const matches = text.matchAll(/https?:\/\/(?!(?:www\.)?(?:linkedin|github)\.com)[\w.-]+\.[\w]{2,}[^\s]*/gi);
  for (const m of matches) {
    return m[0];
  }
  return "";
}

function extractLocation(text) {
  // Look for patterns like "City, State" or "City, Country" near the top (first 500 chars)
  const top = text.slice(0, 500);
  const match = top.match(/[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]{2,}/);
  return match ? match[0].trim() : "";
}

/**
 * Attempt to extract the candidate's name from the top of the resume.
 * Strategy: first non-empty line that looks like a proper name (2-4 words,
 * no digits, no common section headers).
 */
function extractName(text) {
  const SECTION_HEADERS = new Set([
    "summary", "objective", "experience", "education", "skills",
    "projects", "certifications", "achievements", "contact",
    "profile", "about", "career", "work", "employment",
  ]);

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 8)) {
    if (/\d/.test(line)) continue;             // contains digits
    if (line.length > 60) continue;            // too long for a name
    if (/@/.test(line)) continue;              // email address
    if (/http/i.test(line)) continue;          // URL
    const words = line.split(/\s+/);
    if (words.length < 2 || words.length > 5) continue;
    const lower = line.toLowerCase();
    if (SECTION_HEADERS.has(lower)) continue;
    // Each word starts with uppercase (proper name heuristic)
    if (words.every((w) => /^[A-Z]/.test(w))) {
      return line;
    }
  }
  return "";
}

module.exports = { parseResumeText };

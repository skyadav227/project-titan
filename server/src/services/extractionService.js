/**
 * extractionService.js
 *
 * Extracts raw text from uploaded resume files.
 * Supports PDF (via pdfjs-dist bundled inside pdf-parse) and DOCX (via mammoth).
 *
 * WHY we call pdfjs directly instead of using pdf-parse's wrapper:
 *   pdf-parse stores PDFJS in a module-level singleton variable. If a parse fails
 *   (e.g. "Invalid PDF structure"), pdfjs internals are left in a corrupted state
 *   and every subsequent call in the same process also fails — even for valid PDFs.
 *   Loading pdfjs fresh for each call (via require-cache invalidation) avoids this
 *   completely. Each extraction is isolated.
 *
 * Returns plain text only. The caller is responsible for what happens with it.
 */
"use strict";

const path    = require("path");
const mammoth = require("mammoth");
const { readStoredFile } = require("../utils/fileUtils");

// Resolve the bundled pdfjs path once at module load time.
// We use v1.10.100 (the newest version bundled with pdf-parse).
const PDFJS_PATH = path.resolve(
  path.dirname(require.resolve("pdf-parse")),
  "lib/pdf.js/v1.10.100/build/pdf.js"
);

/**
 * Extract plain text from a stored resume file.
 *
 * @param {string} storageReference - UUID filename on disk
 * @param {"pdf"|"docx"} fileType
 * @returns {Promise<string>} Extracted plain text
 * @throws {Error} code:"EXTRACTION_FAILED" with a user-safe message
 */
async function extractText(storageReference, fileType) {
  const buffer = readStoredFile(storageReference);

  try {
    if (fileType === "pdf")  return await extractFromPdf(buffer);
    if (fileType === "docx") return await extractFromDocx(buffer);
    throw new Error(`Unsupported file type: ${fileType}`);
  } catch (err) {
    // Only re-wrap errors that aren't already ours
    if (err.code === "EXTRACTION_FAILED") throw err;

    console.error("[extractionService] Extraction failed:", err.message);
    const safe = new Error("We couldn't read this resume. Please try another file.");
    safe.code = "EXTRACTION_FAILED";
    throw safe;
  }
}

/**
 * Extract text from a PDF buffer using pdfjs directly.
 *
 * Loads pdfjs fresh on every call by clearing the require cache first.
 * This prevents the module-level singleton from persisting a broken state
 * after a failed parse.
 */
async function extractFromPdf(buffer) {
  // Clear cached pdfjs so each call gets a fresh engine state
  delete require.cache[require.resolve(PDFJS_PATH)];
  const PDFJS = require(PDFJS_PATH);
  PDFJS.disableWorker = true;

  let doc;
  try {
    doc = await PDFJS.getDocument(buffer);
  } catch (err) {
    console.error("[extractionService] pdfjs getDocument failed:", err.message);
    const e = new Error("We couldn't read this resume. Please try another file.");
    e.code = "EXTRACTION_FAILED";
    throw e;
  }

  if (!doc || doc.numPages === 0) {
    const e = new Error("The PDF appears to be empty or image-only.");
    e.code = "EXTRACTION_FAILED";
    throw e;
  }

  const pageTexts = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page    = await doc.getPage(i);
    const content = await page.getTextContent();
    // Reconstruct readable text, preserving line breaks by tracking Y position
    let lastY = null;
    let pageText = "";
    for (const item of content.items) {
      const y = item.transform ? item.transform[5] : null;
      if (lastY !== null && y !== lastY) pageText += "\n";
      pageText += item.str;
      lastY = y;
    }
    pageTexts.push(pageText);
  }

  const text = pageTexts.join("\n\n").trim();
  if (!text) {
    const e = new Error("The PDF appears to be empty or image-only. Text-based PDFs are required.");
    e.code = "EXTRACTION_FAILED";
    throw e;
  }

  return text;
}

/**
 * Extract text from a DOCX buffer via mammoth.
 */
async function extractFromDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  const text   = (result.value || "").trim();
  if (!text) {
    const e = new Error("The DOCX appears to be empty.");
    e.code = "EXTRACTION_FAILED";
    throw e;
  }
  return text;
}

module.exports = { extractText };

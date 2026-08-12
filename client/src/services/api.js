/**
 * api.js
 *
 * Base fetch wrapper for all TITAN API calls.
 * Automatically attaches the Authorization header from localStorage.
 * Returns parsed JSON or throws a structured error.
 *
 * Usage:
 *   import { apiFetch } from './api';
 *   const data = await apiFetch('/resumes/active');
 */

const BASE_URL = "http://localhost:5000/api";

/** Retrieve the stored JWT (null if not logged in). */
export function getToken() {
  return localStorage.getItem("titan_token");
}

/** Persist a JWT after login/register. */
export function setToken(token) {
  localStorage.setItem("titan_token", token);
}

/** Remove the stored JWT on logout. */
export function clearToken() {
  localStorage.removeItem("titan_token");
}

/**
 * Core fetch wrapper.
 *
 * @param {string} path              - e.g. '/resumes/active'
 * @param {RequestInit} [options]    - Standard fetch options
 * @param {boolean} [requireAuth]    - Attach Bearer token (default true)
 * @returns {Promise<any>}           - Parsed response data
 * @throws {{ code: string, message: string }} Structured API error
 */
export async function apiFetch(path, options = {}, requireAuth = true) {
  const headers = { ...(options.headers || {}) };

  if (requireAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData — browser sets it with boundary
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch (netErr) {
    throw { code: "NETWORK_ERROR", message: "Something went wrong. Please try again." };
  }

  let json;
  try {
    json = await response.json();
  } catch {
    throw { code: "PARSE_ERROR", message: "Something went wrong. Please try again." };
  }

  if (!json.success) {
    throw json.error || { code: "SERVER_ERROR", message: "Something went wrong. Please try again." };
  }

  return json.data;
}

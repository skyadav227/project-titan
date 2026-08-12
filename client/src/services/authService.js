/**
 * authService.js
 *
 * Auth API calls. Stores/clears the JWT token on success.
 */

import { apiFetch, setToken, clearToken } from "./api";

export async function register({ name, email, password }) {
  const data = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  }, false);
  setToken(data.token);
  return data;
}

export async function login({ email, password }) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }, false);
  setToken(data.token);
  return data;
}

export async function logout() {
  await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
  clearToken();
}

export async function getMe() {
  return apiFetch("/auth/me");
}

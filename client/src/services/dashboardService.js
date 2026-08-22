/**
 * dashboardService.js
 *
 * Frontend API wrapper for the Dashboard stats endpoint.
 * Follows the same pattern as authService / resumeService.
 */
import { apiFetch } from "./api";

/**
 * Fetch all dashboard stats for the authenticated user.
 * GET /api/dashboard/stats
 */
export function getDashboardStats() {
  return apiFetch("/dashboard/stats");
}

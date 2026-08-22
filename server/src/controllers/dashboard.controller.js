/**
 * dashboard.controller.js
 *
 * Thin HTTP handler for the dashboard stats endpoint.
 * Delegates entirely to dashboardService.
 * Follows existing TITAN controller conventions.
 */
"use strict";

const { getDashboardStats } = require("../services/dashboardService");
const { sendSuccess, sendError } = require("../utils/responseUtils");

/**
 * GET /api/dashboard/stats
 *
 * Returns all dashboard data the frontend needs in a single call.
 * Requires authentication (req.user is set by requireAuth middleware).
 */
async function getStats(req, res, next) {
  try {
    const stats = await getDashboardStats(req.user.id);
    return sendSuccess(res, stats);
  } catch (err) {
    console.error("[dashboard.controller] getStats error:", err.message);
    return next(err);
  }
}

module.exports = { getStats };

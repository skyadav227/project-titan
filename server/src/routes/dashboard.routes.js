/**
 * dashboard.routes.js
 *
 * Single endpoint: GET /api/dashboard/stats
 * Requires JWT authentication.
 */
"use strict";

const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const { getStats }    = require("../controllers/dashboard.controller");

const router = Router();

router.get("/stats", requireAuth, getStats);

module.exports = router;

/**
 * auth.routes.js
 *
 * Routes:
 *   POST   /api/auth/register  — create account
 *   POST   /api/auth/login     — authenticate and receive JWT
 *   POST   /api/auth/logout    — client-side logout acknowledgement
 *   GET    /api/auth/me        — get current user (requires auth)
 */
"use strict";

const { Router } = require("express");
const { register, login, logout, me } = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth");

const router = Router();

router.post("/register", register);
router.post("/login",    login);
router.post("/logout",   logout);
router.get("/me",        requireAuth, me);

module.exports = router;

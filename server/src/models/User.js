/**
 * User.js
 *
 * Mongoose model for TITAN user accounts.
 * Passwords are stored as bcrypt hashes — never plain text.
 */
"use strict";

const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"],
    },
    passwordHash: {
      type: String,
      required: true,
      // Never send the hash to clients — select: false excludes it by default
      select: false,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// email already has unique:true which creates an index

// ── Instance methods ──────────────────────────────────────────────────────────

/**
 * Compare a plain-text password against the stored hash.
 * @param {string} plainPassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// ── Pre-save hook ─────────────────────────────────────────────────────────────
// Not used here because we hash explicitly in the controller before saving,
// which keeps the logic visible and avoids double-hashing on updates.

const User = mongoose.model("User", userSchema);

module.exports = User;

/**
 * db.js
 *
 * Establishes and manages the MongoDB connection via Mongoose.
 * Called once at server startup. The connection is shared across all models.
 */
"use strict";

const mongoose = require("mongoose");
const { MONGO_URI } = require("./env");

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`[db] MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error("[db] MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

// Log connection events after initial connect
mongoose.connection.on("disconnected", () => {
  console.warn("[db] MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("[db] MongoDB error:", err.message);
});

module.exports = { connectDB };

const express = require("express");

const { chatWithAI } = require("./aiController");
const { aiChatLimiter } = require("./rateLimiter");

const router = express.Router();

/**
 * Guest AI Chat
 *
 * POST /api/ai/chat
 *
 * Maximum 8 messages per IP per day.
 */
router.post(
  "/chat",
  aiChatLimiter,
  chatWithAI
);

module.exports = router;
const express = require("express");

const {
  chatWithAI,
  getAdminChats,
} = require("./aiController");

const {
  aiChatLimiter,
} = require("./rateLimiter");

const {
  aiMediaUpload,
} = require("./aiUpload.middleware");

const adminAuth = require("../ADMIN(auth)/middleware/admin.middleware");

const router = express.Router();


router.post(
  "/chat",
  aiChatLimiter,
  aiMediaUpload.single("media"),
  chatWithAI
);

/**
 * Admin - Get AI Chat History
 *
 * GET /api/ai/admin/chats
 *
 * Protected by Admin JWT
 */
router.get(
  "/admin/chats",
  adminAuth,
  getAdminChats
);

module.exports = router;
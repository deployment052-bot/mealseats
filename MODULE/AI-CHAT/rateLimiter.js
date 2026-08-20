const rateLimit = require("express-rate-limit");

const aiChatLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,

  limit: 200,

  standardHeaders: "draft-7",

  legacyHeaders: false,

  message: {
    success: false,
    message:
      "You have reached the daily AI Beta limit. Please try again tomorrow.",
  },
});

module.exports = {
  aiChatLimiter,
};
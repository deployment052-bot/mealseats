const express = require("express");

const aiRoutes = require("../MODULE/AI-CHAT/aiRoutes");

const app = express();

/**
 * Body Parser
 */
app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

/**
 * AI Routes
 *
 * POST /api/ai/chat
 */
app.use("/api/ai", aiRoutes);

/**
 * Health Check
 */
app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "MealEats API is running",
  });
});

/**
 * 404 Handler
 */
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
  console.error("ERROR:", err);

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
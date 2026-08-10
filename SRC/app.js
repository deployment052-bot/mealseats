const express = require("express");
const cors = require("cors");

const aiRoutes = require("../MODULE/AI-CHAT/aiRoutes");

const app = express();

/**
 * ============================
 * CORS CONFIGURATION
 * ============================
 */

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",

  // Apna actual Netlify URL yahan daal
  "https://enchanting-alpaca-17d0b5.netlify.app/",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without origin
      // e.g. Postman, server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked CORS Origin:", origin);

      return callback(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

    credentials: true,
  })
);

/**
 * ============================
 * BODY PARSER
 * ============================
 */

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

/**
 * ============================
 * AI ROUTES
 * ============================
 *
 * POST /api/ai/chat
 */

app.use("/api/ai", aiRoutes);

/**
 * ============================
 * HEALTH CHECK
 * ============================
 */

app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "MealEats API is running",
  });
});

/**
 * ============================
 * 404 HANDLER
 * ============================
 */

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/**
 * ============================
 * GLOBAL ERROR HANDLER
 * ============================
 */

app.use((err, req, res, next) => {
  console.error("ERROR:", err);

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
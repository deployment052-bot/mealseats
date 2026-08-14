const express = require("express");

const {
  adminLogin
} = require("../controllers/auth.controller");

const adminAuth = require("../middleware/admin.middleware");

const router = express.Router();

// Admin Login
router.post(
  "/admin/login",
  adminLogin
);

// Protected admin route example


module.exports = router;
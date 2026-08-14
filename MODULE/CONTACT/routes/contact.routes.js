const express = require("express");

const {
  submitContactForm,getContacts
} = require("../controllers/contact.controller");
const adminAuth = require("../../ADMIN(auth)/middleware/admin.middleware");

const router = express.Router();

router.post("/add", submitContactForm);
router.get(
  "/contacts",
  adminAuth,
  getContacts
);
module.exports = router;
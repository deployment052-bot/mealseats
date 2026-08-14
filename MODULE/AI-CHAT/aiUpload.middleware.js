const multer = require("multer");

// --------------------------------------------------
// STORAGE
// --------------------------------------------------
// File ko temporary memory mein rakhenge.
// Isse req.file.buffer milega jo Gemini ko bhej sakte hain.

const storage = multer.memoryStorage();

// --------------------------------------------------
// ALLOWED FILE TYPES
// --------------------------------------------------

const allowedMimeTypes = [
  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",

  // Videos
  "video/mp4",
  "video/mpeg",
  "video/webm",
  "video/quicktime",
];

// --------------------------------------------------
// FILE FILTER
// --------------------------------------------------

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  return cb(
    new Error(
      "Only JPG, PNG, WEBP images and MP4, MPEG, WEBM, MOV videos are allowed"
    ),
    false
  );
};

// --------------------------------------------------
// MULTER CONFIG
// --------------------------------------------------

const aiMediaUpload = multer({
  storage,

  fileFilter,

  limits: {
    // Maximum 20 MB per file
    fileSize: 20 * 1024 * 1024,
  },
});

module.exports = {
  aiMediaUpload,
};
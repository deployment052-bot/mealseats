const mongoose = require("mongoose");

const chatMediaSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      trim: true,
    },

    mimeType: {
      type: String,
      trim: true,
    },

    size: {
      type: Number,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const chatLogSchema = new mongoose.Schema(
  {
    guestSessionId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    message: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },

    response: {
      type: String,
      required: true,
      trim: true,
    },

    media: {
      type: chatMediaSchema,
      default: null,
    },

    ipAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const ChatLog = mongoose.model(
  "ChatLog",
  chatLogSchema
);

module.exports = ChatLog;
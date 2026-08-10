const mongoose = require("mongoose");

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
      required: true,
      trim: true,
      maxlength: 2000,
    },

    response: {
      type: String,
      required: true,
      trim: true,
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

const ChatLog = mongoose.model("ChatLog", chatLogSchema);

module.exports = ChatLog;
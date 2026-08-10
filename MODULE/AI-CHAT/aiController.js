const ChatLog = require("./ChatLog.js");
const { generateAIResponse } = require("./geminiService.js");

const chatWithAI = async (req, res, next) => {
  try {
    const { message, guestSessionId } = req.body;

    // Validate session
    if (
      !guestSessionId ||
      typeof guestSessionId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "guestSessionId is required",
      });
    }

    // Validate message
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const cleanMessage = message.trim();

    if (!cleanMessage) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty",
      });
    }

    if (cleanMessage.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message cannot exceed 2000 characters",
      });
    }

    // Get IP address
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      null;

    // Call Gemini
    const aiResponse = await generateAIResponse(cleanMessage);

    // Save chat
    const chatLog = await ChatLog.create({
      guestSessionId,
      message: cleanMessage,
      response: aiResponse,
      ipAddress,
    });

    return res.status(200).json({
      success: true,
      message: "AI response generated successfully",

      data: {
        chatId: chatLog._id,
        guestSessionId: chatLog.guestSessionId,
        userMessage: chatLog.message,
        response: chatLog.response,
        timestamp: chatLog.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  chatWithAI,
};
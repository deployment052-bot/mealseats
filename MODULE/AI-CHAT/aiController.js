const ChatLog = require("./ChatLog.js");
const { generateAIResponse } = require("./geminiService.js");

 const {
  generatePDF,
} = require("./utils/pdfGenerator.js");
const {
  shouldGeneratePDF,
} = require("./utils/pdfDetector.js");
const chatWithAI = async (req, res, next) => {
  try {
    const {
      message,
      guestSessionId,
    } = req.body;

    // =================================================
    // SESSION VALIDATION
    // =================================================

    if (
      !guestSessionId ||
      typeof guestSessionId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "guestSessionId is required",
      });
    }

    const cleanGuestSessionId =
      guestSessionId.trim();

    // =================================================
    // MEDIA
    // =================================================

    const media = req.file || null;

    // =================================================
    // MESSAGE
    // =================================================

    const cleanMessage =
      typeof message === "string"
        ? message.trim()
        : "";

    // =================================================
    // MESSAGE OR MEDIA REQUIRED
    // =================================================

    if (!cleanMessage && !media) {
      return res.status(400).json({
        success: false,
        message:
          "Message or image/video is required",
      });
    }

    // =================================================
    // MESSAGE LENGTH
    // =================================================

    if (cleanMessage.length > 2000) {
      return res.status(400).json({
        success: false,
        message:
          "Message cannot exceed 2000 characters",
      });
    }

    // =================================================
    // PDF INTENT DETECTION
    // =================================================

    const shouldGeneratePdf =
      shouldGeneratePDF(cleanMessage);

    // =================================================
    // GET IP
    // =================================================

    const ipAddress =
      req.headers["x-forwarded-for"]
        ?.split(",")[0]
        ?.trim() ||
      req.socket.remoteAddress ||
      null;

    // =================================================
    // DEBUG
    // =================================================

    console.log("AI CHAT REQUEST");

    console.log({
      guestSessionId:
        cleanGuestSessionId,

      message:
        cleanMessage,

      shouldGeneratePdf,

      hasMedia:
        !!media,

      mediaName:
        media?.originalname,

      mediaType:
        media?.mimetype,

      mediaSize:
        media?.size,
    });

    // =================================================
    // GENERATE AI RESPONSE
    // =================================================

    const aiResponse =
      await generateAIResponse({
        message: cleanMessage,
        media,
      });

    // =================================================
    // PDF GENERATION
    // =================================================

    let pdf = null;

    if (shouldGeneratePdf) {
      console.log(
        "Generating PDF..."
      );

      const fileName =
        `mealeats-ai-${Date.now()}.pdf`;

      await generatePDF(
        aiResponse,
        fileName
      );

      pdf = {
        generated: true,
        fileName,
        url: `/uploads/${fileName}`,
      };

      console.log(
        "PDF generated successfully:",
        fileName
      );
    }

    // =================================================
    // SAVE CHAT
    // =================================================

    const chatLog =
      await ChatLog.create({
        guestSessionId:
          cleanGuestSessionId,

        message:
          cleanMessage,

        response:
          aiResponse,

        media: media
          ? {
              type:
                media.mimetype.startsWith(
                  "image/"
                )
                  ? "IMAGE"
                  : "VIDEO",

              originalName:
                media.originalname,

              mimeType:
                media.mimetype,

              size:
                media.size,

              url: null,

              publicId: null,
            }
          : null,

        ipAddress,
      });

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,

      message:
        "AI response generated successfully",

      data: {
        chatId:
          chatLog._id,

        guestSessionId:
          chatLog.guestSessionId,

        userMessage:
          chatLog.message,

        response:
          chatLog.response,

        media:
          chatLog.media,

        pdf,

        timestamp:
          chatLog.createdAt,
      },
    });

  } catch (error) {
    console.error(
      "AI CHAT ERROR:",
      error
    );

    next(error);
  }
};



const getAdminChats = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      date,
      guestSessionId,
    } = req.query;

    const pageNumber = Math.max(
      parseInt(page, 10) || 1,
      1
    );

    const limitNumber = Math.min(
      Math.max(parseInt(limit, 10) || 20, 1),
      100
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    const query = {};

    // ==========================================
    // FILTER BY GUEST SESSION
    // ==========================================

    if (guestSessionId) {
      query.guestSessionId =
        guestSessionId.trim();
    }


    // ==========================================
    // FILTER BY DATE
    // ==========================================

    if (date) {
      const startDate = new Date(
        `${date}T00:00:00.000Z`
      );

      const endDate = new Date(
        `${date}T23:59:59.999Z`
      );

      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime())
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid date format. Use YYYY-MM-DD",
        });
      }

      query.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }


    // ==========================================
    // GET CHATS
    // ==========================================

    const [chats, total] =
      await Promise.all([
        ChatLog.find(query)
          .select(
            "guestSessionId message createdAt"
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limitNumber)
          .lean(),

        ChatLog.countDocuments(query),
      ]);


    // ==========================================
    // FORMAT RESPONSE
    // ==========================================

    const formattedChats =
      chats.map((chat) => ({
        id: chat._id,

        guestSessionId:
          chat.guestSessionId,

        message: chat.message,

        date: chat.createdAt
          ? chat.createdAt
              .toISOString()
              .split("T")[0]
          : null,

        time: chat.createdAt
          ? chat.createdAt
              .toISOString()
              .split("T")[1]
              .split(".")[0]
          : null,

        createdAt: chat.createdAt,
      }));


    return res.status(200).json({
      success: true,
      message:
        "AI chat history fetched successfully",

      data: {
        chats: formattedChats,

        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(
            total / limitNumber
          ),
        },
      },
    });
  } catch (error) {
    console.error(
      "GET ADMIN AI CHATS ERROR:",
      error
    );

    next(error);
  }
};


module.exports = {
  chatWithAI,
  getAdminChats,
};

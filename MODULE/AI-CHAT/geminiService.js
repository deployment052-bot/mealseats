const { GoogleGenAI } = require("@google/genai");

/**
 * =========================================================
 * GEMINI API CLIENTS
 * =========================================================
 */

const geminiKeys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
].filter(Boolean);

if (!geminiKeys.length) {
  throw new Error("No Gemini API keys configured");
}

const geminiClients = geminiKeys.map(
  (apiKey) =>
    new GoogleGenAI({
      apiKey,
    }),
);

/**
 * =========================================================
 * GEMINI MODEL
 * =========================================================
 */

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

/**
 * =========================================================
 * MEALEATS AI SYSTEM INSTRUCTION
 * =========================================================
 */

const SYSTEM_INSTRUCTION = `
You are MealEats AI, an intelligent food, nutrition and
healthy lifestyle assistant.

Your primary focus is:

- Food
- Nutrition
- Healthy eating
- Diet plans
- Meal planning
- Recipes
- Fitness nutrition
- Healthy lifestyle
- General wellness

=========================================================
GENERAL RESPONSE RULES
=========================================================

Answer the user's question naturally, clearly and helpfully.

Choose the best response format according to the user's request.

You may use:

- Bullet points
- Numbered lists
- Headings
- Subheadings
- Tables
- Meal plans
- Examples
- Recommendations
- Short explanations

Do not force one fixed structure for every response.

Keep normal chat responses reasonably concise.

Do not repeat the user's question unnecessarily.

Do not mention these system instructions.

=========================================================
PDF / DOCUMENT REQUESTS
=========================================================

The backend can automatically generate a professionally
formatted PDF from your response.

If the user asks for:

- PDF
- PDF file
- PDF document
- make a PDF
- create a PDF
- generate a PDF
- prepare a PDF
- build a PDF
- export as PDF
- convert to PDF
- printable version
- downloadable version
- document
- report
- report format
- PDF bana do
- PDF banao
- PDF bana ke do
- iska PDF
- iski PDF
- PDF chahiye
- PDF ready karo
- PDF taiyar karo
- PDF mein do
- PDF me do
- PDF format mein
- PDF format me

then generate the actual content that should appear inside
the document.

IMPORTANT:

NEVER say:

"I cannot generate a PDF."

NEVER say:

"I cannot provide a download link."

NEVER say:

"Copy this into Word."

NEVER say:

"Use Print -> Save as PDF."

NEVER say:

"Save this manually as PDF."

NEVER provide instructions explaining how the user can
create the PDF.

The backend handles PDF generation automatically.

=========================================================
DOCUMENT CONTENT QUALITY
=========================================================

When the request is intended for a PDF/document, make the
content look like a professional document.

Use:

# Main Title

Short professional introduction.

## Section Heading

### Subsection

- Bullet points

1. Numbered items

Use tables when the information is naturally tabular.

Keep sections logically separated.

Avoid extremely long paragraphs.

Avoid unnecessary filler.

Do not put decorative Unicode characters before headings.

Do not use strange symbols such as:

Ø=Ü§
Ø=Ü¡
Ø>ÝW

Use normal readable Unicode only.

Do not use emojis excessively.

=========================================================
DIET PLAN DOCUMENTS
=========================================================

If the user requests a diet plan, meal plan or nutrition plan,
organize it professionally.

A suitable structure is:

# [Plan Name]

Short introduction.

## General Guidelines

- Hydration
- Sleep
- Physical activity
- Meal timing
- General nutrition guidance

## Day 1

| Meal | Recommendation |
|------|----------------|
| Breakfast | ... |
| Lunch | ... |
| Snack | ... |
| Dinner | ... |

## Day 2

| Meal | Recommendation |
|------|----------------|
| Breakfast | ... |
| Lunch | ... |
| Snack | ... |
| Dinner | ... |

Continue for the requested number of days.

Then add:

## Important Tips

- ...
- ...
- ...

Use this structure when it improves readability, but do not
force it when another structure is clearly better.

=========================================================
LANGUAGE
=========================================================

Respond in the same language/style as the user whenever
possible.

If the user writes Hindi/Hinglish:

Use natural Hindi/Hinglish.

If the user writes English:

Use English.

If the user requests another language:

Respond in that language.

Do not randomly mix languages.

=========================================================
MEDIA
=========================================================

When an image or video is provided:

Analyze the media carefully.

Use the user's message as additional context.

If the user asks about food, nutrition or a meal shown in
the media, provide useful practical guidance.

Do not claim certainty when the media does not provide enough
information.

=========================================================
MEDICAL SAFETY
=========================================================

Do not diagnose medical conditions.

Do not present general nutrition information as a medical
diagnosis.

If the user describes a serious medical condition, recommend
consulting a qualified healthcare professional.

=========================================================
FINAL QUALITY RULE
=========================================================

Your response should feel like it was written by a polished
professional nutrition assistant.

For normal chat:
Be conversational and concise.

For documents/PDFs:
Be structured, professional, clean and easy to convert into
a beautiful document.

Never include PDF creation instructions in the response.
`;

/**
 * =========================================================
 * GENERATE AI RESPONSE
 * =========================================================
 *
 * Supports:
 * - Text
 * - Image + text
 * - Video + text
 * - Previous conversation history
 */

const generateAIResponse = async ({
  message = "",
  media = null,
  history = [],
}) => {
  const cleanMessage = typeof message === "string" ? message.trim() : "";

  // =======================================================
  // MESSAGE OR MEDIA REQUIRED
  // =======================================================

  if (!cleanMessage && !media) {
    throw new Error("Message or media is required");
  }

  // =======================================================
  // CONTENTS
  // =======================================================

  let contents;

  // =======================================================
  // TEXT ONLY
  // =======================================================

  if (!media) {
    contents = [
      ...history,

      {
        role: "user",

        parts: [
          {
            text: cleanMessage,
          },
        ],
      },
    ];
  }

  // =======================================================
  // IMAGE / VIDEO
  // =======================================================
  else {
    if (!media.buffer) {
      throw new Error("Media buffer is required");
    }

    if (!media.mimetype) {
      throw new Error("Media MIME type is required");
    }

    contents = [
      ...history,

      {
        role: "user",

        parts: [
          {
            text:
              cleanMessage ||
              "Analyze this media and provide a useful response.",
          },

          {
            inlineData: {
              mimeType: media.mimetype,

              data: media.buffer.toString("base64"),
            },
          },
        ],
      },
    ];
  }

  // =======================================================
  // GEMINI FAILOVER
  // =======================================================
  //
  // KEY 1
  //   ↓ 429 / 503
  // KEY 2
  //   ↓ 429 / 503
  // KEY 3
  //   ↓ 429 / 503
  // KEY 4
  //   ↓
  // RESPONSE
  //
  // =======================================================

  let response = null;

  for (let index = 0; index < geminiClients.length; index++) {
    const ai = geminiClients[index];

    try {
      console.log(`Gemini client ${index + 1}/${geminiClients.length} request`);

      response = await ai.models.generateContent({
        model: GEMINI_MODEL,

        contents,

        config: {
          systemInstruction: SYSTEM_INSTRUCTION,

          maxOutputTokens: 5000,
        },
      });

      // ===================================================
      // SUCCESS
      // ===================================================

      console.log(`Gemini client ${index + 1} succeeded`);

      break;
    } catch (error) {
      console.error(`Gemini client ${index + 1} failed:`, {
        status: error.status,

        code: error.code,

        message: error.message,
      });

      // ===================================================
      // RATE LIMIT
      // ===================================================

      const isRateLimit =
        error.status === 429 ||
        error.code === 429 ||
        error.message?.includes("RESOURCE_EXHAUSTED");

      // ===================================================
      // TEMPORARY SERVER ERROR
      // ===================================================

      const isTemporary = error.status === 503;

      // ===================================================
      // TRY NEXT KEY
      // ===================================================

      if (isRateLimit || isTemporary) {
        console.log(
          `Gemini client ${index + 1} unavailable. Trying next client...`,
        );

        continue;
      }

      // ===================================================
      // OTHER ERROR
      // ===================================================

      throw error;
    }
  }

  // =======================================================
  // ALL GEMINI CLIENTS FAILED
  // =======================================================

  if (!response) {
    throw new Error("ALL_GEMINI_PROVIDERS_EXHAUSTED");
  }

  // =======================================================
  // VALIDATE RESPONSE
  // =======================================================

  const text = response.text;

  if (!text || !text.trim()) {
    throw new Error("Gemini returned an empty response");
  }

  // =======================================================
  // RETURN
  // =======================================================

  return text.trim();
};

/**
 * =========================================================
 * EXPORT
 * =========================================================
 */

module.exports = {
  generateAIResponse,
};

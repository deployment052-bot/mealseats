const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

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
 */

const generateAIResponse = async ({
  message = "",
  media = null,
}) => {

  const cleanMessage =
    typeof message === "string"
      ? message.trim()
      : "";

  // =======================================================
  // MESSAGE OR MEDIA REQUIRED
  // =======================================================

  if (!cleanMessage && !media) {
    throw new Error(
      "Message or media is required"
    );
  }

  let contents;

  // =======================================================
  // TEXT ONLY
  // =======================================================

  if (!media) {

    contents = cleanMessage;

  }

  // =======================================================
  // IMAGE / VIDEO
  // =======================================================

  else {

    if (!media.buffer) {
      throw new Error(
        "Media buffer is required"
      );
    }

    if (!media.mimetype) {
      throw new Error(
        "Media MIME type is required"
      );
    }

    contents = [
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
    ];
  }

  // =======================================================
  // GEMINI REQUEST WITH RETRY
  // =======================================================

  let response = null;

  for (let attempt = 1; attempt <= 3; attempt++) {

    try {

      console.log(
        `Gemini request attempt ${attempt}/3`
      );

      response =
        await ai.models.generateContent({

          model: "gemini-3.6-flash",

          contents,

          config: {

            systemInstruction:
              SYSTEM_INSTRUCTION,

            maxOutputTokens: 5000,

          },

        });

      // Successful response
      break;

    } catch (error) {

      console.error(
        `Gemini attempt ${attempt} failed:`,
        error.status,
        error.message
      );

      // ===================================================
      // RETRY TEMPORARY 503 ERRORS
      // ===================================================

      if (
        error.status === 503 &&
        attempt < 3
      ) {

        const retryDelay =
          attempt * 2000;

        console.log(
          `Gemini unavailable. Retrying after ${retryDelay}ms...`
        );

        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              retryDelay
            )
        );

        continue;
      }

      throw error;
    }
  }

  // =======================================================
  // VALIDATE RESPONSE
  // =======================================================

  if (!response) {
    throw new Error(
      "Gemini did not return a response"
    );
  }

  const text =
    response.text;

  if (
    !text ||
    !text.trim()
  ) {
    throw new Error(
      "Gemini returned an empty response"
    );
  }

  return text.trim();
};


module.exports = {
  generateAIResponse,
};
const { BrevoClient } = require("@getbrevo/brevo");

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

const sendEmail = async ({
  to,
  toName,
  subject,
  html,
}) => {
  try {
    const response =
      await brevo.transactionalEmails.sendTransacEmail({
        sender: {
          name: process.env.BREVO_SENDER_NAME,
          email: process.env.BREVO_SENDER_EMAIL,
        },

        to: [
          {
            email: to,
            name: toName || "",
          },
        ],

        subject,
        htmlContent: html,
      });

    console.log("Brevo email sent:", response.messageId);

    return response;
  } catch (error) {
    console.error(
      "Brevo email error:",
      error?.message || error
    );

    throw error;
  }
};

module.exports = {
  sendEmail,
};
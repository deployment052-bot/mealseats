require("dotenv").config();

const { sendEmail } = require("./MODULE/CONTACT/utils/brevo");

(async () => {
  try {
    await sendEmail({
      to: "backendoffice12@gmail.com",
      toName: "Test User",
      subject: "MealEats Email Test",
      html: `
        <h2>MealEats Test Email</h2>
        <p>Brevo integration successfully working.</p>
        <p>This is an automated test email.</p>
      `,
    });

    console.log("Test email sent successfully");
  } catch (error) {
    console.error("Test failed:", error);
  }
})();
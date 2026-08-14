const Contact = require("../model");

const { sendEmail } = require("../utils/brevo");

const submitContactForm = async (req, res) => {
  try {
    const { fullName, email, phone, goal } = req.body;

    if (!fullName || !email || !phone || !goal) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }
    const contact = await Contact.create({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      goal: goal.trim(),
    });
    try {
      await sendEmail({
        to: contact.email,
        toName: contact.fullName,

        subject: "We received your enquiry - MealEats",

        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>MealEats Contact Confirmation</title>
            </head>

            <body
              style="
                margin: 0;
                padding: 0;
                background-color: #f5f5f5;
                font-family: Arial, Helvetica, sans-serif;
              "
            >

              <div
                style="
                  max-width: 600px;
                  margin: 40px auto;
                  background: #ffffff;
                  border-radius: 12px;
                  overflow: hidden;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                "
              >

                <!-- HEADER -->

                <div
                  style="
                    padding: 25px;
                    text-align: center;
                    background-color: #ffffff;
                  "
                >
                  <h1
                    style="
                      margin: 0;
                      font-size: 28px;
                      color: #222222;
                    "
                  >
                    MealEats
                  </h1>
                </div>

                <!-- CONTENT -->

                <div style="padding: 30px;">

                  <h2
                    style="
                      margin-top: 0;
                      color: #222222;
                    "
                  >
                    Thank you for contacting us!
                  </h2>

                  <p
                    style="
                      color: #555555;
                      font-size: 15px;
                      line-height: 1.6;
                    "
                  >
                    Hi ${contact.fullName},
                  </p>

                  <p
                    style="
                      color: #555555;
                      font-size: 15px;
                      line-height: 1.6;
                    "
                  >
                    We have successfully received your
                    contact form submission.
                    Our team will review your request and
                    get back to you shortly.
                  </p>

                  <!-- DETAILS -->

                  <div
                    style="
                      margin-top: 25px;
                      padding: 20px;
                      background-color: #f8f8f8;
                      border-radius: 8px;
                    "
                  >

                    <h3
                      style="
                        margin-top: 0;
                        color: #222222;
                      "
                    >
                      Your enquiry details
                    </h3>

                    <p
                      style="
                        margin: 8px 0;
                        color: #555555;
                      "
                    >
                      <strong>Name:</strong>
                      ${contact.fullName}
                    </p>

                    <p
                      style="
                        margin: 8px 0;
                        color: #555555;
                      "
                    >
                      <strong>Email:</strong>
                      ${contact.email}
                    </p>

                    <p
                      style="
                        margin: 8px 0;
                        color: #555555;
                      "
                    >
                      <strong>Phone:</strong>
                      ${contact.phone}
                    </p>

                    <p
                      style="
                        margin: 8px 0;
                        color: #555555;
                      "
                    >
                      <strong>Goal:</strong>
                      ${contact.goal}
                    </p>

                  </div>

                  <p
                    style="
                      margin-top: 25px;
                      color: #555555;
                      font-size: 14px;
                      line-height: 1.6;
                    "
                  >
                    You don't need to take any further
                    action at this time. Our team will
                    contact you shortly.
                  </p>

                  <p
                    style="
                      margin-top: 30px;
                      color: #555555;
                      font-size: 14px;
                    "
                  >
                    Regards,<br />
                    <strong>MealEats Team</strong>
                  </p>

                </div>

                <!-- FOOTER -->

                <div
                  style="
                    padding: 20px;
                    text-align: center;
                    background-color: #f8f8f8;
                    color: #888888;
                    font-size: 12px;
                  "
                >
                  This is an automated email.
                  Please do not reply directly to this email.
                </div>

              </div>

            </body>
          </html>
        `,
      });

      console.log("CONTACT CONFIRMATION EMAIL SENT:", contact.email);
    } catch (emailError) {
      console.error(
        "CONTACT CONFIRMATION EMAIL ERROR:",
        emailError?.message || emailError,
      );
    }

    return res.status(201).json({
      success: true,
      message:
        "Contact form submitted successfully. We will contact you shortly.",
      data: {
        id: contact._id,
      },
    });
  } catch (error) {
    console.error("CONTACT FORM ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getContacts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;

    const pageNumber = Math.max(Number(page), 1);

    const limitNumber = Math.min(Math.max(Number(limit), 1), 100);

    const skip = (pageNumber - 1) * limitNumber;

    // Base query
    const query = {};

    // Search
    if (search.trim()) {
      query.$or = [
        {
          fullName: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          email: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          phone: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          goal: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    const [contacts, total] = await Promise.all([
      Contact.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      Contact.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: "Contact details fetched successfully",

      data: {
        contacts,

        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error) {
    console.error("GET CONTACTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch contact details",
    });
  }
};

module.exports = {
  submitContactForm,
  getContacts,
};

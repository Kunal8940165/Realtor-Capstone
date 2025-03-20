const nodemailer = require("nodemailer");
const { createZoomMeeting } = require("../services/zoomService");
require("dotenv").config();

const sendEmail = async (to, subject, body, includeZoom = false) => {
  try {
    let zoomLink = "";

    // Generate Zoom Link if required
    if (includeZoom) {
      zoomLink = await createZoomMeeting();
      body += `<p><strong>Zoom Link:</strong> <a href="${zoomLink}">${zoomLink}</a></p>`;
    }

    // Configure Nodemailer SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_USER,
      to,
      subject,
      html: body,
    };

    await transporter.sendMail(mailOptions);

    console.log(`📧 Email sent to ${to}`);
    return zoomLink;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return null;
  }
};

module.exports = sendEmail;

const transporter = require("../config/mail");
require("dotenv").config();

async function testMail() {
  const targetEmail = process.argv[2] || process.env.TEST_RECIPIENT_EMAIL || process.env.EMAIL_USER;

  console.log("");
  console.log("Testing Mail Transporter with Config...");
  console.log("EMAIL_USER (FROM):", process.env.EMAIL_USER);
  console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "****" + process.env.EMAIL_PASS.slice(-4) : "NOT SET");
  console.log("RECIPIENT (TO):", targetEmail);
  console.log("");

  try {
    const info = await transporter.sendMail({
      from: `DocuCore AI <${process.env.EMAIL_USER}>`,
      to: targetEmail,
      subject: "Test Credentials Email - DocuCore AI",
      html: `
        <div style="font-family: sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <h2 style="color: #274690; margin-top: 0;">Welcome to DocuCore AI Platform</h2>
          <p>This is a dynamic test email dispatched from the backend server to: <strong>${targetEmail}</strong></p>
          <p style="margin-top: 16px;">Login URL: <a href="http://localhost:3000/auth/login" style="color: #274690; font-weight: bold;">http://localhost:3000/auth/login</a></p>
        </div>
      `,
    });
    console.log(" SUCCESS! Mail delivered. Message ID:", info.messageId || info);
    console.log("");
  } catch (err) {
    console.error(" ERROR sending mail:", err.message);
    console.log("");
  }
}


testMail(); 

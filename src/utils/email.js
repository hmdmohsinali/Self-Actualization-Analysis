import nodemailer from "nodemailer";

/**
 * Create reusable transporter object using SMTP transport
 */
const createTransporter = () => {
  // For development, you can use Ethereal Email (fake SMTP) or Gmail
  // For production, use proper SMTP service like SendGrid, AWS SES, etc.

  if (process.env.NODE_ENV === "development" && !process.env.SMTP_HOST) {
    // In development without SMTP config, return a mock transporter
    console.warn("⚠️  Email service not configured. Emails will not be sent.");
    return {
      sendMail: async (options) => {
        console.log("📧 Mock Email:", {
          to: options.to,
          subject: options.subject,
          text: options.text,
        });
        return { messageId: "mock-message-id" };
      },
    };
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // For Gmail, you might need to enable "Less secure app access" or use App Password
    // For other services, adjust accordingly
  });
};

const transporter = createTransporter();

/**
 * Send password reset OTP email
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.name - Recipient name
 * @param {string} options.otp - Password reset OTP
 * @param {number} [options.expiresInMinutes=10] - OTP expiry time in minutes
 * @returns {Promise} Email send result
 */
export const sendPasswordResetOTPEmail = async ({
  email,
  name,
  otp,
  expiresInMinutes = 10,
}) => {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "Self Actualization"}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "Your Password Reset Code",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Password Reset Code</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <p style="font-size: 16px;">Hello ${name || "User"},</p>
            <p style="font-size: 16px;">You requested to reset your password. Use the following code to continue:</p>
            <p style="font-size: 32px; letter-spacing: 12px; font-weight: bold; text-align: center; margin: 30px 0; color: #333;">
              ${otp}
            </p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              <strong>This code will expire in ${expiresInMinutes} minutes.</strong>
            </p>
            <p style="font-size: 14px; color: #666;">
              If you didn't request this password reset, please ignore this email or contact support if you have concerns.
            </p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              This is an automated email, please do not reply.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
      Password Reset Code
      
      Hello ${name || "User"},
      
      You requested to reset your password. Use the following code to continue:
      
      ${otp}
      
      This code will expire in ${expiresInMinutes} minutes.
      
      If you didn't request this password reset, please ignore this email.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Password reset OTP email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending password reset OTP email:", error);
    throw new Error("Failed to send password reset OTP email");
  }
};

/**
 * Send welcome email (optional utility)
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.name - Recipient name
 * @returns {Promise} Email send result
 */
export const sendWelcomeEmail = async ({ email, name }) => {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "Self Actualization"}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "Welcome to Self Actualization Analysis",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Welcome!</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <p style="font-size: 16px;">Hello ${name},</p>
            <p style="font-size: 16px;">Thank you for joining us! We're excited to have you on board.</p>
            <p style="font-size: 14px; color: #666;">If you have any questions, feel free to reach out to our support team.</p>
          </div>
        </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Welcome email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending welcome email:", error);
    // Don't throw error for welcome email, it's not critical
    return null;
  }
};


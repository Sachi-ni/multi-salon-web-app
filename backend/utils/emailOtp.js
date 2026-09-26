import crypto from "crypto";
import { sendEmail } from "./sendEmail.js";

export const OTP_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;  // 60 seconds
export const MAX_OTP_ATTEMPTS = 5;

/**
 * Generates a cryptographically secure 6-digit numeric OTP.
 */
export const generateOtpCode = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Hashes an OTP code with SHA-256 for secure database storage.
 */
export const hashOtpCode = (code) => {
  return crypto.createHash("sha256").update(String(code).trim()).digest("hex");
};

/**
 * Masks an email for safe client-side display (e.g., "p***5@gmail.com").
 */
export const maskEmail = (email) => {
  if (!email || typeof email !== "string") return "";
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const [localPart, domain] = parts;
  if (localPart.length <= 2) {
    return `${localPart[0]}*@${domain}`;
  }
  const maskedLocal = `${localPart[0]}***${localPart[localPart.length - 1]}`;
  return `${maskedLocal}@${domain}`;
};

/**
 * Sends a 6-digit OTP code through the shared email-sending utility, which
 * tries SendGrid, then Resend, then Gmail SMTP in order.
 * Delivery failures are reported without including credential values.
 */
export const sendOtpEmail = async ({ email, code, type = "superadmin" }) => {
  // Never log OTP values. They are credentials and must only be delivered to the user.
  // SECURITY: Never enable DEBUG_LOG_OTP in production. This requires an explicit local opt-in.
  if (process.env.NODE_ENV === "development" && process.env.DEBUG_LOG_OTP === "true") {
    console.log(`[DEV ONLY] OTP for ${email}: ${code}`);
  }
  const isPasswordReset = type === "password-reset";
  const title = isPasswordReset ? "Password Reset Code" : "SuperAdmin Verification Code";
  const description = isPasswordReset
    ? "A password reset was requested for your SalonHub account. Enter the verification code below to continue."
    : "A sign-in request was initiated for your SalonHub SuperAdmin account. Enter the verification code below to complete your authentication:";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
          .container { max-width: 520px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; }
          .header { background: #0f172a; padding: 24px; text-align: center; border-bottom: 1px solid #334155; }
          .logo { font-size: 24px; font-weight: 900; color: #38bdf8; letter-spacing: -0.5px; }
          .body { padding: 32px 24px; text-align: center; }
          .title { font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 12px; }
          .desc { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
          .code-box { background: #0f172a; border: 2px dashed #38bdf8; border-radius: 12px; padding: 18px 24px; display: inline-block; margin-bottom: 24px; }
          .code { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; font-family: 'Courier New', Courier, monospace; }
          .warning { font-size: 12px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #334155; padding-top: 20px; margin-top: 16px; }
          .footer { text-align: center; font-size: 11px; color: #64748b; padding: 16px; background: #0b1120; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="logo">SalonHub Security</span>
          </div>
          <div class="body">
            <h1 class="title">${title}</h1>
            <p class="desc">${description}</p>
            <div class="code-box">
              <span class="code">${code}</span>
            </div>
            <p class="desc">This code expires in <strong>10 minutes</strong>. Do not share this code with anyone.</p>
            <div class="warning">
              If you did not request this, you can safely ignore this email.
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} SalonHub Multi-Salon Platform. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  const result = await sendEmail({
    to: email,
    subject: `SalonHub ${isPasswordReset ? "Password Reset" : "Verification"} Code: ${code}`,
    text: `Your SalonHub ${isPasswordReset ? "password reset" : "verification"} code is: ${code}\n\nThis code expires in 10 minutes.`,
    html: htmlContent,
    fromName: "SalonHub Security",
  });

  if (result.delivered) {
    console.log(`[SuperAdmin OTP] Verification code emailed via ${result.provider} to: ${email}`);
  } else {
    console.warn(`[SuperAdmin OTP] Verification code delivery failed for: ${email}`);
  }

  return result;
};

// Kept as a named wrapper so the established SuperAdmin flow continues to use
// the same delivery infrastructure as password reset without duplicating it.
export const sendSuperAdminOtpEmail = ({ email, code }) =>
  sendOtpEmail({ email, code, type: "superadmin" });

import crypto from "crypto";
import nodemailer from "nodemailer";

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
 * Sends the 6-digit OTP code to the SuperAdmin's email address.
 * Supports both HTTP-based email (Resend API) and standard SMTP (Nodemailer).
 * If cloud hosting (like Render Free Tier) blocks outbound SMTP ports, the code is
 * prominently logged in the server console so login is never broken.
 */
export const sendSuperAdminOtpEmail = async ({ email, code }) => {
  // Always log the OTP code in the server logs so developers / admins can always access it
  console.log("============================================================");
  console.log(`🔑 [SUPERADMIN OTP CODE]: ${code} (For: ${email})`);
  console.log("============================================================");

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
            <h1 class="title">SuperAdmin Verification Code</h1>
            <p class="desc">A sign-in request was initiated for your SalonHub SuperAdmin account. Enter the verification code below to complete your authentication:</p>
            <div class="code-box">
              <span class="code">${code}</span>
            </div>
            <p class="desc">This code expires in <strong>10 minutes</strong>. Do not share this code with anyone.</p>
            <div class="warning">
              If you did not request this login, someone may know your password. Please change your SuperAdmin password immediately.
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} SalonHub Multi-Salon Platform. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  // 1. If RESEND_API_KEY is configured, use HTTP REST API (never blocked by cloud firewalls on port 443)
  if (process.env.RESEND_API_KEY) {
    try {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "SalonHub Security <onboarding@resend.dev>",
          to: [email],
          subject: `SalonHub Verification Code: ${code}`,
          html: htmlContent,
        }),
      });

      if (resendRes.ok) {
        console.log(`[SuperAdmin OTP] Verification code emailed via Resend HTTP API to: ${email}`);
        return { delivered: true, provider: "resend" };
      }
      const resendErr = await resendRes.text();
      console.warn(`[SuperAdmin OTP] Resend HTTP API error: ${resendErr}`);
    } catch (httpErr) {
      console.warn(`[SuperAdmin OTP] Resend HTTP fetch failed: ${httpErr.message}`);
    }
  }

  // 2. If SMTP credentials exist, attempt SMTP with a fast 4s timeout
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        family: 4,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 5000,
      });

      await transporter.sendMail({
        from: `"SalonHub Security" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `SalonHub Verification Code: ${code}`,
        text: `Your SalonHub SuperAdmin verification code is: ${code}\n\nThis code expires in 10 minutes.`,
        html: htmlContent,
      });

      console.log(`[SuperAdmin OTP] Verification code successfully emailed to: ${email}`);
      return { delivered: true, provider: "smtp" };
    } catch (smtpErr) {
      console.warn(`[SuperAdmin OTP] SMTP delivery blocked or failed (${smtpErr.message}). Code is available in server logs above.`);
      // Return gracefully so cloud host port blocking does not break the login flow
      return { delivered: false, inLogs: true, error: smtpErr.message };
    }
  }

  return { delivered: false, inLogs: true };
};

import sgMail from "@sendgrid/mail";
import nodemailer from "nodemailer";

let sendGridConfigured = false;

// Lazily configures the SendGrid client only once per process, only when a
// key is actually present, so importing this module has no side effects.
const getSendGridClient = () => {
  if (!sendGridConfigured) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    sendGridConfigured = true;
  }
  return sgMail;
};

/**
 * Shared email-sending utility used across the app (OTP, contact form,
 * appointment notifications, bill receipts, etc.).
 *
 * Tries providers in order and stops at the first successful delivery:
 *   1. SendGrid HTTPS API   (SENDGRID_API_KEY + SENDGRID_FROM_EMAIL)
 *      — Uses HTTPS (port 443), so it is not affected by Render's free-tier
 *        outbound SMTP port block. This is the primary/preferred provider.
 *   2. Resend HTTPS API     (RESEND_API_KEY)
 *      — Kept as a fallback since it is already proven working.
 *   3. Gmail SMTP via Nodemailer (EMAIL_USER + EMAIL_PASS)
 *      — Final fallback; may be blocked on some hosts' free tiers.
 *   4. If nothing is configured, logs a clear error and returns delivered: false.
 *
 * SECURITY: Never log the API key, credentials, or full email body/HTML.
 * Only the recipient address, subject-less status, and provider name are logged.
 *
 * @param {Object} options
 * @param {string} options.to - recipient email address
 * @param {string} options.subject - email subject line
 * @param {string} [options.text] - plain text body (at least one of text/html required)
 * @param {string} [options.html] - HTML body
 * @param {string} [options.fromName] - display name for the "From" header (default "SalonHub")
 * @returns {Promise<{delivered: boolean, provider?: string, error?: string}>}
 */
export const sendEmail = async ({ to, subject, text, html, fromName = "SalonHub" }) => {
  if (!to || !subject || (!text && !html)) {
    console.error("[sendEmail] Missing required fields (to/subject/text|html); email not sent.");
    return { delivered: false, error: "missing_fields" };
  }

  // 1. SendGrid HTTPS API
  if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
    try {
      const client = getSendGridClient();
      await client.send({
        to,
        from: { email: process.env.SENDGRID_FROM_EMAIL, name: fromName },
        subject,
        ...(text ? { text } : {}),
        ...(html ? { html } : {}),
      });
      console.log(`[Email] Delivered via SendGrid to: ${to}`);
      return { delivered: true, provider: "sendgrid" };
    } catch (sgErr) {
      const sgErrMsg = sgErr?.response?.body?.errors?.[0]?.message || sgErr.message;
      console.warn(`[Email] SendGrid delivery failed: ${sgErrMsg}`);
    }
  }

  // 2. Resend HTTPS API (never blocked by cloud firewalls on port 443)
  if (process.env.RESEND_API_KEY) {
    try {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${fromName} <onboarding@resend.dev>`,
          to: [to],
          subject,
          ...(html ? { html } : {}),
          ...(text ? { text } : {}),
        }),
      });

      if (resendRes.ok) {
        console.log(`[Email] Delivered via Resend to: ${to}`);
        return { delivered: true, provider: "resend" };
      }
      const resendErr = await resendRes.text();
      console.warn(`[Email] Resend HTTP API error: ${resendErr}`);
    } catch (httpErr) {
      console.warn(`[Email] Resend HTTP fetch failed: ${httpErr.message}`);
    }
  }

  // 3. Gmail SMTP via Nodemailer with a fast timeout (final fallback)
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
        from: `"${fromName}" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        ...(text ? { text } : {}),
        ...(html ? { html } : {}),
      });

      console.log(`[Email] Delivered via Gmail SMTP to: ${to}`);
      return { delivered: true, provider: "smtp" };
    } catch (smtpErr) {
      console.warn(`[Email] SMTP delivery failed: ${smtpErr.message}`);
      return { delivered: false, error: smtpErr.message };
    }
  }

  console.error("[Email] No email provider configured (SENDGRID_API_KEY, RESEND_API_KEY, or EMAIL_USER/EMAIL_PASS). Email not sent.");
  return { delivered: false, error: "no_provider_configured" };
};

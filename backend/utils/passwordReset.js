import crypto from "crypto";
import nodemailer from "nodemailer";

export const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000;

export const createPasswordResetToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  return {
    rawToken,
    tokenHash: crypto.createHash("sha256").update(rawToken).digest("hex"),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
  };
};

export const hashPasswordResetToken = (rawToken) =>
  crypto.createHash("sha256").update(rawToken).digest("hex");

export const sendPasswordResetEmail = async ({ email, rawToken }) => {
  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
  const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
  const subject = "Reset your SalonHub password";
  const text = `Use this link to reset your SalonHub password. It expires in 15 minutes:\n\n${resetLink}`;
  const html = `<p>Use the link below to reset your SalonHub password. It expires in 15 minutes.</p><p><a href="${resetLink}">Reset password</a></p>`;

  // Use the same HTTPS Resend API as the SuperAdmin OTP flow. This works when
  // cloud hosts block SMTP and does not require Gmail credentials.
  let resendFailure = null;
  if (process.env.RESEND_API_KEY) {
    try {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || "SalonHub Security <onboarding@resend.dev>",
          to: [email],
          subject,
          text,
          html,
        }),
      });

      if (resendRes.ok) {
        console.log(`[Password reset] Email sent via Resend to: ${email}`);
        return { delivered: true, provider: "resend" };
      }

      resendFailure = await resendRes.text();
      console.warn(`[Password reset] Resend API error: ${resendFailure}`);
    } catch (resendError) {
      resendFailure = resendError.message;
      console.warn(`[Password reset] Resend API request failed: ${resendError.message}`);
    }
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    if (resendFailure) {
      throw new Error(`Password reset email could not be sent through Resend: ${resendFailure}`);
    }
    throw new Error("Password reset email service is not configured (set RESEND_API_KEY or EMAIL_USER and EMAIL_PASS)");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    family: 4, // Force IPv4 (fixes ENETUNREACH on Render/cloud containers)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    text,
    html,
  });

  console.log(`[Password reset] Email sent via SMTP to: ${email}`);
  return { delivered: true, provider: "smtp" };
};

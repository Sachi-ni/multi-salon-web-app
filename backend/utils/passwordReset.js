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
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Password reset email service is not configured");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
  const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Reset your SalonHub password",
    text: `Use this link to reset your SalonHub password. It expires in 15 minutes:\n\n${resetLink}`,
    html: `<p>Use the link below to reset your SalonHub password. It expires in 15 minutes.</p><p><a href="${resetLink}">Reset password</a></p>`,
  });
};
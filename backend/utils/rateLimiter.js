import rateLimit from "express-rate-limit";
import { createHash } from "node:crypto";

export const createJsonRateLimiter = (options) => rateLimit({
  standardHeaders: "draft-7",
  legacyHeaders: false,
  ...options,
  handler: (_req, res) => res.status(429).json({
    message: "Too many requests. Please try again later.",
  }),
});

export const createLoginRateLimiters = () => {
  const windowMs = 15 * 60 * 1000;
  return [
    createJsonRateLimiter({
      windowMs,
      max: 60,
      skipSuccessfulRequests: true,
    }),
    createJsonRateLimiter({
      windowMs,
      max: 8,
      skipSuccessfulRequests: true,
      keyGenerator: (req) => {
        const identifier = String(req.body?.email || "").trim().toLowerCase();
        const accountKey = createHash("sha256").update(identifier).digest("hex");
        return `login-account:${accountKey}`;
      },
    }),
  ];
};

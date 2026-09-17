import rateLimit from "express-rate-limit";

export const createJsonRateLimiter = (options) => rateLimit({
  standardHeaders: "draft-7",
  legacyHeaders: false,
  ...options,
  handler: (_req, res) => res.status(429).json({
    message: "Too many requests. Please try again later.",
  }),
});

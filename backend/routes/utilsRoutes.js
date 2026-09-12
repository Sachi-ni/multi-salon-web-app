import express from "express";
import dns from "dns";
import rateLimit from "express-rate-limit";

const router = express.Router();
const emailDomainLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
const DOMAIN_PATTERN = /^(?=.{1,253}$)(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;
const DNS_TIMEOUT_MS = 3000;

const resolveMxWithTimeout = (domain) => Promise.race([
  dns.promises.resolveMx(domain),
  new Promise((_, reject) => {
    setTimeout(() => reject(new Error("DNS lookup timed out")), DNS_TIMEOUT_MS);
  }),
]);

router.get("/check-email-domain", emailDomainLimiter, async (req, res) => {
  const domain = String(req.query.domain || "").trim().toLowerCase();
  if (!DOMAIN_PATTERN.test(domain)) {
    return res.json({ valid: false, reason: "invalid_domain" });
  }

  try {
    const records = await resolveMxWithTimeout(domain);
    return res.json({
      valid: Array.isArray(records) && records.length > 0,
      reason: Array.isArray(records) && records.length > 0 ? null : "no_mx_records",
    });
  } catch (error) {
    return res.json({
      valid: false,
      reason: error.message === "DNS lookup timed out" ? "timeout" : "dns_error",
    });
  }
});

export default router;
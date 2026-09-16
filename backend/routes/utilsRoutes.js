import express from "express";
import dns from "dns";
import rateLimit from "express-rate-limit";
import Customer from "../models/Customer.js";
import Staff from "../models/Staff.js";
import Salon from "../models/Salon.js";

const router = express.Router();
const emailDomainLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
const DOMAIN_PATTERN = /^(?=.{1,253}$)(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;
const DNS_TIMEOUT_MS = 3000;

const activeSalonFilter = {
  status: { $not: /^deactivated$/i },
  isPaused: { $ne: true },
};

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

// Public, aggregate-only figures for the landing page. No customer or staff
// records are exposed here.
router.get("/platform-stats", async (req, res) => {
  try {
    const activeSalonIds = await Salon.find(activeSalonFilter).distinct("_id");
    const [happyClients, expertStylists, firstSalon] = await Promise.all([
      Customer.countDocuments(),
      Staff.countDocuments({
        status: "Active",
        role: { $not: /^(manager|super-admin)$/i },
        salon_id: { $in: activeSalonIds },
      }),
      Salon.findOne(activeSalonFilter).sort({ createdAt: 1 }).select("createdAt").lean(),
    ]);

    const yearsExperience = firstSalon?.createdAt
      ? Math.max(0, Math.floor((Date.now() - new Date(firstSalon.createdAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000)))
      : 0;

    res.json({
      happyClients,
      expertStylists,
      salonBranches: activeSalonIds.length,
      yearsExperience,
    });
  } catch (error) {
    console.error("Unable to get platform statistics:", error);
    res.status(500).json({ message: "Unable to load platform statistics" });
  }
});

export default router;

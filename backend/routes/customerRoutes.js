import express from "express";
import Customer from "../models/Customer.js";
import Appointment from "../models/Appointment.js";
import { loginCustomer } from "../controllers/customerAuthController.js"
import { protect } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import { createLoginRateLimiters } from "../utils/rateLimiter.js";

const router = express.Router();
const [loginIpLimiter, loginAccountLimiter] = createLoginRateLimiters();

// Get all customers
router.get("/", protect, requireRole(["super-admin", "manager"]), async (req, res) => {
  try {
    const filter = {};
    if (req.user.role?.toLowerCase() === "manager") {
      if (!req.user.salon_id) {
        return res.status(403).json({ message: "Manager is not assigned to a salon" });
      }

      const appointmentCustomerIds = await Appointment.distinct("customer_id", {
        salon_id: req.user.salon_id,
        customer_id: { $ne: null },
      });
      filter.$or = [
        { preferredSalonId: req.user.salon_id },
        { _id: { $in: appointmentCustomerIds } },
      ];
    }

    const customers = await Customer.find(filter)
      .select("name email phone registration_date createdAt updatedAt");
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Customer creation is restricted to the public auth registration contract.

// Legacy customer registration is removed; use /api/auth/register instead.
router.post("/login", loginIpLimiter, loginAccountLimiter, loginCustomer);

export default router;

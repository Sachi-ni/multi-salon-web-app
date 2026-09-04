import express from "express";
import Customer from "../models/Customer.js";
import { registerCustomer, loginCustomer } from "../controllers/customerAuthController.js"
import { protect } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Get all customers
router.get("/", protect, requireRole(["super-admin", "manager"]), async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Customer creation is restricted to the public auth registration contract.

// Legacy customer registration is removed; use /api/auth/register instead.
router.post("/login",    loginCustomer);

export default router;

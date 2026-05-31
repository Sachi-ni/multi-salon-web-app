import express from "express";
import Customer from "../models/Customer.js";
import { registerCustomer, loginCustomer } from "../controllers/customerAuthController.js"

const router = express.Router();

// Get all customers
router.get("/", async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create customer
router.post("/", async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/register", registerCustomer);
router.post("/login",    loginCustomer);

export default router;

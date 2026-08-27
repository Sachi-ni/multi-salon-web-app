import Customer from "../models/Customer.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";

const EMAIL_PATTERN = /^[^\s@]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{3,63}$/;
const PHONE_PATTERN = /^\+?[0-9]{10}$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[\S]{8,}$/;
const COMMON_PASSWORDS = new Set(["12345678", "password", "password123", "qwerty123", "letmein"]);

export const registerCustomer = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPhone = phone?.replace(/[\s()-]/g, "");

    if (!EMAIL_PATTERN.test(normalizedEmail || "")) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }
    if (!PHONE_PATTERN.test(normalizedPhone || "")) {
      return res.status(400).json({ message: "Phone number must contain exactly 10 digits and may start with +" });
    }
    if (!PASSWORD_PATTERN.test(password || "")) {
      return res.status(400).json({ message: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character" });
    }
    if (COMMON_PASSWORDS.has(password.toLowerCase())) {
      return res.status(400).json({ message: "Please choose a strong password not common one" });
    }

    const existingCustomer = await Customer.findOne({ email: normalizedEmail });
    if (existingCustomer) {
      return res.status(400).json({ message: "Customer already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const customer = new Customer({
      name,
      email: normalizedEmail,
      phone: normalizedPhone,
      password_hash,
      registration_date: new Date(),
      role: "customer"
    });

    await customer.save();

    res.status(201).json({
      id:    customer._id,
      name:  customer.name,
      email: customer.email,
      phone: customer.phone,
      role:  customer.role,
      token: generateToken(customer._id)
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const isMatch = await bcrypt.compare(password, customer.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    res.status(200).json({
      id:    customer._id,
      name:  customer.name,
      email: customer.email,
      phone: customer.phone,
      role:  customer.role,
      token: generateToken(customer._id)
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
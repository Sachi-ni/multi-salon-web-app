import Customer from "../models/Customer.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";

export const registerCustomer = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({ message: "Customer already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const customer = new Customer({
      name,
      email,
      phone,
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
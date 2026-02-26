import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import Staff from "../models/Staff.js";
import Customer from "../models/Customer.js";

/* 🔐 Generate JWT */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

/* ======================
   REGISTER
====================== */
export const register = async (req, res) => {
  const { role, password, ...rest } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  let user;

  if (role === "ADMIN") {
    user = await Admin.create({
      ...rest,
      password_hash: hashedPassword,
      role: "ADMIN"
    });
  } 
  else if (role === "MANAGER" || role === "STAFF") {
    user = await Staff.create({
      ...rest,
      password_hash: hashedPassword,
      role
    });
  } 
  else if (role === "CUSTOMER") {
    user = await Customer.create({
      ...rest,
      password_hash: hashedPassword
    });
  } 
  else {
    return res.status(400).json({ message: "Invalid role" });
  }

  res.status(201).json({ message: "User registered successfully" });
};

/* ======================
   LOGIN
====================== */
export const login = async (req, res) => {
  const { email, password, role } = req.body;

  let user;

  if (role === "ADMIN") {
    user = await Admin.findOne({ email });
  } 
  else if (role === "MANAGER" || role === "STAFF") {
    user = await Staff.findOne({ email });
  } 
  else if (role === "CUSTOMER") {
    user = await Customer.findOne({ email });
  } 
  else {
    return res.status(400).json({ message: "Invalid role" });
  }

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = generateToken({
    id: user._id,
    role: user.role || role
  });

  res.json({
    message: "Login successful",
    token,
    user: {
      id: user._id,
      role: user.role || role,
      email: user.email
    }
  });
};
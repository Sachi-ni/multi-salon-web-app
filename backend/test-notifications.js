import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Admin from "./models/Admin.js";

dotenv.config();

const test = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const admin = await Admin.findOne({ role: "super-admin" });
  if (!admin) {
    console.log("No super admin found");
    process.exit(1);
  }
  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  
  const res = await fetch("http://localhost:5000/api/notifications", {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text);
  process.exit(0);
};

test();

import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Admin from "./models/Admin.js";

dotenv.config();

const test = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const admin = await Admin.findOne({ role: "super-admin" });
  const token = jwt.sign({ id: admin._id, role: admin.role, salon_id: admin.salon_id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  
  const res = await fetch("http://localhost:5000/api/appointments?salonId=all", {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const json = await res.json();
  const missing = json.filter(a => !a.customer_id || a.customer_id.name === "Unknown Customer");
  console.log("Total appointments:", json.length);
  console.log("Appointments with missing/fallback customers:", missing.length);
  if (missing.length > 0) {
    console.log("Example missing:", missing[0]);
  }
  process.exit(0);
};

test();

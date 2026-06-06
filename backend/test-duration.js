import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Admin from "./models/Admin.js";
import Appointment from "./models/Appointment.js";

dotenv.config();

const test = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const admin = await Admin.findOne({ role: "super-admin" });
  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  
  const appt = await Appointment.findOne({ status: "pending" });
  if (!appt) {
    console.log("No pending appt found");
    process.exit(1);
  }
  
  console.log("Old duration:", appt.duration, "End time:", appt.end_time);
  
  const res = await fetch(`http://localhost:5000/api/appointments/${appt._id}/duration`, {
    method: "PATCH",
    headers: { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ duration: 180 })
  });
  
  console.log("Status:", res.status);
  const json = await res.json();
  console.log("Response:", json);
  process.exit(0);
};

test();

import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Admin from "./models/Admin.js";
import Appointment from "./models/Appointment.js";
import Notification from "./models/Notification.js";

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
  
  const res = await fetch(`http://localhost:5000/api/appointments/${appt._id}/confirm`, {
    method: "PATCH",
    headers: { 
      Authorization: `Bearer ${token}`
    }
  });
  
  console.log("Status:", res.status);
  const json = await res.json();
  console.log("Response:", json);
  
  const notifications = await Notification.find({ appointment_id: appt._id, recipient_model: "Customer" });
  console.log("Customer notifications created:", notifications.length);
  
  process.exit(0);
};

test();

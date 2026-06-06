import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Customer from "./models/Customer.js";
import Salon from "./models/Salon.js";
import Service from "./models/Service.js";
import Staff from "./models/Staff.js";
import Notification from "./models/Notification.js";

dotenv.config();

const test = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
  const customer = await Customer.findOne({});
  const salon = await Salon.findOne({});
  const service = await Service.findOne({});
  const staff = await Staff.findOne({});
  
  if (!customer || !salon || !service || !staff) {
    console.log("Missing data");
    process.exit(1);
  }
  
  const token = jwt.sign({ id: customer._id, role: "customer" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  
  console.log("Booking appointment...");
  const res = await fetch("http://localhost:5000/api/appointments", {
    method: "POST",
    headers: { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      salon_id: salon._id,
      service_id: service._id,
      staff_id: staff._id,
      appointment_date: "2026-06-25",
      start_time: "10:00",
      notes: "Test booking"
    })
  });
  
  console.log("Booking Status:", res.status);
  const appt = await res.json();
  console.log("Booking Response:", appt);
  
  const notifications = await Notification.find({ appointment_id: appt._id });
  console.log("Notifications created:", notifications.length);
  
  process.exit(0);
};

test();

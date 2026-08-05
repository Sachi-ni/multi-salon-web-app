import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Admin from "./models/Admin.js";
import Staff from "./models/Staff.js";
import Service from "./models/Service.js";
import Salon from "./models/Salon.js";

dotenv.config();

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://pawanmadushanka15:QpA06g1yTq4n1bH6@saloon.xbc9afc.mongodb.net/test?retryWrites=true&w=majority");
    
    // Create token
    const admin = await Admin.findOne({ role: "super-admin" });
    const token = jwt.sign(
      { id: admin._id, role: admin.role, salon_id: admin.salon_id },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "30d" }
    );

    const staff = await Staff.findOne();
    const salon = await Salon.findOne();
    const service = await Service.findOne();

    const staffId = staff._id.toString();
    const salonId = salon._id.toString();
    const serviceId = service._id.toString();
    const date = "2026-06-30";

    console.log(`URL: http://localhost:5000/api/appointments/available-slots?staffId=${staffId}&date=${date}&serviceId=${serviceId}&salonId=${salonId}`);

    const res = await fetch(`http://localhost:5000/api/appointments/available-slots?staffId=${staffId}&date=${date}&serviceId=${serviceId}&salonId=${salonId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Data:", data);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

test();

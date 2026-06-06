import mongoose from "mongoose";
import dotenv from "dotenv";
import Appointment from "./models/Appointment.js";
import Customer from "./models/Customer.js";

dotenv.config();

const test = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const appts = await Appointment.find({ appointment_date: "2026-06-25" }).populate("customer_id");
  appts.forEach(a => {
    console.log("Appointment:", a._id);
    console.log("Service ID:", a.service_id);
    console.log("Customer ID field:", a.customer_id);
    console.log("---");
  });
  process.exit(0);
};

test();

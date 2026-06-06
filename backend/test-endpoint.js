import mongoose from "mongoose";
import dotenv from "dotenv";
import { getSalonAppointments } from "./controllers/appointmentController.js";
import "./models/Customer.js";
import "./models/Service.js";
import "./models/Staff.js";
import "./models/Salon.js";
import "./models/Appointment.js";

dotenv.config();

const testEndpoint = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const req = {
      user: { role: "super-admin" },
      query: { salonId: "all" }
    };

    const res = {
      status: (code) => {
        console.log("Status:", code);
        return {
          json: (data) => console.log("JSON:", JSON.stringify(data, null, 2))
        };
      }
    };

    await getSalonAppointments(req, res);

    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err);
    process.exit(1);
  }
};

testEndpoint();

import mongoose from "mongoose";
import { getAvailableSlots } from "./controllers/appointmentController.js";
import Salon from "./models/Salon.js";
import Staff from "./models/Staff.js";
import Service from "./models/Service.js";
import dotenv from "dotenv";

dotenv.config();

mongoose.connect(process.env.MONGO_URI || "mongodb+srv://pawanmadushanka15:QpA06g1yTq4n1bH6@saloon.xbc9afc.mongodb.net/test?retryWrites=true&w=majority")
  .then(async () => {
    // Pick any valid staff, service, salon
    const salon = await Salon.findOne();
    const service = await Service.findOne();
    const staff = await Staff.findOne();

    const req = {
      query: {
        staffId: staff._id.toString(),
        date: "2026-06-30",
        serviceId: service._id.toString(),
        salonId: salon._id.toString()
      }
    };

    const res = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        console.log("Status:", this.statusCode);
        console.log("Response:", JSON.stringify(data, null, 2));
        process.exit(0);
      }
    };

    console.log("Calling getAvailableSlots with:", req.query);
    await getAvailableSlots(req, res);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

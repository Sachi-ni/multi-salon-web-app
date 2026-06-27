import mongoose from "mongoose";
import StaffAvailability from "./models/StaffAvailability.js";
import dotenv from "dotenv";

dotenv.config();

mongoose.connect(process.env.MONGO_URI || "mongodb+srv://pawanmadushanka15:QpA06g1yTq4n1bH6@saloon.xbc9afc.mongodb.net/test?retryWrites=true&w=majority")
  .then(async () => {
    const avail = await StaffAvailability.find();
    console.log("Total Availability records:", avail.length);
    avail.forEach(a => {
      console.log(`- Staff: ${a.staff_id}, Date: ${a.available_date}, Slots: ${a.slots.length}`);
    });
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

import mongoose from "mongoose";
import StaffAvailability from "./models/StaffAvailability.js";
import dotenv from "dotenv";

dotenv.config();

mongoose.connect(process.env.MONGO_URI || "mongodb+srv://pawanmadushanka15:QpA06g1yTq4n1bH6@saloon.xbc9afc.mongodb.net/test?retryWrites=true&w=majority")
  .then(async () => {
    const queryDate = new Date("2026-06-30");
    queryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const avail = await StaffAvailability.find({
      available_date: { $gte: queryDate, $lt: nextDay }
    });
    
    console.log(`Found ${avail.length} records for 2026-06-30.`);
    avail.forEach(a => {
      console.log(`\nStaff: ${a.staff_id}`);
      a.slots.forEach(s => {
        console.log(`  ${s.start_time} - ${s.end_time} | booked: ${s.is_booked}`);
      });
    });
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

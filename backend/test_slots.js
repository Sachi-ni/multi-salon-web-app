import mongoose from "mongoose";
import Salon from "./models/Salon.js";
import Appointment from "./models/Appointment.js";
import StaffAvailability from "./models/StaffAvailability.js";
import dotenv from "dotenv";

dotenv.config();

const timesOverlap = (s1, e1, s2, e2) => {
  return s1 < e2 && s2 < e1;
};

mongoose.connect(process.env.MONGO_URI || "mongodb+srv://pawanmadushanka15:QpA06g1yTq4n1bH6@saloon.xbc9afc.mongodb.net/test?retryWrites=true&w=majority")
  .then(async () => {
    const salon = await Salon.findOne({ name: "Ganemulla" });
    if (salon) {
      console.log("Ganemulla open_time:", salon.open_time, "close_time:", salon.close_time);
    }
    
    // Test slot generation
    let openTime = "09:00";
    let closeTime = "17:00";
    if (salon && salon.open_time) openTime = salon.open_time;
    if (salon && salon.close_time) closeTime = salon.close_time;

    const generatedSlots = [];
    let [currentH, currentM] = openTime.split(":").map(Number);
    const [closeH, closeM] = closeTime.split(":").map(Number);

    while (currentH < closeH || (currentH === closeH && currentM < closeM)) {
      const start_time = `${String(currentH).padStart(2, "0")}:${String(currentM).padStart(2, "0")}`;
      let nextH = currentH + 1;
      let nextM = currentM;
      const end_time = `${String(nextH).padStart(2, "0")}:${String(nextM).padStart(2, "0")}`;
      
      if (nextH > closeH || (nextH === closeH && nextM > closeM)) {
        break;
      }

      generatedSlots.push({
        start_time,
        end_time,
        is_booked: false
      });
      currentH = nextH;
    }
    console.log("Generated slots:", generatedSlots);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

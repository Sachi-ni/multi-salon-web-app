import mongoose from 'mongoose';
import Notification from './models/Notification.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  // colombo branch manager id
  const staffId = "6a40a5c7eb44287ecc5f8b17";
  
  await Notification.create({
    recipient_id: staffId,
    recipient_model: "Staff",
    title: "New Booking Received",
    message: "A new booking was made by jj for Hair Coloring, Bridal Makeup.",
    appointment_id: "6a54c5bf311b9ea94011f00d"
  });
  
  console.log("Created notification for branch manager.");
  process.exit(0);
}).catch(console.error);

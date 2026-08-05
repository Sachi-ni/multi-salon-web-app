import mongoose from 'mongoose';
import Appointment from './models/Appointment.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const appt = await Appointment.findOne().sort({_id: -1}).lean();
  console.log(JSON.stringify(appt, null, 2));
  process.exit(0);
}).catch(console.error);

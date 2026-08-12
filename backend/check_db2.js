import mongoose from 'mongoose';
import AppointmentService from './models/AppointmentService.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const apptServices = await AppointmentService.find({ appointment_id: "6a54bbede1ece1dc55f80ef5" }).lean();
  console.log(JSON.stringify(apptServices, null, 2));
  process.exit(0);
}).catch(console.error);

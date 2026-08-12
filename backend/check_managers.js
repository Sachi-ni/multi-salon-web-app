import mongoose from 'mongoose';
import Staff from './models/Staff.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const staff = await Staff.find({ role: "manager" }).lean();
  console.log("Managers:", staff);
  process.exit(0);
}).catch(console.error);

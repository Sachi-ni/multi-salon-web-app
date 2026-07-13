import mongoose from 'mongoose';
import Admin from './models/Admin.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const admin = await Admin.findById("6a54bbabe1ece1dc55f80ef4").lean();
  console.log("Found in Admin:", admin);
  process.exit(0);
}).catch(console.error);

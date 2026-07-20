import mongoose from 'mongoose';
import Customer from './models/Customer.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const c = await Customer.findById("6a54bbabe1ece1dc55f80ef4").lean();
  console.log("Customer found:", c);
  process.exit(0);
}).catch(console.error);

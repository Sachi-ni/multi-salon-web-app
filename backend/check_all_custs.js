import mongoose from 'mongoose';
import Customer from './models/Customer.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const custs = await Customer.find().lean();
  console.log("Customers:");
  custs.forEach(c => console.log(c._id, c.name, c.email));
  process.exit(0);
}).catch(console.error);

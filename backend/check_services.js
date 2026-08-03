import mongoose from 'mongoose';
import Service from './models/Service.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const services = await Service.find({ _id: { $in: ["6a240a11caac4fd9a39a3eed", "6a240a12caac4fd9a39a3ef4"] } }).lean();
  console.log(JSON.stringify(services, null, 2));
  process.exit(0);
}).catch(console.error);

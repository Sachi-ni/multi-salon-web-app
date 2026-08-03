import mongoose from 'mongoose';
import Feedback from './models/Feedback.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const feedbacks = await Feedback.find().lean();
  console.log(JSON.stringify(feedbacks, null, 2));
  process.exit(0);
}).catch(console.error);

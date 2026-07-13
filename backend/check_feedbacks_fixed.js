import mongoose from 'mongoose';
import Feedback from './models/Feedback.js';
import Customer from './models/Customer.js';
import Admin from './models/Admin.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const rawFeedbacks = await Feedback.find()
      .populate("appointment_id", "appointment_date start_time status")
      .populate("service_id", "service_name")
      .populate("staff_id", "full_name")
      .sort({ createdAt: -1 })
      .lean();

  for (const f of rawFeedbacks) {
    if (f.customer_id) {
      let customer = await Customer.findById(f.customer_id, "name email phone").lean();
      if (!customer) {
        const admin = await Admin.findById(f.customer_id, "full_name email phone").lean();
        if (admin) {
          customer = {
            _id: admin._id,
            name: admin.full_name,
            email: admin.email,
            phone: admin.phone
          };
        }
      }
      f.customer_id = customer || null;
    }
  }

  console.log(JSON.stringify(rawFeedbacks, null, 2));
  process.exit(0);
}).catch(console.error);

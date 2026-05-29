import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer"
  },
  salon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon"
  },
  staff_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff"
  },
  service_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service"
  },
  status: String,
  amount: Number,
  appointment_date: Date,
  scheduled_start_time: String,
  scheduled_end_time: String
});

export default mongoose.model("Appointment", appointmentSchema);
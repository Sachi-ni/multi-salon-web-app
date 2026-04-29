import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer"
  },
  salon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: true
  },
  staff_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
    required: true
  },
  service_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true
  },
  status: {
    type: String,
    enum: ["booked", "cancelled", "pending"],
    default: "pending",
  },
  appointment_date: {
    type: Date,
    required: true
  },
  start_time: {
    type: String,
    required: true
  },
  end_time: {
    type: String,
    required: true
  }
}, { timestamps: true });

appointmentSchema.index({ staff_id: 1, appointment_date: 1 });



export default mongoose.model("Appointment", appointmentSchema);
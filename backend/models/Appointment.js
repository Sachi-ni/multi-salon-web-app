import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },
  salon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon",
    required: true
  },
  date:       { type: String, required: true }, // "2026-06-10"
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "completed"],
    default: "pending"
  },
  services: [
    {
      service_id: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
      staff_id:   { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
      slot: {
        start_time: { type: String }, // "09:00"
        end_time:   { type: String }  // "09:30"
      }
    }
  ],
  total_price: { type: Number, default: 0 },
  notes:       { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("Appointment", appointmentSchema);
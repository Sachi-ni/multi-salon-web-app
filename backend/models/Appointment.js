import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
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
    staff_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff"
    },
    status: String,
    appointment_date: Date,
    scheduled_start_time: String,
    scheduled_end_time: String
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);
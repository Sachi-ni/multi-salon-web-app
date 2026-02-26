import mongoose from "mongoose";

const appointmentServiceSchema = new mongoose.Schema(
  {
    appointment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true
    },
    service_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true
    },
    staff_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff"
    },
    sub_price: Number,
    service_start_time: String,
    service_end_time: String
  },
  { timestamps: true }
);

export default mongoose.model("AppointmentService", appointmentServiceSchema);
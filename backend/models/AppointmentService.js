import mongoose from "mongoose";

const appointmentServiceSchema = new mongoose.Schema({
  appointment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment"
  },
  service_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service"
  },
  staff_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff"
  },
  sub_price: Number,
  service_start_time: String,
  service_end_time: String
});

export default mongoose.model("AppointmentService", appointmentServiceSchema);
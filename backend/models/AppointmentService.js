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

// Compound indexes for slot checking and staff lookups
appointmentServiceSchema.index({ staff_id: 1, appointment_id: 1 });
appointmentServiceSchema.index({ appointment_id: 1 });
appointmentServiceSchema.index({ staff_id: 1, service_start_time: 1, service_end_time: 1 });

export default mongoose.model("AppointmentService", appointmentServiceSchema);
import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: false
  },
  guest_name: { type: String, default: "" },
  guest_phone: { type: String, default: "" },
  salon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon",
    required: true
  },
  service_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: false
  },
  service_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service"
  }],
  staff_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
    required: true
  },
  appointment_date: { type: String, required: true },   // "2026-07-01"
  start_time: { type: String, required: true },    // "10:00"
  end_time: { type: String, required: true },    // "12:00"
  duration: { type: Number, required: true },    // in minutes (e.g. 60, 120, 180)
  status: {
    type: String,
    enum: ["pending", "confirmed", "rejected", "completed", "cancelled"],
    default: "pending"
  },
  total_price: { type: Number, default: 0 },
  notes: { type: String, default: "" },
  confirmed_at: { type: Date, default: null },
  rejected_at: { type: Date, default: null },
  cancelled_at: { type: Date, default: null },
  feedback_submitted: { type: Boolean, default: false },
  needsCustomerConfirmation: { type: Boolean, default: false },
  last_update_summary: { type: String, default: "" },
  last_updated_by: { type: mongoose.Schema.Types.ObjectId, refPath: "last_updated_by_model", default: null },
  last_updated_by_model: { type: String, enum: ["Admin", "Staff"], default: "Admin" },
  last_updated_at: { type: Date, default: null },
  edit_history: [{
    summary: { type: String, required: true },
    changes: { type: mongoose.Schema.Types.Mixed, default: {} },
    changed_by: { type: mongoose.Schema.Types.ObjectId, refPath: "edit_history.changed_by_model" },
    changed_by_model: { type: String, enum: ["Admin", "Staff"] },
    changed_at: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

// Compound index for fast conflict detection queries
appointmentSchema.index({ staff_id: 1, appointment_date: 1, status: 1 });

export default mongoose.model("Appointment", appointmentSchema);
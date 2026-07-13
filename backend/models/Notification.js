import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  recipient_model: {
    type: String,
    required: true,
    enum: ["Customer", "Admin", "Staff"]
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  is_read: {
    type: Boolean,
    default: false
  },
  appointment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    default: null
  }
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);

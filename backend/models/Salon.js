import mongoose from "mongoose";

const salonSchema = new mongoose.Schema({
  name: String,
  location: String,
  contact_info: String,
  phone: String,
  email: String,
  open_time: String,
  close_time: String,
  capacity: Number,
  about: String,
revenue: { type: Number, default: 0 },
  staffCount: { type: Number, default: 0 },
  logo: { type: String, default: "" },
  images: { type: [String], default: [] },
  status: { type: String, enum: ["active", "deactivated"], default: "active" },
  deactivationType: { type: String, enum: ["temporary", "permanent"], default: null },
  deactivatedAt: { type: Date, default: null },
  deactivatedReason: { type: String, default: null },
  deactivatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  isPaused: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Salon", salonSchema);

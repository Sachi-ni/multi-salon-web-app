import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  phone: { type: String, default: "" },
  email: { type: String, required: true },
  role: { type: String, required: true },
  specification: { type: String, default: "" },
  commission_rate: { type: Number, default: 0 },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },

  salon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: true
  },

  // 🔥 ADD THIS
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service"
  }],

  // 🔥 ADD THIS
  workingHours: {
    start: { type: String, default: "09:00" },
    end: { type: String, default: "18:00" }
  },

  image: { type: String, default: "" }
});

export default mongoose.model("Staff", staffSchema);
import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
  full_name:       { type: String, required: true },
  first_name:      { type: String, required: true },
  last_name:       { type: String, required: true },
  phone:           { type: String, default: "" },
  email:           { type: String, required: true, unique: true },
  password_hash:   { type: String, default: "" },
  role:            { type: String, required: true },
  specification:   { type: String, default: "" },
  commission_rate: { type: Number, default: 0 },
  salary_payment_frequency: {
    type: String,
    enum: ["daily", "weekly", "monthly"],
    default: "monthly"
  },
  salary_payment_count_per_day: {
    type: Number,
    default: 1,
    min: 1
  },

  status:{ 
    type: String,
    default: "Active", 
    enum: ["Active", "Inactive"] 
  },
  
  salon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon",
    required: true
  },
  resetPasswordTokenHash: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  image:    { type: String, default: "" },
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }] // ← new
});

export default mongoose.model("Staff", staffSchema);
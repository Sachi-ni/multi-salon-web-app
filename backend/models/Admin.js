import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  username:  { type: String, required: true, unique: true },
  email:     { type: String, required: true, unique: true },
phone:     { type: String },
  image:     { type: String, default: "" },
  password:  { type: String, required: true },
  role: {
    type: String,
    enum: ["super-admin", "staff-admin", "user"],
    default: "user"
  },
  salon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon",
    default: null // null for super-admin since they oversee all salons
  }
}, { timestamps: true });

export default mongoose.model("Admin", adminSchema);
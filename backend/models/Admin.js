import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, default: "ADMIN" },
    full_name: String,
    salon_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salon"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);
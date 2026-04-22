import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // This will be the hashed password
  role: { type: String, default: "super-admin" }
}, { timestamps: true });

export default mongoose.model("Admin", adminSchema);
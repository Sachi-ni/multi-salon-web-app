import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ["super-admin", "user-admin", "user"], 
    default: "user" 
  }
}, { timestamps: true });

export default mongoose.model("Admin", adminSchema);

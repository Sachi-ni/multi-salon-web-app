import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  username: String,
  password_hash: String,
  email: String,
  role: String,
  full_name: String,
  salon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon"
  }
});

export default mongoose.model("Admin", adminSchema);
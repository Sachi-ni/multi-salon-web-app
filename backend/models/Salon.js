import mongoose from "mongoose";

const salonSchema = new mongoose.Schema({
  name: String,
  ownerName: String,
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
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Branch", salonSchema, "salons");

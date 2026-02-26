import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    email: { type: String, unique: true },
    registration_date: { type: Date, default: Date.now },
    password_hash: String
  },
  { timestamps: true }
);

export default mongoose.model("Customer", customerSchema);
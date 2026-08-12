

import mongoose from "mongoose";

const billSchema = new mongoose.Schema({
  appointment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment"
  },
  total_amount: Number,
  bill_date: Date,
  payment_method: String,
  payout_status: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending"
  },
  paid_out_at: { type: Date, default: null }
});

export default mongoose.model("Bill", billSchema);
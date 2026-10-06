import mongoose from "mongoose";

const billSchema = new mongoose.Schema({
  appointment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    required: true
  },
  bill_number: {
    type: String,
    unique: true
  },
  salon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon"
  },
  customer_name: { type: String, default: "" },
  customer_email: { type: String, default: "" },
  customer_phone: { type: String, default: "" },
  items: [
    {
      service_name: { type: String, default: "" },
      price: { type: Number, default: 0 },
      duration: { type: Number, default: 0 },
      staff_name: { type: String, default: "" }
    }
  ],
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total_amount: { type: Number, required: true },
  payment_method: {
    type: String,
    enum: ["cash", "card", "online", "bank_transfer"],
    default: "cash"
  },
  payment_status: {
    type: String,
    enum: ["paid", "pending", "refunded"],
    default: "paid"
  },
  notes: { type: String, default: "" },
  issued_by: { type: String, default: "" },
  issued_by_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  },
  bill_date: {
    type: Date,
    default: Date.now
  },
  payout_status: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending"
  },
  paid_out_at: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model("Bill", billSchema);
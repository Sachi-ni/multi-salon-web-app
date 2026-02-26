import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    appointment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true
    },
    total_amount: Number,
    bill_date: Date,
    payment_method: String
  },
  { timestamps: true }
);

export default mongoose.model("Bill", billSchema);
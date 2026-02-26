import mongoose from "mongoose";

const salarySchema = new mongoose.Schema(
  {
    staff_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true
    },
    pay_period_start: Date,
    pay_period_end: Date,
    base_salary: Number,
    commission: Number,
    total_payout: Number
  },
  { timestamps: true }
);

export default mongoose.model("Salary", salarySchema);
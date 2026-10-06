import mongoose from "mongoose";

const salaryFrequencyChangeSchema = new mongoose.Schema(
  {
    salon_id: { type: mongoose.Schema.Types.ObjectId, ref: "Salon", required: true, index: true },
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true, index: true },
    old_frequency: { type: String, enum: ["daily", "weekly", "monthly"], required: true },
    new_frequency: { type: String, enum: ["daily", "weekly", "monthly"], required: true },
    changed_by: { type: mongoose.Schema.Types.ObjectId, required: true },
    changed_date: { type: String, required: true },
    amount_paid: { type: Number, default: 0 },
  },
  { timestamps: true }
);

salaryFrequencyChangeSchema.index(
  { staff_id: 1, changed_date: 1 },
  { unique: true }
);

export default mongoose.model("SalaryFrequencyChange", salaryFrequencyChangeSchema);

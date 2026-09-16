import mongoose from "mongoose";

const staffUnavailabilitySchema = new mongoose.Schema({
  staff_id: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
  start_date_time: { type: Date, required: true },
  end_date_time: { type: Date, required: true },
  reason: { type: String, default: "" },
  created_by: { type: mongoose.Schema.Types.ObjectId, refPath: "created_by_model", required: true },
  created_by_model: { type: String, enum: ["Admin", "Staff"], required: true },
}, { timestamps: true });

staffUnavailabilitySchema.index({ staff_id: 1, start_date_time: 1, end_date_time: 1 });

export default mongoose.model("StaffUnavailability", staffUnavailabilitySchema);

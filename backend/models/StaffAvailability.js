import mongoose from "mongoose";

const staffAvailabilitySchema = new mongoose.Schema(
  {
    staff_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true
    },
    available_date: Date,
    start_time: String,
    end_time: String,
    status: String
  },
  { timestamps: true }
);

export default mongoose.model("StaffAvailability", staffAvailabilitySchema);
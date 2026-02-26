import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    staff_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true
    },
    work_date: Date,
    clock_in_time: String,
    clock_out_time: String,
    status: String
  },
  { timestamps: true }
);

export default mongoose.model("Attendance", attendanceSchema);
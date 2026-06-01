import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema({
  staff_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
    required: true
  },
  available_date: {
    type: Date,
    required: true
  },
  slots: [
    {
      start_time: { type: String, required: true },
      end_time:   { type: String, required: true },
      is_booked:  { type: Boolean, default: false }
    }
  ]
}, { timestamps: true });

availabilitySchema.index({ staff_id: 1, available_date: 1 }, { unique: true });

export default mongoose.model("StaffAvailability", availabilitySchema);
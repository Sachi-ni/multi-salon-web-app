import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema({
  staff_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff"
  },
  available_date: Date,
  start_time: String,
  end_time: String,
  status: String
});

export default mongoose.model("StaffAvailability", availabilitySchema);
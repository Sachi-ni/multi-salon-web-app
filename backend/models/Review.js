import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  appointment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment"
  },
  rating: Number,
  comment: String,
  review_date: Date
});

export default mongoose.model("Review", reviewSchema);
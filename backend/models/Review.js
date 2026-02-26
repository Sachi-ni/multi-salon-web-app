import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    appointment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true
    },
    rating: Number,
    comment: String,
    review_date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("Review", reviewSchema);
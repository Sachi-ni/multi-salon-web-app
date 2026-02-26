import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    full_name: String,
    phone: String,
    email: String,
    role: String,
    specification: String,
    commission_rate: Number,
    salon_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salon",
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Staff", staffSchema);
import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  service_name: { type: String, required: true },
  base_price:   { type: Number, required: true },
  description:  { type: String, default: "" },
  duration:     { type: Number, required: true }, // in minutes
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ServiceCategory"
  },
  salon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon",
    required: true
  }
});

export default mongoose.model("Service", serviceSchema);
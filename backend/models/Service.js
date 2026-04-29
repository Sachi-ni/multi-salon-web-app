import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  service_name: String,
  base_price: Number,
  description: String,
  duration: Number,
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ServiceCategory"
  }
});

export default mongoose.model("Service", serviceSchema);
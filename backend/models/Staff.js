import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  phone: { type: String, default: "" },
  email: { type: String, required: true },
  role: { type: String, required: true },
  specification: { type: String, default: "" },
  commission_rate: { type: Number, default: 0 },
  status: { type: String, default: "Active", enum: ["Active", "Inactive"] },
  salon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon",
    required: true
  },
  image: { type: String, default: "" }
});

export default mongoose.model("Staff", staffSchema);


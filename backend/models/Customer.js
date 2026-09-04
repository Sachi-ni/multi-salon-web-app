import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
name:              { type: String, required: true },
  phone:             { type: String, default: "" },
  email:             { type: String, required: true },
  image:             { type: String, default: "" },
  registration_date: { type: Date, default: Date.now },
  password_hash:     { type: String, required: true },
  role:              { type: String, default: "customer" },
  // Non-binding UI metadata only; never use this field for booking authorization.
  preferredSalonId:  { type: mongoose.Schema.Types.ObjectId, ref: "Salon", required: false, default: null }
});

export default mongoose.model("Customer", customerSchema);
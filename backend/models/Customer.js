import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  name:              { type: String, required: true },
  phone:             { type: String, default: "" },
  email:             { type: String, required: true },
  registration_date: { type: Date, default: Date.now },
  password_hash:     { type: String, required: true },
  role:              { type: String, default: "customer" } // ← 
});

export default mongoose.model("Customer", customerSchema);
import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  registration_date: Date,
  password_hash: String
});

export default mongoose.model("Customer", customerSchema);
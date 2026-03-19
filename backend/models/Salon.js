import mongoose from "mongoose";

const salonSchema = new mongoose.Schema({
  name: String,
  location: String,
  contact_info: String,
  email: String,
  open_time: String,
  close_time: String,
  capacity: Number
});

export default mongoose.model("Salon", salonSchema);
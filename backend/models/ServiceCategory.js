import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  category_name: { type: String, required: true }
});

export default mongoose.model("ServiceCategory", categorySchema);
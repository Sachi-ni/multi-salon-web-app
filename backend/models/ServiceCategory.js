import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  category_name: String
});

export default mongoose.model("ServiceCategory", categorySchema);
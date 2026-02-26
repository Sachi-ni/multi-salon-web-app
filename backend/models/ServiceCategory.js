import mongoose from "mongoose";

const serviceCategorySchema = new mongoose.Schema(
  {
    category_name: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("ServiceCategory", serviceCategorySchema);
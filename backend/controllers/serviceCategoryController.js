import ServiceCategory from "../models/ServiceCategory.js";

export const createCategory = async (req, res) => {
  const category = await ServiceCategory.create(req.body);
  res.status(201).json(category);
};

export const getCategories = async (req, res) => {
  const categories = await ServiceCategory.find();
  res.json(categories);
};

export const updateCategory = async (req, res) => {
  const category = await ServiceCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(category);
};

export const deleteCategory = async (req, res) => {
  await ServiceCategory.findByIdAndDelete(req.params.id);
  res.json({ message: "Category deleted" });
};
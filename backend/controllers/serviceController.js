import Service from "../models/Service.js";

export const createService = async (req, res) => {
  const service = await Service.create(req.body);
  res.status(201).json(service);
};

export const getServices = async (req, res) => {
  const services = await Service.find()
    .populate("staff_id")
    .populate("category_id");
  res.json(services);
};

export const updateService = async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(service);
};

export const deleteService = async (req, res) => {
  await Service.findByIdAndDelete(req.params.id);
  res.json({ message: "Service deleted" });
};
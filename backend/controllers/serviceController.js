import Service from "../models/Service.js";

export const createService = async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getServices = async (req, res) => {
  try {
    const { salonId } = req.query;

    const filter = salonId ? { salon_id: salonId } : {};

    const services = await Service.find(filter).populate("category_id");
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
import Salon from "../models/Salon.js";

// CREATE
export const createSalon = async (req, res) => {
  const salon = await Salon.create(req.body);
  res.status(201).json(salon);
};

// READ ALL
export const getSalons = async (req, res) => {
  const salons = await Salon.find();
  res.json(salons);
};

// READ ONE BY ID ✅
export const getSalonById = async (req, res) => {
  const { id } = req.params;

  const salon = await Salon.findById(id);

  if (!salon) {
    return res.status(404).json({ message: "Salon not found" });
  }

  res.json(salon);
};

// DELETE
export const deleteSalon = async (req, res) => {
  const { id } = req.params;

  const salon = await Salon.findByIdAndDelete(id);

  if (!salon) {
    return res.status(404).json({ message: "Salon not found" });
  }

  res.json({ message: "Salon deleted successfully" });
};
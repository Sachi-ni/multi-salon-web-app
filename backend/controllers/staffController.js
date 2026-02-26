import Staff from "../models/Staff.js";

export const createStaff = async (req, res) => {
  const staff = await Staff.create(req.body);
  res.status(201).json(staff);
};

export const getStaff = async (req, res) => {
  const staff = await Staff.find().populate("salon_id");
  res.json(staff);
};

export const getStaffById = async (req, res) => {
  const staff = await Staff.findById(req.params.id);
  res.json(staff);
};

export const updateStaff = async (req, res) => {
  const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(staff);
};

export const deleteStaff = async (req, res) => {
  await Staff.findByIdAndDelete(req.params.id);
  res.json({ message: "Staff deleted" });
};
import Admin from "../models/Admin.js";

export const createAdmin = async (req, res) => {
  const admin = await Admin.create(req.body);
  res.status(201).json(admin);
};

export const getAdmins = async (req, res) => {
  const admins = await Admin.find().populate("salon_id");
  res.json(admins);
};

export const getAdminById = async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  res.json(admin);
};

export const updateAdmin = async (req, res) => {
  const admin = await Admin.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(admin);
};

export const deleteAdmin = async (req, res) => {
  await Admin.findByIdAndDelete(req.params.id);
  res.json({ message: "Admin deleted" });
};
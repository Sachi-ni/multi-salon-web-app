import Staff from "../models/Staff.js";

export const createStaff = async (req, res) => {
  try {
    // Map frontend fields to model fields
    const staffData = {
      full_name: req.body.name,
      email: req.body.email,
      role: req.body.role,
      specification: req.body.specification,
      commission_rate: req.body.commission_rate,
      salon_id: req.body.salonId,
      image: req.file ? req.file.path : null,
    };

    const staff = await Staff.create(staffData);
    res.status(201).json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStaff = async (req, res) => {
  try {
    const staff = await Staff.find().populate("salon_id", "name");
    // Map full_name to name and salon_id to salon for frontend compatibility
    const staffWithName = staff.map(s => ({
      ...s.toObject(),
      name: s.full_name,
      salon: s.salon_id
    }));
    res.json(staffWithName);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    res.json({ message: "Staff removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
import Staff from "../models/Staff.js";

export const createStaff = async (req, res) => {
  try {
    // Map frontend fields to model fields


    const staffData = {
      full_name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      role: req.body.role,
      specification: req.body.specification,
      commission_rate: req.body.commission_rate,
      salon_id: req.body.salonId,
      services: req.body.services || [],
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
    const { salonId } = req.query;
    const filter = salonId ? { salon_id: salonId } : {};
    const staff = await Staff.find(filter).populate("salon_id", "name");
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTeam = async (req, res) => {
  try {
    const { salonId, serviceId } = req.query;

    const filter = { status: "Active" };

    if (salonId) {
      filter.salon_id = salonId;
    }
    if (serviceId) {
      filter.services = serviceId;
    }

    const staff = await Staff.find(filter)
      .select("-password_hash")
      .populate("salon_id", "name")
      .populate("services", "service_name");

    const formattedStaff = staff.map((member) => ({
      ...member.toObject(),
      name: member.full_name,
    }));

    res.json(formattedStaff);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
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
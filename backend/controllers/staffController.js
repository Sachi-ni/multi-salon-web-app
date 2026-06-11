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
  image:           req.file ? req.file.path : null,
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

    const staff = await Staff.find(filter)
      .populate("salon_id", "name");

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

    console.log("Updating Staff ID:", req.params.id);
    console.log("Request Body:", req.body);

    const updateData = {
      full_name: req.body.name,
      email: req.body.email,
      role: req.body.role,
      salon_id: req.body.salonId,
      status: req.body.status,
    };

    console.log("Update Data:", updateData);

    if (req.file) {
      updateData.image = req.file.path;
    }

    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        returnDocument: "after"
      }
    );

    console.log("Updated Staff:", staff);

    res.json(staff);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message
    });
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
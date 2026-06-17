import Staff from "../models/Staff.js";
import Salon from "../models/Salon.js";
import bcrypt from "bcryptjs";

export const createStaff = async (req, res) => {
  try {
    const { password } = req.body;
    const services = Array.isArray(req.body.services)
      ? req.body.services
      : req.body.services
        ? [req.body.services]
        : [];

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const staffData = {
      full_name: req.body.name,
      email: req.body.email,
      password_hash,
      phone: req.body.phone,
      role: req.body.role || "Staff",
      specification: req.body.specification,
      commission_rate: req.body.commission_rate,
      salon_id: req.body.salonId,
      services,
      image: req.file ? req.file.path : null,
    };

    const staff = await Staff.create(staffData);

    // Increment salon's staffCount
    if (req.body.salonId) {
      await Salon.findByIdAndUpdate(
        req.body.salonId,
        { $inc: { staffCount: 1 } }
      );
    }

    const staffResponse = staff.toObject();
    delete staffResponse.password_hash;

    res.status(201).json(staffResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStaff = async (req, res) => {
  try {
    const { salonId } = req.query;
    const filter = salonId ? { salon_id: salonId } : {};

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

    console.log("Updating Staff ID:", req.params.id);
    console.log("Request Body:", req.body);

    // Get original staff to check if salon is changing
    const originalStaff = await Staff.findById(req.params.id);
    if (!originalStaff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const updateData = {};
    const services = (Array.isArray(req.body.services)
      ? req.body.services
      : req.body.services
        ? [req.body.services]
        : undefined
    )?.filter(Boolean);

    if (req.body.name !== undefined) updateData.full_name = req.body.name;
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.role !== undefined) updateData.role = req.body.role;
    if (req.body.salonId !== undefined) updateData.salon_id = req.body.salonId;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (services !== undefined) updateData.services = services;

    console.log("Update Data:", updateData);

    if (req.file) {
      updateData.image = req.file.path;
    }

    // Handle salon changes for staffCount
    if (req.body.salonId && req.body.salonId !== originalStaff.salon_id.toString()) {
      // Decrement old salon's staffCount
      await Salon.findByIdAndUpdate(
        originalStaff.salon_id,
        { $inc: { staffCount: -1 } }
      );
      
      // Increment new salon's staffCount
      await Salon.findByIdAndUpdate(
        req.body.salonId,
        { $inc: { staffCount: 1 } }
      );
    }

    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        returnDocument: "after"
      }
    ).select("-password_hash");

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

    // Decrement salon's staffCount
    if (staff.salon_id) {
      await Salon.findByIdAndUpdate(
        staff.salon_id,
        { $inc: { staffCount: -1 } }
      );
    }

    res.json({ message: "Staff removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

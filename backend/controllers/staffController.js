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

    const role = req.user?.role?.toLowerCase();
    const isManager = role === "manager";
    const isSuperAdmin = role === "super-admin";

    // Manager can only create staff in their own salon
    const salonId = isManager
      ? req.user.salon_id
      : req.body.salonId;

    const staffData = {
      full_name: req.body.name,
      email: req.body.email,
      password_hash,
      phone: req.body.phone,
      role: req.body.role || "Staff",
      specification: req.body.specification,
      commission_rate: req.body.commission_rate,
      salon_id: salonId,
      services,
      image: req.file ? req.file.path : null,
    };

    // keep status default aligned with schema enum
    if (!staffData.status) {
      staffData.status = "Active";
    }

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
    const userRole = req.user?.role?.toLowerCase();
    const isSalonScopedAdmin = userRole === "manager";
    const isSuperAdmin = userRole === "super-admin";

    let filter = {};

    // If the logged-in user belongs to a salon, always scope by their salon_id.
    if (isSalonScopedAdmin) {
      filter = {
        salon_id: req.user.salon_id,
      };
    } else if (isSuperAdmin) {
      // super-admin can view staff for a requested salon.
      // Frontend sends { salonId } query param; map it to salon_id filter.
      if (req.query.salonId) {
        filter = { salon_id: req.query.salonId };
      } else if (req.user?.salon_id) {
        // fallback: if token already contains a salon_id, use it
        filter = { salon_id: req.user.salon_id };
      }
    }

    console.log("req user:", req.user);
    console.log("Filter:", filter);
    
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
    const userRole = req.user?.role?.toLowerCase();
    const isManager = userRole === "manager";
    const isSuperAdmin = userRole === "super-admin";

    console.log("Updating Staff ID:", req.params.id);
    console.log("Request Body:", req.body);

    const existing = await Staff.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Manager can only update staff in their own salon
    if (
      isManager &&
      existing.salon_id?.toString() !== req.user.salon_id?.toString()
    ) {
      return res.status(403).json({
        message: "Forbidden: cannot update staff for another salon",
      });
    }

    const originalStaff = existing;

    const updateData = {};

    const services = (
      Array.isArray(req.body.services)
        ? req.body.services
        : req.body.services
        ? [req.body.services]
        : undefined
    )?.filter(Boolean);

    if (req.body.name !== undefined)
      updateData.full_name = req.body.name;

    if (req.body.email !== undefined)
      updateData.email = req.body.email;

    if (req.body.role !== undefined)
      updateData.role = req.body.role;

    // Only super-admin can change salon assignment
    if (
      isSuperAdmin &&
      req.body.salonId !== undefined
    ) {
      updateData.salon_id = req.body.salonId;
    }

    if (req.body.status !== undefined)
      updateData.status = req.body.status;

    if (services !== undefined)
      updateData.services = services;

    if (req.file) {
      updateData.image = req.file.path;
    }

    console.log("Update Data:", updateData);

    // Handle salon changes and maintain staff counts
    if (
      isSuperAdmin &&
      req.body.salonId &&
      req.body.salonId !== originalStaff.salon_id?.toString()
    ) {
      await Salon.findByIdAndUpdate(
        originalStaff.salon_id,
        { $inc: { staffCount: -1 } }
      );

      await Salon.findByIdAndUpdate(
        req.body.salonId,
        { $inc: { staffCount: 1 } }
      );
    }

    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        returnDocument: "after",
      }
    ).select("-password_hash");

    console.log("Updated Staff:", staff);

    res.json(staff);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteStaff = async (req, res) => {
  try {
    const userRole = req.user?.role?.toLowerCase();
    const isManager = userRole === "manager";

    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        message: "Staff not found",
      });
    }

    // Manager can only delete staff in their own salon
    if (
      isManager &&
      staff.salon_id?.toString() !== req.user.salon_id?.toString()
    ) {
      return res.status(403).json({
        message: "Forbidden: cannot delete staff for another salon",
      });
    }

    await Staff.findByIdAndDelete(req.params.id);

    // Maintain salon staff count
    if (staff.salon_id) {
      await Salon.findByIdAndUpdate(
        staff.salon_id,
        { $inc: { staffCount: -1 } }
      );
    }

    res.json({
      message: "Staff removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
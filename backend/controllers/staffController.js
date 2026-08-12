import Staff from "../models/Staff.js";
import Salon from "../models/Salon.js";
import bcrypt from "bcryptjs";
import Salary from "../models/Salary.js";
import Appointment from "../models/Appointment.js";
import Feedback from "../models/Feedback.js";

// Compute average staff rating from the Feedback collection for all staff
const attachRatings = async (staffList) => {
  try {
    const staffIds = staffList.map((s) => s._id);
    if (staffIds.length === 0) return staffList;

    const agg = await Feedback.aggregate([
      { $match: { staff_id: { $in: staffIds } } },
      {
        $group: {
          _id: "$staff_id",
          avgRating: { $avg: "$staffRating" },
          count: { $sum: 1 },
        },
      },
    ]);

    const ratingMap = {};
    agg.forEach((r) => {
      ratingMap[r._id.toString()] = {
        rating: Number(r.avgRating.toFixed(1)) || 0,
        ratingCount: r.count,
      };
    });

    return staffList.map((member) => {
      const meta = ratingMap[member._id.toString()] || { rating: 0, ratingCount: 0 };
      return { ...member, rating: meta.rating, ratingCount: meta.ratingCount };
    });
  } catch (err) {
    console.error("Error attaching staff ratings:", err);
    return staffList;
  }
};

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

    const salaryPaymentCountPerDay = Number(req.body.salaryPaymentCountPerDay || 1);

    const staffData = {
      full_name: req.body.name,
      email: req.body.email,
      password_hash,
      phone: req.body.phone,
      role: req.body.role || "Staff",
      specification: req.body.specification,
      commission_rate: req.body.commission_rate,
      salary_payment_frequency: req.body.salaryPaymentFrequency || "monthly",
      salary_payment_count_per_day: Number.isFinite(salaryPaymentCountPerDay) && salaryPaymentCountPerDay > 0 ? salaryPaymentCountPerDay : 1,
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
    // Auto-generate salary rows for current month for this staff (best-effort)
    try {
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      // We generate only for this staff by invoking Salary logic directly:
      // If controller exists, we could call it, but here we simply ensure a record exists.
      // Salary generation logic lives in salaryController; for simplicity we just leave it to /generate-monthly.
      // Create a placeholder now with basicSalary=0; controller will update snapshot/basicSalary when generate-monthly is called.
      await Salary.findOneAndUpdate(
        { salon_id: salonId, staff_id: staff._id, month: monthKey },
        {
          $setOnInsert: {
            salon_id: salonId,
            staff_id: staff._id,
            month: monthKey,
            servicesSnapshot: [],
            basicSalary: 0,
            commission: 0,
            totalSalary: 0,
            status: "Not Paid",
            paidAt: null,
          },
        },
        { upsert: true, new: true }
      );
    } catch (e) {
      // ignore
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

let formattedStaff = staff.map((member) => ({
      ...member.toObject(),
      name: member.full_name,
    }));

    // Attach average staff rating from Feedback collection (super-admin & manager views)
    formattedStaff = await attachRatings(formattedStaff);

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

    let formattedStaff = staff.map((member) => ({
      ...member.toObject(),
      name: member.full_name,
    }));

    // Attach average staff rating from Feedback collection (customer team page)
    formattedStaff = await attachRatings(formattedStaff);

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

    const willUpdateServices = services !== undefined;

    if (req.body.name !== undefined)
      updateData.full_name = req.body.name;

    if (req.body.email !== undefined)
      updateData.email = req.body.email;

    if (req.body.role !== undefined)
      updateData.role = req.body.role;

    if (req.body.salaryPaymentFrequency !== undefined)
      updateData.salary_payment_frequency = req.body.salaryPaymentFrequency;

    if (req.body.salaryPaymentCountPerDay !== undefined) {
      const parsedCount = Number(req.body.salaryPaymentCountPerDay);
      updateData.salary_payment_count_per_day = Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : 1;
    }

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

    // If staff services changed, ensure salary row basics are refreshed for current month (best-effort)
    if (willUpdateServices) {
      try {
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        await Salary.findOneAndUpdate(
          { salon_id: staff.salon_id, staff_id: staff._id, month: monthKey },
          {
            $set: { commission: 0, totalSalary: 0, status: "Not Paid" },
            $unset: { servicesSnapshot: "" },
          },
          { upsert: true, new: true }
        );
      } catch {
        // ignore
      }
    }

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

export const getStaffDashboard = async (req, res) => {
  try {
    const staffId = req.user.id;

    const staff = await Staff.findById(staffId).populate("salon_id", "name");
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Find the manager of this salon
    const manager = await Staff.findOne({
      salon_id: staff.salon_id?._id,
      role: { $in: ["manager", "staff-admin"] },
    });

    const profile = {
      staffName: staff.full_name,
      salonName: staff.salon_id?.name || "N/A",
      managerName: manager ? manager.full_name : "N/A",
      managerPhone: manager ? manager.phone : "N/A",
    };

    // Find all appointments for this staff
    const appointments = await Appointment.find({ staff_id: staffId })
      .populate("customer_id", "name")
      .populate("service_ids", "service_name")
      .sort({ appointment_date: -1 });

    res.json({
      profile,
      appointments,
    });
  } catch (error) {
    console.error("Error in getStaffDashboard:", error);
    res.status(500).json({ message: "Server error getting dashboard data" });
  }
};
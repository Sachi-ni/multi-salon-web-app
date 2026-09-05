import Staff from "../models/Staff.js";
import Salon from "../models/Salon.js";
import bcrypt from "bcryptjs";
import Salary from "../models/Salary.js";
import Appointment from "../models/Appointment.js";
import Feedback from "../models/Feedback.js";
import { storeMedia } from "../utils/mediaStorage.js";
import { assertNotPrivilegedRole } from "../utils/roleGuard.js";

const EMAIL_PATTERN = /^[^\s@]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const EMAIL_DOMAINS = new Set(["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"]);
const PHONE_PATTERN = /^(?:\+94|0)\d{9}$/;
const COMMON_PASSWORDS = new Set(["123456", "12345678", "password", "password123", "qwerty"]);
const normalizePhone = (phone) => String(phone || "").trim().replace(/[\s()-]/g, "");
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
    // Defense in depth: this endpoint must never create privileged accounts.
    assertNotPrivilegedRole(req.body.role);
    const { password } = req.body;
    let services = [];
    if (req.body.services) {
      if (Array.isArray(req.body.services)) {
        services = req.body.services;
      } else if (typeof req.body.services === "string") {
        try {
          const parsed = JSON.parse(req.body.services);
          services = Array.isArray(parsed) ? parsed : [req.body.services];
        } catch {
          services = [req.body.services];
        }
      }
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = normalizePhone(req.body.phone);
    const isStrongPassword =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[!@#$%^&*]/.test(password);

    if (!EMAIL_PATTERN.test(email) || !EMAIL_DOMAINS.has(email.split("@")[1])) {
      return res.status(400).json({
        message: "Email must be valid and use Gmail, Yahoo, Outlook, or Hotmail.",
      });
    }

    if (!PHONE_PATTERN.test(phone)) {
      return res.status(400).json({
        message: "Enter a valid Sri Lankan phone number (for example, 0771234567 or +94771234567).",
      });
    }

    if (!isStrongPassword || COMMON_PASSWORDS.has(password.toLowerCase())) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      });
    }

    const duplicateStaff = await Staff.findOne({
      email: { $regex: `^${escapeRegex(email)}$`, $options: "i" },
    });
    if (duplicateStaff) {
      return res.status(409).json({ message: "That email is already in use." });
    }

    const suppliedName = String(req.body.name || "").trim();
    const nameParts = suppliedName.split(/\s+/).filter(Boolean);
    const firstName = String(req.body.firstName || nameParts.shift() || "").trim();
    const lastName = String(req.body.lastName || nameParts.join(" ") || "").trim();

    if (!firstName || !lastName) {
      return res.status(400).json({
        message: "First name and last name are required.",
      });
    }

    if (!req.body.email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const role = req.user?.role?.toLowerCase();
    const isManager = role === "manager";
    const isSuperAdmin = role === "super-admin";

    if (!isManager && !isSuperAdmin) {
      return res.status(403).json({ message: "Only SuperAdmin or a manager can create staff" });
    }

    // Manager can only create staff in their own salon
    const salonId = isManager ? req.user.salon_id : req.body.salonId;
    if (!salonId) {
      return res.status(400).json({ message: "A salon assignment is required" });
    }
    if (isManager && !req.user.salon_id) {
      return res.status(403).json({ message: "Manager is not assigned to a salon" });
    }
    if (isSuperAdmin && !(await Salon.exists({ _id: salonId }))) {
      return res.status(404).json({ message: "Salon not found" });
    }

    const salaryPaymentCountPerDay = Number(req.body.salaryPaymentCountPerDay || 1);

    const staffData = {
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`.trim(),
      email,
      password_hash,
      phone,
      role: "staff",
      specification: req.body.specification,
      commission_rate: req.body.commission_rate || 0,
      salary_payment_frequency: req.body.salaryPaymentFrequency || "monthly",
      salary_payment_count_per_day: Number.isFinite(salaryPaymentCountPerDay) && salaryPaymentCountPerDay > 0 ? salaryPaymentCountPerDay : 1,
      salon_id: salonId,
      services,
      image: req.file ? await storeMedia(req.file, "salonhub/staff") : null,
    };

    // keep status default aligned with schema enum
    if (!staffData.status) {
      staffData.status = "Active";
    }

    const staff = await Staff.create(staffData);

    // Increment salon's staffCount
    if (staff.salon_id) {
      await Salon.findByIdAndUpdate(
        staff.salon_id,
        { $inc: { staffCount: 1 } }
      );
    }

    // Auto-generate salary record for current period for this staff (excluding managers)
    if ((staff.role || "").toLowerCase() !== "manager") {
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const frequency = staff.salary_payment_frequency || "monthly";

        const yyyymmdd = `${year}-${String(month).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        let period, periodStart, periodEnd, weekNumber = 0;

        if (frequency === "daily") {
          period = yyyymmdd;
          periodStart = yyyymmdd;
          periodEnd = yyyymmdd;
        } else if (frequency === "weekly") {
          const d = new Date(yyyymmdd);
          const dayNum = d.getUTCDay() || 7;
          d.setUTCDate(d.getUTCDate() + 4 - dayNum);
          const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
          weekNumber = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
          period = `${year}-W${String(weekNumber).padStart(2, "0")}`;

          const firstDayOfYear = new Date(year, 0, 1);
          const days = (weekNumber - 1) * 7;
          const startDate = new Date(firstDayOfYear);
          startDate.setDate(firstDayOfYear.getDate() + days);
          const dayOfWeek = startDate.getDay();
          const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          startDate.setDate(startDate.getDate() + diff);
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);

          const toStr = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
          periodStart = toStr(startDate);
          periodEnd = toStr(endDate);
        } else {
          period = `${year}-${String(month).padStart(2, "0")}`;
          const lastDay = new Date(year, month, 0).getDate();
          periodStart = `${year}-${String(month).padStart(2, "0")}-01`;
          periodEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
        }

        await Salary.findOneAndUpdate(
          { salon_id: salonId, staff_id: staff._id, period, frequency },
          {
            $setOnInsert: {
              salon_id: salonId,
              staff_id: staff._id,
              frequency,
              period,
              staff_name: staff.full_name || "",
              staff_role: staff.role || "",
              commission_rate: staff.commission_rate || 0,
              salary_payment_count_per_day: staff.salary_payment_count_per_day || 1,
              workingAmount: 0,
              rate: staff.commission_rate || 0,
              workRate: 0,
              daySalary: 0,
              totalSalary: 0,
              status: "Not Paid",
              year,
              month,
              weekNumber,
              dateRange: { start: periodStart, end: periodEnd },
              dailyRecords: [],
            },
          },
          { upsert: true, new: true }
        );
      } catch (e) {
        console.error("Error auto-creating salary row:", e);
      }
    }

    const staffResponse = staff.toObject();
    delete staffResponse.password_hash;

    res.status(201).json(staffResponse);
  } catch (error) {
    console.error("createStaff error:", error);
    const isValidationError = error.name === "ValidationError" || error.name === "MongoServerError";
    res.status(error.statusCode || (isValidationError ? 400 : 500)).json({
      message: isValidationError ? `Staff validation failed: ${error.message}` : error.message,
    });
  }
};

export const getStaff = async (req, res) => {
  try {
    const userRole = req.user?.role?.toLowerCase();
    const isSalonScopedAdmin = userRole === "manager";
    const isSuperAdmin = userRole === "super-admin";

    let filter = {};

    // Manager view
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

    // The public customer team page must only expose service professionals,
    // not salon-management accounts.
    const filter = {
      status: "Active",
      role: { $not: /^(manager|super-admin)$/i },
    };

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

    let services;

    if (req.body.services !== undefined) {
      let rawServices = req.body.services;
      if (Array.isArray(rawServices)) {
        services = rawServices;
      } else if (typeof rawServices === "string") {
        try {
          const parsed = JSON.parse(rawServices);
          services = Array.isArray(parsed) ? parsed : [rawServices];
        } catch (error) {
          services = [rawServices];
        }
      } else {
        services = [];
      }
      services = services.filter((serviceId) => typeof serviceId === "string" && serviceId.trim() !== "");
    }

    console.log("services:", req.body.services);
    console.log("type:", typeof req.body.services);

    const willUpdateServices = services !== undefined;

    if (req.body.firstName !== undefined) {
      updateData.first_name = req.body.firstName;
    }

    if (req.body.lastName !== undefined) {
      updateData.last_name = req.body.lastName;
    }

    if (
      req.body.firstName !== undefined ||
      req.body.lastName !== undefined
    ) {
      const firstName =
        req.body.firstName !== undefined
          ? req.body.firstName
          : existing.first_name;

      const lastName =
        req.body.lastName !== undefined
          ? req.body.lastName
          : existing.last_name;

      updateData.full_name =
        `${firstName} ${lastName}`.trim();
    }

    if (req.body.email !== undefined)
      updateData.email = req.body.email;

    if (req.body.phone !== undefined)
      updateData.phone = req.body.phone;

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(req.body.password, salt);
    }

    if (req.body.role !== undefined && String(req.body.role).toLowerCase() !== "staff") {
      return res.status(400).json({ message: "Staff role cannot be changed to a privileged role" });
    }
    if (req.body.role !== undefined)
      updateData.role = "staff";

    if (req.body.specification !== undefined) {
      updateData.specification = req.body.specification;
    }

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
      if (!(await Salon.exists({ _id: req.body.salonId }))) {
        return res.status(404).json({ message: "Salon not found" });
      }
      updateData.salon_id = req.body.salonId;
    }

    if (req.body.status !== undefined)
      updateData.status = req.body.status;

    console.log("FINAL SERVICES TO SAVE:", services);

    if (services !== undefined)
      updateData.services = services;

    if (req.file) {
      updateData.image = await storeMedia(req.file, "salonhub/staff");
    }

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
      { new: true }
    )
      .select("-password_hash")
      .populate("services", "service_name")
      .populate("salon_id", "name");

    // Update staff snapshots in unpaid salary records if name, count per day, or frequency changed
    try {
      const isNonManager = (staff.role || "").toLowerCase() !== "manager";
      if (isNonManager) {
        const salonId = staff.salon_id;
        const frequency = staff.salary_payment_frequency || "monthly";
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const yyyymmdd = `${year}-${String(month).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        let period, periodStart, periodEnd, weekNumber = 0;
        if (frequency === "daily") {
          period = yyyymmdd;
          periodStart = yyyymmdd;
          periodEnd = yyyymmdd;
        } else if (frequency === "weekly") {
          const d = new Date(yyyymmdd);
          const dayNum = d.getUTCDay() || 7;
          d.setUTCDate(d.getUTCDate() + 4 - dayNum);
          const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
          weekNumber = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
          period = `${year}-W${String(weekNumber).padStart(2, "0")}`;
          const firstDayOfYear = new Date(year, 0, 1);
          const days = (weekNumber - 1) * 7;
          const startDate = new Date(firstDayOfYear);
          startDate.setDate(firstDayOfYear.getDate() + days);
          const dayOfWeek = startDate.getDay();
          const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          startDate.setDate(startDate.getDate() + diff);
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          const toStr = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
          periodStart = toStr(startDate);
          periodEnd = toStr(endDate);
        } else {
          period = `${year}-${String(month).padStart(2, "0")}`;
          const lastDay = new Date(year, month, 0).getDate();
          periodStart = `${year}-${String(month).padStart(2, "0")}-01`;
          periodEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
        }

        // Update name and count per day on all unpaid records
        await Salary.updateMany(
          { staff_id: staff._id, status: "Not Paid" },
          {
            $set: {
              staff_name: staff.full_name || "",
              salary_payment_count_per_day: staff.salary_payment_count_per_day || 1,
            }
          }
        );

        // Ensure a current period record exists with the updated frequency
        await Salary.findOneAndUpdate(
          { salon_id: salonId, staff_id: staff._id, period, frequency },
          {
            $setOnInsert: {
              salon_id: salonId,
              staff_id: staff._id,
              frequency,
              period,
              staff_name: staff.full_name || "",
              staff_role: staff.role || "",
              commission_rate: staff.commission_rate || 0,
              salary_payment_count_per_day: staff.salary_payment_count_per_day || 1,
              workingAmount: 0,
              rate: staff.commission_rate || 0,
              workRate: 0,
              daySalary: 0,
              totalSalary: 0,
              status: "Not Paid",
              year,
              month,
              weekNumber,
              dateRange: { start: periodStart, end: periodEnd },
              dailyRecords: [],
            },
          },
          { upsert: true, new: true }
        );
      }
    } catch (e) {
      console.error("Error updating salary snapshot:", e);
    }

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
      role: {
        $in: [
          /^manager$/i,
          /^manager$/i
        ]
      },
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

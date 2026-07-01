import Salary from "../models/Salary.js";
import Staff from "../models/Staff.js";
import Service from "../models/Service.js";

// Helper: YYYY-MM from Date (server timezone)
const toMonthKey = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const computeBasicFromSnapshot = (servicesSnapshot = []) => {
  return servicesSnapshot.reduce((sum, s) => sum + Number(s.base_price || 0), 0);
};

const parseWorkHours = (value) => {
  const hours = Number(value ?? 1);
  return Number.isFinite(hours) && hours >= 0 ? hours : 1;
};

const buildSnapshot = async (staff) => {
  const services = await Service.find({
    _id: { $in: staff.services || [] },
    salon_id: staff.salon_id,
  }).select("service_name base_price");

  return services.map((svc) => ({
    service_id: svc._id,
    service_name: svc.service_name,
    base_price: svc.base_price,
  }));
};

export const generateMonthForSalon = async (req, res) => {
  try {
    const { salonId, month } = req.body;
    const monthKey = month || toMonthKey(new Date());

    const targetSalonId = salonId || req.user?.salon_id;
    if (!targetSalonId) {
      return res.status(400).json({ message: "salonId is required" });
    }

    const staffList = await Staff.find({
      salon_id: targetSalonId,
      status: "Active",
    }).select("_id services salon_id full_name role");

    const results = [];

    for (const staff of staffList) {
      const servicesSnapshot = await buildSnapshot(staff);
      const basicSalary = computeBasicFromSnapshot(servicesSnapshot);

      const existing = await Salary.findOne({
        salon_id: targetSalonId,
        staff_id: staff._id,
        month: monthKey,
      });

      // Only create if missing. Commission/status are preserved.
      if (!existing) {
        const doc = await Salary.create({
          salon_id: targetSalonId,
          staff_id: staff._id,
          month: monthKey,
          servicesSnapshot,
          basicSalary,
          workHours: 1,
          commission: 0,
          totalSalary: basicSalary,
          status: "Not Paid",
          paidAt: null,
        });
        results.push({ created: true, _id: doc._id });
      } else {
        // If staff services changed previously, we want basic salary to follow.
        // Update snapshot + basicSalary (but keep commission & status fields).
        existing.servicesSnapshot = servicesSnapshot;
        existing.basicSalary = basicSalary;
        existing.workHours = Number(existing.workHours || 1);
        existing.totalSalary = basicSalary * Number(existing.workHours || 1) + Number(existing.commission || 0);
        await existing.save();
        results.push({ created: false, _id: existing._id });
      }
    }

    res.status(200).json({ message: "Monthly salary generated", month: monthKey, results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/salary?month=YYYY-MM&salonId=optional
export const getSalaries = async (req, res) => {
  try {
    const monthKey = req.query.month || toMonthKey(new Date());

    const targetSalonId =
      req.user?.role === "super-admin" ? req.query.salonId || req.user?.salon_id : req.user?.salon_id;

    if (!targetSalonId) {
      return res.status(400).json({ message: "salonId is required" });
    }

    const rows = await Salary.find({ salon_id: targetSalonId, month: monthKey })
      .populate("staff_id", "full_name role")
      .select("salon_id staff_id month servicesSnapshot basicSalary workHours commission totalSalary status paidAt");

    // Ensure basic salary exists even if missing records (frontend friendly)
    res.status(200).json({ salaries: rows.map((r) => ({
      _id: r._id,
      salon_id: r.salon_id,
      staff_id: r.staff_id,
      full_name: r.staff_id?.full_name,
      role: r.staff_id?.role,
      month: r.month,
      servicesSnapshot: r.servicesSnapshot,
      base_salary: r.basicSalary,
      work_hours: r.workHours,
      commission: r.commission,
      total_payout: r.totalSalary,
      status: r.status,
      paidAt: r.paidAt,
    })) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/salary/upsert
// body: { staffId, month, commission, status }
export const upsertMonthlySalary = async (req, res) => {
  try {
    const { staffId, month, commission, status, workHours } = req.body;
    const monthKey = month || toMonthKey(new Date());

    if (!staffId) {
      return res.status(400).json({ message: "staffId is required" });
    }

    const staff = await Staff.findById(staffId).populate("services");
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const targetSalonId = staff.salon_id;

    // Basic auth scoping: managers cannot change other salons
    if (req.user?.role !== "super-admin" && targetSalonId?.toString() !== req.user?.salon_id?.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const servicesSnapshot = await buildSnapshot(staff);
    const basicSalary = computeBasicFromSnapshot(servicesSnapshot);

    const safeCommission = Number(commission || 0);
    const safeWorkHours = parseWorkHours(workHours);
    const safeStatus = status === "Paid" ? "Paid" : "Not Paid";

    const existing = await Salary.findOne({
      salon_id: targetSalonId,
      staff_id: staffId,
      month: monthKey,
    });

    const totalSalary = basicSalary * safeWorkHours + safeCommission;

    if (!existing) {
      const created = await Salary.create({
        salon_id: targetSalonId,
        staff_id: staffId,
        month: monthKey,
        servicesSnapshot,
        basicSalary,
        workHours: safeWorkHours,
        commission: safeCommission,
        totalSalary,
        status: safeStatus,
        paidAt: safeStatus === "Paid" ? new Date() : null,
      });
      return res.status(201).json({ message: "Salary created", salary: created });
    }

    existing.servicesSnapshot = servicesSnapshot;
    existing.basicSalary = basicSalary;
    existing.workHours = safeWorkHours;
    existing.commission = safeCommission;
    existing.totalSalary = totalSalary;
    existing.status = safeStatus;
    existing.paidAt = safeStatus === "Paid" ? new Date() : null;

    await existing.save();

    res.status(200).json({ message: "Salary updated", salary: existing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/salary/ensure?month=YYYY-MM
// Creates/refreshes salary rows for the salon & month.
export const ensureMonthForSalon = async (req, res) => {
  try {
    const monthKey = req.query.month || toMonthKey(new Date());
    const salonId = req.query.salonId || req.user?.salon_id;

    // Reuse generator
    const fakeReq = { ...req, body: { salonId, month: monthKey }, user: req.user };

    // Call generator with the same logic
    return await generateMonthForSalon(fakeReq, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


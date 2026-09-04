import Salary from "../models/Salary.js";
import Staff from "../models/Staff.js";
import Appointment from "../models/Appointment.js";
import AppointmentService from "../models/AppointmentService.js";
import Salon from "../models/Salon.js";
import Service from "../models/Service.js";
import mongoose from "mongoose";

// ─── Safe helpers ───────────────────────────────────────────────────────────

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

// Convert Date, ISO string, or YYYY-MM-DD into YYYY-MM-DD.
// All salary daily records must use this format.
const normalizeSalaryDate = (value) => {
  if (!value) return "";

  // If already YYYY-MM-DD, keep it unchanged.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getEffectiveRate = (salaryRecord, staffCommissionRate = 0) => {
  const savedRate = safeNumber(salaryRecord?.rate, NaN);

  if (Number.isFinite(savedRate) && savedRate > 0) {
    return savedRate;
  }

  return safeNumber(staffCommissionRate, 0);
};
// ─── Helper: scope salary records to the requesting user's salon ───────────
// Super-admins operate on every salon; managers only their own.
const salaryBelongsToUserSalon = (salaryRecord, reqUser) => {
  if (!reqUser || reqUser.role === "super-admin") return true;

  const recordSalonId =
    salaryRecord?.salon_id?._id ?? salaryRecord?.salon_id;

  if (
    recordSalonId === undefined ||
    recordSalonId === null ||
    reqUser.salon_id === undefined ||
    reqUser.salon_id === null
  ) {
    return false;
  }

  return String(recordSalonId) === String(reqUser.salon_id);
};

// ─── Helper Functions ──────────────────────────────────────────────────────

// ─── Helper Functions ──────────────────────────────────────────────────────

const getISOWeek = (dateStr) => {
  const date = new Date(dateStr);
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return weekNo;
};

const getISOWeekStr = (dateStr) => {
  const date = new Date(dateStr);
  const weekNo = getISOWeek(dateStr);
  const year = date.getUTCFullYear();
  return `${year}-W${String(weekNo).padStart(2, "0")}`;
};

const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

const calculateDaySalary = (
  workRate,
  salaryPaymentCountPerDay = 0,
  isAbsent = false
) => {
  // A day manually marked absent by a manager earns nothing, even when the
  // staff member has a fixed salary-per-day amount.
  if (isAbsent) {
    return 0;
  }

  const numericPerDay = safeNumber(salaryPaymentCountPerDay, 0);
  const numericWorkRate = safeNumber(workRate, 0);

  // No working amount means no appointments were completed for this staff on
  // this day - the staff still earns the fixed salary-per-day amount.
  if (numericWorkRate <= 0) {
    return numericPerDay;
  }

  return numericWorkRate > numericPerDay ? numericWorkRate : numericPerDay;
};

// ─── Helper: convert a date string to local "YYYY-MM-DD" (avoid toISOString timezone shift) ─
const toLocalDateStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Monday-based week start that is ISO-correct for every year.
// Jan 4 always belongs to ISO week 1, so the Monday of that week plus
// (weekNum - 1) * 7 days gives the exact ISO week range. This keeps
// dateRange.start/end aligned with the "YYYY-Www" period labels produced
// by getISOWeek (the naive "Jan 1 - weekday" approach diverges for years
// where Jan 1 falls on Fri/Sat/Sun, e.g. 2022 or 2027).
const getWeekDates = (year, weekNum) => {
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay(); // 0 = Sunday ... 6 = Saturday
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startDate = new Date(jan4);
  startDate.setDate(jan4.getDate() - daysSinceMonday + (weekNum - 1) * 7);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    dates.push(toLocalDateStr(d));
  }
  return dates;
};

// ─── Helper: ensure ALL days in a period have a daily record ──────────────
const ensureAllDaysInPeriod = (
  salaryRecord,
  effectiveRate,
  salaryPaymentCountPerDay,
  upToDate
) => {
  if (!salaryRecord.dateRange?.start || !salaryRecord.dateRange?.end) {
    return;
  }

  if (!Array.isArray(salaryRecord.dailyRecords)) {
    salaryRecord.dailyRecords = [];
  }

  const validRate = safeNumber(
    effectiveRate,
    safeNumber(salaryRecord.rate, 0)
  );

  // Normalize all existing records.
  salaryRecord.dailyRecords = salaryRecord.dailyRecords.map((record) => ({
    ...record,
    date: normalizeSalaryDate(record.date),
    workingAmount: safeNumber(record.workingAmount, 0),

    // Keep the staff rate even when there are no appointments.
    rate:
      record.rate !== undefined &&
      record.rate !== null &&
      Number(record.rate) > 0
        ? safeNumber(record.rate)
        : validRate,

    workRate: safeNumber(record.workRate, 0),
    daySalary: safeNumber(record.daySalary, 0),
    totalSalary: safeNumber(record.totalSalary, 0),
    status: record.status || "Not Paid",

    // Preserve the manager-marked absence (recalcWeeklyMonthlyTotals applies
    // it by forcing the day salary to 0).
    isAbsent: Boolean(record.isAbsent),
    absentMarkedAt: record.absentMarkedAt || null,
  }));

  const existingDates = new Set(
    salaryRecord.dailyRecords.map((record) => record.date)
  );

  const startDate = new Date(
    `${normalizeSalaryDate(salaryRecord.dateRange.start)}T00:00:00`
  );

  let endDate = new Date(
    `${normalizeSalaryDate(salaryRecord.dateRange.end)}T00:00:00`
  );

  // Optionally stop filling days at a cap (e.g. today) so future days of the
  // current period are never pre-created with salary values.
  if (upToDate) {
    const upToDateValue = new Date(`${normalizeSalaryDate(upToDate)}T00:00:00`);
    if (!Number.isNaN(upToDateValue.getTime()) && upToDateValue < endDate) {
      endDate = upToDateValue;
    }
  }

  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const date = normalizeSalaryDate(currentDate);

    if (!existingDates.has(date)) {
      salaryRecord.dailyRecords.push({
        date,

        // No completed appointment means only the salary-per-day amount
        // applies (applied by recalcWeeklyMonthlyTotals below).
        workingAmount: 0,

        // Important: keep the staff commission rate.
        rate: validRate,

        workRate: 0,
        daySalary: 0,
        totalSalary: 0,
        status: "Not Paid",
        isAbsent: false,
        absentMarkedAt: null,
      });

      existingDates.add(date);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  salaryRecord.dailyRecords.sort((a, b) =>
    a.date.localeCompare(b.date)
  );
};

// ─── Recalculate weekly/monthly totals from daily records ─────────────────
const recalcWeeklyMonthlyTotals = (salaryRecord) => {
  if (!Array.isArray(salaryRecord.dailyRecords)) {
    salaryRecord.dailyRecords = [];
  }

  const salaryPaymentCountPerDay = safeNumber(
    salaryRecord.salary_payment_count_per_day,
    0
  );

  // Make sure all daily values are valid numbers.
  salaryRecord.dailyRecords = salaryRecord.dailyRecords.map((record) => {
    const workingAmount = safeNumber(record.workingAmount, 0);
    const rate = safeNumber(record.rate, 0);

    const workRate =
      workingAmount > 0 && rate > 0
        ? workingAmount * (rate / 100)
        : 0;

    const isAbsent = Boolean(record.isAbsent);

    const daySalary = calculateDaySalary(
      workRate,
      salaryPaymentCountPerDay,
      isAbsent
    );

    return {
      ...record,
      date: normalizeSalaryDate(record.date),
      workingAmount,
      rate,
      workRate,
      daySalary,
      totalSalary: daySalary,
      status: record.status || "Not Paid",
      isAbsent,
      absentMarkedAt: record.absentMarkedAt || null,
    };
  });

  // Sort records from oldest date to newest date.
  salaryRecord.dailyRecords.sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  // Calculate the period totals. Future-dated day records (if any) must not
  // inflate the totals of the still-running period.
  const todayKey = toLocalDateStr(new Date());
  const countedRecords = salaryRecord.dailyRecords.filter(
    (record) => !record.date || record.date <= todayKey
  );

  salaryRecord.workingAmount =
    countedRecords.reduce(
      (total, record) =>
        total + safeNumber(record.workingAmount, 0),
      0
    );

  salaryRecord.workRate =
    countedRecords.reduce(
      (total, record) =>
        total + safeNumber(record.workRate, 0),
      0
    );

  salaryRecord.daySalary =
    countedRecords.reduce(
      (total, record) =>
        total + safeNumber(record.daySalary, 0),
      0
    );

  // Final weekly/monthly salary.
  salaryRecord.totalSalary = salaryRecord.daySalary;
};

// ─── Refresh salary records so they follow the salary-per-day rules ────────
// Days without completed appointments still earn the fixed salary-per-day
// amount, weekly/monthly records cover every day up to today, and all totals
// are recalculated before the records are returned to the frontend. Paid
// records keep their historical values.
const refreshSalaryRecord = (salaryRecord) => {
  // Backfill the per-day amount snapshot from the staff when it is missing.
  const staffPerDay = safeNumber(
    salaryRecord.staff_id?.salary_payment_count_per_day,
    0
  );
  const currentPerDay = safeNumber(
    salaryRecord.salary_payment_count_per_day,
    0
  );
  const perDay = currentPerDay > 0 ? currentPerDay : staffPerDay;

  const effectiveRate = getEffectiveRate(
    salaryRecord,
    salaryRecord.commission_rate
  );

  const before = {
    rate: safeNumber(salaryRecord.rate, 0),
    workingAmount: safeNumber(salaryRecord.workingAmount, 0),
    workRate: safeNumber(salaryRecord.workRate, 0),
    daySalary: safeNumber(salaryRecord.daySalary, 0),
    totalSalary: safeNumber(salaryRecord.totalSalary, 0),
    dailyRecords: (salaryRecord.dailyRecords || [])
      .map(
        (record) =>
          `${normalizeSalaryDate(record.date)}:${safeNumber(
            record.daySalary,
            0
          )}`
      )
      .join(","),
  };

  if (perDay !== currentPerDay) {
    salaryRecord.salary_payment_count_per_day = perDay;
  }

  // Always keep the staff commission rate on the record.
  salaryRecord.rate = effectiveRate;

  if (salaryRecord.frequency === "daily") {
    const workingAmount = safeNumber(salaryRecord.workingAmount, 0);
    const workRate =
      workingAmount > 0 ? workingAmount * (effectiveRate / 100) : 0;
    const daySalary = calculateDaySalary(
      workRate,
      perDay,
      Boolean(salaryRecord.isAbsent)
    );

    salaryRecord.workRate = workRate;
    salaryRecord.daySalary = daySalary;
    salaryRecord.totalSalary = daySalary;
  } else {
    // Weekly/monthly records: materialize every day up to today, then apply
    // the salary-per-day rules and recalculate the period totals.
    ensureAllDaysInPeriod(
      salaryRecord,
      effectiveRate,
      perDay,
      toLocalDateStr(new Date())
    );
    recalcWeeklyMonthlyTotals(salaryRecord);
  }

  const after = {
    rate: safeNumber(salaryRecord.rate, 0),
    workingAmount: safeNumber(salaryRecord.workingAmount, 0),
    workRate: safeNumber(salaryRecord.workRate, 0),
    daySalary: safeNumber(salaryRecord.daySalary, 0),
    totalSalary: safeNumber(salaryRecord.totalSalary, 0),
    dailyRecords: (salaryRecord.dailyRecords || [])
      .map(
        (record) =>
          `${normalizeSalaryDate(record.date)}:${safeNumber(
            record.daySalary,
            0
          )}`
      )
      .join(","),
  };

  return JSON.stringify(before) !== JSON.stringify(after);
};

const refreshSalariesForResponse = async (salaries) => {
  const changed = [];

  for (const salaryRecord of salaries) {
    // Paid records keep their historical values.
    if ((salaryRecord.status || "") === "Paid") continue;

    try {
      if (refreshSalaryRecord(salaryRecord)) {
        changed.push(salaryRecord);
      }
    } catch (err) {
      console.error("Salary refresh failed:", err);
    }
  }

  await Promise.all(
    changed.map((record) =>
      record.save().catch((err) => {
        console.error("Failed to persist refreshed salary record:", err.message);
      })
    )
  );

  return salaries;
};

// ─── Calculate and update salary when appointment is completed ─────────────

export const updateSalaryOnAppointmentCompletion = async (appointmentId) => {
  try {
    const appointment = await Appointment.findById(appointmentId)
      .populate("staff_id", "full_name role commission_rate salary_payment_frequency salary_payment_count_per_day salon_id")
      .populate("salon_id", "name");

    if (!appointment || appointment.status !== "completed") {
      return { success: false, message: "Appointment not completed" };
    }

    const salonId = appointment.salon_id._id || appointment.salon_id;
    const appointmentDate = appointment.appointment_date;

    // Get appointment services
    const apptServices = await AppointmentService.find({
      appointment_id: appointment._id,
    }).populate("staff_id", "full_name role commission_rate salary_payment_frequency salary_payment_count_per_day");

    // If no AppointmentService records, use the main appointment data
    if (!apptServices || apptServices.length === 0) {
      // Single staff appointment
      const staff = appointment.staff_id;
      const subPrice = appointment.total_price || 0;
      await updateSingleStaffSalary(staff, salonId, appointmentDate, subPrice);
    } else {
      // Multiple services with potentially multiple staff
      for (const apptSvc of apptServices) {
        // Ensure we have a full Staff document. Sometimes populate may
        // return a bare ObjectId (truthy) which lacks fields like _id
        // or commission_rate. In that case, fetch the staff record.
        let staff = apptSvc.staff_id || appointment.staff_id;

        if (staff && !staff._id && mongoose.isValidObjectId(staff)) {
          try {
            const fetched = await Staff.findById(staff).select(
              "full_name commission_rate salary_payment_frequency salary_payment_count_per_day role"
            );
            if (fetched) staff = fetched;
          } catch (e) {
            // ignore and fallback to appointment.staff_id below
            staff = appointment.staff_id || staff;
          }
        }

        const subPrice = apptSvc.sub_price || 0;
        await updateSingleStaffSalary(staff, salonId, appointmentDate, subPrice);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating salary on appointment completion:", error);
    return { success: false, message: error.message };
  }
};

export const processSalaryOnCompletion = updateSalaryOnAppointmentCompletion;

const accrueStaffSalaryForFrequency = async (staff, salonId, appointmentDate, amount, frequency) => {
  if (!staff) return;

  const commissionRate = staff.commission_rate || 0;
  const salaryPaymentCountPerDay = staff.salary_payment_count_per_day || 1;
  const staffId = staff._id;
  const staffName = staff.full_name || "";

  let year;
  let month;
  let weekNumber = 0;

  const normalizedAppointmentDate = normalizeSalaryDate(appointmentDate);

  // Determine period from appointment date and frequency
  let period;
  let periodStart, periodEnd;
  
  const dateObj = new Date(normalizedAppointmentDate);
  year = dateObj.getFullYear();
  month = dateObj.getMonth() + 1;

  if (frequency === "daily") {
    period = normalizedAppointmentDate;
    periodStart = normalizedAppointmentDate;
    periodEnd = normalizedAppointmentDate;
  } else if (frequency === "weekly") {
    weekNumber = getISOWeek(normalizedAppointmentDate);
    period = `${year}-W${String(weekNumber).padStart(2, "0")}`;
    const weekDates = getWeekDates(year, weekNumber);
    periodStart = weekDates[0];
    periodEnd = weekDates[6];
  } else {
    // monthly
    period = `${year}-${String(month).padStart(2, "0")}`;
    const daysInMonth = getDaysInMonth(year, month);
    periodStart = `${year}-${String(month).padStart(2, "0")}-01`;
    periodEnd = `${year}-${String(month).padStart(2, "0")}-${daysInMonth}`;
  }

  // Find or create salary record
  let salaryRecord = await Salary.findOne({
    salon_id: salonId,
    staff_id: staffId,
    period,
    frequency,
  });

  if (!salaryRecord) {
    salaryRecord = new Salary({
      salon_id: salonId,
      staff_id: staffId,
      frequency,
      period,
      staff_name: staffName,
      staff_role: staff.role || "",
      commission_rate: commissionRate,
      salary_payment_count_per_day: salaryPaymentCountPerDay,
      workingAmount: 0,
      rate: commissionRate,
      workRate: 0,
      daySalary: 0,
      totalSalary: 0,
      status: "Not Paid",
      year,
      month,
      weekNumber,
      dateRange: { start: periodStart, end: periodEnd },
      dailyRecords: [],
    });
  }

  const effectiveRate = getEffectiveRate(
    salaryRecord,
    commissionRate
  );

  // Always keep the salary record rate.
  salaryRecord.rate = effectiveRate;

  if (frequency === "daily") {
    // ─── DAILY SALARY ───────────────────────────────────────────────────────

    salaryRecord.workingAmount =
      safeNumber(salaryRecord.workingAmount, 0) +
      safeNumber(amount, 0);

    salaryRecord.workRate =
      salaryRecord.workingAmount *
      (effectiveRate / 100);

    salaryRecord.daySalary =
      calculateDaySalary(
        salaryRecord.workRate,
        salaryPaymentCountPerDay,
        Boolean(salaryRecord.isAbsent)
      );

    salaryRecord.totalSalary =
      salaryRecord.daySalary;

  } else {
    // ─── WEEKLY AND MONTHLY SALARY ──────────────────────────────────────────

    if (!Array.isArray(salaryRecord.dailyRecords)) {
      salaryRecord.dailyRecords = [];
    }

    // Normalize all stored dates before searching.
    salaryRecord.dailyRecords =
      salaryRecord.dailyRecords.map((record) => ({
        ...record,
        date: normalizeSalaryDate(record.date),

        // Preserve the manager-marked absence.
        isAbsent: Boolean(record.isAbsent),
        absentMarkedAt: record.absentMarkedAt || null,
      }));

    // Find the current appointment date.
    let dailyRecord =
      salaryRecord.dailyRecords.find(
        (record) =>
          record.date === normalizedAppointmentDate
      );

    // If the date does not exist, create it.
    if (!dailyRecord) {
      dailyRecord = {
        date: normalizedAppointmentDate,
        workingAmount: 0,

        // New day keeps the staff commission rate.
        rate: effectiveRate,

        workRate: 0,
        daySalary: 0,
        totalSalary: 0,
        status: "Not Paid",
        isAbsent: false,
        absentMarkedAt: null,
      };

      salaryRecord.dailyRecords.push(dailyRecord);
    }

    // Add only the new completed appointment amount.
    dailyRecord.workingAmount =
      safeNumber(dailyRecord.workingAmount, 0) +
      safeNumber(amount, 0);

    // Keep the rate for the current day.
    dailyRecord.rate = effectiveRate;

    // Calculate only the current day's salary.
    dailyRecord.workRate =
      dailyRecord.workingAmount *
      (effectiveRate / 100);

    dailyRecord.daySalary =
      calculateDaySalary(
        dailyRecord.workRate,
        salaryPaymentCountPerDay,
        Boolean(dailyRecord.isAbsent)
      );

    dailyRecord.totalSalary =
      dailyRecord.daySalary;

    dailyRecord.status = "Not Paid";

    // Recalculate the final weekly/monthly salary.
    recalcWeeklyMonthlyTotals(salaryRecord);
  }

  // Save the salary record.
  await salaryRecord.save();
};

// Dispatcher: accrues the salary amount for a single staff member when an
// appointment is completed.
const updateSingleStaffSalary = async (staff, salonId, appointmentDate, amount) => {
  if (!staff) return;

  // Managers do not earn salaries. (Matches the role filtering applied by
  // every salary listing endpoint; otherwise completing an appointment for a
  // manager creates orphan records that never appear in lists but still
  // inflate summaries.)
  const role = (staff.role || "").toLowerCase();
  if (role === "manager") return;

  // Managers accrue salary exactly like regular staff on the admin/salary
  // page: only in the frequency configured on their profile
  // (salary_payment_frequency). The super-admin manager salary page therefore
  // shows one record per manager per period just like the admin page shows one
  // record per staff member.
  await accrueStaffSalaryForFrequency(
    staff,
    salonId,
    appointmentDate,
    amount,
    staff.salary_payment_frequency || "monthly"
  );
};

// Resolve the salary role filter used by the listing / payroll endpoints.
//   "manager"    -> only salon managers (Staff collection role "manager")
  //   "management" -> salon managers
  //   anything else -> normal staff (managers are excluded)
const resolveSalaryRole = (roleFilter) => {
  const role = (roleFilter || "").toLowerCase();
  if (role === "manager") return "manager";
  if (role === "management") return "management";
  return "staff";
};

// Should a staff record (given its role) be included under a role mode?
const salaryRoleIncludes = (mode, staffRole) => {
  const role = (staffRole || "").toLowerCase();
  if (mode === "manager") return role === "manager";
  if (mode === "management") return role === "manager";
  return role !== "manager";
};
// ─── Get salaries ──────────────────────────────────────────────────────────

export const getSalaries = async (req, res) => {
  try {
    const { salonId, frequency, period, staffId, role: roleFilter } = req.query;

    const filter = {};

    if (req.user.role !== "super-admin") {
      filter.salon_id = req.user.salon_id;
    } else if (salonId) {
      filter.salon_id = salonId;
    }

    if (frequency) filter.frequency = frequency;
    if (period) filter.period = period;
    if (staffId) filter.staff_id = staffId;

    let salaries = await Salary.find(filter)
      .populate("staff_id", "full_name email phone role salary_payment_frequency salary_payment_count_per_day commission_rate image")
      .populate("salon_id", "name location phone email")
      .sort({ "staff_name": 1 });

    // Role scoping: the super-admin salary page asks for salon managers only;
    // every other listing keeps excluding managers.
    const roleMode = resolveSalaryRole(roleFilter);
    salaries = salaries.filter((s) =>
      salaryRoleIncludes(roleMode, s.staff_id?.role || s.staff_role)
    );

    // Cross-check: only return salaries where the staff member's
    // salary_payment_frequency matches the queried frequency. This matches the
    // admin/salary page, where each person only appears in the tab matching
    // their configured frequency.
    if (frequency) {
      salaries = salaries.filter(s => {
        if (!s.staff_id) return true; // keep if staff data missing (edge case)
        return s.staff_id.salary_payment_frequency === frequency;
      });
    }

    // Apply the salary-per-day rules (days without completed appointments
    // still earn the salary-per-day amount) before responding.
    salaries = await refreshSalariesForResponse(salaries);

    res.json({ success: true, salaries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get salary summary ────────────────────────────────────────────────────

export const getSalarySummary = async (req, res) => {
  try {
    const { salonId, frequency, role: roleFilter } = req.query;

    const match = {};
    if (req.user.role !== "super-admin") {
      match.salon_id = new mongoose.Types.ObjectId(req.user.salon_id);
    } else if (salonId) {
      match.salon_id = new mongoose.Types.ObjectId(salonId);
    }
    if (frequency) match.frequency = frequency;

    // Fetch with staff role info so totals match what lists display
    // (manager records are excluded everywhere else).
    let salaryDocs = await Salary.find(match)
      .populate("staff_id", "role")
      .select("status totalSalary paidTotal workingAmount staff_role")
      .lean();

    const roleMode = resolveSalaryRole(roleFilter);
    salaryDocs = salaryDocs.filter((s) =>
      salaryRoleIncludes(roleMode, s.staff_id?.role || s.staff_role)
    );

    const summary = {
      totalPending: 0,
      totalPaid: 0,
      pendingCount: 0,
      paidCount: 0,
      totalWorkingAmount: 0,
    };
    for (const s of salaryDocs) {
      if (s.status === "Paid") {
        summary.totalPaid += safeNumber(s.paidTotal, 0);
        summary.paidCount += 1;
      } else {
        summary.totalPending += safeNumber(s.totalSalary, 0);
        summary.pendingCount += 1;
      }
      summary.totalWorkingAmount += safeNumber(s.workingAmount, 0);
    }

    res.json({
      success: true,
      ...summary,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get staff list for salary filters ────────────────────────────────────

export const getStaffSalaryList = async (req, res) => {
  try {
    const { salonId, frequency } = req.query;

    const salonFilter = {};
    if (req.user.role !== "super-admin") {
      salonFilter.salon_id = req.user.salon_id;
    } else if (salonId) {
      salonFilter.salon_id = salonId;
    }

    const staffList = await Staff.find({
      ...salonFilter,
      status: "Active",
      role: { $not: { $regex: /manager/i } },
      ...(frequency ? { salary_payment_frequency: frequency } : {}),
    })
      .select("full_name role commission_rate salary_payment_frequency salary_payment_count_per_day salon_id services")
      .populate("salon_id", "name")
      .populate("services", "service_name base_price duration")
      .sort({ full_name: 1 })
      .lean();

    res.json({ success: true, staff: staffList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Mark salary as Paid ────────────────────────────────────────────────────

export const markAsPaid = async (req, res) => {
  try {
    const { salaryId } = req.params;

    const salary = await Salary.findById(salaryId);
    if (!salary) {
      return res.status(404).json({ success: false, message: "Salary record not found" });
    }

    // Salon scoping: non super-admins may only pay salaries in their own salon
    if (!salaryBelongsToUserSalon(salary, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this salary record",
      });
    }

    // Capture the totalSalary before paying so reports show the paid value
    salary.paidTotal = salary.totalSalary || 0;

    salary.status = "Paid";
    salary.paidAt = new Date();

    // Preserve all data - do NOT reset workingAmount, workRate, daySalary, totalSalary
    // This ensures past dates show the correct data with "Paid" status

    // Mark all daily records as Paid but preserve their values
    if (salary.dailyRecords && salary.dailyRecords.length > 0) {
      for (const dr of salary.dailyRecords) {
        dr.status = "Paid";
        // Preserve workingAmount, workRate, daySalary, totalSalary
      }
    }

    await salary.save();

    res.json({ success: true, message: "Salary marked as paid", salary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -- Create (if missing) and mark a salary record as Paid -------------------
// Used by the admin/salon salary tables for staff rows that do not have a
// salary record for the selected period yet (the frontend "fallback" rows).
// The record is created with the salary-per-day rules applied, then marked as
// Paid immediately. The UI already prevents paying before the period ends
// (daily per day, weekly after the week, monthly after the month); this
// endpoint simply records whatever staff/period/frequency is sent.
export const createAndMarkPaid = async (req, res) => {
  try {
    const { staffId, frequency, period, salonId } = req.body;

    if (!staffId || !frequency || !period) {
      return res.status(400).json({
        success: false,
        message: "staffId, frequency and period are required",
      });
    }

    const salon_id =
      req.user.role === "super-admin" ? salonId || null : req.user.salon_id;

    if (!salon_id) {
      return res.status(400).json({
        success: false,
        message: "salonId is required to pay this salary record",
      });
    }

    const staff = await Staff.findOne({ _id: staffId, salon_id });
    if (!staff) {
      return res.status(403).json({
        success: false,
        message: "Staff not found in your salon",
      });
    }

    let salaryRecord = await Salary.findOne({
      salon_id,
      staff_id: staffId,
      period,
      frequency,
    });

    if (!salaryRecord) {
      // Derive the date range covered by the period key.
      let periodStart;
      let periodEnd;
      let year = 0;
      let month = 0;
      let weekNumber = 0;

      if (frequency === "daily") {
        periodStart = period;
        periodEnd = period;
        const d = new Date(period);
        year = d.getFullYear();
        month = d.getMonth() + 1;
      } else if (frequency === "weekly") {
        const parts = period.split("-W");
        year = parseInt(parts[0], 10);
        weekNumber = parseInt(parts[1], 10);
        const weekDates = getWeekDates(year, weekNumber);
        periodStart = weekDates[0];
        periodEnd = weekDates[6];
        month = new Date(periodStart).getMonth() + 1;
      } else {
        const parts = period.split("-");
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        const daysInMonth = getDaysInMonth(year, month);
        const monthStr = String(month).padStart(2, "0");
        periodStart = `${year}-${monthStr}-01`;
        periodEnd = `${year}-${monthStr}-${daysInMonth}`;
      }

      salaryRecord = new Salary({
        salon_id,
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
      });

      // Apply the salary-per-day rules (every elapsed day earns the fixed
      // salary-per-day amount) before capturing the payable total.
      refreshSalaryRecord(salaryRecord);
    }

    // Capture the payable total and mark the record (and its daily records)
    // as Paid while preserving all computed amounts.
    salaryRecord.paidTotal = safeNumber(salaryRecord.totalSalary, 0);
    salaryRecord.status = "Paid";
    salaryRecord.paidAt = new Date();

    if (Array.isArray(salaryRecord.dailyRecords)) {
      for (const dr of salaryRecord.dailyRecords) {
        dr.status = "Paid";
      }
    }

    await salaryRecord.save();

    res.json({ success: true, message: "Salary marked as paid", salary: salaryRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Mark / unmark an absent day (manual manager override) ─────────────────
// A manager can mark a specific date as absent for a staff member. Absent
// days earn no salary: daySalary is forced to 0 and the period totals are
// recalculated. The rest of the salary process keeps working automatically.

// Core: apply (or clear) an absence on one day of a salary record.
// `dateKey` is only used for weekly/monthly records (daily records represent
// exactly one day, their own period).
const applyAbsenceToRecord = (salaryRecord, dateKey, isAbsent) => {
  const effectiveRate = getEffectiveRate(
    salaryRecord,
    salaryRecord.commission_rate
  );

  if (salaryRecord.frequency === "daily") {
    // The whole record represents a single day.
    salaryRecord.isAbsent = isAbsent;
    salaryRecord.absentMarkedAt = isAbsent ? new Date() : null;

    const workingAmount = safeNumber(salaryRecord.workingAmount, 0);
    salaryRecord.rate = effectiveRate;
    salaryRecord.workRate =
      workingAmount > 0 ? workingAmount * (effectiveRate / 100) : 0;
    salaryRecord.daySalary = calculateDaySalary(
      salaryRecord.workRate,
      salaryRecord.salary_payment_count_per_day,
      isAbsent
    );
    salaryRecord.totalSalary = salaryRecord.daySalary;
    return;
  }

  if (!Array.isArray(salaryRecord.dailyRecords)) {
    salaryRecord.dailyRecords = [];
  }

  const normalizedDate = normalizeSalaryDate(dateKey);

  if (!normalizedDate) {
    throw new Error("A valid date is required to mark an absent day");
  }

  // Normalize stored dates before searching.
  salaryRecord.dailyRecords = salaryRecord.dailyRecords.map((record) => ({
    ...record,
    date: normalizeSalaryDate(record.date),
    isAbsent: Boolean(record.isAbsent),
    absentMarkedAt: record.absentMarkedAt || null,
  }));

  let dailyRecord = salaryRecord.dailyRecords.find(
    (record) => record.date === normalizedDate
  );

  // Create the day record when missing so absences can be recorded even for
  // days without completed appointments.
  if (!dailyRecord) {
    dailyRecord = {
      date: normalizedDate,
      workingAmount: 0,
      rate: effectiveRate,
      workRate: 0,
      daySalary: 0,
      totalSalary: 0,
      status: "Not Paid",
      isAbsent: false,
      absentMarkedAt: null,
    };
    salaryRecord.dailyRecords.push(dailyRecord);
  }

  dailyRecord.isAbsent = isAbsent;
  dailyRecord.absentMarkedAt = isAbsent ? new Date() : null;

  // Recalculate every day and the period totals (absent days contribute 0).
  recalcWeeklyMonthlyTotals(salaryRecord);
};

// Validates the request body shared by the absence endpoints.
const resolveAbsenceRequest = (body) => {
  const isAbsent = body.isAbsent === undefined ? true : Boolean(body.isAbsent);
  const date = normalizeSalaryDate(body.date);

  if (!date) {
    return { error: "A valid date (YYYY-MM-DD) is required" };
  }

  // Absence can only be recorded for today or past days - future days have
  // no salary yet.
  if (date > toLocalDateStr(new Date())) {
    return { error: "Cannot mark a future date as absent" };
  }

    return { isAbsent, date };
};

// Backfill the required period identity fields on legacy salary records that
// are missing them (frequency, period, year, month, weekNumber), so an absence
// can be saved without crashing. Mirrors the derivation used when creating
// records in createAndMarkPaid / markStaffDayAbsent; it only fills MISSING or
// INVALID values, so valid records are left untouched.
const periodIdentityValid = (sr) => {
  if (typeof sr.frequency !== "string" || !sr.frequency) return false;
  if (typeof sr.period !== "string" || sr.period.length === 0) return false;
  if (!Number.isFinite(Number(sr.year))) return false;
  if (!Number.isFinite(Number(sr.month))) return false;
  if (!Number.isFinite(Number(sr.weekNumber))) return false;
  return true;
};

const ensurePeriodIdentifier = (sr, anchorDateKey) => {
  if (periodIdentityValid(sr)) return;

  const frequency = sr.frequency || "monthly";
  const anchor = sr.dateRange?.start
    ? new Date(sr.dateRange.start)
    : new Date(anchorDateKey || Date.now());

  if (frequency === "daily") {
    if (!sr.period) sr.period = toLocalDateStr(new Date(anchorDateKey || Date.now()));
    if (!Number.isFinite(Number(sr.year))) sr.year = anchor.getFullYear();
    if (!Number.isFinite(Number(sr.month))) sr.month = anchor.getMonth() + 1;
    if (!Number.isFinite(Number(sr.weekNumber))) sr.weekNumber = 0;
    return;
  }

  if (frequency === "weekly") {
    const year = Number.isFinite(Number(sr.year)) ? Number(sr.year) : anchor.getFullYear();
    const weekNumber =
      Number.isFinite(Number(sr.weekNumber)) && sr.weekNumber > 0
        ? Number(sr.weekNumber)
        : getISOWeek(toLocalDateStr(anchor));
    const weekDates = getWeekDates(year, weekNumber);
    sr.year = year;
    sr.weekNumber = weekNumber;
    sr.month = new Date(weekDates[0]).getMonth() + 1;
    sr.period = `${year}-W${String(weekNumber).padStart(2, "0")}`;
    if (!sr.dateRange || !sr.dateRange.start || !sr.dateRange.end) {
      sr.dateRange = { start: weekDates[0], end: weekDates[6] };
    }
    return;
  }

  // monthly
  const month = anchor.getMonth() + 1;
  const year = anchor.getFullYear();
  const daysInMonth = getDaysInMonth(year, month);
  const monthStr = String(month).padStart(2, "0");
  sr.year = year;
  sr.month = month;
  sr.weekNumber = 0;
  sr.period = `${year}-${monthStr}`;
  if (!sr.dateRange || !sr.dateRange.start || !sr.dateRange.end) {
    sr.dateRange = { start: `${year}-${monthStr}-01`, end: `${year}-${monthStr}-${daysInMonth}` };
  }
};

// Mark/unmark an absent day on an existing salary record.
// PATCH /salary/:salaryId/day-absent   body: { date, isAbsent }
export const markDayAbsent = async (req, res) => {
  try {
    const { salaryId } = req.params;

    const absence = resolveAbsenceRequest(req.body);
    if (absence.error) {
      return res.status(400).json({ success: false, message: absence.error });
    }

    const salary = await Salary.findById(salaryId);
    if (!salary) {
      return res.status(404).json({ success: false, message: "Salary record not found" });
    }

    // Salon scoping: non super-admins may only update their own salon's records
    if (!salaryBelongsToUserSalon(salary, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this salary record",
      });
    }

                        // Paid records are historical - their values must not change.
    if ((salary.status || "") === "Paid") {
      return res.status(400).json({
        success: false,
        message: "This salary record has already been paid and cannot be changed",
      });
    }


    // Per-day paid check for weekly/monthly: an individual day that has
    // already been paid cannot be toggled to/from absent.
    if (salary.frequency === "weekly" || salary.frequency === "monthly") {
      const normalizedDate = normalizeSalaryDate(absence.date);
      const dayRecord = (salary.dailyRecords || []).find(
        (record) => normalizeSalaryDate(record.date) === normalizedDate
      );
      if (dayRecord && (dayRecord.status || "") === "Paid") {
        return res.status(400).json({
          success: false,
          message: "This day has already been paid and cannot be changed",
        });
      }
    }

    // Repair legacy records that are missing their required period identity
    // fields (period/year/month/weekNumber) so the absence update can persist.
    ensurePeriodIdentifier(salary, absence.date);

    applyAbsenceToRecord(salary, absence.date, absence.isAbsent);

    await salary.save();

    res.json({
      success: true,
      message: absence.isAbsent
        ? "Day marked as absent - salary for that date is now 0"
        : "Absence removed - salary recalculated",
      salary,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark/unmark an absent day for a staff member that does not have a salary
// record for the period yet (frontend "fallback" rows). The record is created
// (Not Paid) first, then the absence is applied.
// PATCH /salary/staff/:staffId/day-absent
// body: { frequency, period, date, isAbsent, salonId }
export const markStaffDayAbsent = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { frequency, period, salonId } = req.body;

    if (!frequency || !period) {
      return res.status(400).json({
        success: false,
        message: "frequency and period are required",
      });
    }

    const absence = resolveAbsenceRequest(req.body);
    if (absence.error) {
      return res.status(400).json({ success: false, message: absence.error });
    }

    const salon_id =
      req.user.role === "super-admin" ? salonId || null : req.user.salon_id;

    if (!salon_id) {
      return res.status(400).json({
        success: false,
        message: "salonId is required to mark this absence",
      });
    }

    const staff = await Staff.findOne({ _id: staffId, salon_id });
    if (!staff) {
      return res.status(403).json({
        success: false,
        message: "Staff not found in your salon",
      });
    }

    let salaryRecord = await Salary.findOne({
      salon_id,
      staff_id: staffId,
      period,
      frequency,
    });

    if (!salaryRecord) {
      // Derive the date range covered by the period key.
      let periodStart;
      let periodEnd;
      let year = 0;
      let month = 0;
      let weekNumber = 0;

      if (frequency === "daily") {
        periodStart = period;
        periodEnd = period;
        const d = new Date(period);
        year = d.getFullYear();
        month = d.getMonth() + 1;
      } else if (frequency === "weekly") {
        const parts = period.split("-W");
        year = parseInt(parts[0], 10);
        weekNumber = parseInt(parts[1], 10);
        const weekDates = getWeekDates(year, weekNumber);
        periodStart = weekDates[0];
        periodEnd = weekDates[6];
        month = new Date(periodStart).getMonth() + 1;
      } else {
        const parts = period.split("-");
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        const daysInMonth = getDaysInMonth(year, month);
        const monthStr = String(month).padStart(2, "0");
        periodStart = `${year}-${monthStr}-01`;
        periodEnd = `${year}-${monthStr}-${daysInMonth}`;
      }

      salaryRecord = new Salary({
        salon_id,
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
      });

      // Apply the salary-per-day rules for the elapsed days first, then the
      // absence below overrides the marked day.
      refreshSalaryRecord(salaryRecord);
    }

    applyAbsenceToRecord(salaryRecord, absence.date, absence.isAbsent);

    await salaryRecord.save();

    res.json({
      success: true,
      message: absence.isAbsent
        ? "Day marked as absent - salary for that date is now 0"
        : "Absence removed - salary recalculated",
      salary: salaryRecord,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get all staff with their salary info for a given frequency ────────────

export const getStaffWithSalaries = async (req, res) => {
  try {
    const { salonId, frequency, period, role: roleFilter } = req.query;

    const salonFilter = {};
    if (req.user.role !== "super-admin") {
      salonFilter.salon_id = req.user.salon_id;
    } else if (salonId) {
      salonFilter.salon_id = salonId;
    }

    // Role scoping: the super-admin salary page asks for salon managers only;
    // every other listing keeps excluding managers.
    const roleMode = resolveSalaryRole(roleFilter);

    const roleMatch =
      roleMode === "manager"
        ? { role: { $regex: /^manager$/i } }
        : roleMode === "management"
          ? { role: { $regex: /^manager$/i } }
          : { role: { $not: { $regex: /manager/i } } };

    // Active staff for this salon matching the selected frequency. The
    // salary_payment_frequency filter is applied for every role mode so that
    // each person only appears in the tab matching their configured frequency
    // (same behavior as the admin/salary page).
    const staffList = await Staff.find({
      ...salonFilter,
      status: "Active",
      ...roleMatch,
      ...(frequency ? { salary_payment_frequency: frequency } : {}),
    }).lean();

    if (!period) {
      return res.json({ success: true, staff: staffList, salaries: [] });
    }

    // Get salary records for this period
    const salaryFilter = {
      ...salonFilter,
      frequency,
      period,
    };

    let salaries = await Salary.find(salaryFilter)
      .populate("staff_id", "full_name email phone role salary_payment_frequency salary_payment_count_per_day commission_rate image")
      .lean();

    salaries = salaries.filter((s) =>
      salaryRoleIncludes(roleMode, s.staff_id?.role || s.staff_role)
    );

    res.json({ success: true, staff: staffList, salaries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Generate payroll for a period ─────────────────────────────────────────

export const generatePayroll = async (req, res) => {
  try {
    const { salonId, frequency, period, role: roleFilter } = req.body;

    const salonFilter = {};
    if (req.user.role !== "super-admin") {
      salonFilter.salon_id = req.user.salon_id;
    } else if (salonId) {
      salonFilter.salon_id = salonId;
    }

    // Role scoping: super-admin manager salary page asks for salon managers only;
    // every other payroll keeps excluding managers.
    const roleMode = resolveSalaryRole(roleFilter);

    const roleMatch =
      roleMode === "manager"
        ? { role: { $regex: /^manager$/i } }
        : roleMode === "management"
          ? { role: { $regex: /^manager$/i } }
          : { role: { $not: { $regex: /manager/i } } };

    // Active staff matching the selected frequency. The salary_payment_frequency
    // filter is applied for every role mode so each person is only paid in the
    // frequency configured on their profile (same as the admin/salary page).
    const staffList = await Staff.find({
      ...salonFilter,
      status: "Active",
      ...roleMatch,
      ...(frequency ? { salary_payment_frequency: frequency } : {}),
    }).lean();

    let periodStart, periodEnd;
    let year, month, weekNumber = 0;

    if (frequency === "daily") {
      periodStart = period;
      periodEnd = period;
      const d = new Date(period);
      year = d.getFullYear();
      month = d.getMonth() + 1;
    } else if (frequency === "weekly") {
      const parts = period.split("-W");
      year = parseInt(parts[0]);
      weekNumber = parseInt(parts[1]);
      const weekDates = getWeekDates(year, weekNumber);
      periodStart = weekDates[0];
      periodEnd = weekDates[6];
      month = new Date(periodStart).getMonth() + 1;
    } else {
      // monthly
      const parts = period.split("-");
      year = parseInt(parts[0]);
      month = parseInt(parts[1]);
      const daysInMonth = getDaysInMonth(year, month);
      const monthStr = String(month).padStart(2, "0");
      periodStart = `${year}-${monthStr}-01`;
      periodEnd = `${year}-${monthStr}-${daysInMonth}`;
    }

    // Get completed appointments in this period for this salon
    const appointmentFilter = {
      ...salonFilter,
      status: "completed",
      appointment_date: {
        $gte: periodStart,
        $lte: periodEnd,
      },
    };

    const completedAppointments = await Appointment.find(appointmentFilter)
      .populate("staff_id", "full_name role commission_rate salary_payment_frequency salary_payment_count_per_day")
      .lean();

    // Process each staff member
    for (const staff of staffList) {
      const commissionRate = staff.commission_rate || 0;
      const salaryPaymentCountPerDay = staff.salary_payment_count_per_day || 1;

      // Find completed appointments for this staff
      const staffAppointments = completedAppointments.filter(
        (a) => a.staff_id && a.staff_id._id.toString() === staff._id.toString()
      );

      // Get appointment services for this staff
      const staffAppointmentIds = staffAppointments.map((a) => a._id);
      const apptServices = await AppointmentService.find({
        appointment_id: { $in: staffAppointmentIds },
        staff_id: staff._id,
      }).lean();

      // Calculate working amount from main appointment total_price for single-staff appointments
      // and from AppointmentService for multi-staff appointments
      let totalWorkingAmount = 0;
      const dailyMap = {};

      for (const appt of staffAppointments) {
        // Check if this appointment has AppointmentService records for this staff
        const staffServices = apptServices.filter(
          (as) => as.appointment_id.toString() === appt._id.toString()
        );

        if (staffServices.length > 0) {
          for (const svc of staffServices) {
            const amount = svc.sub_price || 0;
            totalWorkingAmount += amount;
            const date = appt.appointment_date;
            dailyMap[date] = (dailyMap[date] || 0) + amount;
          }
        } else {
          // Single staff appointment - use total_price
          const amount = appt.total_price || 0;
          totalWorkingAmount += amount;
          const date = appt.appointment_date;
          dailyMap[date] = (dailyMap[date] || 0) + amount;
        }
      }

      // Find or create salary record
      let salaryRecord = await Salary.findOne({
        salon_id: salonFilter.salon_id || req.user.salon_id,
        staff_id: staff._id,
        period,
        frequency,
      });

      if (!salaryRecord) {
        salaryRecord = new Salary({
          salon_id: salonFilter.salon_id || req.user.salon_id,
          staff_id: staff._id,
          frequency,
          period,
          staff_name: staff.full_name || "",
          staff_role: staff.role || "",
          commission_rate: commissionRate,
          salary_payment_count_per_day: salaryPaymentCountPerDay,
          workingAmount: 0,
          rate: commissionRate,
          workRate: 0,
          daySalary: 0,
          totalSalary: 0,
          status: "Not Paid",
          year,
          month,
          weekNumber,
          dateRange: { start: periodStart, end: periodEnd },
          dailyRecords: [],
        });
      }

      // Update snapshot
      salaryRecord.staff_name = staff.full_name || "";
      salaryRecord.commission_rate = commissionRate;
      salaryRecord.salary_payment_count_per_day = salaryPaymentCountPerDay;
      salaryRecord.dateRange = { start: periodStart, end: periodEnd };

      // Use saved rate, fallback to commission rate
      const effectiveRate = salaryRecord.rate !== undefined && salaryRecord.rate !== null
        ? salaryRecord.rate
        : commissionRate;

      if (frequency === "daily") {
        salaryRecord.workingAmount = totalWorkingAmount;
        salaryRecord.workRate = totalWorkingAmount * (effectiveRate / 100);
        salaryRecord.daySalary = calculateDaySalary(
          salaryRecord.workRate,
          salaryPaymentCountPerDay,
          Boolean(salaryRecord.isAbsent)
        );
        salaryRecord.totalSalary = salaryRecord.daySalary;
      } else {
        // Weekly or Monthly: build daily records
        const dateEntries = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b));

        // Merge with existing daily records
        const existingDates = new Set();
        for (const dr of salaryRecord.dailyRecords) {
          existingDates.add(dr.date);
          const newAmount = dailyMap[dr.date] || 0;
          if (newAmount > 0) {
            dr.workingAmount = (dr.workingAmount || 0) + newAmount;
            const dailyWorkRate = dr.workingAmount * (effectiveRate / 100);
            dr.workRate = dailyWorkRate;
            dr.rate = effectiveRate;
            dr.daySalary = calculateDaySalary(
              dailyWorkRate,
              salaryPaymentCountPerDay,
              Boolean(dr.isAbsent)
            );
            dr.totalSalary = dr.daySalary;
          }
        }

        // Add new daily entries
        for (const [date, amount] of dateEntries) {
          if (!existingDates.has(date)) {
            const dailyWorkRate = amount * (effectiveRate / 100);
            salaryRecord.dailyRecords.push({
              date,
              workingAmount: amount,
              rate: effectiveRate,
              workRate: dailyWorkRate,
              daySalary: calculateDaySalary(dailyWorkRate, salaryPaymentCountPerDay),
              totalSalary: calculateDaySalary(dailyWorkRate, salaryPaymentCountPerDay),
              status: "Not Paid",
              isAbsent: false,
              absentMarkedAt: null,
            });
          }
        }

        // Recalculate totals using shared helper
        recalcWeeklyMonthlyTotals(salaryRecord);
      }

      // For weekly/monthly, ensure all days in the period are represented
      // (only up to today so future days never earn salary in advance)
      if (frequency !== "daily") {
        ensureAllDaysInPeriod(
          salaryRecord,
          effectiveRate,
          salaryPaymentCountPerDay,
          toLocalDateStr(new Date())
        );
        // Recalculate totals after filling missing days
        recalcWeeklyMonthlyTotals(salaryRecord);
      }

      await salaryRecord.save();
    }

    // Return updated salaries
    const updatedSalaries = await Salary.find({
      salon_id: salonFilter.salon_id || req.user.salon_id,
      frequency,
      period,
    })
      .populate("staff_id", "full_name email phone role salary_payment_frequency salary_payment_count_per_day commission_rate image")
      .sort({ staff_name: 1 })
      .lean();

    res.json({ success: true, salaries: updatedSalaries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get full salary details with daily breakdown for PDF ──────────────────

export const getSalaryDetails = async (req, res) => {
  try {
    const salaryId = req.params.salaryId || req.params.id;

    const salary = await Salary.findById(salaryId)
      .populate({
        path: "staff_id",
        select: "full_name email phone role salary_payment_frequency salary_payment_count_per_day commission_rate image specification services",
        populate: {
          path: "services",
          model: Service,
          select: "service_name base_price duration description",
        },
      })
      .populate("salon_id", "name location phone email about")
      .lean();

    if (!salary) {
      return res.status(404).json({ success: false, message: "Salary record not found" });
    }

    // Salon scoping: non super-admins may only view their own salon's slips
    if (!salaryBelongsToUserSalon(salary, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this salary record",
      });
    }

    const servicesData = Array.isArray(salary.staff_id?.services)
      ? salary.staff_id.services.map((service) => ({
          _id: service._id,
          service_name: service.service_name,
          base_price: service.base_price,
          duration: service.duration,
          description: service.description || "",
        }))
      : [];

    res.json({ success: true, salary, services: servicesData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Initialize salary records for all staff in a salon ────────────────────

export const initializeSalaries = async (req, res) => {
  try {
    const { salonId, frequency, period, role: roleFilter } = req.body;

    const salonFilter = {};
    if (req.user.role !== "super-admin") {
      salonFilter.salon_id = req.user.salon_id;
    } else if (salonId) {
      salonFilter.salon_id = salonId;
    }

    // Role scoping: super-admin manager salary page asks for salon managers only;
    // every other initialization keeps excluding managers.
    const roleMode = resolveSalaryRole(roleFilter);

    const roleMatch =
      roleMode === "manager"
        ? { role: { $regex: /^manager$/i } }
        : roleMode === "management"
          ? { role: { $regex: /^manager$/i } }
          : { role: { $not: { $regex: /manager/i } } };

    // Staff matching the selected frequency (all role modes get the
    // salary_payment_frequency filter so each person is handled in the
    // frequency configured on their profile, same as the admin/salary page).
    const staffList = await Staff.find({
      ...salonFilter,
      status: "Active",
      ...roleMatch,
      ...(frequency ? { salary_payment_frequency: frequency } : {}),
    }).lean();

    let periodStart, periodEnd;
    let year, month, weekNumber = 0;

    if (frequency === "daily") {
      periodStart = period;
      periodEnd = period;
      const d = new Date(period);
      year = d.getFullYear();
      month = d.getMonth() + 1;
    } else if (frequency === "weekly") {
      const parts = period.split("-W");
      year = parseInt(parts[0]);
      weekNumber = parseInt(parts[1]);
      const weekDates = getWeekDates(year, weekNumber);
      periodStart = weekDates[0];
      periodEnd = weekDates[6];
      month = new Date(periodStart).getMonth() + 1;
    } else {
      // monthly
      const parts = period.split("-");
      year = parseInt(parts[0]);
      month = parseInt(parts[1]);
      const daysInMonth = getDaysInMonth(year, month);
      const monthStr = String(month).padStart(2, "0");
      periodStart = `${year}-${monthStr}-01`;
      periodEnd = `${year}-${monthStr}-${daysInMonth}`;
    }

    const created = [];

    for (const staff of staffList) {
      const commissionRate = staff.commission_rate || 0;
      const salaryPaymentCountPerDay = staff.salary_payment_count_per_day || 1;

      // Check if already exists
      const existing = await Salary.findOne({
        salon_id: salonFilter.salon_id || req.user.salon_id,
        staff_id: staff._id,
        period,
        frequency,
      });

      if (!existing) {
        const newSalary = await Salary.create({
          salon_id: salonFilter.salon_id || req.user.salon_id,
          staff_id: staff._id,
          frequency,
          period,
          staff_name: staff.full_name || "",
          staff_role: staff.role || "",
          commission_rate: commissionRate,
          salary_payment_count_per_day: salaryPaymentCountPerDay,
          workingAmount: 0,
          rate: commissionRate,
          workRate: 0,
          daySalary: 0,
          totalSalary: 0,
          status: "Not Paid",
          year,
          month,
          weekNumber,
          dateRange: { start: periodStart, end: periodEnd },
          dailyRecords: [],
        });
        created.push(newSalary);
      }
    }

    res.json({
      success: true,
      message: `Initialized ${created.length} salary records`,
      count: created.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Update rate for a salary record and recalculate ─────────────────────

export const updateRate = async (req, res) => {
  try {
    const { salaryId } = req.params;
    const { rate } = req.body;

    if (rate === undefined || rate === null || isNaN(rate)) {
      return res.status(400).json({ success: false, message: "Rate is required and must be a number" });
    }

    const salary = await Salary.findById(salaryId);
    if (!salary) {
      return res.status(404).json({ success: false, message: "Salary record not found" });
    }

    // Salon scoping: non super-admins may only update rates in their own salon
    if (!salaryBelongsToUserSalon(salary, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this salary record's rate",
      });
    }

    const numericRate = Number(rate);
    if (numericRate < 0) {
      return res.status(400).json({ success: false, message: "Rate cannot be negative" });
    }
    salary.rate = numericRate;

    // Recalculate work rate and total salary
    if (salary.frequency === "daily") {
      salary.workRate = salary.workingAmount * (numericRate / 100);
      salary.daySalary = calculateDaySalary(
        salary.workRate,
        salary.salary_payment_count_per_day,
        Boolean(salary.isAbsent)
      );
      salary.totalSalary = salary.daySalary;
    } else {
      // Weekly or monthly - recalculate each daily record
      for (const dr of salary.dailyRecords) {
        dr.rate = numericRate;
        dr.workRate = dr.workingAmount * (numericRate / 100);
        dr.daySalary = calculateDaySalary(
          dr.workRate,
          salary.salary_payment_count_per_day,
          Boolean(dr.isAbsent)
        );
        dr.totalSalary = dr.daySalary;
      }
      // Recalculate totals using shared helper (which sums daily workRates)
      recalcWeeklyMonthlyTotals(salary);
    }

    await salary.save();

    res.json({ success: true, message: "Rate updated successfully", salary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// ─── Update rate by staff id (creates the period salary record if missing) ─

export const updateStaffRate = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { rate, frequency, period } = req.body;

    const numericRate = Number(rate);
    if (rate === undefined || rate === null || isNaN(numericRate)) {
      return res.status(400).json({ success: false, message: "Rate is required and must be a number" });
    }
    if (numericRate < 0) {
      return res.status(400).json({ success: false, message: "Rate cannot be negative" });
    }
    if (!frequency || !period) {
      return res.status(400).json({ success: false, message: "Frequency and period are required" });
    }

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    // Salon scoping: non super-admins may only update staff in their own salon
    if (req.user.role !== "super-admin" && String(staff.salon_id) !== String(req.user.salon_id)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this staff member's rate",
      });
    }

    // Persist the rate on the staff so future periods pick it up automatically.
    // Use findByIdAndUpdate (not staff.save()) because older staff documents may
    // be missing newly-required schema fields (e.g. first_name/last_name); a full
    // document save would fail validation even though only the rate changed.
    await Staff.findByIdAndUpdate(staff._id, { commission_rate: numericRate });
    staff.commission_rate = numericRate;

    const salaryPaymentCountPerDay = staff.salary_payment_count_per_day || 1;

    // Find or create the salary record for this staff / frequency / period
    let salary = await Salary.findOne({
      salon_id: staff.salon_id,
      staff_id: staff._id,
      frequency,
      period,
    });

    if (!salary) {
      let periodStart, periodEnd;
      let year, month, weekNumber = 0;

      if (frequency === "daily") {
        periodStart = period;
        periodEnd = period;
        const d = new Date(period);
        year = d.getFullYear();
        month = d.getMonth() + 1;
      } else if (frequency === "weekly") {
        const parts = period.split("-W");
        year = parseInt(parts[0]);
        weekNumber = parseInt(parts[1]);
        const weekDates = getWeekDates(year, weekNumber);
        periodStart = weekDates[0];
        periodEnd = weekDates[6];
        month = new Date(periodStart).getMonth() + 1;
      } else {
        // monthly
        const parts = period.split("-");
        year = parseInt(parts[0]);
        month = parseInt(parts[1]);
        const daysInMonth = getDaysInMonth(year, month);
        const monthStr = String(month).padStart(2, "0");
        periodStart = `${year}-${monthStr}-01`;
        periodEnd = `${year}-${monthStr}-${daysInMonth}`;
      }

      let createdSalary;
      try {
        createdSalary = await Salary.create({
          salon_id: staff.salon_id,
          staff_id: staff._id,
          frequency,
          period,
          staff_name: staff.full_name || "",
          staff_role: staff.role || "",
          commission_rate: numericRate,
          salary_payment_count_per_day: salaryPaymentCountPerDay,
          workingAmount: 0,
          rate: numericRate,
          workRate: 0,
          daySalary: 0,
          totalSalary: 0,
          status: "Not Paid",
          year,
          month,
          weekNumber,
          dateRange: { start: periodStart, end: periodEnd },
          dailyRecords: [],
        });
      } catch (createErr) {
        // Defensive: a deployment whose salaries collection still carries a
        // stale unique index (e.g. salon_id_1_staff_id_1_month_1 from an older
        // schema) will reject legitimate new records with E11000. Surface a
        // clear error instead of a misleading 500/404.
        if (createErr && createErr.code === 11000) {
          return res.status(409).json({
            success: false,
            message:
              "Could not create the salary record because a conflicting record already exists for this staff member (stale legacy index/data). Please repair the salaries collection indexes.",
          });
        }
        throw createErr;
      }
      const salary = createdSalary;

      return res.json({ success: true, message: "Rate saved successfully", salary });
    }

    // Existing record - apply the new rate and recalculate
    salary.rate = numericRate;
    salary.commission_rate = numericRate;

    if (salary.frequency === "daily") {
      salary.workRate = salary.workingAmount * (numericRate / 100);
      salary.daySalary = calculateDaySalary(
        salary.workRate,
        salary.salary_payment_count_per_day,
        Boolean(salary.isAbsent)
      );
      salary.totalSalary = salary.daySalary;
    } else {
      // Weekly or monthly - recalculate each daily record
      for (const dr of salary.dailyRecords) {
        dr.rate = numericRate;
        dr.workRate = dr.workingAmount * (numericRate / 100);
        dr.daySalary = calculateDaySalary(
          dr.workRate,
          salary.salary_payment_count_per_day,
          Boolean(dr.isAbsent)
        );
        dr.totalSalary = dr.daySalary;
      }
      // Recalculate totals using shared helper
      recalcWeeklyMonthlyTotals(salary);
    }

    await salary.save();

    res.json({ success: true, message: "Rate updated successfully", salary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
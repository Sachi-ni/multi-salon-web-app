import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";

import {
  getSalaries,
  markAsPaid,
  createSalaryAndMarkPaid,
  getSalaryDetails,
  updateRate,
  updateStaffRate,
  getStaffWithSalaries,
  markDayAbsent,
  markStaffDayAbsent,
} from "../../services/salaryService";
import { getSalons } from "../../services/salonService";


import {
  Loader2,
  Wallet,
  Download,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowLeft,
  Search,
  Lock,
} from "lucide-react";

import "../admin/admin.css";

// ─── Utility Helpers ──────────────────────────────────────────────────────

const formatMoney = (value) => {
  const num = Number(value || 0);
  try {
    return `LKR ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } catch {
    return `LKR ${num.toLocaleString()}`;
  }
};

const statusVariant = (status) => {
  const s = (status || "").toLowerCase();

  if (s.includes("paid") || s === "complete" || s === "processed") return "success";
  if (s.includes("pending") || s.includes("not")) return "warning";
  if (s.includes("overdue")) return "danger";
  return "info";
};

const toDateKey = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const getWeekNumber = (date) => {
  const d = new Date(date);
  const dayNum = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayNum);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return weekNo;
};

const getWeekRange = (dateStr) => {
  const d = new Date(dateStr);
  const day = d.getDay() || 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const toKey = (dt) => {
    const y = dt.getFullYear();
    const mo = String(dt.getMonth() + 1).padStart(2, "0");
    const da = String(dt.getDate()).padStart(2, "0");
    return `${y}-${mo}-${da}`;
  };
  return { start: toKey(monday), end: toKey(sunday), label: `${toKey(monday)} to ${toKey(sunday)}` };
};

const getMonthLabel = (dateStr) => {
  const d = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
};

const isPeriodEnded = (frequency, currentDateStr) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (frequency === "daily") {
    const d = new Date(currentDateStr);
    d.setHours(23, 59, 59, 999);
    return today >= d;
  }
  if (frequency === "weekly") {
    const range = getWeekRange(currentDateStr);
    const weekEnd = new Date(range.end);
    weekEnd.setHours(23, 59, 59, 999);
    return today >= weekEnd;
  }
  const range = getMonthRange(currentDateStr);
  const monthEnd = new Date(range.end);
  monthEnd.setHours(23, 59, 59, 999);
  return today >= monthEnd;
};

const getMonthRange = (dateStr) => {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth();
  const firstDay = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const lastDayNum = new Date(y, m + 1, 0).getDate();
  const lastDay = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDayNum).padStart(2, "0")}`;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return { start: firstDay, end: lastDay, label: `${months[m]} ${y}` };
};

const SALARY_REFRESH_KEY = "salary-refresh-token";

// Prefix used for row ids of staff that do not have a salary record yet
const FALLBACK_PREFIX = "fallback-";

// Number of days of a period that have already elapsed (period start up to
// today). Used for fallback rows so the fixed salary-per-day amount is
// included in the period totals for days without completed appointments.
const countElapsedPeriodDays = (frequency, dateStr) => {
  const selected = new Date(dateStr);
  if (Number.isNaN(selected.getTime())) return 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let start;
  let end;

  if (frequency === "weekly") {
    const day = selected.getDay() || 7; // ISO week: Monday = 1 ... Sunday = 7
    start = new Date(selected);
    start.setHours(0, 0, 0, 0);
    start.setDate(selected.getDate() - day + 1);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
  } else if (frequency === "monthly") {
    start = new Date(selected.getFullYear(), selected.getMonth(), 1);
    end = new Date(selected.getFullYear(), selected.getMonth() + 1, 0);
  } else {
    start = new Date(selected);
    start.setHours(0, 0, 0, 0);
    end = start;
  }

  const effectiveEnd = end < todayStart ? end : todayStart;
  if (effectiveEnd < start) return 0;
  return Math.round((effectiveEnd - start) / 86400000) + 1;
};

// Monday (YYYY-MM-DD) of an ISO week — mirrors the backend getWeekDates.
const getISOWeekMondayStr = (year, weekNo) => {
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay(); // 0 = Sunday ... 6 = Saturday
  const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(year, 0, 4 + offset + (weekNo - 1) * 7);
  return toDateKey(monday);
};

// A date (YYYY-MM-DD) inside a period key:
//   daily   "2026-09-04" -> "2026-09-04"
//   weekly  "2026-W36"   -> the week's Monday
//   monthly "2026-09"    -> "2026-09-01"
const getPeriodAnchorDateStr = (frequency, periodKey) => {
  const key = String(periodKey || "");
  if (frequency === "weekly") {
    const match = /^(\d{4})-W(\d{1,2})$/.exec(key);
    return match ? getISOWeekMondayStr(Number(match[1]), Number(match[2])) : "";
  }
  if (frequency === "monthly") {
    return /^\d{4}-\d{2}$/.test(key) ? `${key}-01` : "";
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : "";
};

// Last day (YYYY-MM-DD) of the period that contains anchorStr.
const getPeriodEndDateStr = (frequency, anchorStr) => {
  if (!anchorStr) return "";
  if (frequency === "weekly") return getWeekRange(anchorStr).end;
  const d = new Date(anchorStr);
  if (Number.isNaN(d.getTime())) return anchorStr;
  if (frequency === "monthly") {
    return toDateKey(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  }
  return toDateKey(d);
};

// A day/week/month is "over" once its last day has fully passed (strictly
// before today). Only over periods feed the Overdue box: the running period
// is still "pending", and once over, its unpaid salary carries forward.
const isPeriodOver = (frequency, periodKey) => {
  const anchorStr = getPeriodAnchorDateStr(frequency, periodKey);
  if (!anchorStr) return false;
  const endStr = getPeriodEndDateStr(frequency, anchorStr);
  if (!endStr) return false;
  return endStr < toDateKey(new Date());
};

// ─── Main Component ───────────────────────────────────────────────────────

const Salary = () => {
  const navigate = useNavigate();

  // Manager salary page for super admins: salon managers from every salon are
  // listed (one manager per salon, matching the admin/salary salary-per-day
  // calculation), with a salon filter.
  const [salonId, setSalonId] = useState("all");
  const [salons, setSalons] = useState([]);

  const [frequency, setFrequency] = useState("daily");

  const today = toDateKey(new Date());
  const [dailyDate, setDailyDate] = useState(today);
  const [weeklyDate, setWeeklyDate] = useState(today);
  const [monthlyDate, setMonthlyDate] = useState(today);

  const [salaries, setSalaries] = useState([]);
  // Salary records of ALL periods for the current tab — used to carry the
  // Overdue balance forward across days/weeks/months.
  const [allSalaries, setAllSalaries] = useState([]);
  // When no salary records exist, we show staff members with default zero values
  const [fallbackStaff, setFallbackStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [editingRates, setEditingRates] = useState({});
  const [dirtyRates, setDirtyRates] = useState({});

  const [pdfData, setPdfData] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const selectedMonthlyDateKey = frequency === "monthly" ? toDateKey(monthlyDate) : "";

  // ─── Load Salons (for the salon filter) ───────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    const loadSalons = async () => {
      try {
        const res = await getSalons();
        if (!cancelled) setSalons(res?.data?.salons || res?.data || []);
      } catch {
        if (!cancelled) setSalons([]);
      }
    };
    loadSalons();
    return () => {
      cancelled = true;
    };
  }, []);

  const salonNameById = new Map(
    salons.map((salon) => [String(salon._id), salon.name || "Unnamed Salon"])
  );

  // ─── Period Calculation ────────────────────────────────────────────────

  const getPeriod = useCallback(() => {
    if (frequency === "daily") return dailyDate;
    if (frequency === "weekly") {
      const d = new Date(weeklyDate);
      const weekNo = getWeekNumber(weeklyDate);
      return `${d.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
    }
    const d = new Date(monthlyDate);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, [frequency, dailyDate, weeklyDate, monthlyDate]);

  const getPeriodDisplayLabel = useCallback(() => {
    if (frequency === "daily") return dailyDate;
    if (frequency === "weekly") {
      const range = getWeekRange(weeklyDate);
      return `${range.start} to ${range.end}`;
    }
    return getMonthLabel(monthlyDate);
  }, [frequency, dailyDate, weeklyDate, monthlyDate]);

  // ─── Load Salaries ──────────────────────────────────────────────────────

  const loadSalaries = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const period = getPeriod();
      const salaryParams = {
        frequency,
        // Only salon managers are shown on this page. The salary calculation
        // (salary-per-day rules, period totals) is identical to the
        // admin/salary page.
        role: "manager",
        ...(salonId && salonId !== "all" ? { salonId } : {}),
      };
      const [salRes, staffRes] = await Promise.all([
        // All periods are fetched so the Overdue box can carry forward unpaid
        // salaries from earlier (over) days/weeks/months; the table still
        // shows only the selected period (filtered below).
        getSalaries(salaryParams),
        getStaffWithSalaries({ ...salaryParams, period }),
      ]);
      const allRecords = salRes?.data?.salaries || [];
      setAllSalaries(allRecords);

      // Records of the currently selected day/week/month (what the table shows).
      const data = period
        ? allRecords.filter((s) => s.period === period)
        : allRecords;
      setSalaries(data);

      // Get staff list for fallback when no salary records exist
      const staffData = staffRes?.data?.staff || [];
      setFallbackStaff(staffData);

      const rates = {};
      for (const sal of data) {
        rates[sal._id] = sal.rate ?? sal.commission_rate ?? 0;
      }
      // Seed editable rates for staff without salary records too
      for (const staff of staffData) {
        const key = `${FALLBACK_PREFIX}${staff._id}`;
        if (rates[key] === undefined) {
          rates[key] = staff.commission_rate ?? 0;
        }
      }
      setEditingRates(rates);
      setDirtyRates({});
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load salary data");
    } finally {
      setLoading(false);
    }
  }, [salonId, frequency, getPeriod, dailyDate, weeklyDate, monthlyDate]);

  useEffect(() => {
    loadSalaries();
  }, [loadSalaries]);

  useEffect(() => {
    const handleSalaryRefresh = () => {
      loadSalaries();
    };

    const handleStorageRefresh = (event) => {
      if (event.key === SALARY_REFRESH_KEY) {
        loadSalaries();
      }
    };

    window.addEventListener("salary-refresh", handleSalaryRefresh);
    window.addEventListener("storage", handleStorageRefresh);

    return () => {
      window.removeEventListener("salary-refresh", handleSalaryRefresh);
      window.removeEventListener("storage", handleStorageRefresh);
    };
  }, [loadSalaries]);

  // ─── Rate Editing ──────────────────────────────────────────────────────

  const handleRateChange = (salaryId, newRate) => {
    setEditingRates((prev) => ({ ...prev, [salaryId]: newRate }));
    setDirtyRates((prev) => ({ ...prev, [salaryId]: true }));
  };

  const handleSaveRate = async (rowId) => {
    if (!rowId) return;

    const rawRate = editingRates[rowId];
    const numericRate = Number(rawRate);
    if (
      rawRate === undefined ||
      rawRate === null ||
      rawRate === "" ||
      Number.isNaN(numericRate)
    ) {
      setError("Please enter a valid rate before saving");
      return;
    }

    try {
      setError("");
      setSuccessMsg("");
      setLoading(true);

      const key = String(rowId);
      let message = "Rate updated successfully";
      if (key.startsWith(FALLBACK_PREFIX)) {
        // Staff without a salary record yet - persist the rate on the staff
        // and create their salary record for the current period.
        const staffId = key.slice(FALLBACK_PREFIX.length);
        await updateStaffRate(staffId, {
          rate: numericRate,
          frequency,
          period: getPeriod(),
        });
        message = "Rate saved successfully";
      } else {
        await updateRate(rowId, numericRate);
      }

      setDirtyRates((prev) => ({ ...prev, [rowId]: false }));
      await loadSalaries();
      setSuccessMsg(message);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to update rate");
    } finally {
      setLoading(false);
    }
  };

  // ─── Pay ────────────────────────────────────────────────────────────────

  const handlePay = async (row) => {
    if (!row) return;
    const salaryId = row._id;
    const isFallbackRow = !row.period || String(salaryId).startsWith(FALLBACK_PREFIX);
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      if (isFallbackRow) {
        // No salary record exists yet for this period - create it and mark it
        // paid in one step so every staff row can be paid once the period has
        // elapsed (daily per day, weekly after the week, monthly after the month).
        const staffId = row.staff_id?._id || row.staff_id;
        if (!staffId) {
          setError("Staff information missing for this row");
          setLoading(false);
          return;
        }
        await createSalaryAndMarkPaid({
          staffId,
          frequency,
          period: getPeriod(),
          salonId: row.staff_id?.salon_id || (salonId && salonId !== "all" ? salonId : undefined),
        });
      } else {
        await markAsPaid(salaryId);
      }
      setSuccessMsg("Salary marked as paid successfully");
      await loadSalaries();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to mark as paid");
    } finally {
      setLoading(false);
    }
  };

  // ─── Absent (manual override: salary for that date becomes 0) ───────────

  const handleToggleAbsent = async (row) => {
    if (!row) return;
    const salaryId = String(row._id || "");
    const isFallbackRow = !row.period || salaryId.startsWith(FALLBACK_PREFIX);

    // The day the absence applies to: the currently selected day.
    const selectedDay =
      frequency === "daily"
        ? (row.period || dailyDate)
        : frequency === "weekly"
          ? weeklyDate
          : selectedMonthlyDateKey;

    const dayRecord =
      frequency === "monthly"
        ? (Array.isArray(row.dailyRecords)
            ? row.dailyRecords.find(
                (dr) => toDateKey(dr.date) === selectedMonthlyDateKey
              )
            : null)
        : frequency === "weekly"
          ? (Array.isArray(row.dailyRecords)
              ? row.dailyRecords.find((dr) => toDateKey(dr.date) === weeklyDate)
              : null)
          : null;

    const currentlyAbsent =
      frequency === "daily"
        ? Boolean(row.isAbsent)
        : Boolean(dayRecord?.isAbsent);

    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      if (isFallbackRow) {
        // Staff without a salary record yet - create the record for this
        // period and mark the day absent in one step.
        const staffId = row.staff_id?._id || row.staff_id;
        if (!staffId) {
          setError("Staff information missing for this row");
          setLoading(false);
          return;
        }
        await markStaffDayAbsent(staffId, {
          frequency,
          period: getPeriod(),
          date: selectedDay,
          isAbsent: !currentlyAbsent,
          salonId:
            row.staff_id?.salon_id ||
            (salonId && salonId !== "all" ? salonId : undefined),
        });
      } else {
        await markDayAbsent(salaryId, {
          date: selectedDay,
          isAbsent: !currentlyAbsent,
        });
      }
      setSuccessMsg(
        !currentlyAbsent
          ? "Day marked as absent - salary for that date is now 0"
          : "Absence removed - salary recalculated"
      );
      await loadSalaries();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to update absence");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (salaryId) => {
    if (!salaryId || String(salaryId).startsWith("fallback-")) return;
    setPdfLoading(true);
    setError("");
    try {
      const res = await getSalaryDetails(salaryId);
      const salary = res?.data?.salary;
      if (!salary) {
        setError("Salary details not found");
        setPdfLoading(false);
        return;
      }
      setPdfData(salary);
      setShowPdfModal(true);
      setPdfLoading(false);
      setTimeout(() => generatePdf(salary), 300);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load salary details");
      setPdfLoading(false);
    }
  };

  const generatePdf = (salary) => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 12;
      const contentWidth = pageWidth - margin * 2;
      const rowHeight = 7;
      let yPos = margin;

      const salon = salary.salon_id || {};
      const staff = salary.staff_id || {};
      const services = Array.isArray(staff.services) ? staff.services : [];
      const frequency = salary.frequency || "daily";
      const frequencyLabel = frequency.charAt(0).toUpperCase() + frequency.slice(1);
      const isWeekly = frequency === "weekly";
      const isMonthly = frequency === "monthly";
      const rows = Array.isArray(salary.dailyRecords) && salary.dailyRecords.length > 0
        ? salary.dailyRecords
        : [{
            date: salary.period || salary.dateRange?.start,
            workingAmount: salary.workingAmount || 0,
            rate: salary.rate ?? salary.commission_rate ?? 0,
            workRate: salary.workRate || 0,
            daySalary: salary.daySalary || 0,
          }];

      const totalWorkingAmount = rows.reduce((sum, row) => sum + Number(row.workingAmount || 0), 0);
      const totalWorkRate = rows.reduce((sum, row) => sum + Number(row.workRate || 0), 0);
      const totalSalary = salary.status === "Paid"
        ? (salary.paidTotal || salary.totalSalary || 0)
        : (salary.totalSalary || totalWorkRate || 0);

      const formatDate = (value) => {
        if (!value) return "N/A";
        // Print plain YYYY-MM-DD strings as-is to avoid timezone drift.
        if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return value;
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        // Format using LOCAL calendar parts - toISOString() converts to UTC
        // and shifts dates to the previous day for times before local 05:30.
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      };

      const formatMoney = (value) => {
        const num = Number(value || 0);
        return `LKR ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      };

      const drawBanner = () => {
        doc.setFillColor(255, 215, 0);
        doc.rect(0, 0, pageWidth, 42, "F");
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("SALARY PAYMENT SLIP", pageWidth / 2, 14, { align: "center" });
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`${frequencyLabel} Salary Report`, pageWidth / 2, 28, { align: "center" });
      };

      const drawSection = (title) => {
        yPos += 2;
        doc.setFillColor(70, 130, 180);
        doc.rect(margin, yPos - 4, contentWidth, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(title, margin + 3, yPos + 1);
        yPos += 10;
      };

      const ensureSpace = (needed) => {
        if (yPos + needed < pageHeight - 25) return;
        doc.addPage();
        yPos = margin;
      };

      const labelWidth = 50;
      const drawInfoRow = (label, value) => {
        ensureSpace(6);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(60, 60, 60);
        doc.text(label, margin + 3, yPos);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        const valueText = String(value ?? "N/A");
        const wrappedValue = doc.splitTextToSize(valueText, contentWidth - labelWidth - 5);
        doc.text(wrappedValue, margin + labelWidth + 2, yPos);
        yPos += Math.max(5.5, wrappedValue.length * 3.5);
      };

      const periodLabel = isWeekly
        ? `${formatDate(salary.dateRange?.start || salary.period)} to ${formatDate(salary.dateRange?.end || salary.period)}`
        : isMonthly
          ? (salary.period || formatDate(salary.dateRange?.start))
          : formatDate(salary.period);

      drawBanner();
      yPos = 48;

      // Header Info Section
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      
      // Left column
      doc.text("Payment Type", margin + 2, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(`: ${frequencyLabel}`, margin + 35, yPos);
      
      // Right column
      doc.setFont("helvetica", "bold");
      doc.text("Salon Name", pageWidth - margin - 50, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(`: ${salon.name || "N/A"}`, pageWidth - margin - 15, yPos);
      
      yPos += 6;
      doc.setFont("helvetica", "bold");
      doc.text("Salary Period", margin + 2, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(`: ${periodLabel}`, margin + 35, yPos);
      
      doc.setFont("helvetica", "bold");
      doc.text("Location", pageWidth - margin - 50, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(`: ${salon.location || "N/A"}`, pageWidth - margin - 15, yPos);
      
      yPos += 8;

      // Staff Information Section
      drawSection("STAFF INFORMATION");
      drawInfoRow("Full Name", staff.name || staff.full_name || salary.staff_name || "N/A");
      drawInfoRow("Email", staff.email || "N/A");
      yPos += 1;

      // Services Section
      drawSection("SERVICES ASSIGNED");
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setFillColor(70, 130, 180);
      doc.rect(margin, yPos - 4, contentWidth, rowHeight, "F");
      doc.setTextColor(255, 255, 255);
      doc.text("Service Name", margin + 2, yPos + 1);
      doc.text("Amount", pageWidth - margin - 22, yPos + 1, { align: "left" });
      yPos += rowHeight + 1;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const serviceRows = services.length > 0
        ? services
        : [{ service_name: "No services assigned", base_price: 0 }];

      serviceRows.forEach((service, index) => {
        ensureSpace(rowHeight + 2);
        doc.setFillColor(...(index % 2 === 0 ? [250, 250, 250] : [240, 248, 255]));
        doc.rect(margin, yPos - 3.5, contentWidth, rowHeight, "F");
        doc.setLineWidth(0.1);
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, yPos + 2.5, pageWidth - margin, yPos + 2.5);
        
        const serviceName = service?.service_name || service?.name || "Service";
        const serviceAmount = Number(service?.base_price ?? service?.price ?? 0);
        const wrappedName = doc.splitTextToSize(serviceName, contentWidth - 50);
        doc.setFontSize(8);
        doc.text(wrappedName, margin + 2, yPos + 1);
        doc.text(formatMoney(serviceAmount), pageWidth - margin - 2, yPos + 1, { align: "right" });
        yPos += Math.max(rowHeight, wrappedName.length * 3.5) + 0.5;
      });

      yPos += 3;

      // Daily Records Section
      drawSection("DAILY RECORDS");
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setFillColor(70, 130, 180);
      doc.rect(margin, yPos - 4, contentWidth, rowHeight, "F");
      doc.setTextColor(255, 255, 255);

      if (isWeekly) {
        doc.text("Day", margin + 2, yPos + 1);
        doc.text("Amount", margin + 25, yPos + 1);
        doc.text("Rate %", margin + 65, yPos + 1);
        doc.text("Salary", pageWidth - margin - 22, yPos + 1, { align: "left" });
      } else {
        doc.text("Date", margin + 2, yPos + 1);
        doc.text("Amount", margin + 25, yPos + 1);
        doc.text("Rate %", margin + 65, yPos + 1);
        doc.text("Work Rate", margin + 95, yPos + 1);
        doc.text("Day Salary", pageWidth - margin - 22, yPos + 1, { align: "left" });
      }
      yPos += rowHeight + 1;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      rows.forEach((record, index) => {
        ensureSpace(rowHeight + 2);
        doc.setFillColor(...(index % 2 === 0 ? [250, 250, 250] : [240, 248, 255]));
        doc.rect(margin, yPos - 3.5, contentWidth, rowHeight, "F");
        doc.setLineWidth(0.1);
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, yPos + 2.5, pageWidth - margin, yPos + 2.5);
        
        if (isWeekly) {
          const dateValue = record.date || salary.dateRange?.start;
          const dayName = new Date(dateValue).toLocaleDateString("en-US", { weekday: "short" });
          doc.text(dayName, margin + 2, yPos + 1);
          doc.text(formatMoney(record.workingAmount), margin + 25, yPos + 1);
          doc.text(`${Number(record.rate || salary.rate || 0)}%`, margin + 65, yPos + 1);
          doc.text(formatMoney(record.daySalary), pageWidth - margin - 2, yPos + 1, { align: "right" });
        } else {
          doc.text(formatDate(record.date), margin + 2, yPos + 1);
          doc.text(formatMoney(record.workingAmount), margin + 25, yPos + 1);
          doc.text(`${Number(record.rate || salary.rate || 0)}%`, margin + 65, yPos + 1);
          doc.text(formatMoney(record.workRate), margin + 95, yPos + 1);
          doc.text(formatMoney(record.daySalary), pageWidth - margin - 2, yPos + 1, { align: "right" });
        }
        yPos += rowHeight + 0.5;
      });

      yPos += 3;

      // Divider
      doc.setDrawColor(255, 215, 0);
      doc.setLineWidth(1);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;

      // Summary Section with creative styling
      drawSection("PAYMENT SUMMARY");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      
      // Summary with background boxes
      const summaryItems = [
        { label: "Total Working Amount", value: formatMoney(totalWorkingAmount), color: [230, 240, 250] },
        { label: "Total Work Rate", value: formatMoney(totalWorkRate), color: [240, 250, 240] },
        { label: "TOTAL SALARY", value: formatMoney(totalSalary), color: [255, 250, 240] },
        { label: "Payment Status", value: salary.status || "Not Paid", color: [255, 240, 245] },
      ];

      summaryItems.forEach((item, idx) => {
        ensureSpace(7);
        doc.setFillColor(...item.color);
        doc.rect(margin, yPos - 3.5, contentWidth, 7, "F");
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.3);
        doc.rect(margin, yPos - 3.5, contentWidth, 7);
        
        doc.setTextColor(30, 30, 30);
        doc.text(item.label, margin + 3, yPos + 1);
        doc.setTextColor(...(idx === 2 ? [180, 40, 40] : [60, 60, 60]));
        doc.setFont("helvetica", "bold");
        doc.text(item.value, pageWidth - margin - 2, yPos + 1, { align: "right" });
        yPos += 8;
      });

      if (salary.paidAt) {
        ensureSpace(6);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        doc.text(`Paid Date: ${formatDate(salary.paidAt)}`, margin + 3, yPos);
        yPos += 6;
      }

      // Footer
      yPos = pageHeight - 18;
      doc.setDrawColor(255, 215, 0);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 4;
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.text("✓ This is a computer-generated salary slip. No signature required.", pageWidth / 2, yPos, { align: "center" });
      yPos += 3;
      doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: "center" });

      const fileName = `salary_slip_${staff.name || staff.full_name || salary.staff_name || "staff"}_${salary.period}_${salary.frequency}.pdf`;
      doc.save(fileName);
      setShowPdfModal(false);
      setPdfData(null);
      setSuccessMsg("PDF downloaded successfully");
    } catch (e) {
      console.error("PDF generation error:", e);
      setError("Failed to generate PDF: " + e.message);
    }
  };

  // ─── Build display rows (salaries + staff without records) ──────────────

  let displayRows = [...salaries];

  // Always show every staff member of the salon under this frequency tab.
  // Staff that do not have a salary record for the selected period yet are
  // appended as zero-value rows, so newly added staff appear alongside the
  // existing rows (earlier staff rows are never removed).
  if (fallbackStaff.length > 0) {
    const recordedStaffIds = new Set(
      displayRows.map((row) => String(row.staff_id?._id || row.staff_id || ""))
    );

    const pendingRows = fallbackStaff
      .filter((staff) => !recordedStaffIds.has(String(staff._id)))
      .map((staff) => {
        // Days without completed appointments still earn the fixed
        // salary-per-day amount, so fallback rows show it too.
        const perDayAmount = Number(staff.salary_payment_count_per_day || 0);
        const fallbackTotalSalary =
          frequency === "daily"
            ? (dailyDate <= today ? perDayAmount : 0)
            : perDayAmount *
              countElapsedPeriodDays(
                frequency,
                frequency === "weekly" ? weeklyDate : monthlyDate
              );

        return {
          _id: `${FALLBACK_PREFIX}${staff._id}`,
          staff_id: staff,
          staff_name: staff.full_name || "",
          workingAmount: 0,
          rate: staff.commission_rate ?? 0,
          commission_rate: staff.commission_rate ?? 0,
          workRate: 0,
          daySalary: fallbackTotalSalary,
          totalSalary: fallbackTotalSalary,
          status: "Not Paid",
        };
      });

    displayRows = [...displayRows, ...pendingRows];
  }

  // ─── Summary cards (computed from the same rows the table renders) ───────

  const summary = useMemo(() => {
    // Per-row "Total Salary" exactly as the table renders it (monthly is
    // scoped to the selected day of the month).
    const rowTotalSalary = (row) => {
      if (frequency === "monthly" && Array.isArray(row.dailyRecords)) {
        return row.dailyRecords.reduce((sum, dr) => {
          return toDateKey(dr.date) <= selectedMonthlyDateKey
            ? sum + (Number(dr.daySalary) || 0)
            : sum;
        }, 0);
      }
      return Number(row.totalSalary) || 0;
    };

    const totalPending = displayRows.reduce(
      (sum, s) => ((s.status || "Not Paid") !== "Paid" ? sum + rowTotalSalary(s) : sum),
      0
    );
    const pendingCount = displayRows.filter(
      (s) => (s.status || "Not Paid") !== "Paid"
    ).length;
    const totalPaid = displayRows.reduce(
      (sum, s) =>
        (s.status || "Not Paid") === "Paid"
          ? sum + (Number(s.paidTotal ?? s.totalSalary) || 0)
          : sum,
      0
    );
    const paidCount = displayRows.filter(
      (s) => (s.status || "Not Paid") === "Paid"
    ).length;
    const totalWorkingAmount = displayRows.reduce(
      (sum, s) => sum + (Number(s.workingAmount) || 0),
      0
    );

    // ── Overdue: carry-forward of every OVER period's unpaid salary ────────
    // Records are grouped by period. For each day/week/month that is already
    // over, every unpaid record counts; staff of this tab WITHOUT a record in
    // that period still earn the fixed per-day amount for its days (the same
    // rule fallback rows use). The balance never resets when a new day/week/
    // month opens, and paying a salary removes exactly that amount.
    let pendingOverdue = 0;
    const byPeriod = new Map();
    for (const rec of allSalaries) {
      const periodKey = rec.period;
      if (!periodKey) continue;
      if (!byPeriod.has(periodKey)) byPeriod.set(periodKey, new Map());
      byPeriod
        .get(periodKey)
        .set(String(rec.staff_id?._id || rec.staff_id || ""), rec);
    }
    for (const [periodKey, staffMap] of byPeriod.entries()) {
      if (!isPeriodOver(frequency, periodKey)) continue; // still running → not overdue yet
      const anchorStr = getPeriodAnchorDateStr(frequency, periodKey);
      const periodEndStr = getPeriodEndDateStr(frequency, anchorStr);
      for (const rec of staffMap.values()) {
        if ((rec.status || "Not Paid") !== "Paid") {
          pendingOverdue += Number(rec.totalSalary) || 0;
        }
      }
      for (const staff of fallbackStaff) {
        if (staffMap.has(String(staff._id || ""))) continue;
        // Staff created after this period ended were not employed then.
        const createdAt = staff.createdAt ? new Date(staff.createdAt) : null;
        if (
          createdAt &&
          !Number.isNaN(createdAt.getTime()) &&
          toDateKey(createdAt) > periodEndStr
        ) {
          continue;
        }
        const perDay = Number(staff.salary_payment_count_per_day) || 0;
        pendingOverdue += perDay * countElapsedPeriodDays(frequency, anchorStr);
      }
    }

    return {
      totalPending,
      totalPaid,
      pendingCount,
      paidCount,
      totalWorkingAmount,
      pendingOverdue,
    };
  }, [displayRows, allSalaries, fallbackStaff, frequency, selectedMonthlyDateKey]);

  // ─── Filter by search ──────────────────────────────────────────────────

  const filteredDisplayRows = searchQuery
    ? displayRows.filter((row) => {
        const name = (row.staff_id?.name || row.staff_id?.full_name || row.staff_name || "").toLowerCase();
        return name.includes(searchQuery.toLowerCase());
      })
    : displayRows;

  // ─── Tabs ──────────────────────────────────────────────────────────────

  const tabs = [
    { id: "daily", label: "Daily" },
    { id: "weekly", label: "Weekly" },
    { id: "monthly", label: "Monthly" },
  ];

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[60vh]">
      {/* Page Header with back arrow → Dashboard */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/superAdminDashboard")}
            className="w-8 h-8 rounded-lg bg-[#1d1d1d] border border-gray-700 flex items-center justify-center text-gray-400 hover:text-yellow-400 hover:border-yellow-400/50 transition-all duration-150"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-white">Salon Manager Salary</h1>
            <p className="text-xs text-gray-400 mt-1">
              {frequency.charAt(0).toUpperCase() + frequency.slice(1)} — {getPeriodDisplayLabel()} · Salon managers only
            </p>
          </div>
        </div>

        {/* Salon filter + Calendar picker on the right */}
        <div className="flex gap-2 items-center">
          <select
            value={salonId}
            onChange={(e) => setSalonId(e.target.value)}
            className="bg-[#1d1d1d] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none transition-all duration-200 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20 max-w-[220px]"
            title="Filter by salon"
          >
            <option value="all">All Salons</option>
            {salons.map((salon) => (
              <option key={salon._id} value={salon._id}>
                {salon.name || "Unnamed Salon"}
              </option>
            ))}
          </select>
          {frequency === "daily" && (
            <input
              type="date"
              value={dailyDate}
              onChange={(e) => setDailyDate(e.target.value)}
              className="bg-[#1d1d1d] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none transition-all duration-200 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20"
            />
          )}
          {frequency === "weekly" && (
            <input
              type="date"
              value={weeklyDate}
              onChange={(e) => setWeeklyDate(e.target.value)}
              className="bg-[#1d1d1d] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none transition-all duration-200 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20"
            />
          )}
          {frequency === "monthly" && (
            <input
              type="date"
              value={monthlyDate}
              onChange={(e) => setMonthlyDate(e.target.value)}
              className="bg-[#1d1d1d] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none transition-all duration-200 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20"
            />
          )}
        </div>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* ─── Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#161616] border border-yellow-500/20 rounded-xl p-4">
          <div className="text-[0.65rem] text-gray-500 uppercase tracking-wider font-semibold">Pending Pay</div>
          <div className="mt-1 text-xl font-black text-white">{formatMoney(summary.totalPending)}</div>
          <div className="text-[0.65rem] text-gray-500">{summary.pendingCount} managers/admins</div>
        </div>
        <div className="bg-[#161616] border border-yellow-500/20 rounded-xl p-4">
          <div className="text-[0.65rem] text-gray-500 uppercase tracking-wider font-semibold">Total Paid</div>
          <div className="mt-1 text-xl font-black text-white">{formatMoney(summary.totalPaid)}</div>
          <div className="text-[0.65rem] text-gray-500">{summary.paidCount} managers/admins</div>
        </div>
        <div className="bg-[#161616] border border-yellow-500/20 rounded-xl p-4">
          <div className="text-[0.65rem] text-gray-500 uppercase tracking-wider font-semibold">Working Amount</div>
          <div className="mt-1 text-xl font-black text-white">{formatMoney(summary.totalWorkingAmount)}</div>
          <div className="text-[0.65rem] text-gray-500">From appointments</div>
        </div>
        <div className="bg-[#161616] border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[0.65rem] text-gray-500 uppercase tracking-wider font-semibold">Overdue</div>
              <div className="mt-1 text-xl font-black text-red-400">{formatMoney(summary.pendingOverdue)}</div>
              <div className="text-[0.65rem] text-red-400/70">Unpaid from over periods</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tabs + Search (full width) ───────────────────────────────── */}
      <div className="mb-4 w-full">
        <div className="w-full flex flex-wrap items-center gap-3 mb-3">
          <div className="flex gap-1 bg-[#161616] border border-gray-800 rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFrequency(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  frequency === tab.id
                    ? "bg-yellow-400 text-black shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Period indicator badge */}
          <span className="text-xs text-yellow-400 font-semibold bg-[#1d1d1d] rounded-lg px-3 py-2 border border-yellow-500/20">
            {getPeriodDisplayLabel()}
          </span>
        </div>
      </div>
      {/* Search - takes remaining width */}
      <div className="relative flex-1 min-w-[200px] mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by staff name..."
          className="w-full bg-[#1d1d1d] border border-gray-700 rounded-lg pl-9 pr-3.5 py-2 text-sm text-white outline-none transition-all duration-200 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20 placeholder-gray-500"
        />
      </div>

      {/* ─── Salary Table ──────────────────────────────────────────────── */}
      <div className="bg-[#161616] border border-yellow-500/20 rounded-xl p-5">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
          </div>
        ) : filteredDisplayRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#1d1d1d] border border-border flex items-center justify-center mb-5">
              <Wallet className="w-7 h-7 text-gray-500" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">No salary records found</h3>
            <p className="text-xs text-gray-500 max-w-xs">
              No {frequency} salary data available for this period for the salon managers &amp; admins. Salary is
              generated from completed appointments; days without appointments still earn the salary-per-day amount.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Manager / Admin</th>
                  <th>Salon</th>
                  <th>{frequency === "daily" ? "Working Amount" : "Work Amount"}</th>
                  <th>Rate %</th>
                  <th>Work Rate</th>
                  {frequency !== "daily" && <th>Day Salary</th>}
                  <th>Total Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDisplayRows.map((row) => {
                  const staff = row.staff_id || {};
                  const staffName = staff.name || staff.full_name || row.staff_name || "Unknown";
                  const isFallback =
                    !row.period || String(row._id).startsWith(FALLBACK_PREFIX);
                  const monthlyDayRecord =
                    frequency === "monthly" && Array.isArray(row.dailyRecords)
                      ? row.dailyRecords.find((dr) => toDateKey(dr.date) === selectedMonthlyDateKey)
                      : null;
                  const selectedWeeklyRecord =
                    frequency === "weekly" && Array.isArray(row.dailyRecords)
                      ? row.dailyRecords.find((dr) => toDateKey(dr.date) === weeklyDate)
                      : null;
                  const selectedDailyRecord = monthlyDayRecord || null;
                  const workingAmt = frequency === "monthly"
                    ? (selectedDailyRecord?.workingAmount || 0)
                    : frequency === "weekly"
                      ? (selectedWeeklyRecord?.workingAmount || 0)
                      : (row.workingAmount || 0);
                  const currentRate = editingRates[row._id] !== undefined
                    ? editingRates[row._id]
                    : (selectedWeeklyRecord?.rate ?? row.rate ?? row.commission_rate ?? 0);
                  const isDirty = dirtyRates[row._id] || false;
                  const workRate = frequency === "monthly"
                    ? (selectedDailyRecord?.workRate || 0)
                    : frequency === "weekly"
                      ? (selectedWeeklyRecord?.workRate || 0)
                      : (row.workRate || 0);
                  const fallbackPerDay = isFallback
                    ? Number(staff.salary_payment_count_per_day || 0)
                    : 0;
                  const selectedDateKey = frequency === "monthly"
                    ? selectedMonthlyDateKey
                    : frequency === "weekly"
                      ? weeklyDate
                      : dailyDate;
                  // Manager-marked absence for the selected day (manual
                  // override: the absent day's salary becomes 0).
                  const selectedPeriodDayRecord =
                    frequency === "monthly"
                      ? monthlyDayRecord
                      : frequency === "weekly"
                        ? selectedWeeklyRecord
                        : null;
                  const isDayAbsent = frequency === "daily"
                    ? Boolean(row.isAbsent)
                    : Boolean(selectedPeriodDayRecord?.isAbsent);
                  // Days without completed appointments still earn the fixed
                  // salary-per-day amount (rows without a record included).
                  // Absent days always display 0.
                  const daySalary = frequency === "monthly"
                    ? (isDayAbsent
                        ? 0
                        : (selectedDailyRecord?.daySalary ||
                           (isFallback && selectedDateKey <= today ? fallbackPerDay : 0)))
                    : frequency === "weekly"
                      ? (isDayAbsent
                          ? 0
                          : (selectedWeeklyRecord?.daySalary ||
                             (isFallback && selectedDateKey <= today ? fallbackPerDay : 0)))
                      : (row.daySalary || 0);
                  const totalSal = frequency === "monthly"
                    ? (Array.isArray(row.dailyRecords)
                        ? row.dailyRecords.reduce((sum, dr) => {
                            return toDateKey(dr.date) <= selectedMonthlyDateKey
                              ? sum + (dr.daySalary || 0)
                              : sum;
                          }, 0)
                        : (row.totalSalary || 0))
                    : (row.totalSalary || 0);
                  const status = frequency === "monthly"
                    ? (selectedDailyRecord?.status || row.status || "Not Paid")
                    : (row.status || "Not Paid");
                  const isPaid = status === "Paid";
                  const periodEnded = isPeriodEnded(
                    frequency,
                    frequency === "daily" ? dailyDate : frequency === "weekly" ? weeklyDate : monthlyDate
                  );
                  const canPay = !isPaid && totalSal > 0 && periodEnded;
                  const canDownloadPdf = !isFallback && isPaid;
                  // Absent toggle: only for days that already passed and are
                  // not paid yet.
                  const selectedDayPassed = selectedDateKey <= today;
                  const selectedDayPaid =
                    frequency === "daily"
                      ? isPaid
                      : (selectedPeriodDayRecord?.status === "Paid" || isPaid);
                  const canToggleAbsent = !selectedDayPaid && selectedDayPassed;
                  const absentDisabledReason = selectedDayPaid
                    ? (frequency === "daily" ? "Salary already paid" : "This day has already been paid")
                    : !selectedDayPassed
                      ? "The selected day has not finished yet"
                      : "";

                  return (
                    <tr key={row._id}>
                      <td className="font-bold text-white">{staffName}</td>
                      <td className="text-gray-400 text-xs">
                        {row.salon_id?.name ||
                         salonNameById.get(String(row.salon_id || staff.salon_id || "")) ||
                         "—"}
                      </td>
                      <td className="text-right">{formatMoney(workingAmt)}</td>
                      <td className="text-center">
                        <div className="flex items-center gap-1 justify-center">
                          <input
                            type="number"
                            value={currentRate}
                            onChange={(e) => handleRateChange(row._id, e.target.value)}
                            className="w-16 bg-[#1d1d1d] border border-gray-700 rounded px-2 py-1 text-xs text-white text-center outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20"
                            min="0" max="100" step="0.1"
                          />
                          <span className="text-xs text-gray-400">%</span>
                          {isDirty && (
                            <button
                              onClick={() => handleSaveRate(row._id)}
                              className="p-1 rounded hover:bg-yellow-400/20 text-yellow-400 transition-colors"
                              title="Save rate"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="text-right">{formatMoney(workRate)}</td>
                      {frequency !== "daily" && (
                        <td className="text-right">
                          {formatMoney(daySalary)}
                          {isDayAbsent && (
                            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-500/20 text-red-400 border border-red-500/30 uppercase">
                              Absent
                            </span>
                          )}
                        </td>
                      )}
                      <td className="text-right font-bold">{formatMoney(totalSal)}</td>
                      <td>
                        <Badge variant={statusVariant(status)}>
                          {isPaid ? "Paid" : "Not Paid"}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {!isPaid ? (
                            <>
                              <button
                                onClick={() => handleToggleAbsent(row)}
                                disabled={!canToggleAbsent}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed ${
                                  isDayAbsent
                                    ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30"
                                    : "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                                }`}
                                title={
                                  absentDisabledReason ||
                                  (isDayAbsent
                                    ? "Remove absence - salary for this date is recalculated"
                                    : "Mark absent - salary for this date becomes 0")
                                }
                              >
                                {isDayAbsent ? "Present" : "Absent"}
                              </button>
                              <button
                                onClick={() => handlePay(row)}
                                disabled={!canPay}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-all uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
                                title={periodEnded ? "Mark as Paid" : "Period has not ended yet - daily can be paid each day, weekly after the week, monthly after the month"}
                              >
                                Paid
                              </button>
                              <button
                                disabled
                                className="p-2 rounded-lg bg-[#1d1d1d] border border-gray-700 text-gray-600 cursor-not-allowed"
                                title="Complete payment first"
                              >
                                <Lock className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <Badge variant="success">Paid</Badge>
                              <button
                                onClick={() => handleDownloadPdf(row._id)}
                                disabled={!canDownloadPdf || pdfLoading}
                                className={`p-2 rounded-lg border transition-all duration-150 ${
                                  canDownloadPdf
                                    ? "bg-[#1d1d1d] border-yellow-500/50 text-yellow-400 hover:bg-yellow-400/10 hover:border-yellow-400"
                                    : "bg-[#1d1d1d] border-gray-700 text-gray-600 cursor-not-allowed"
                                }`}
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── PDF Loading Modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={showPdfModal}
        onClose={() => { setShowPdfModal(false); setPdfData(null); }}
        title="Generating PDF..."
        maxWidth="max-w-sm"
      >
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Preparing salary slip PDF...</p>
          {pdfData && (
            <div className="mt-4 text-center">
              <p className="text-white font-semibold">
                {pdfData.staff_id?.full_name || pdfData.staff_name}
              </p>
              <p className="text-xs text-gray-500">
                {pdfData.period}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Salary;
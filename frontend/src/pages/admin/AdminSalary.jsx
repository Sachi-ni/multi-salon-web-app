import React, { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";

import {
  getSalaries,
  markAsPaid,
  getSalaryDetails,
  updateRate,
  getStaffWithSalaries,
} from "../../services/salaryService";


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

import { useAuth } from "../../context/AuthContext";
import "./admin.css";

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

const toMonthKey = (date) => {
  const d = new Date(date);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");

  return `${y}-${m}`;
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

const getOrdinalSuffix = (value) => {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  switch (value % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

const getWeekOfMonth = (dateStr) => {
  const d = new Date(dateStr);
  const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
  return Math.ceil((d.getDate() + firstDay.getDay()) / 7);
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

const calculateDaySalary = (workRate, salaryPaymentCountPerDay) => {
  if (workRate === 0) return 0;
  return salaryPaymentCountPerDay;
};

const formatPdfDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().slice(0, 10);
};

const formatPdfMoney = (value) => {
  const num = Number(value || 0);
  return `LKR ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getDayShortName = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { weekday: "short" });
};

const getMonthPeriodLabel = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "N/A";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const SALARY_REFRESH_KEY = "salary-refresh-token";

// ─── Main Component ───────────────────────────────────────────────────────

const Salary = () => {
  const navigate = useNavigate();
  const { salonId: routeSalonId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const salonId = routeSalonId || user?.salon_id || searchParams.get("salonId") || "";

  const [frequency, setFrequency] = useState("daily");

  const today = toDateKey(new Date());
  const [dailyDate, setDailyDate] = useState(today);
  const [weeklyDate, setWeeklyDate] = useState(today);
  const [monthlyDate, setMonthlyDate] = useState(today);

  const [salaries, setSalaries] = useState([]);
  // When no salary records exist, we show staff members with default zero values
  const [fallbackStaff, setFallbackStaff] = useState([]);
  const [summary, setSummary] = useState({
    totalPending: 0,
    totalPaid: 0,
    pendingCount: 0,
    paidCount: 0,
    totalWorkingAmount: 0,
    pendingOverdue: 0,
  });
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
      const [salRes, staffRes] = await Promise.all([
        getSalaries({ salonId, frequency, period }),
        getStaffWithSalaries({ salonId, frequency, period }),
      ]);
      const data = salRes?.data?.salaries || [];
      setSalaries(data);

      // Get staff list for fallback when no salary records exist
      const staffData = staffRes?.data?.staff || [];
      setFallbackStaff(staffData);

      const rates = {};
      for (const sal of data) {
        rates[sal._id] = sal.rate ?? sal.commission_rate ?? 0;
      }
      setEditingRates(rates);
      setDirtyRates({});

      const computedSummary = {
        totalPending: data.reduce((sum, s) => s.status !== "Paid" ? sum + (s.totalSalary || 0) : sum, 0),
        totalPaid: data.reduce((sum, s) => s.status === "Paid" ? sum + (s.paidTotal || s.totalSalary || 0) : sum, 0),
        pendingCount: data.filter(s => s.status !== "Paid").length,
        paidCount: data.filter(s => s.status === "Paid").length,
        totalWorkingAmount: data.reduce((sum, s) => sum + (s.workingAmount || 0), 0),
        pendingOverdue: data.filter(s => {
          if (s.status === "Paid") return false;
          const periodDate = frequency === "daily" ? dailyDate : frequency === "weekly" ? weeklyDate : monthlyDate;
          return isPeriodEnded(frequency, periodDate);
        }).reduce((sum, s) => sum + (s.totalSalary || 0), 0),
      };
      setSummary(computedSummary);
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

  const handleSaveRate = async (salaryId) => {
    const rate = editingRates[salaryId];
    if (rate === undefined || rate === null) return;
    try {
      setLoading(true);
      await updateRate(salaryId, Number(rate));
      setDirtyRates((prev) => ({ ...prev, [salaryId]: false }));
      setSuccessMsg("Rate updated successfully");
      await loadSalaries();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to update rate");
    } finally {
      setLoading(false);
    }
  };

  // ─── Pay ────────────────────────────────────────────────────────────────

  const handlePay = async (salaryId) => {
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await markAsPaid(salaryId);
      setSuccessMsg("Salary marked as paid successfully");
      await loadSalaries();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to mark as paid");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (salaryId) => {
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
      const margin = 15;
      let yPos = margin;

      const salon = salary.salon_id || {};
      const staff = salary.staff_id || {};
      const services = Array.isArray(staff.services) ? staff.services : [];
      const frequency = salary.frequency || "daily";
      const frequencyLabel = frequency.charAt(0).toUpperCase() + frequency.slice(1);
      const isWeekly = frequency === "weekly";
      const isMonthly = frequency === "monthly";
      const rowHeight = 7;
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
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return date.toISOString().slice(0, 10);
      };

      const formatMoney = (value) => {
        const num = Number(value || 0);
        return `LKR ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      };

      const drawBanner = (text, top) => {
        doc.setFillColor(255, 215, 0);
        doc.rect(0, top, pageWidth, 45, "F");
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, "bold");
        doc.setFontSize(18);
        doc.text(text, pageWidth / 2, top + 12, { align: "center" });
      };

      const drawSection = (title) => {
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, yPos - 5, pageWidth - margin * 2, 8, "F");
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont(undefined, "bold");
        doc.text(title, margin + 2, yPos);
        yPos += 8;
      };

      const ensureSpace = (needed) => {
        if (yPos + needed < pageHeight - 25) return;
        doc.addPage();
        yPos = margin;
      };

      const periodLabel = isWeekly
        ? `${formatDate(salary.dateRange?.start || salary.period)} to ${formatDate(salary.dateRange?.end || salary.period)}`
        : isMonthly
          ? (salary.period || formatDate(salary.dateRange?.start))
          : formatDate(salary.period);

      drawBanner("SALARY PAYMENT SLIP", 0);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text(`${frequencyLabel} SALARY REPORT`, pageWidth / 2, 20, { align: "center" });

      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      doc.text(`Payment Type    : ${frequencyLabel}`, margin, 27);
      doc.text(`Salary Period   : ${periodLabel}`, margin, 34);
      doc.text(`Salon Name      : ${salon.name || "N/A"}`, pageWidth - margin, 27, { align: "right" });
      doc.text(`Salon Location  : ${salon.location || "N/A"}`, pageWidth - margin, 34, { align: "right" });

      yPos = 52;
      drawSection("STAFF INFORMATION");
      doc.setFont(undefined, "normal");
      doc.text(`Staff Name      : ${staff.full_name || salary.staff_name || "N/A"}`, margin + 2, yPos);
      yPos += 6;
      doc.text(`Staff email     : ${staff.email || "N/A"}`, margin + 2, yPos);
      yPos += 10;

      drawSection("SERVICES");
      doc.setFontSize(7.8);
      doc.setFont(undefined, "bold");
      const serviceHeaders = ["Service", "Amount"];
      const serviceCols = [120, pageWidth - margin * 2 - 120];
      doc.setFillColor(50, 50, 50);
      doc.rect(margin, yPos - 5, pageWidth - margin * 2, rowHeight, "F");
      doc.setTextColor(255, 255, 255);
      let serviceCx = margin;
      serviceHeaders.forEach((header, index) => {
        doc.text(header, serviceCx + 2, yPos);
        serviceCx += serviceCols[index];
      });
      yPos += rowHeight;

      doc.setFont(undefined, "normal");
      doc.setTextColor(0, 0, 0);
      let servicesTotal = 0;
      const serviceRows = services.length > 0
        ? services
        : [{ service_name: "No services available", base_price: 0 }];

      serviceRows.forEach((service, index) => {
        ensureSpace(rowHeight + 4);
        doc.setFillColor(index % 2 === 0 ? 248 : 255, index % 2 === 0 ? 248 : 255, index % 2 === 0 ? 248 : 255);
        doc.rect(margin, yPos - 5, pageWidth - margin * 2, rowHeight, "F");
        const serviceName = service?.service_name || service?.name || "Service";
        const serviceAmount = Number(service?.base_price ?? service?.price ?? 0);
        servicesTotal += serviceAmount;
        doc.text(serviceName, margin + 2, yPos);
        doc.text(formatMoney(serviceAmount), margin + serviceCols[0] + 2, yPos);
        yPos += rowHeight;
      });

      yPos += 6;

      drawSection("DAILY RECORDS");
      doc.setFontSize(7.5);
      doc.setFont(undefined, "bold");
      doc.setFillColor(50, 50, 50);

      const columns = isWeekly
        ? [20, 34, 30, 18, 30, 30]
        : [34, 30, 18, 34, 30];
      const tableWidth = pageWidth - margin * 2;

      const drawHeaderRow = (headers) => {
        let cx = margin;
        doc.setFillColor(50, 50, 50);
        doc.rect(margin, yPos - 5, tableWidth, rowHeight, "F");
        doc.setTextColor(255, 255, 255);
        headers.forEach((header, index) => {
          doc.text(header, cx + 2, yPos);
          cx += columns[index];
        });
        yPos += rowHeight;
      };

      const drawDataRow = (cells, evenRow) => {
        ensureSpace(rowHeight + 4);
        doc.setFillColor(evenRow ? 248 : 255, evenRow ? 248 : 255, evenRow ? 248 : 255);
        doc.rect(margin, yPos - 5, tableWidth, rowHeight, "F");
        doc.setTextColor(0, 0, 0);
        let cx = margin;
        cells.forEach((cell, index) => {
          doc.text(String(cell ?? ""), cx + 2, yPos);
          cx += columns[index];
        });
        yPos += rowHeight;
      };

      if (isWeekly) {
        drawHeaderRow(["Day", "WorkingAmount", "Rate", "DaySalary"]);
        rows.forEach((record, index) => {
          const dateValue = record.date || salary.dateRange?.start;
          const dayName = new Date(dateValue).toLocaleDateString("en-US", { weekday: "short" });
          drawDataRow([
            dayName,
            formatMoney(record.workingAmount),
            `${Number(record.rate || salary.rate || 0)}%`,
            formatMoney(record.daySalary),
          ], index % 2 === 0);
        });
      } else {
        drawHeaderRow(["Date", "WorkingAmount", "Rate", "WorkRate", "DaySalary"]);
        rows.forEach((record, index) => {
          drawDataRow([
            formatDate(record.date),
            formatMoney(record.workingAmount),
            `${Number(record.rate || salary.rate || 0)}%`,
            formatMoney(record.workRate),
            formatMoney(record.daySalary),
          ], index % 2 === 0);
        });
      }

      yPos += 4;
      doc.setDrawColor(250, 204, 21);
      doc.setLineWidth(0.8);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 4;

      drawSection("SUMMARY");
      doc.setFont(undefined, "normal");
      doc.text(`Total Working Amount : ${formatMoney(totalWorkingAmount)}`, margin + 2, yPos);
      yPos += 7;
      doc.text(`Total Work Rate      : ${formatMoney(totalWorkRate)}`, margin + 2, yPos);
      yPos += 7;
      doc.text(`Total Salary         : ${formatMoney(totalSalary)}`, margin + 2, yPos);
      yPos += 7;
      doc.text(`Status               : ${salary.status || "Not Paid"}`, margin + 2, yPos);
      yPos += 7;
      if (salary.paidAt) {
        doc.text(`Paid Date            : ${formatDate(salary.paidAt)}`, margin + 2, yPos);
        yPos += 7;
      }

      yPos = pageHeight - 20;
      doc.setDrawColor(250, 204, 21);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text("This is a computer-generated salary slip", pageWidth / 2, yPos, { align: "center" });

      const fileName = `salary_slip_${staff.full_name || salary.staff_name || "staff"}_${salary.period}_${salary.frequency}.pdf`;
      doc.save(fileName);
      setShowPdfModal(false);
      setPdfData(null);
      setSuccessMsg("PDF downloaded successfully");
    } catch (e) {
      console.error("PDF generation error:", e);
      setError("Failed to generate PDF: " + e.message);
    }
  };

  // ─── Build display rows (salaries + fallback staff for new periods) ─────

  let displayRows = [...salaries];

  // If no salary records exist but we have staff, create fallback rows
  if (salaries.length === 0 && fallbackStaff.length > 0) {
    displayRows = fallbackStaff.map((staff) => ({
      _id: staff._id,
      staff_id: staff,
      staff_name: staff.full_name || "",
      workingAmount: 0,
      rate: staff.commission_rate || 0,
      commission_rate: staff.commission_rate || 0,
      workRate: 0,
      daySalary: 0,
      totalSalary: 0,
      status: "Not Paid",
    }));
  }

  // ─── Filter by search ──────────────────────────────────────────────────

  const filteredDisplayRows = searchQuery
    ? displayRows.filter((row) => {
        const name = (row.staff_id?.full_name || row.staff_name || "").toLowerCase();
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
            onClick={() => navigate(`/salon-admin/${salonId}/adminDashboard`)}
            className="w-8 h-8 rounded-lg bg-[#1d1d1d] border border-gray-700 flex items-center justify-center text-gray-400 hover:text-yellow-400 hover:border-yellow-400/50 transition-all duration-150"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-white">Salary & Payroll</h1>
            <p className="text-xs text-gray-400 mt-1">
              {frequency.charAt(0).toUpperCase() + frequency.slice(1)} — {getPeriodDisplayLabel()}
            </p>
          </div>
        </div>

        {/* Calendar picker on the right */}
        <div className="flex gap-2 items-center">
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
          <div className="text-[0.65rem] text-gray-500">{summary.pendingCount} staff</div>
        </div>
        <div className="bg-[#161616] border border-yellow-500/20 rounded-xl p-4">
          <div className="text-[0.65rem] text-gray-500 uppercase tracking-wider font-semibold">Total Paid</div>
          <div className="mt-1 text-xl font-black text-white">{formatMoney(summary.totalPaid)}</div>
          <div className="text-[0.65rem] text-gray-500">{summary.paidCount} staff</div>
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
              No {frequency} salary data available for this period. Complete appointments to generate salary records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Staff</th>
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
                  const staffName = staff.full_name || row.staff_name || "Unknown";
                  const isFallback = !row.period; // no period means it's a fallback staff row
                  const monthlyDayRecord =
                    frequency === "monthly" && Array.isArray(row.dailyRecords)
                      ? row.dailyRecords.find((dr) => toDateKey(dr.date) === selectedMonthlyDateKey)
                      : null;
                  const selectedDailyRecord = monthlyDayRecord || null;
                  const workingAmt = frequency === "monthly"
                    ? (selectedDailyRecord?.workingAmount || 0)
                    : (row.workingAmount || 0);
                  const currentRate = editingRates[row._id] !== undefined ? editingRates[row._id] : (row.rate ?? row.commission_rate ?? 0);
                  const isDirty = dirtyRates[row._id] || false;
                  const workRate = frequency === "monthly"
                    ? (selectedDailyRecord?.workRate || 0)
                    : (row.workRate || 0);
                  const daySalary = frequency === "monthly"
                    ? (selectedDailyRecord?.daySalary || 0)
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
                  const canPay = !isFallback && !isPaid && totalSal > 0 && periodEnded;
                  const canDownloadPdf = !isFallback && isPaid;

                  return (
                    <tr key={row._id}>
                      <td className="font-bold text-white">{staffName}</td>
                      <td className="text-right">{formatMoney(workingAmt)}</td>
                      <td className="text-center">
                        <div className="flex items-center gap-1 justify-center">
                          <input
                            type="number"
                            value={currentRate}
                            onChange={(e) => handleRateChange(row._id, e.target.value)}
                            className="w-16 bg-[#1d1d1d] border border-gray-700 rounded px-2 py-1 text-xs text-white text-center outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20"
                            min="0" max="100" step="0.1"
                            disabled={isPaid}
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
                        <td className="text-right">{formatMoney(daySalary)}</td>
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
                                onClick={() => handlePay(row._id)}
                                disabled={!canPay}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-all uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
                                title={!isFallback && periodEnded ? "Mark as Paid" : "Period has not ended yet"}
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
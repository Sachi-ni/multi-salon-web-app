import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wallet,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  FileText,
  Download,
  FileSpreadsheet,
  Receipt,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Store,
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";

import { useAuth } from "../../context/AuthContext";
import { getDailyReport } from "../../services/billingService";
import { getSalons } from "../../services/salonService";

import "./admin.css";

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const fmtMoney = (v) => {
  const n = Number(v || 0);
  return `LKR ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtTime12 = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
};

const invoiceNo = (id) => (id ? `INV-${id.slice(-6).toUpperCase()}` : "—");

const statusBadge = (status) => {
  const map = {
    completed: "success",
    pending:   "warning",
    confirmed: "info",
    cancelled: "danger",
    rejected:  "danger",
  };
  return map[status] || "neutral";
};

const ITEMS_PER_PAGE = 10;

// ── Date range presets ───────────────────────────────────────────────────────

const getDateRange = (preset) => {
  const today = new Date();
  const start = new Date(today);
  const end = new Date(today);

  switch (preset) {
    case "today":
      break;
    case "yesterday":
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
      break;
    case "thisWeek": {
      const day = today.getDay();
      start.setDate(today.getDate() - day);
      end.setDate(today.getDate() + (6 - day));
      break;
    }
    case "thisMonth":
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 0);
      break;
    default:
      break;
  }

  return { startDate: fmtDate(start), endDate: fmtDate(end) };
};

const presetLabel = (p, startDate, endDate) => {
  const labels = {
    today: "Today",
    yesterday: "Yesterday",
    thisWeek: "This Week",
    thisMonth: "This Month",
  };
  if (p === "custom" && startDate && endDate)
    return `${startDate} — ${endDate}`;
  return labels[p] || p;
};

// ═════════════════════════════════════════════════════════════════════════════
//  Component
// ═════════════════════════════════════════════════════════════════════════════

const Billing = () => {
  const { salonId: routeSalonId } = useParams();
  const { user } = useAuth();
  const salonId = routeSalonId || user?.salon_id || "";

  // ── State ──────────────────────────────────────────────────────────────────

  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [preset, setPreset]         = useState("thisMonth");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd]     = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage]               = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Super Admin specific state
  const [salonsList, setSalonsList] = useState([]);
  const [selectedSalonId, setSelectedSalonId] = useState(user?.role === "super-admin" && !routeSalonId ? "all" : salonId);

  const [data, setData] = useState({
    totalAppointments: 0,
    paidAppointments:  0,
    pendingAppointments: 0,
    totalRevenue: 0,
    averageBill: 0,
    appointments: [],
    salonName: "",
    branchLocation: "",
    managerName: "",
  });

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchReport = useCallback(async (p, cs, ce, sId = selectedSalonId) => {
    setLoading(true);
    setError("");
    try {
      let range;
      if (p === "custom") {
        if (!cs || !ce) { setLoading(false); return; }
        range = { startDate: cs, endDate: ce };
      } else {
        range = getDateRange(p);
      }

      const res = await getDailyReport(range.startDate, range.endDate, sId);
      setData(res.data);
      setPage(1);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to load billing data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedSalonId]);

  // Load salons list for super admins
  useEffect(() => {
    if (user?.role === "super-admin") {
      getSalons().then((res) => {
        setSalonsList(res.data || []);
      }).catch(err => console.error("Failed to load salons:", err));
    }
  }, [user?.role]);

  useEffect(() => {
    fetchReport(preset, customStart, customEnd);
  }, [preset, fetchReport]);

  const handlePresetChange = (newPreset) => {
    setPreset(newPreset);
    if (newPreset !== "custom") {
      fetchReport(newPreset, "", "", selectedSalonId);
    }
  };

  const applyCustomDate = () => {
    if (!customStart || !customEnd) return;
    fetchReport("custom", customStart, customEnd, selectedSalonId);
  };

  const handleSalonChange = (e) => {
    const newSalonId = e.target.value;
    setSelectedSalonId(newSalonId);
    fetchReport(preset, customStart, customEnd, newSalonId);
  };

  // ── Filtering + Pagination ─────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = data.appointments;

    // Status filter
    if (statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((a) => {
        const customer = (a.customer_id?.name || a.guest_name || "").toLowerCase();
        const staff    = (a.staff_id?.full_name || "").toLowerCase();
        const inv      = invoiceNo(a._id).toLowerCase();
        return customer.includes(q) || staff.includes(q) || inv.includes(q);
      });
    }

    return list;
  }, [data.appointments, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // ── Totals for the bottom section (based on currently filtered data) ───────

  const filteredTotals = useMemo(() => {
    const completed = filtered.filter((a) => a.status === "completed");
    const revenue   = completed.reduce((s, a) => s + (a.total_price || 0), 0);
    return {
      count: filtered.length,
      revenue,
      avg: completed.length > 0 ? revenue / completed.length : 0,
    };
  }, [filtered]);

  // ── PDF Export ─────────────────────────────────────────────────────────────

  const exportPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    // ── Header ───────────────────────────────────────────────────────────────
    // White background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 44, "F");

    // Yellow Accent line
    doc.setFillColor(250, 204, 21); 
    doc.rect(0, 38, pageWidth, 2, "F");

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(data.salonName || "Salon", 14, 20);

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    if (data.branchLocation) doc.text(data.branchLocation, 14, 27);
    if (data.managerName)    doc.text(`Branch Manager: ${data.managerName}`, 14, 33);

    // Report title on right
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Daily Revenue Report", pageWidth - 14, 20, { align: "right" });

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      presetLabel(preset, customStart, customEnd),
      pageWidth - 14,
      27,
      { align: "right" }
    );

    // ── Summary boxes ────────────────────────────────────────────────────────
    const boxY = 46;
    const boxW = (pageWidth - 28 - 15) / 4;
    const summaryItems = [
      { label: "Total Revenue",      value: fmtMoney(data.totalRevenue) },
      { label: "Total Appointments",  value: String(data.totalAppointments) },
      { label: "Paid Appointments",   value: String(data.paidAppointments) },
      { label: "Pending Appointments", value: String(data.pendingAppointments) },
    ];

    summaryItems.forEach((item, i) => {
      const x = 14 + i * (boxW + 5);
      
      // Light grey box with border
      doc.setFillColor(248, 248, 248);
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(x, boxY, boxW, 20, 2, 2, "FD");
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(item.label.toUpperCase(), x + 4, boxY + 7);
      
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text(item.value, x + 4, boxY + 15);
      doc.setFont("helvetica", "normal");
    });

    // ── Table ────────────────────────────────────────────────────────────────
    const tableData = filtered.map((a) => [
      invoiceNo(a._id),
      a.customer_id?.name || a.guest_name || "N/A",
      a.staff_id?.full_name || "N/A",
      a.service_id?.service_name || "N/A",
      a.appointment_date,
      fmtTime12(a.start_time),
      fmtMoney(a.total_price || 0),
      (a.status || "").charAt(0).toUpperCase() + (a.status || "").slice(1),
    ]);

    autoTable(doc, {
      startY: boxY + 28,
      head: [["Invoice #", "Customer", "Staff", "Service", "Date", "Time", "Amount", "Status"]],
      body: tableData,
      theme: "striped",
      styles: {
        fontSize: 9,
        cellPadding: 4,
        textColor: [40, 40, 40],
      },
      headStyles: {
        fillColor: [250, 204, 21],
        textColor: [30, 30, 30],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248],
      },
    });

    // ── Footer summary ───────────────────────────────────────────────────────
    // Safely get the Y position where the table ended to draw the footer below it
    const finalY = (doc.lastAutoTable?.finalY || doc.previousAutoTable?.finalY || (boxY + 30 + tableData.length * 10)) + 10;

    doc.setFillColor(248, 248, 248);
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(14, finalY, pageWidth - 28, 22, 2, 2, "FD");

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("Total Appointments", 20, finalY + 8);
    doc.text("Total Revenue", 20 + 55, finalY + 8);
    doc.text("Average Bill", 20 + 110, finalY + 8);

    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text(String(data.totalAppointments), 20, finalY + 16);
    doc.text(fmtMoney(data.totalRevenue), 20 + 55, finalY + 16);
    doc.text(fmtMoney(data.averageBill), 20 + 110, finalY + 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      pageWidth - 14,
      finalY + 16,
      { align: "right" }
    );

    doc.save("Daily_Revenue_Report.pdf");
  };

  // ── Excel Export ───────────────────────────────────────────────────────────

  const exportExcel = () => {
    const rows = filtered.map((a) => ({
      "Invoice No":        invoiceNo(a._id),
      "Appointment Date":  a.appointment_date,
      "Appointment Time":  fmtTime12(a.start_time),
      "Customer Name":     a.customer_id?.name || a.guest_name || "N/A",
      "Staff Name":        a.staff_id?.full_name || "N/A",
      "Service Name":      a.service_id?.service_name || "N/A",
      "Duration (min)":    a.duration || 0,
      "Amount":            a.total_price || 0,
      "Status":            a.status,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Revenue Report");
    XLSX.writeFile(wb, "Daily_Revenue_Report.xlsx");
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[60vh]">
      <PageHeader
        title="Billing & Revenue"
        subtitle="Daily revenue report for your salon branch"
        backTo={`/salon-admin/${salonId}/adminDashboard`}
      >
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={FileText} onClick={exportPDF}>
            Print PDF
          </Button>
          <Button variant="ghost" size="sm" icon={FileSpreadsheet} onClick={exportExcel}>
            Export Excel
          </Button>
        </div>
      </PageHeader>

      {/* ── Summary Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Wallet,       label: "Total Revenue",      value: fmtMoney(data.totalRevenue),     sub: "Completed amounts" },
          { icon: Calendar,     label: "Total Appointments",  value: data.totalAppointments,          sub: "Selected period" },
          { icon: CheckCircle2, label: "Paid Appointments",   value: data.paidAppointments,           sub: "Completed" },
          { icon: Clock,        label: "Pending Appointments", value: data.pendingAppointments,        sub: "Awaiting action" },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <StatCard icon={s.icon} label={s.label} value={s.value} subtitle={s.sub} />
          </motion.div>
        ))}
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <Card className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Super Admin Salon Selector */}
            {user?.role === "super-admin" && !routeSalonId && (
              <div className="flex items-center gap-2 bg-surface-2 px-3 py-1.5 rounded-lg border border-border">
                <Store className="w-4 h-4 text-accent" />
                <select
                  className="bg-transparent text-xs font-semibold text-white focus:outline-none w-full cursor-pointer"
                  value={selectedSalonId}
                  onChange={handleSalonChange}
                >
                  <option value="all" className="bg-surface text-white">All Salons</option>
                  {salonsList.map(s => (
                    <option key={s._id} value={s._id} className="bg-surface text-white">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date presets */}
            <div className="flex flex-wrap gap-2">
              {["today", "yesterday", "thisWeek", "thisMonth", "custom"].map((p) => (
                <button
                  key={p}
                  onClick={() => handlePresetChange(p)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-extrabold border transition-all duration-200 ${
                    preset === p
                      ? "bg-accent text-primary border-accent"
                      : "bg-surface-2 text-muted-2 border-border hover:border-border-hover"
                  }`}
                >
                  {p === "today" && "Today"}
                  {p === "yesterday" && "Yesterday"}
                  {p === "thisWeek" && "This Week"}
                  {p === "thisMonth" && "This Month"}
                  {p === "custom" && "Custom Range"}
                </button>
              ))}
            </div>
          </div>

          {/* Custom date inputs */}
          {preset === "custom" && (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-white text-xs focus:border-accent focus:outline-none transition-colors"
              />
              <span className="text-muted-2 text-xs">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-white text-xs focus:border-accent focus:outline-none transition-colors"
              />
              <Button variant="primary" size="xs" onClick={applyCustomDate}>
                Apply
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* ── Search + Status filter ────────────────────────────────────────── */}
      <Card className="mb-6" padding="p-0">
        <Card.Header className="px-5 pt-5">
          <Card.Title>Appointments</Card.Title>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Status toggle */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-white text-xs focus:border-accent focus:outline-none transition-colors"
            >
              <option value="completed">Completed Only</option>
              <option value="all">All Statuses</option>
              <option value="pending">Pending Only</option>
              <option value="confirmed">Confirmed Only</option>
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-2" />
              <input
                type="text"
                placeholder="Search name, invoice, staff…"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="w-56 bg-surface-2 border border-border rounded-lg pl-8 pr-3 py-1.5 text-white text-xs focus:border-accent focus:outline-none transition-colors placeholder:text-muted"
              />
            </div>
          </div>
        </Card.Header>

        {/* ── Error banner ─────────────────────────────────────────────────── */}
        {error && (
          <div className="mx-5 mt-2 px-4 py-3 rounded-xl border border-danger-border bg-danger-dim text-danger text-xs font-bold">
            {error}
          </div>
        )}

        {/* ── Table ────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-muted-2">
            <Loader2 className="w-5 h-5 animate-spin text-accent" />
            <span className="text-sm">Loading billing data…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState
              icon={Receipt}
              title="No billing records found"
              description="There are no appointments matching your filters for the selected period."
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Invoice No.</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Customer</th>
                    <th>Staff</th>
                    <th>Service</th>
                    <th>Duration</th>
                    <th className="text-right">Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((a) => (
                    <tr key={a._id}>
                      <td className="whitespace-nowrap font-bold text-accent text-sm">
                        {invoiceNo(a._id)}
                      </td>
                      <td className="whitespace-nowrap text-sm">{a.appointment_date}</td>
                      <td className="whitespace-nowrap text-sm">{fmtTime12(a.start_time)}</td>
                      <td className="text-sm min-w-[140px]">
                        <div className="font-bold text-white">
                          {a.customer_id?.name || a.guest_name || "N/A"}
                        </div>
                        {a.customer_id?.phone && (
                          <div className="text-muted-2 text-[0.7rem]">{a.customer_id.phone}</div>
                        )}
                      </td>
                      <td className="text-sm">{a.staff_id?.full_name || "N/A"}</td>
                      <td className="text-sm">{a.service_id?.service_name || "N/A"}</td>
                      <td className="whitespace-nowrap text-sm text-muted-2">
                        {a.duration ? `${a.duration} min` : "—"}
                      </td>
                      <td className="whitespace-nowrap text-sm font-bold text-right text-accent">
                        {fmtMoney(a.total_price || 0)}
                      </td>
                      <td>
                        <Badge variant={statusBadge(a.status)}>
                          {(a.status || "").toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ──────────────────────────────────────────────── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-border">
                <span className="text-xs text-muted-2">
                  Showing {(page - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of{" "}
                  {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-2 hover:border-accent hover:text-accent disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (n) =>
                        n === 1 ||
                        n === totalPages ||
                        Math.abs(n - page) <= 1
                    )
                    .reduce((acc, n, idx, arr) => {
                      if (idx > 0 && n - arr[idx - 1] > 1) acc.push("...");
                      acc.push(n);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === "..." ? (
                        <span key={`dot-${idx}`} className="px-1 text-muted-2 text-xs">…</span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setPage(item)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                            page === item
                              ? "bg-accent text-primary border border-accent"
                              : "border border-border text-muted-2 hover:border-accent hover:text-accent"
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-2 hover:border-accent hover:text-accent disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* ── Bottom Totals ─────────────────────────────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Appointments", value: String(filteredTotals.count), accent: false },
            { label: "Total Revenue",      value: fmtMoney(filteredTotals.revenue), accent: true },
            { label: "Average Bill Value",  value: fmtMoney(filteredTotals.avg), accent: false },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
            >
              <Card className="text-center admin-card">
                <p className="text-[0.65rem] font-bold text-muted-2 uppercase tracking-widest mb-2">
                  {item.label}
                </p>
                <p className={`text-2xl font-black ${item.accent ? "text-accent" : "text-white"}`}>
                  {item.value}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Billing;

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wallet,
  Calendar,
  Search,
  Receipt,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Coins,
  TrendingUp,
  Download,
  Printer
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";
import Table from "../../components/ui/Table";
import EmptyState from "../../components/ui/EmptyState";

import { useAuth } from "../../context/AuthContext";
import { getDailyReport } from "../../services/billingService";
import { getSalons } from "../../services/salonService";
import clsx from "clsx";

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

const Billing = () => {
  const { salonId: routeSalonId } = useParams();
  const { user } = useAuth();
  let salonId = routeSalonId || user?.salon_id || "";
  if (!salonId) {
    const match = window.location.pathname.match(/^\/salon-admin\/([^/]+)/);
    if (match) salonId = match[1];
  }

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
    confirmedAppointments: 0,
    pendingAppointments: 0,
    completedRevenue: 0,
    confirmedRevenue: 0,
    totalProjectedRevenue: 0,
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

  useEffect(() => {
    if (user?.role === "super-admin") {
      getSalons().then((res) => {
        setSalonsList(res.data || []);
      }).catch(err => console.error("Failed to load salons:", err));
    }
  }, [user?.role]);

  useEffect(() => {
    fetchReport(preset, customStart, customEnd);
  }, [preset, fetchReport, customStart, customEnd]);

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
    let list = data.appointments || [];

    if (statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((a) => {
        const customer = (a.customer_id?.name || a.guest_name || "").toLowerCase();
        const staff    = (a.staff_id?.full_name || "").toLowerCase();
        const inv      = invoiceNo(a._id).toLowerCase();
        const service  = (a.service_id?.service_name || "").toLowerCase();
        return customer.includes(q) || staff.includes(q) || inv.includes(q) || service.includes(q);
      });
    }

    return list;
  }, [data.appointments, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Fallback Revenue computations from appointment array
  const displayCompletedRevenue = useMemo(() => {
    if (data.completedRevenue !== undefined && data.completedRevenue > 0) return data.completedRevenue;
    const completedList = (data.appointments || []).filter(a => a.status === "completed");
    return completedList.reduce((sum, a) => sum + (a.total_price || a.service_id?.base_price || 0), 0);
  }, [data]);

  const displayProjectedRevenue = useMemo(() => {
    if (data.totalProjectedRevenue !== undefined && data.totalProjectedRevenue > 0) return data.totalProjectedRevenue;
    const validList = (data.appointments || []).filter(a => ["completed", "confirmed"].includes(a.status));
    return validList.reduce((sum, a) => sum + (a.total_price || a.service_id?.base_price || 0), 0);
  }, [data]);

  const displayAvgBill = useMemo(() => {
    if (data.averageBill && data.averageBill > 0) return data.averageBill;
    const validList = (data.appointments || []).filter(a => ["completed", "confirmed"].includes(a.status));
    const total = validList.reduce((sum, a) => sum + (a.total_price || a.service_id?.base_price || 0), 0);
    return validList.length > 0 ? total / validList.length : 0;
  }, [data]);

  // ── PDF Export ─────────────────────────────────────────────────────────────

  const exportPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 44, "F");

    doc.setFillColor(250, 204, 21); 
    doc.rect(0, 38, pageWidth, 2, "F");

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(data.salonName || "Salon Network", 14, 20);

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    if (data.branchLocation) doc.text(data.branchLocation, 14, 27);
    if (data.managerName)    doc.text(`Branch Manager: ${data.managerName}`, 14, 33);

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Revenue & Financial Report", pageWidth - 14, 20, { align: "right" });

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(presetLabel(preset, customStart, customEnd), pageWidth - 14, 27, { align: "right" });

    const boxY = 46;
    const boxW = (pageWidth - 28 - 15) / 4;
    const summaryItems = [
      { label: "Completed Rev",     value: fmtMoney(displayCompletedRevenue) },
      { label: "Projected Rev",     value: fmtMoney(displayProjectedRevenue) },
      { label: "Total Bookings",     value: String(data.totalAppointments || 0) },
      { label: "Avg Bill Value",    value: fmtMoney(displayAvgBill) },
    ];

    summaryItems.forEach((item, i) => {
      const x = 14 + i * (boxW + 5);
      doc.setFillColor(248, 248, 248);
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(x, boxY, boxW, 20, 2, 2, "FD");
      
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(item.label.toUpperCase(), x + 4, boxY + 7);
      
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text(item.value, x + 4, boxY + 15);
      doc.setFont("helvetica", "normal");
    });

    const tableData = filtered.map((a) => [
      invoiceNo(a._id),
      a.customer_id?.name || a.guest_name || "N/A",
      a.staff_id?.full_name || "N/A",
      a.service_id?.service_name || "N/A",
      a.appointment_date,
      fmtTime12(a.start_time),
      fmtMoney(a.total_price || a.service_id?.base_price || 0),
      (a.status || "").charAt(0).toUpperCase() + (a.status || "").slice(1),
    ]);

    autoTable(doc, {
      startY: boxY + 28,
      head: [["Invoice #", "Customer", "Staff", "Service", "Date", "Time", "Amount", "Status"]],
      body: tableData,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 3, textColor: [40, 40, 40] },
      headStyles: { fillColor: [250, 204, 21], textColor: [30, 30, 30], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });

    doc.save("Revenue_Report.pdf");
  };

  const exportExcel = () => {
    const rows = filtered.map((a) => ({
      "Invoice No":        invoiceNo(a._id),
      "Appointment Date":  a.appointment_date,
      "Appointment Time":  fmtTime12(a.start_time),
      "Customer Name":     a.customer_id?.name || a.guest_name || "N/A",
      "Staff Name":        a.staff_id?.full_name || "N/A",
      "Service Name":      a.service_id?.service_name || "N/A",
      "Duration (min)":    a.duration || 0,
      "Amount":            a.total_price || a.service_id?.base_price || 0,
      "Status":            a.status,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Revenue Report");
    XLSX.writeFile(wb, "Revenue_Report.xlsx");
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "confirmed":
        return <Badge variant="info">Confirmed</Badge>;
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      case "cancelled":
      case "rejected":
        return <Badge variant="danger">{status}</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Report & Financial Revenue"
        subtitle="Financial overview, revenue statements, and downloadable reports across salon locations"
        backTo={user?.role === "super-admin" ? "/superAdminDashboard" : `/salon-admin/${salonId}/adminDashboard`}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={exportPDF}
            className="px-4 py-2 rounded-xl bg-amber-400 text-black text-xs font-black hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print PDF
          </button>
          <button
            onClick={exportExcel}
            className="px-4 py-2 rounded-xl bg-surface border border-border text-neutral-300 text-xs font-bold hover:border-amber-400/40 hover:text-white transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-amber-400" />
            Export Excel
          </button>
        </div>
      </PageHeader>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-card relative overflow-hidden group hover:border-amber-400/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Completed Revenue</span>
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <Coins className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-xl font-black text-amber-400 leading-none">{fmtMoney(displayCompletedRevenue)}</h3>
            <p className="text-2xs text-neutral-400 mt-2 font-medium">Earned from completed bookings</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-card relative overflow-hidden group hover:border-amber-400/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Projected Revenue</span>
              <div className="w-10 h-10 rounded-xl bg-blue-400/10 border border-blue-400/30 flex items-center justify-center text-blue-400">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-xl font-black text-white leading-none">{fmtMoney(displayProjectedRevenue)}</h3>
            <p className="text-2xs text-neutral-400 mt-2 font-medium">Includes confirmed appointments</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-card relative overflow-hidden group hover:border-amber-400/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Total Bookings</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-xl font-black text-white leading-none">{data.totalAppointments || 0}</h3>
            <p className="text-2xs text-neutral-400 mt-2 font-medium">{data.paidAppointments || 0} Paid · {data.confirmedAppointments || 0} Confirmed · {data.pendingAppointments || 0} Pending</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-card relative overflow-hidden group hover:border-amber-400/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Avg Bill Value</span>
              <div className="w-10 h-10 rounded-xl bg-purple-400/10 border border-purple-400/30 flex items-center justify-center text-purple-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-xl font-black text-white leading-none">{fmtMoney(displayAvgBill)}</h3>
            <p className="text-2xs text-neutral-400 mt-2 font-medium">Average ticket size per active booking</p>
          </div>
        </motion.div>
      </div>

      {/* Preset Time Range & Branch Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-border rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          {user?.role === "super-admin" && !routeSalonId && (
            <div className="relative mr-2">
              <select
                className="appearance-none bg-surface-2 border border-border rounded-xl px-4 pr-8 py-2 text-xs font-bold text-white outline-none cursor-pointer uppercase tracking-wider"
                value={selectedSalonId}
                onChange={handleSalonChange}
              >
                <option value="all">All Salons</option>
                {salonsList.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {["today", "yesterday", "thisWeek", "thisMonth", "custom"].map((p) => (
            <button
              key={p}
              onClick={() => handlePresetChange(p)}
              className={clsx(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
                preset === p
                  ? "bg-amber-400 text-black font-extrabold shadow-sm"
                  : "bg-surface-2 text-neutral-400 hover:text-white hover:border-amber-400/30"
              )}
            >
              {p === "today" && "Today"}
              {p === "yesterday" && "Yesterday"}
              {p === "thisWeek" && "This Week"}
              {p === "thisMonth" && "This Month"}
              {p === "custom" && "Custom Range"}
            </button>
          ))}
        </div>

        {preset === "custom" && (
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              style={{ colorScheme: "dark" }}
              className="bg-surface-2 border border-border rounded-xl px-3 py-1.5 text-white text-xs outline-none"
            />
            <span className="text-neutral-400 text-xs">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              style={{ colorScheme: "dark" }}
              className="bg-surface-2 border border-border rounded-xl px-3 py-1.5 text-white text-xs outline-none"
            />
            <button
              onClick={applyCustomDate}
              className="px-3 py-1.5 rounded-xl bg-amber-400 text-black text-xs font-extrabold"
            >
              Apply Range
            </button>
          </div>
        )}
      </div>

      {/* Filter Bar & Data Table */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by customer name, invoice #, staff, or service..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all duration-200 focus:border-amber-400 placeholder:text-neutral-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-surface border border-border rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none cursor-pointer uppercase tracking-wider"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed Only</option>
              <option value="confirmed">Confirmed Only</option>
              <option value="pending">Pending Only</option>
            </select>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-danger-dim border border-danger-border text-xs text-danger font-semibold">
            {error}
          </div>
        )}

        {/* Financial Transactions Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-neutral-400">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            <span className="text-xs font-semibold">Loading billing reports...</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No revenue records found"
            description="There are no appointments matching your filters for the selected period."
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <Table.Head>
                <Table.Th>Invoice No.</Table.Th>
                <Table.Th>Date & Time</Table.Th>
                <Table.Th>Customer</Table.Th>
                <Table.Th>Staff</Table.Th>
                <Table.Th>Service</Table.Th>
                <Table.Th align="right">Amount</Table.Th>
                <Table.Th align="right">Status</Table.Th>
              </Table.Head>
              <Table.Body>
                {paginated.map((a) => (
                  <tr key={a._id} className="hover:bg-surface-2/60 transition-colors">
                    <Table.Td bold className="text-amber-400 font-black text-xs">
                      {invoiceNo(a._id)}
                    </Table.Td>
                    <Table.Td className="text-xs text-neutral-300">
                      <p className="font-bold text-white">{a.appointment_date}</p>
                      <p className="text-2xs text-neutral-400">{fmtTime12(a.start_time)}</p>
                    </Table.Td>
                    <Table.Td className="text-xs">
                      <p className="font-extrabold text-white">{a.customer_id?.name || a.guest_name || "N/A"}</p>
                      <p className="text-2xs text-neutral-400">{a.customer_id?.phone || a.guest_phone || ""}</p>
                    </Table.Td>
                    <Table.Td className="text-xs text-neutral-300 font-medium">
                      {a.staff_id?.full_name || "Unassigned"}
                    </Table.Td>
                    <Table.Td className="text-xs text-neutral-300 font-semibold">
                      {a.service_id?.service_name || (a.appointment_services && a.appointment_services.length > 0 ? a.appointment_services.map(s => s.service_id?.service_name).join(", ") : "Service")}
                    </Table.Td>
                    <Table.Td align="right" className="text-amber-400 font-black text-xs">
                      LKR {(a.total_price || a.service_id?.base_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Table.Td>
                    <Table.Td align="right">
                      {getStatusBadge(a.status)}
                    </Table.Td>
                  </tr>
                ))}
              </Table.Body>
            </Table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 text-xs">
                <span className="text-neutral-400">
                  Showing Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-xl bg-surface border border-border text-neutral-300 hover:text-white disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-xl bg-surface border border-border text-neutral-300 hover:text-white disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Billing;

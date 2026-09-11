import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Users, Calendar, CheckCircle,
  XCircle, DollarSign, TrendingUp,
  Clock, BarChart3,
  PieChart as PieChartIcon, LineChart as LineChartIcon, Sparkles, Award, Repeat
} from "lucide-react";
import { motion } from "framer-motion";
import { ComposedChart, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

import api from "../../services/api";
import { getSalonAppointments } from "../../services/appointmentService";
import { getStaff } from "../../services/staffService";
import { getServices } from "../../services/serviceService";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Spinner from "../../components/ui/Spinner";

/* ── Palette ── */
const CHART_COLORS = ["#a855f7", "#22c55e", "#ef4444", "#f5c800", "#38bdf8", "#f472b6", "#14b8a6", "#6366f1"];
const STATUS_COLORS = { Completed: "#22c55e", Pending: "#f5c800", Cancelled: "#ef4444" };

/* ── Tooltip (shared) ── */
const tooltipStyle = {
  backgroundColor: "rgba(10,10,10,0.92)",
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
  padding: "10px 14px",
};
const tooltipItemStyle = { color: "#e5e5e5", fontSize: "12px" };
const tooltipLabelStyle = { color: "#fff", fontWeight: 700, fontSize: "12px", marginBottom: "4px" };

/* ── Framer Motion ── */
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } },
};

/* ── KPI config (admin-specific) ── */
const KPI_CONFIG = [
  { key: "totalRevenue", label: "Total Revenue", icon: DollarSign, color: "#22c55e", isCurrency: true, sub: "in selected period" },
  { key: "totalBookings", label: "Total Bookings", icon: Calendar, color: "#38bdf8", sub: "appointments made" },
  { key: "completedBookings", label: "Completed", icon: CheckCircle, color: "#f5c800", sub: "appointments finished" },
  { key: "avgBookingValue", label: "Avg Value", icon: TrendingUp, color: "#f59e0b", isCurrency: true, sub: "per completed booking" },
  { key: "totalCustomers", label: "Total Customers", icon: Users, color: "#a855f7", sub: "lifetime distinct clients" },
  { key: "cancelledBookings", label: "Cancelled", icon: XCircle, color: "#ef4444", sub: "appointments cancelled" },
  { key: "returningCustomers", label: "Returning", icon: Repeat, color: "#14b8a6", sub: "returning clients" },
];

/* ── Custom Tooltip ── */
const CustomTooltip = ({ active, payload, label, isCurrency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle}>
      <p style={tooltipLabelStyle}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ ...tooltipItemStyle, color: p.color }}>
          <span style={{ fontWeight: 600 }}>{p.name}: </span>
          {isCurrency ? `Rs. ${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};

/* ── Section Header ── */
const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-1">
    <div className="p-2 rounded-lg bg-accent-dim border border-accent/20">
      <Icon className="w-4 h-4 text-accent" />
    </div>
    <div>
      <h3 className="text-sm font-extrabold text-white tracking-tight">{title}</h3>
      {subtitle && <p className="text-[0.65rem] text-muted-2 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════ */
/*              ADMIN ANALYTICS COMPONENT          */
/* ═══════════════════════════════════════════════ */
export default function AdminAnalytics() {
  const { salonId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState("30days");

  const [appointments, setAppointments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);

  /* ── Fetch ── */
  const fetchData = useCallback(async () => {
    if (!salonId) return;
    try {
      setLoading(true);
      setError("");

      const [apptsRes, staffRes, servicesRes, custRes] = await Promise.allSettled([
        getSalonAppointments(salonId),
        getStaff(salonId),
        getServices(salonId),
        api.get("/customers")
      ]);

      if (apptsRes.status === "fulfilled") setAppointments(apptsRes.value.data || []);
      if (staffRes.status === "fulfilled") setStaff(staffRes.value.data || []);
      if (servicesRes.status === "fulfilled") setServices(servicesRes.value.data || []);
      if (custRes.status === "fulfilled") setAllCustomers(custRes.value.data || []);

    } catch (err) {
      console.error(err);
      setError("Failed to load salon analytics data");
    } finally {
      setLoading(false);
    }
  }, [salonId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Derived: Date-Filtered Data ── */
  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate = new Date(0);

    if (dateRange === "today") startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (dateRange === "yesterday") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    }
    else if (dateRange === "7days") startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (dateRange === "30days") startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    else if (dateRange === "90days") startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    else if (dateRange === "year") startDate = new Date(now.getFullYear(), 0, 1);

    let endDate = null;
    if (dateRange === "yesterday") {
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const startISO = startDate.toISOString().split("T")[0];
    const endISO = endDate ? endDate.toISOString().split("T")[0] : null;

    const filteredAppointments = appointments.filter(a => {
      const aDate = a.appointment_date || (a.createdAt && a.createdAt.split("T")[0]);
      if (!aDate) return false;
      if (endISO) return aDate >= startISO && aDate < endISO;
      return aDate >= startISO;
    });

    const salonCustomerIds = new Set(appointments.filter(a => a.customer_id).map(a => typeof a.customer_id === "object" ? a.customer_id._id : a.customer_id));
    const salonCustomers = allCustomers.filter(c => salonCustomerIds.has(c._id));

    return { filteredAppointments, salonCustomers, startDate, endISO };
  }, [appointments, allCustomers, dateRange]);

  /* ── KPI Calculations ── */
  const kpis = useMemo(() => {
    const { filteredAppointments, salonCustomers, startDate } = filteredData;

    const totalBookings = filteredAppointments.length;
    const completedBookings = filteredAppointments.filter(a => a.status === "completed").length;
    const cancelledBookings = filteredAppointments.filter(a => a.status === "cancelled" || a.status === "rejected").length;

    const totalRevenue = filteredAppointments
      .filter(a => a.status === "completed")
      .reduce((sum, a) => sum + (a.total_price || 0), 0);

    const avgBookingValue = completedBookings > 0 ? Math.round(totalRevenue / completedBookings) : 0;

    const totalCustomers = salonCustomers.length;
    const newCustomers = salonCustomers.filter(c => c.createdAt && new Date(c.createdAt) >= startDate).length;
    const returningCustomers = totalCustomers - newCustomers;

    const completionRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0;

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      avgBookingValue,
      totalCustomers,
      newCustomers,
      returningCustomers,
      completionRate
    };
  }, [filteredData]);

  /* ── Charts Data ── */
  const chartsData = useMemo(() => {
    const { filteredAppointments, salonCustomers } = filteredData;

    // 1. Trend Map
    const trendMap = {};
    filteredAppointments.forEach(a => {
      const date = a.appointment_date || (a.createdAt && a.createdAt.split("T")[0]);
      if (!date) return;
      if (!trendMap[date]) trendMap[date] = { date, revenue: 0, completed: 0, cancelled: 0, pending: 0 };

      if (a.status === "completed") {
        trendMap[date].revenue += (a.total_price || 0);
        trendMap[date].completed += 1;
      } else if (a.status === "cancelled" || a.status === "rejected") {
        trendMap[date].cancelled += 1;
      } else {
        trendMap[date].pending += 1;
      }
    });
    let trendData = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));
    if (trendData.length === 1) {
      const d = new Date(trendData[0].date);
      const prev = new Date(d); prev.setDate(prev.getDate() - 1);
      const prevStr = [prev.getFullYear(), String(prev.getMonth() + 1).padStart(2, '0'), String(prev.getDate()).padStart(2, '0')].join('-');
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const nextStr = [next.getFullYear(), String(next.getMonth() + 1).padStart(2, '0'), String(next.getDate()).padStart(2, '0')].join('-');
      trendData = [
        { date: prevStr, revenue: 0, completed: 0, cancelled: 0, pending: 0 },
        trendData[0],
        { date: nextStr, revenue: 0, completed: 0, cancelled: 0, pending: 0 }
      ];
    }

    // 2. Staff Performance
    const staffMap = {};
    staff.forEach(s => staffMap[s._id] = { name: s.user_id?.name || s.name || "Unknown", completed: 0, revenue: 0 });
    filteredAppointments.forEach(a => {
      if (a.status === "completed" && a.staff_id) {
        const sid = typeof a.staff_id === 'object' ? a.staff_id._id : a.staff_id;
        if (staffMap[sid]) {
          staffMap[sid].completed += 1;
          staffMap[sid].revenue += (a.total_price || 0);
        }
      }
    });
    const staffData = Object.values(staffMap).filter(s => s.completed > 0 || s.revenue > 0);

    // 3. Top Services
    const serviceMap = {};
    services.forEach(s => serviceMap[s._id] = { name: s.service_name || s.name || "Unknown", revenue: 0, count: 0 });
    filteredAppointments.forEach(a => {
      if (a.status === "completed" && a.service_ids && a.service_ids.length > 0) {
        const avg = a.total_price / a.service_ids.length;
        a.service_ids.forEach(s => {
          const sid = typeof s === 'object' ? s._id : s;
          if (serviceMap[sid]) {
            serviceMap[sid].revenue += avg;
            serviceMap[sid].count += 1;
          }
        });
      }
    });
    const topServicesData = Object.values(serviceMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 4. Status Data
    const statusData = [
      { name: "Completed", value: kpis.completedBookings },
      { name: "Pending", value: kpis.totalBookings - kpis.completedBookings - kpis.cancelledBookings },
      { name: "Cancelled", value: kpis.cancelledBookings },
    ].filter(d => d.value > 0);

    // 5. Customer Growth
    const custMap = {};
    salonCustomers.forEach(c => {
      const date = c.createdAt ? c.createdAt.split("T")[0] : null;
      if (!date) return;
      if (!custMap[date]) custMap[date] = 0;
      custMap[date] += 1;
    });
    const customerGrowthData = Object.keys(custMap).sort().map(date => ({ date, newCustomers: custMap[date] }));

    return { trendData, staffData, topServicesData, statusData, customerGrowthData };
  }, [filteredData, kpis, staff, services]);

  /* ── Recent Activity ── */
  const recentActivity = useMemo(() => {
    return [...appointments]
      .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0))
      .slice(0, 8);
  }, [appointments]);

  const formatCurrency = (val) => `Rs. ${val.toLocaleString()}`;

  /* ── Smart Insights ── */
  const insights = useMemo(() => {
    const topEarner = chartsData.staffData.length > 0
      ? [...chartsData.staffData].sort((a, b) => b.revenue - a.revenue)[0]
      : null;
    const topService = chartsData.topServicesData.length > 0
      ? chartsData.topServicesData[0]
      : null;

    return { topEarner, topService };
  }, [chartsData]);

  /* ── Date Range Options ── */
  const dateRangeOptions = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "7days", label: "7 Days" },
    { value: "30days", label: "30 Days" },
    { value: "90days", label: "90 Days" },
    { value: "year", label: "This Year" },
    { value: "all", label: "All Time" },
  ];

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div className="p-6 max-w-7xl mx-auto pb-20 min-h-[60vh]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <PageHeader
          title="Business Analytics"
          subtitle="Monitor your salon's performance and growth"
          backTo={`/salon-admin/${salonId}/adminDashboard`}
        />

        {/* Pill-style date range selector */}
        <div className="flex items-center bg-surface-2 border border-border rounded-xl p-1 gap-0.5 flex-shrink-0">
          {dateRangeOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setDateRange(opt.value)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                dateRange === opt.value
                  ? "bg-accent text-primary shadow-glow-sm"
                  : "text-muted-2 hover:text-white hover:bg-surface-3"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-danger-dim border border-danger/30 text-sm text-danger font-medium mb-6 flex items-center gap-2">
          <XCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <Spinner.FullPage />
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-8">

          {/* ═══ KPI STRIP ═══ */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {KPI_CONFIG.map((cfg) => {
              const Icon = cfg.icon;
              let displayVal;
              if (cfg.isCurrency) displayVal = formatCurrency(kpis[cfg.key]);
              else displayVal = kpis[cfg.key];

              return (
                <motion.div
                  key={cfg.key}
                  whileHover={{ y: -4, transition: { type: "spring", stiffness: 400 } }}
                  className="relative group"
                >
                  <div
                    className="bg-surface border border-border rounded-xl p-4 h-full transition-all duration-300 hover:border-border-hover hover:shadow-card group-hover:bg-surface-2/60"
                    style={{ borderLeft: `3px solid ${cfg.color}` }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[0.6rem] font-extrabold uppercase tracking-widest text-muted-2">{cfg.label}</span>
                      <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                    </div>
                    <div className="text-xl font-black text-white leading-none mb-2">{displayVal}</div>
                    <span className="text-[0.6rem] text-muted font-medium">{cfg.sub}</span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* ═══ SMART INSIGHTS ═══ */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden group hover:border-accent/30 transition-all duration-300">
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-accent/10 blur-2xl" />
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="p-2 rounded-lg bg-accent-dim border border-accent/20">
                  <Award className="w-4 h-4 text-accent" />
                </div>
                <span className="text-[0.65rem] font-bold uppercase text-accent tracking-wider">Top Earner</span>
              </div>
              <p className="text-lg font-extrabold text-white relative z-10">
                {insights.topEarner?.name || "N/A"}
              </p>
              <p className="text-xs text-muted-2 mt-1 relative z-10">
                {insights.topEarner ? `${formatCurrency(Math.round(insights.topEarner.revenue))} earned · ${insights.topEarner.completed} bookings` : "No data yet"}
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden group hover:border-success/30 transition-all duration-300">
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-success/10 blur-2xl" />
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="p-2 rounded-lg bg-success-dim border border-success-border">
                  <Sparkles className="w-4 h-4 text-success" />
                </div>
                <span className="text-[0.65rem] font-bold uppercase text-success tracking-wider">Most Popular Service</span>
              </div>
              <p className="text-lg font-extrabold text-white relative z-10">
                {insights.topService?.name || "N/A"}
              </p>
              <p className="text-xs text-muted-2 mt-1 relative z-10">
                {insights.topService ? `${formatCurrency(Math.round(insights.topService.revenue))} revenue · ${insights.topService.count} bookings` : "No data yet"}
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden group hover:border-info/30 transition-all duration-300">
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-info/10 blur-2xl" />
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="p-2 rounded-lg bg-info-dim border border-info-border">
                  <TrendingUp className="w-4 h-4 text-info" />
                </div>
                <span className="text-[0.65rem] font-bold uppercase text-info tracking-wider">Completion Rate</span>
              </div>
              <p className="text-lg font-extrabold text-white relative z-10">
                {kpis.completionRate}%
              </p>
              <p className="text-xs text-muted-2 mt-1 relative z-10">
                {kpis.completedBookings} of {kpis.totalBookings} bookings completed
              </p>
            </div>
          </motion.div>

          {/* ═══ HERO CHART: Revenue Trend (Full Width) ═══ */}
          <motion.div variants={fadeUp}>
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <SectionHeader icon={LineChartIcon} title="Revenue & Booking Trend" subtitle="Revenue generated from completed appointments" />
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[0.65rem] text-muted-2">
                    <span className="w-2 h-2 rounded-full bg-[#a855f7]"></span> Revenue
                  </div>
                  <div className="flex items-center gap-1.5 text-[0.65rem] text-muted-2">
                    <span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span> Bookings
                  </div>
                </div>
              </div>
              <div className="h-[280px] w-full -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartsData.trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="adminRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="bookingsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#525252" vertical={true} horizontal={true} />
                    <XAxis dataKey="date" stroke="#ffffff30" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" stroke="#ffffff30" fontSize={10} tickFormatter={v => `Rs.${v / 1000}k`} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#ffffff30" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip isCurrency />} />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#a855f7"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#adminRevGrad)"
                      dot={{ r: 3, fill: "#a855f7", stroke: "#0a0a0a", strokeWidth: 2 }}
                      activeDot={{ r: 5, stroke: "#a855f7", strokeWidth: 2, fill: "#0a0a0a" }}
                    />
                    <Bar 
                      yAxisId="right" 
                      dataKey="completed" 
                      name="Bookings" 
                      fill="url(#bookingsGrad)" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={40} 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* ═══ ROW 2: Booking Analytics + Booking Status ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <motion.div variants={fadeUp} className="lg:col-span-3">
              <Card className="h-full">
                <SectionHeader icon={BarChart3} title="Booking Analytics" subtitle="Daily breakdown by booking status" />
                <div className="h-[300px] w-full mt-4 -mx-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartsData.trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" vertical={false} />
                      <XAxis dataKey="date" stroke="#ffffff30" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="#ffffff30" fontSize={10} allowDecimals={false} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: "12px", fontSize: "11px" }} />
                      <Bar dataKey="completed" name="Completed" stackId="bookings" fill="#22c55e" radius={[0, 0, 0, 0]} barSize={16} />
                      <Bar dataKey="pending" name="Pending" stackId="bookings" fill="#f5c800" />
                      <Bar dataKey="cancelled" name="Cancelled" stackId="bookings" fill="#ef4444" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp} className="lg:col-span-2">
              <Card className="h-full flex flex-col">
                <SectionHeader icon={PieChartIcon} title="Booking Status" subtitle="Distribution overview" />
                <div className="flex-1 w-full flex items-center justify-center mt-2">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={chartsData.statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartsData.statusData.map((entry) => (
                          <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#888"} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom legend */}
                <div className="flex items-center justify-center gap-5 pt-2 pb-1 border-t border-border mt-auto">
                  {chartsData.statusData.map(entry => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.name] }}></span>
                      <span className="text-muted-2 font-medium">{entry.name}</span>
                      <span className="font-bold text-white">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* ═══ ROW 3: Staff Performance + Top Services ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div variants={fadeUp}>
              <Card className="h-full">
                <SectionHeader icon={Users} title="Staff Performance" subtitle="Completed bookings and revenue per staff member" />
                {chartsData.staffData.length === 0 ? (
                  <div className="py-16 text-center text-muted-2 text-xs">No staff performance data available.</div>
                ) : (
                  <div className="h-[300px] w-full mt-4 -mx-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartsData.staffData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" vertical={false} />
                        <XAxis dataKey="name" stroke="#ffffff30" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" stroke="#ffffff30" fontSize={10} allowDecimals={false} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" stroke="#ffffff30" fontSize={10} tickFormatter={val => `${val / 1000}k`} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: "12px", fontSize: "11px" }} />
                        <Bar yAxisId="left" dataKey="completed" name="Completed Bookings" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={18} />
                        <Bar yAxisId="right" dataKey="revenue" name="Revenue Generated" fill="#f472b6" radius={[4, 4, 0, 0]} barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card className="h-full">
                <SectionHeader icon={Sparkles} title="Top Performing Services" subtitle="Ranked by revenue contribution" />
                {chartsData.topServicesData.length === 0 ? (
                  <div className="py-16 text-center text-muted-2 text-xs">No completed service data available.</div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {chartsData.topServicesData.map((service, i) => {
                      const maxRevenue = chartsData.topServicesData[0]?.revenue || 1;
                      const percentage = Math.round((service.revenue / maxRevenue) * 100);
                      const color = CHART_COLORS[i % CHART_COLORS.length];
                      return (
                        <div key={service.name} className="group">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white" style={{ minWidth: "16px" }}>
                                #{i + 1}
                              </span>
                              <span className="text-sm font-semibold text-white/90">{service.name}</span>
                            </div>
                            <span className="text-xs font-bold text-accent">{formatCurrency(Math.round(service.revenue))}</span>
                          </div>
                          <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: color }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[0.6rem] text-muted">{service.count} bookings</span>
                            <span className="text-[0.6rem] text-muted">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </motion.div>
          </div>


          {/* ═══ RECENT ACTIVITY ═══ */}
          <motion.div variants={fadeUp}>
            <Card>
              <SectionHeader icon={Clock} title="Recent Activity" subtitle="Latest booking events in your salon" />
              <div className="flex flex-col gap-0 mt-4">
                {recentActivity.length === 0 ? (
                  <p className="text-muted-2 text-sm py-8 text-center">No recent activity found.</p>
                ) : (
                  recentActivity.map((a, i) => {
                    const isCompleted = a.status === 'completed';
                    const isCancelled = a.status === 'cancelled' || a.status === 'rejected';

                    let ActivityIcon = Clock;
                    let iconBg = "bg-warning-dim border-warning-border";
                    let iconColor = "text-warning";
                    let text = `New booking created for ${a.appointment_date}`;

                    if (isCompleted) {
                      ActivityIcon = CheckCircle;
                      iconBg = "bg-success-dim border-success-border";
                      iconColor = "text-success";
                      text = `Appointment completed (${formatCurrency(a.total_price || 0)})`;
                    } else if (isCancelled) {
                      ActivityIcon = XCircle;
                      iconBg = "bg-danger-dim border-danger-border";
                      iconColor = "text-danger";
                      text = `Appointment cancelled`;
                    }

                    return (
                      <div key={a._id || i} className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0 hover:bg-surface-2/30 transition-colors px-2 -mx-2 rounded-lg">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${iconBg}`}>
                          <ActivityIcon className={`w-4 h-4 ${iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-semibold truncate">
                            {a.customer_id?.name || a.guest_name || "Unknown Customer"}
                          </p>
                          <p className="text-[0.65rem] text-muted-2 truncate">{text}</p>
                        </div>
                        <div className="text-[0.65rem] text-muted font-mono flex-shrink-0">
                          {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : a.appointment_date}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </motion.div>

        </motion.div>
      )}
    </div>
  );
}

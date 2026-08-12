import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users, UserPlus, Calendar, CheckCircle,
  XCircle, DollarSign, TrendingUp, Activity,
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

import api from "../../services/api";
import { getSalonAppointments } from "../../services/appointmentService";
import { getSalons } from "../../services/salonService";
import { getRevenueStats } from "../../services/revenueService";

import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
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

/* ── KPI config ── */
const KPI_CONFIG = [
  { key: "totalRevenue", label: "Total Revenue", icon: DollarSign, color: "#22c55e", isCurrency: true, sub: "vs previous period", hasTrend: true },
  { key: "totalBookings", label: "Total Bookings", icon: Calendar, color: "#38bdf8", sub: "in selected period" },
  { key: "completedBookings", label: "Completed", icon: CheckCircle, color: "#f5c800", sub: "successfully finished" },
  { key: "totalUsers", label: "Total Users", icon: Users, color: "#a855f7", sub: "lifetime registered" },
  { key: "activeUsers", label: "Active Users", icon: Activity, color: "#f472b6", sub: "booked in period" },
  { key: "newRegistrations", label: "New Signups", icon: UserPlus, color: "#6366f1", sub: "in selected period" },
  { key: "cancelledBookings", label: "Cancelled", icon: XCircle, color: "#ef4444", sub: "in selected period" },
  { key: "completionRate", label: "Completion Rate", icon: TrendingUp, color: "#f59e0b", isPercent: true, sub: "of total bookings" },
];

/* ── Custom Tooltip Components ── */
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
/*                  MAIN COMPONENT                 */
/* ═══════════════════════════════════════════════ */
export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState("30days");

  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [salons, setSalons] = useState([]);
  const [revenueStats, setRevenueStats] = useState(null);

  /* ── Fetch ── */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [apptsRes, custRes, salonsRes, revStatsRes] = await Promise.allSettled([
        getSalonAppointments("all"),
        api.get("/customers"),
        getSalons(),
        getRevenueStats(dateRange)
      ]);

      if (apptsRes.status === "fulfilled") setAppointments(apptsRes.value.data || []);
      if (custRes.status === "fulfilled") setCustomers(custRes.value.data || []);
      if (salonsRes.status === "fulfilled") setSalons(salonsRes.value.data || []);
      if (revStatsRes.status === "fulfilled") setRevenueStats(revStatsRes.value.data);

    } catch (err) {
      console.error(err);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Derived: Date-Filtered Data ── */
  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate = new Date(0);

    if (dateRange === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateRange === "7days") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (dateRange === "30days") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (dateRange === "90days") {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (dateRange === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const startISO = startDate.toISOString().split("T")[0];

    const filteredAppointments = appointments.filter(a => {
      const aDate = a.appointment_date || (a.createdAt && a.createdAt.split("T")[0]);
      return aDate >= startISO;
    });

    const filteredCustomers = customers.filter(c => {
      const custDate = c.registration_date || c.createdAt;
      if (!custDate) return true;
      return new Date(custDate) >= startDate;
    });

    return { filteredAppointments, filteredCustomers };
  }, [appointments, customers, dateRange]);

  /* ── KPI Calculations ── */
  const kpis = useMemo(() => {
    const { filteredAppointments, filteredCustomers } = filteredData;

    const totalUsers = customers.length;
    const newRegistrations = filteredCustomers.length;

    const activeUserIds = new Set(filteredAppointments.filter(a => a.customer_id).map(a => a.customer_id?._id || a.customer_id));
    const activeUsers = activeUserIds.size;

    const totalBookings = filteredAppointments.length;
    const completedBookings = filteredAppointments.filter(a => a.status === "completed").length;
    const cancelledBookings = filteredAppointments.filter(a => a.status === "cancelled" || a.status === "rejected").length;

    const computedRevenue = filteredAppointments
      .filter(a => a.status === "completed")
      .reduce((sum, a) => sum + (a.total_price || 0), 0);

    const completionRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0;

    return {
      totalUsers,
      activeUsers,
      newRegistrations,
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue: revenueStats?.grossRevenue || computedRevenue,
      monthlyGrowth: revenueStats?.grossGrowth || 0,
      completionRate
    };
  }, [filteredData, customers, revenueStats]);

  /* ── Charts Data ── */
  const chartsData = useMemo(() => {
    const { filteredAppointments, filteredCustomers } = filteredData;

    // 1. Revenue & Booking Trend
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
    const trendData = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

    // 2. User Growth
    const userGrowthMap = {};
    filteredCustomers.forEach(c => {
      const custDate = c.registration_date || c.createdAt;
      const date = custDate ? custDate.split("T")[0] : null;
      if (!date) return;
      if (!userGrowthMap[date]) userGrowthMap[date] = { date, newUsers: 0 };
      userGrowthMap[date].newUsers += 1;
    });
    const userGrowthData = Object.values(userGrowthMap).sort((a, b) => a.date.localeCompare(b.date));

    // 3. Top Services
    const serviceMap = {};
    filteredAppointments.forEach(a => {
      if (a.status === "completed" && a.service_ids && a.service_ids.length > 0) {
        a.service_ids.forEach(s => {
          const sName = s?.service_name || s?.name || "Unknown Service";
          if (!serviceMap[sName]) serviceMap[sName] = { name: sName, revenue: 0, count: 0 };
          const avgPrice = a.total_price / a.service_ids.length;
          serviceMap[sName].revenue += avgPrice;
          serviceMap[sName].count += 1;
        });
      }
    });
    const topServicesData = Object.values(serviceMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 4. Booking Status Pie
    const statusData = [
      { name: "Completed", value: kpis.completedBookings },
      { name: "Pending", value: kpis.totalBookings - kpis.completedBookings - kpis.cancelledBookings },
      { name: "Cancelled", value: kpis.cancelledBookings },
    ].filter(d => d.value > 0);

    // 5. Revenue by Salon
    const salonRevMap = {};
    filteredAppointments.forEach(a => {
      if (a.status === "completed" && a.salon_id) {
        const salonName = salons.find(s => s._id === (a.salon_id?._id || a.salon_id))?.name || "Unknown";
        if (!salonRevMap[salonName]) salonRevMap[salonName] = 0;
        salonRevMap[salonName] += (a.total_price || 0);
      }
    });
    const salonRevenueData = Object.keys(salonRevMap).map(k => ({ name: k, value: salonRevMap[k] }));

    return { trendData, userGrowthData, topServicesData, statusData, salonRevenueData };
  }, [filteredData, kpis, salons]);

  const formatCurrency = (val) => `Rs. ${val.toLocaleString()}`;

  /* ── Date Range Options ── */
  const dateRangeOptions = [
    { value: "today", label: "Today" },
    { value: "7days", label: "7 Days" },
    { value: "30days", label: "30 Days" },
    { value: "90days", label: "90 Days" },
    { value: "year", label: "This Year" },
    { value: "all", label: "All Time" },
  ];

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div className="pb-10">
      <PageHeader title="Analytics" subtitle="Comprehensive performance and growth metrics" backTo="/superAdminDashboard">
        {/* Pill-style date range selector */}
        <div className="flex items-center bg-surface-2 border border-border rounded-xl p-1 gap-0.5">
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
      </PageHeader>

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
          <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {KPI_CONFIG.map((cfg, i) => {
              const Icon = cfg.icon;
              let displayVal;
              if (cfg.isCurrency) displayVal = formatCurrency(kpis[cfg.key]);
              else if (cfg.isPercent) displayVal = `${kpis[cfg.key]}%`;
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
                    <div className="flex items-center gap-1.5">
                      {cfg.hasTrend && (
                        <span className={`text-[0.6rem] font-bold px-1.5 py-0.5 rounded ${kpis.monthlyGrowth >= 0 ? "bg-success-dim text-success" : "bg-danger-dim text-danger"}`}>
                          {kpis.monthlyGrowth >= 0 ? "↑" : "↓"}{Math.abs(kpis.monthlyGrowth)}%
                        </span>
                      )}
                      <span className="text-[0.6rem] text-muted font-medium">{cfg.sub}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* ═══ HERO CHART: Revenue Trend (Full Width) ═══ */}
          <motion.div variants={fadeUp}>
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <SectionHeader icon={LineChartIcon} title="Revenue Overview" subtitle="Revenue generated from completed appointments" />
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-[0.65rem] text-muted-2">
                    <span className="w-2 h-2 rounded-full bg-[#a855f7]"></span> Revenue
                  </div>
                </div>
              </div>
              <div className="h-[280px] w-full -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartsData.trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" vertical={false} />
                    <XAxis dataKey="date" stroke="#ffffff30" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#ffffff30" fontSize={10} tickFormatter={v => `Rs.${v / 1000}k`} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip isCurrency />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#a855f7"
                      strokeWidth={2.5}
                      fill="url(#revGrad)"
                      dot={{ r: 3, fill: "#a855f7", stroke: "#0a0a0a", strokeWidth: 2 }}
                      activeDot={{ r: 5, stroke: "#a855f7", strokeWidth: 2, fill: "#0a0a0a" }}
                    />
                  </AreaChart>
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
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ paddingTop: "12px", fontSize: "11px" }}
                      />
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
                {/* Custom legend below */}
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

          {/* ═══ ROW 3: User Growth + Top Services ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div variants={fadeUp}>
              <Card className="h-full">
                <SectionHeader icon={UserPlus} title="User Growth" subtitle="New customer registrations over time" />
                <div className="h-[280px] w-full mt-4 -mx-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartsData.userGrowthData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" vertical={false} />
                      <XAxis dataKey="date" stroke="#ffffff30" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="#ffffff30" fontSize={10} allowDecimals={false} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="newUsers"
                        name="New Registrations"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        fill="url(#userGrad)"
                        dot={{ r: 3, fill: "#6366f1", stroke: "#0a0a0a", strokeWidth: 2 }}
                        activeDot={{ r: 5, stroke: "#6366f1", strokeWidth: 2, fill: "#0a0a0a" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
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

          {/* ═══ ROW 4: Revenue by Salon (full-width) ═══ */}
          <motion.div variants={fadeUp}>
            <Card>
              <SectionHeader icon={DollarSign} title="Revenue by Salon" subtitle="Revenue distribution across all salon branches" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                {/* Donut chart */}
                <div className="h-[280px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartsData.salonRevenueData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={100}
                        dataKey="value"
                        stroke="none"
                        paddingAngle={2}
                      >
                        {chartsData.salonRevenueData.map((entry, index) => (
                          <Cell key={`salon-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={tooltipStyle}
                        itemStyle={tooltipItemStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend list */}
                <div className="flex flex-col justify-center gap-3">
                  {chartsData.salonRevenueData.length === 0 ? (
                    <p className="text-xs text-muted-2 text-center py-8">No salon revenue data available.</p>
                  ) : (
                    chartsData.salonRevenueData.map((salon, i) => {
                      const totalSalonRev = chartsData.salonRevenueData.reduce((s, d) => s + d.value, 0);
                      const pct = totalSalonRev > 0 ? Math.round((salon.value / totalSalonRev) * 100) : 0;
                      return (
                        <div key={salon.name} className="flex items-center gap-3 p-3 bg-surface-2 border border-border rounded-xl hover:border-border-hover transition-colors">
                          <span
                            className="w-3 h-3 rounded-md flex-shrink-0"
                            style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{salon.name}</p>
                            <p className="text-[0.65rem] text-muted-2">{pct}% of total revenue</p>
                          </div>
                          <span className="text-sm font-extrabold text-accent">{formatCurrency(salon.value)}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

        </motion.div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Users, UserPlus, Calendar, CheckCircle, 
  XCircle, DollarSign, TrendingUp, Activity
} from "lucide-react";
import { motion } from "framer-motion";
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

const COLORS = ["#8b5cf6", "#10b981", "#ef4444", "#f59e0b", "#3b82f6", "#ec4899", "#14b8a6", "#6366f1"];

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState("30days"); // today, 7days, 30days, 90days, year, all

  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [salons, setSalons] = useState([]);
  const [revenueStats, setRevenueStats] = useState(null);

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

  // Derived State based on Date Range
  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate = new Date(0); // Default to all time

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
      // Handle both date strings (appointment_date) and ISO strings (createdAt)
      const aDate = a.appointment_date || (a.createdAt && a.createdAt.split("T")[0]);
      return aDate >= startISO;
    });

    const filteredCustomers = customers.filter(c => {
      if (!c.createdAt) return true; // Include if no date
      return new Date(c.createdAt) >= startDate;
    });

    return { filteredAppointments, filteredCustomers };
  }, [appointments, customers, dateRange]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const { filteredAppointments, filteredCustomers } = filteredData;

    const totalUsers = customers.length; // Total all time
    const newRegistrations = filteredCustomers.length;
    
    // Active users: Users who made an appointment in the period
    const activeUserIds = new Set(filteredAppointments.filter(a => a.customer_id).map(a => a.customer_id?._id || a.customer_id));
    const activeUsers = activeUserIds.size;

    const totalBookings = filteredAppointments.length;
    const completedBookings = filteredAppointments.filter(a => a.status === "completed").length;
    const cancelledBookings = filteredAppointments.filter(a => a.status === "cancelled" || a.status === "rejected").length;
    
    const computedRevenue = filteredAppointments
      .filter(a => a.status === "completed")
      .reduce((sum, a) => sum + (a.total_price || 0), 0);

    return {
      totalUsers,
      activeUsers,
      newRegistrations,
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue: revenueStats?.grossRevenue || computedRevenue,
      monthlyGrowth: revenueStats?.grossGrowth || 0
    };
  }, [filteredData, customers, revenueStats]);

  // Charts Data Calculations
  const chartsData = useMemo(() => {
    const { filteredAppointments, filteredCustomers } = filteredData;
    
    // 1. Revenue & Booking Trend (Group by Date)
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

    // 2. User Growth (New users per date)
    const userGrowthMap = {};
    filteredCustomers.forEach(c => {
      const date = c.createdAt ? c.createdAt.split("T")[0] : null;
      if (!date) return;
      if (!userGrowthMap[date]) userGrowthMap[date] = { date, newUsers: 0 };
      userGrowthMap[date].newUsers += 1;
    });
    const userGrowthData = Object.values(userGrowthMap).sort((a, b) => a.date.localeCompare(b.date));

    // 3. Top Performing Services (Horizontal Bar)
    const serviceMap = {};
    filteredAppointments.forEach(a => {
      if (a.status === "completed" && a.service_ids && a.service_ids.length > 0) {
        a.service_ids.forEach(s => {
          const sName = s?.service_name || s?.name || "Unknown Service";
          if (!serviceMap[sName]) serviceMap[sName] = { name: sName, revenue: 0, count: 0 };
          // Simple approximation: divide total price by number of services
          const avgPrice = a.total_price / a.service_ids.length;
          serviceMap[sName].revenue += avgPrice;
          serviceMap[sName].count += 1;
        });
      }
    });
    const topServicesData = Object.values(serviceMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // Top 5

    // 4. Booking Status (Pie)
    const statusData = [
      { name: "Completed", value: kpis.completedBookings },
      { name: "Pending", value: kpis.totalBookings - kpis.completedBookings - kpis.cancelledBookings },
      { name: "Cancelled", value: kpis.cancelledBookings },
    ].filter(d => d.value > 0);

    // 5. Revenue Distribution by Salon (Donut)
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

  const renderKpiCard = (title, value, icon, trend, subtext, colorClass) => (
    <Card className="relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500" />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[0.65rem] font-bold tracking-widest uppercase text-muted-2 mb-1.5">{title}</p>
          <h3 className="text-3xl font-black text-white">{value}</h3>
          {(trend !== undefined || subtext) && (
            <div className="flex items-center gap-2 mt-2">
              {trend !== undefined && (
                <span className={`text-xs font-bold ${trend >= 0 ? "text-success" : "text-danger"}`}>
                  {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
                </span>
              )}
              {subtext && <span className="text-xs text-muted-2 font-medium">{subtext}</span>}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-white/5 border border-white/10 ${colorClass}`}>
          {icon}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="pb-10">
      <PageHeader title="Analytics" subtitle="Comprehensive performance and growth metrics" backTo="/superAdminDashboard">
        <select 
          value={dateRange} 
          onChange={(e) => setDateRange(e.target.value)}
          className="bg-surface-2 border border-border text-white text-sm rounded-lg focus:ring-accent focus:border-accent block w-full p-2.5 outline-none"
        >
          <option value="today">Today</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
          <option value="year">This Year</option>
          <option value="all">All Time</option>
        </select>
      </PageHeader>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-danger-dim border border-danger/30 text-sm text-danger font-medium mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner.FullPage />
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-6"
        >
          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderKpiCard("Total Revenue", formatCurrency(kpis.totalRevenue), <DollarSign className="w-6 h-6" />, kpis.monthlyGrowth, "vs previous period", "text-emerald-400")}
            {renderKpiCard("Total Bookings", kpis.totalBookings, <Calendar className="w-6 h-6" />, undefined, "in selected period", "text-blue-400")}
            {renderKpiCard("Completed", kpis.completedBookings, <CheckCircle className="w-6 h-6" />, undefined, "successfully finished", "text-accent")}
            {renderKpiCard("Total Users", kpis.totalUsers, <Users className="w-6 h-6" />, undefined, "lifetime registered", "text-purple-400")}
            {renderKpiCard("Active Users", kpis.activeUsers, <Activity className="w-6 h-6" />, undefined, "made booking in period", "text-pink-400")}
            {renderKpiCard("New Reg.", kpis.newRegistrations, <UserPlus className="w-6 h-6" />, undefined, "in selected period", "text-indigo-400")}
            {renderKpiCard("Cancelled", kpis.cancelledBookings, <XCircle className="w-6 h-6" />, undefined, "in selected period", "text-red-400")}
            {renderKpiCard("Completion Rate", kpis.totalBookings > 0 ? Math.round((kpis.completedBookings / kpis.totalBookings) * 100) + "%" : "0%", <TrendingUp className="w-6 h-6" />, undefined, "of total bookings", "text-amber-400")}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 flex flex-col min-h-[350px]">
              <h3 className="text-sm font-bold text-white mb-6">Revenue Trend</h3>
              <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartsData.trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="date" stroke="#ffffff50" fontSize={12} tickMargin={10} />
                    <YAxis stroke="#ffffff50" fontSize={12} tickFormatter={(value) => `Rs.${value/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#ffffff20', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend iconType="circle" />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="flex flex-col min-h-[350px]">
              <h3 className="text-sm font-bold text-white mb-6">Booking Status</h3>
              <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartsData.statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartsData.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#ffffff20', borderRadius: '8px' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="flex flex-col min-h-[350px]">
              <h3 className="text-sm font-bold text-white mb-6">Booking Analytics</h3>
              <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartsData.trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="date" stroke="#ffffff50" fontSize={12} tickMargin={10} />
                    <YAxis stroke="#ffffff50" fontSize={12} allowDecimals={false} />
                    <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#ffffff20', borderRadius: '8px' }} />
                    <Legend iconType="circle" />
                    <Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="pending" name="Pending" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="cancelled" name="Cancelled" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="flex flex-col min-h-[350px]">
              <h3 className="text-sm font-bold text-white mb-6">User Growth</h3>
              <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartsData.userGrowthData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="date" stroke="#ffffff50" fontSize={12} tickMargin={10} />
                    <YAxis stroke="#ffffff50" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#ffffff20', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="newUsers" name="New Registrations" stroke="#ec4899" fillOpacity={1} fill="url(#colorUsers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Charts Row 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="flex flex-col min-h-[350px]">
              <h3 className="text-sm font-bold text-white mb-6">Revenue by Salon</h3>
              <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartsData.salonRevenueData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {chartsData.salonRevenueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: '#18181b', borderColor: '#ffffff20', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="flex flex-col min-h-[350px]">
              <h3 className="text-sm font-bold text-white mb-6">Top Performing Services</h3>
              <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartsData.topServicesData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="#ffffff50" fontSize={12} tickFormatter={(value) => `Rs.${value/1000}k`} />
                    <YAxis dataKey="name" type="category" stroke="#ffffff50" fontSize={11} width={80} />
                    <Tooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#ffffff20', borderRadius: '8px' }} />
                    <Bar dataKey="revenue" name="Revenue" fill="#14b8a6" radius={[0, 4, 4, 0]}>
                      {chartsData.topServicesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

        </motion.div>
      )}
    </div>
  );
}

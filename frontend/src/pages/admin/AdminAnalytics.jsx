import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { 
  Users, UserPlus, Calendar, CheckCircle, 
  XCircle, DollarSign, TrendingUp, Activity,
  Clock, Scissors, Star
} from "lucide-react";
import { motion } from "framer-motion";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

import api from "../../services/api";
import { getSalonAppointments } from "../../services/appointmentService";
import { getStaff } from "../../services/staffService";
import { getServices } from "../../services/serviceService";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Spinner from "../../components/ui/Spinner";

const COLORS = ["#8b5cf6", "#10b981", "#ef4444", "#f59e0b", "#3b82f6", "#ec4899", "#14b8a6", "#6366f1"];

export default function AdminAnalytics() {
  const { salonId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState("30days"); 

  const [appointments, setAppointments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);

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

  // Derived State based on Date Range
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
    
    // For "yesterday", we also need an end date
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

    // Customers who had an appointment in this salon
    const salonCustomerIds = new Set(appointments.filter(a => a.customer_id).map(a => typeof a.customer_id === "object" ? a.customer_id._id : a.customer_id));
    const salonCustomers = allCustomers.filter(c => salonCustomerIds.has(c._id));

    return { filteredAppointments, salonCustomers, startDate, endISO };
  }, [appointments, allCustomers, dateRange]);

  const kpis = useMemo(() => {
    const { filteredAppointments, salonCustomers, startDate } = filteredData;

    const totalBookings = filteredAppointments.length;
    const completedBookings = filteredAppointments.filter(a => a.status === "completed").length;
    const cancelledBookings = filteredAppointments.filter(a => a.status === "cancelled" || a.status === "rejected").length;
    
    const totalRevenue = filteredAppointments
      .filter(a => a.status === "completed")
      .reduce((sum, a) => sum + (a.total_price || 0), 0);

    const avgBookingValue = completedBookings > 0 ? totalRevenue / completedBookings : 0;

    const totalCustomers = salonCustomers.length;
    const newCustomers = salonCustomers.filter(c => c.createdAt && new Date(c.createdAt) >= startDate).length;
    const returningCustomers = totalCustomers - newCustomers;

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      avgBookingValue,
      totalCustomers,
      newCustomers,
      returningCustomers
    };
  }, [filteredData]);

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
    const trendData = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

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
    services.forEach(s => serviceMap[s._id] = { name: s.name || "Unknown", revenue: 0, count: 0 });
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

    // 5. Customer Growth (Cumulative or New)
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

  const recentActivity = useMemo(() => {
    return [...appointments]
      .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0))
      .slice(0, 8);
  }, [appointments]);

  const formatCurrency = (val) => `Rs. ${val.toLocaleString()}`;

  const renderKpiCard = (title, value, icon, subtext, colorClass) => (
    <Card className="relative overflow-hidden group border border-white/5">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500" />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[0.65rem] font-bold tracking-widest uppercase text-muted-2 mb-1.5">{title}</p>
          <h3 className="text-3xl font-black text-white">{value}</h3>
          {subtext && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-2 font-medium">{subtext}</span>
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
    <div className="min-h-[60vh]">
      
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <PageHeader title="Business Analytics" subtitle="Monitor your salon's performance and growth" backTo={`/salon-admin/${salonId}/adminDashboard`} />
        
        <select 
          value={dateRange} 
          onChange={(e) => setDateRange(e.target.value)}
          className="bg-surface-2 border border-border text-white text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none min-w-[160px]"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
          <option value="year">This Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {renderKpiCard("Total Revenue", formatCurrency(kpis.totalRevenue), <DollarSign className="w-6 h-6" />, "in selected period", "text-emerald-400")}
            {renderKpiCard("Total Bookings", kpis.totalBookings, <Calendar className="w-6 h-6" />, "appointments made", "text-blue-400")}
            {renderKpiCard("Completed", kpis.completedBookings, <CheckCircle className="w-6 h-6" />, "appointments finished", "text-accent")}
            {renderKpiCard("Avg Booking Value", formatCurrency(kpis.avgBookingValue.toFixed(0)), <TrendingUp className="w-6 h-6" />, "per completed booking", "text-amber-400")}
            
            {renderKpiCard("Total Customers", kpis.totalCustomers, <Users className="w-6 h-6" />, "lifetime distinct clients", "text-purple-400")}
            {renderKpiCard("New Customers", kpis.newCustomers, <UserPlus className="w-6 h-6" />, "registered in period", "text-pink-400")}
            {renderKpiCard("Cancelled", kpis.cancelledBookings, <XCircle className="w-6 h-6" />, "appointments cancelled", "text-red-400")}
            {renderKpiCard("Returning", kpis.returningCustomers, <Activity className="w-6 h-6" />, "returning clients", "text-indigo-400")}
          </div>

          {/* Smart Insights (Mocked for visual, driven by data) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Card className="bg-gradient-to-br from-surface to-accent/5 border-accent/20">
               <h4 className="text-xs font-bold uppercase text-accent mb-1 tracking-wider">Top Earner</h4>
               <p className="text-lg font-semibold text-white">
                 {chartsData.staffData.length > 0 ? chartsData.staffData.sort((a,b)=>b.revenue-a.revenue)[0].name : "N/A"}
               </p>
               <p className="text-xs text-muted-2 mt-1">Generated the most revenue</p>
             </Card>
             <Card className="bg-gradient-to-br from-surface to-emerald-500/5 border-emerald-500/20">
               <h4 className="text-xs font-bold uppercase text-emerald-500 mb-1 tracking-wider">Most Popular Service</h4>
               <p className="text-lg font-semibold text-white">
                 {chartsData.topServicesData.length > 0 ? chartsData.topServicesData[0].name : "N/A"}
               </p>
               <p className="text-xs text-muted-2 mt-1">Booked most frequently</p>
             </Card>
             <Card className="bg-gradient-to-br from-surface to-blue-500/5 border-blue-500/20">
               <h4 className="text-xs font-bold uppercase text-blue-500 mb-1 tracking-wider">Completion Rate</h4>
               <p className="text-lg font-semibold text-white">
                 {kpis.totalBookings > 0 ? Math.round((kpis.completedBookings / kpis.totalBookings) * 100) : 0}%
               </p>
               <p className="text-xs text-muted-2 mt-1">Bookings successfully completed</p>
             </Card>
          </div>

          {/* Main Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 flex flex-col min-h-[350px]">
              <h3 className="text-sm font-bold text-white mb-6">Revenue & Booking Trend</h3>
              <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartsData.trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="date" stroke="#ffffff50" fontSize={12} tickMargin={10} />
                    <YAxis stroke="#ffffff50" fontSize={12} tickFormatter={(value) => `Rs.${value/1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#ffffff20', borderRadius: '8px' }} />
                    <Legend iconType="circle" />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="flex flex-col min-h-[350px]">
              <h3 className="text-sm font-bold text-white mb-6">Staff Performance</h3>
              <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartsData.staffData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} tickMargin={10} />
                    <YAxis yAxisId="left" stroke="#ffffff50" fontSize={12} allowDecimals={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#ffffff50" fontSize={12} tickFormatter={(val) => `${val/1000}k`} />
                    <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#ffffff20', borderRadius: '8px' }} />
                    <Legend iconType="circle" />
                    <Bar yAxisId="left" dataKey="completed" name="Completed Bookings" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="revenue" name="Revenue Generated" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
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
                    <Bar dataKey="revenue" name="Revenue" fill="#f59e0b" radius={[0, 4, 4, 0]}>
                      {chartsData.topServicesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
          
          {/* Recent Activity Feed */}
          <Card>
             <h3 className="text-sm font-bold text-white mb-6">Recent Activity</h3>
             <div className="flex flex-col gap-4">
                {recentActivity.length === 0 ? (
                  <p className="text-muted-2 text-sm">No recent activity found.</p>
                ) : (
                  recentActivity.map((a, i) => {
                    const isCompleted = a.status === 'completed';
                    const isCancelled = a.status === 'cancelled' || a.status === 'rejected';
                    
                    let Icon = Clock;
                    let color = "text-amber-400 bg-amber-400/10";
                    let text = `New booking created for ${a.appointment_date}`;

                    if (isCompleted) {
                      Icon = CheckCircle;
                      color = "text-emerald-400 bg-emerald-400/10";
                      text = `Appointment completed (${formatCurrency(a.total_price)})`;
                    } else if (isCancelled) {
                      Icon = XCircle;
                      color = "text-red-400 bg-red-400/10";
                      text = `Appointment cancelled`;
                    }

                    return (
                      <div key={a._id || i} className="flex items-center gap-4 py-2 border-b border-white/5 last:border-0">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                            <Icon className="w-5 h-5" />
                         </div>
                         <div className="flex-1">
                            <p className="text-sm text-white font-medium">
                              {a.customer_id?.name || a.guest_name || "Unknown Customer"}
                            </p>
                            <p className="text-xs text-muted-2">{text}</p>
                         </div>
                         <div className="text-xs text-muted-2 font-mono">
                            {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : a.appointment_date}
                         </div>
                      </div>
                    )
                  })
                )}
             </div>
          </Card>

        </motion.div>
      )}
    </div>
  );
}

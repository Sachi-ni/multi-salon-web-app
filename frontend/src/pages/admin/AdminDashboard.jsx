import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getSalon } from "../../services/salonService";
import { getSalonAppointments, confirmAppointment, completeAppointment } from "../../services/appointmentService";
import { getStaff } from "../../services/staffService";
import { getSalonFeedback } from "../../services/feedbackService";
import { getDailyReport } from "../../services/billingService";

import {
  Calendar,
  Users,
  Star,
  ArrowRight,
  CalendarPlus,
  UserPlus,
  MapPin,
  TrendingUp,
  ChevronRight,
  Store,
  Coins,
  MessageSquare
} from "lucide-react";

import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Table from "../../components/ui/Table";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { user } = useAuth();
  let salonId = params.salonId;
  if (!salonId) {
    const match = window.location.pathname.match(/^\/salon-admin\/([^/]+)/);
    if (match) salonId = match[1];
  }

  const [salon, setSalon] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [reportData, setReportData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const startStr = thirtyDaysAgo.toISOString().split("T")[0];
      const endStr = today.toISOString().split("T")[0];

      const [salonRes, apptRes, staffRes, feedbackRes, reportRes] = await Promise.allSettled([
        getSalon(salonId),
        getSalonAppointments(salonId),
        getStaff(salonId),
        getSalonFeedback(salonId),
        getDailyReport(startStr, endStr, salonId),
      ]);

      if (salonRes.status === "fulfilled") setSalon(salonRes.value.data);
      if (apptRes.status === "fulfilled") setAppointments(apptRes.value.data || []);
      if (staffRes.status === "fulfilled") setStaffList(staffRes.value.data || []);
      if (feedbackRes.status === "fulfilled") setFeedbacks(feedbackRes.value.data || []);
      if (reportRes.status === "fulfilled") setReportData(reportRes.value.data);

    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError("Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  }, [salonId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Aggregate Ratings
  const avgRating = useMemo(() => {
    if (!feedbacks.length) return "0.0";
    const total = feedbacks.reduce((acc, curr) => acc + ((curr.serviceRating + curr.staffRating) / 2), 0);
    return (total / feedbacks.length).toFixed(1);
  }, [feedbacks]);

  // Total Projected Revenue (Completed + Confirmed)
  const totalRevenue = useMemo(() => {
    if (reportData?.totalProjectedRevenue) return reportData.totalProjectedRevenue;
    const valid = appointments.filter(a => ["completed", "confirmed"].includes(a.status));
    return valid.reduce((sum, a) => sum + (a.total_price || a.service_id?.base_price || 0), 0);
  }, [appointments, reportData]);

  // 7-day chart trend data
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });

    return last7Days.map((dateStr) => {
      const dayAppts = appointments.filter((a) => a.appointment_date === dateStr);
      const dayRevenue = dayAppts
        .filter((a) => ["completed", "confirmed"].includes(a.status))
        .reduce((sum, a) => sum + (a.total_price || a.service_id?.base_price || 0), 0);

      const label = new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" });
      return {
        date: label,
        revenue: dayRevenue,
        bookings: dayAppts.length,
      };
    });
  }, [appointments]);

  const recentAppointments = useMemo(() => {
    return appointments.slice(0, 5);
  }, [appointments]);

  const handleConfirm = async (id) => {
    setActionLoading(id);
    try {
      await confirmAppointment(id);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading("");
    }
  };

  const handleComplete = async (id) => {
    setActionLoading(id);
    try {
      await completeAppointment(id);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading("");
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return <Badge variant="success">Confirmed</Badge>;
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      case "completed":
        return <Badge variant="info">Completed</Badge>;
      case "cancelled":
      case "rejected":
        return <Badge variant="danger">{status}</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-surface-2 animate-pulse rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-surface border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salon Branch Dashboard"
        subtitle={`Welcome back, ${salon?.name || "Salon Manager"}!`}
        backTo={user?.role === "super-admin" ? "/superAdminDashboard" : undefined}
      >
        <Button
          variant="primary"
          icon={CalendarPlus}
          onClick={() => navigate(`/salon-admin/${salonId}/AddAppointment`)}
        >
          New Appointment
        </Button>
      </PageHeader>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/20 text-danger rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Salon Branch Banner */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white leading-tight">{salon?.name || "Branch Location"}</h2>
              <Badge variant="success" dot={true}>Active Branch</Badge>
            </div>
            <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              {salon?.location || salon?.address || "Address not provided"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/salon-admin/${salonId}/adminStaff`)}
            className="px-3.5 py-2 rounded-xl bg-surface-2 border border-border text-xs font-bold text-neutral-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>{staffList.length} Stylists</span>
          </button>
          <button
            onClick={() => navigate(`/salon-admin/${salonId}/adminReviews`)}
            className="px-3.5 py-2 rounded-xl bg-amber-400/10 border border-amber-400/30 text-xs font-black text-amber-400 hover:bg-amber-400 hover:text-black transition-all flex items-center gap-1.5"
          >
            <Star className="w-4 h-4 fill-amber-400" />
            <span>{avgRating} Rating</span>
          </button>
        </div>
      </div>

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-card hover:border-amber-400/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Branch Revenue</span>
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <Coins className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-xl font-black text-amber-400 leading-none">LKR {totalRevenue.toLocaleString()}</h3>
            <p className="text-2xs text-neutral-400 mt-2 font-medium">Earned + Confirmed bookings</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-card hover:border-amber-400/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Total Bookings</span>
              <div className="w-10 h-10 rounded-xl bg-blue-400/10 border border-blue-400/30 flex items-center justify-center text-blue-400">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-xl font-black text-white leading-none">{appointments.length}</h3>
            <p className="text-2xs text-neutral-400 mt-2 font-medium">
              {appointments.filter(a => a.status === "pending").length} Pending · {appointments.filter(a => a.status === "confirmed").length} Confirmed
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-card hover:border-amber-400/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Active Staff</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-xl font-black text-white leading-none">{staffList.length} Members</h3>
            <p className="text-2xs text-neutral-400 mt-2 font-medium">Salon stylists & staff</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-card hover:border-amber-400/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Customer Rating</span>
              <div className="w-10 h-10 rounded-xl bg-purple-400/10 border border-purple-400/30 flex items-center justify-center text-purple-400">
                <Star className="w-5 h-5 fill-purple-400" />
              </div>
            </div>
            <h3 className="text-xl font-black text-white leading-none">{avgRating} / 5.0</h3>
            <p className="text-2xs text-neutral-400 mt-2 font-medium">Based on {feedbacks.length} reviews</p>
          </div>
        </motion.div>
      </div>

      {/* Revenue & Booking Trends Chart */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              7-Day Booking & Revenue Trend
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">Daily performance overview for your branch</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Revenue (LKR)
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" /> Bookings
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="bookingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="date" stroke="#737373" fontSize={11} tickLine={false} />
              <YAxis stroke="#737373" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#171717", borderColor: "#404040", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGradient)" name="Revenue (LKR)" />
              <Area type="monotone" dataKey="bookings" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#bookingsGradient)" name="Bookings" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions & Recent Appointments Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Grid (1 Col) */}
        <div className="space-y-3">
          <h3 className="text-base font-extrabold text-white">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-3">
            {[
              { title: "Create Appointment", desc: "Book new client session", icon: CalendarPlus, path: `/salon-admin/${salonId}/AddAppointment` },
              { title: "Add Staff Member", desc: "Register new stylist", icon: UserPlus, path: `/salon-admin/${salonId}/adminStaff` },
              { title: "Financial Report", desc: "View revenue statements", icon: Coins, path: `/salon-admin/${salonId}/adminBilling` },
              { title: "Customer Reviews", desc: "View branch feedback", icon: MessageSquare, path: `/salon-admin/${salonId}/adminReviews` },
            ].map((action, idx) => (
              <button
                key={idx}
                onClick={() => navigate(action.path)}
                className="group p-4 rounded-2xl bg-surface border border-border hover:border-amber-400/40 hover:bg-surface-2 transition-all flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 group-hover:bg-amber-400 group-hover:text-black transition-colors">
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white group-hover:text-amber-400 transition-colors">{action.title}</h4>
                    <p className="text-2xs text-neutral-400">{action.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>

        {/* Recent Appointments Table (2 Cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white">Recent Appointments</h3>
            <button
              onClick={() => navigate(`/salon-admin/${salonId}/adminAppointments`)}
              className="text-xs text-amber-400 font-extrabold hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentAppointments.length === 0 ? (
            <div className="p-8 bg-surface border border-border rounded-2xl text-center text-neutral-400 text-xs">
              No recent appointments found for this branch.
            </div>
          ) : (
            <Table>
              <Table.Head>
                <Table.Th>Customer</Table.Th>
                <Table.Th>Date & Time</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th align="right">Amount</Table.Th>
                <Table.Th align="right">Action</Table.Th>
              </Table.Head>
              <Table.Body>
                {recentAppointments.map((a) => {
                  const customerName = a.customer_id?.name || a.guest_name || "Guest Customer";
                  const totalPrice = a.total_price || a.service_id?.base_price || 0;
                  const isActionLoading = actionLoading === a._id;

                  return (
                    <tr key={a._id} className="hover:bg-surface-2/60 transition-colors">
                      <Table.Td bold className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-400/10 text-amber-400 font-extrabold text-2xs flex items-center justify-center">
                          {customerName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-extrabold text-xs">{customerName}</span>
                      </Table.Td>
                      <Table.Td className="text-xs text-neutral-300">
                        <p className="font-semibold text-white">{a.appointment_date}</p>
                        <p className="text-2xs text-neutral-400">{a.start_time}</p>
                      </Table.Td>
                      <Table.Td>{getStatusBadge(a.status)}</Table.Td>
                      <Table.Td align="right" className="text-amber-400 font-black text-xs">
                        LKR {totalPrice.toLocaleString()}
                      </Table.Td>
                      <Table.Td align="right">
                        {a.status === "pending" && (
                          <button
                            onClick={() => handleConfirm(a._id)}
                            disabled={isActionLoading}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black font-extrabold text-2xs hover:bg-emerald-400 transition-colors"
                          >
                            Accept
                          </button>
                        )}
                        {a.status === "confirmed" && (
                          <button
                            onClick={() => handleComplete(a._id)}
                            disabled={isActionLoading}
                            className="px-2.5 py-1 rounded-lg bg-blue-500 text-white font-extrabold text-2xs hover:bg-blue-400 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                      </Table.Td>
                    </tr>
                  );
                })}
              </Table.Body>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
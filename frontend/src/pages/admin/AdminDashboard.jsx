import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getSalon } from "../../services/salonService";
import { getSalonAppointments } from "../../services/appointmentService";
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
  ChevronRight,
  Store,
  Coins,
  MessageSquare,
  Clock,
  Scissors
} from "lucide-react";

import { motion } from "framer-motion";

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

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const startStr = [
        thirtyDaysAgo.getFullYear(),
        String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0'),
        String(thirtyDaysAgo.getDate()).padStart(2, '0')
      ].join('-');
      const endStr = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
      ].join('-');

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
    const valid = appointments.filter(a => ["completed", "confirmed"].includes(a.status?.toLowerCase()));
    return valid.reduce((sum, a) => sum + (a.total_price || a.service_id?.base_price || 0), 0);
  }, [appointments, reportData]);

  const recentAppointments = useMemo(() => {
    return appointments.slice(0, 6);
  }, [appointments]);

  const getServiceSummary = (appt) => {
    if (appt.appointment_services?.length) {
      const names = appt.appointment_services
        .map((s) => s.service_id?.service_name)
        .filter(Boolean);
      if (names.length) return names.join(", ");
    }
    if (appt.service_ids?.length) {
      const names = appt.service_ids
        .map((s) => (typeof s === "object" ? s?.service_name : null))
        .filter(Boolean);
      if (names.length) return names.join(", ");
    }
    return appt.service_id?.service_name || "Salon Service";
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

      {/* Recent Appointments Table Card (replaces 7-Day Booking & Revenue Trend) */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              Recent Appointments
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">Latest customer bookings for your branch</p>
          </div>

          <button
            onClick={() => navigate(`/salon-admin/${salonId}/adminAppointments`)}
            className="px-3.5 py-2 rounded-xl bg-surface-2 border border-border text-xs text-amber-400 font-extrabold hover:border-amber-400/40 hover:bg-amber-400/10 transition-all flex items-center gap-1.5"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentAppointments.length === 0 ? (
          <div className="p-8 bg-surface-2/50 border border-border rounded-xl text-center text-neutral-400 text-xs">
            No recent appointments found for this branch.
          </div>
        ) : (
          <Table className="w-full">
            <Table.Head>
              <Table.Th className="w-[24%]">Customer</Table.Th>
              <Table.Th className="w-[28%]">Services</Table.Th>
              <Table.Th className="w-[19%]">Date & Time</Table.Th>
              <Table.Th className="w-[16%]">Status</Table.Th>
              <Table.Th align="right" className="w-[13%]">Amount</Table.Th>
            </Table.Head>
            <Table.Body>
              {recentAppointments.map((a) => {
                const customerName = a.customer_id?.name || a.guest_name || "Guest Customer";
                const serviceSummary = getServiceSummary(a);
                const totalPrice = a.total_price || a.service_id?.base_price || 0;
                const timeRange = a.start_time
                  ? `${a.start_time}${a.end_time ? ` - ${a.end_time}` : ""}`
                  : "N/A";

                return (
                  <Table.Tr key={a._id} className="hover:bg-surface-2/60 transition-colors">
                    <Table.Td bold className="w-[24%]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                          {customerName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-bold text-xs truncate max-w-[200px]">{customerName}</span>
                      </div>
                    </Table.Td>
                    <Table.Td className="w-[28%] text-xs text-neutral-300">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Scissors className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate max-w-[260px]" title={serviceSummary}>{serviceSummary}</span>
                      </div>
                    </Table.Td>
                    <Table.Td className="w-[19%] text-xs text-neutral-300 whitespace-nowrap">
                      <div className="font-semibold text-white">{a.appointment_date}</div>
                      <div className="text-2xs text-neutral-400 flex items-center gap-1 font-mono mt-0.5">
                        <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{timeRange}</span>
                      </div>
                    </Table.Td>
                    <Table.Td className="w-[16%] whitespace-nowrap">
                      {getStatusBadge(a.status)}
                      {a.status === "confirmed" && a.confirmed_by_name && (
                        <span className="block text-[0.65rem] text-emerald-400 mt-1 font-semibold">
                          By {a.confirmed_by_name} ({a.confirmed_by_role || "Staff"})
                        </span>
                      )}
                    </Table.Td>
                    <Table.Td align="right" className="w-[13%] text-amber-400 font-black text-xs whitespace-nowrap">
                      LKR {Number(totalPrice).toLocaleString()}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Body>
          </Table>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-base font-extrabold text-white">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { title: "Create Appointment", desc: "Book new client session", icon: CalendarPlus, path: `/salon-admin/${salonId}/AddAppointment` },
            { title: "Add Staff Member", desc: "Register new stylist", icon: UserPlus, path: `/salon-admin/${salonId}/adminStaff` },
            { title: "Add Service", desc: "Manage salon services", icon: Scissors, path: `/salon-admin/${salonId}/adminServices` },
            { title: "Customer Reviews", desc: "View branch feedback", icon: MessageSquare, path: `/salon-admin/${salonId}/adminReviews` },
          ].map((action, idx) => (
            <button
              key={idx}
              onClick={() => navigate(action.path)}
              className="group p-4 rounded-2xl bg-surface border border-border hover:border-amber-400/40 hover:bg-surface-2 transition-all flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 group-hover:bg-amber-400 group-hover:text-black transition-colors shrink-0">
                  <action.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-extrabold text-white group-hover:text-amber-400 transition-colors truncate">{action.title}</h4>
                  <p className="text-2xs text-neutral-400 truncate">{action.desc}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
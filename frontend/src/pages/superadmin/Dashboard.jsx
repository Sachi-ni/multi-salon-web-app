import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, Users, Calendar, Wallet, Plus, Download, 
  ArrowRight, Store, UserPlus, CalendarPlus, DollarSign, 
  ShieldCheck, ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { 
  AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";

import { getSalons } from "../../services/salonService";
import { getStaff } from "../../services/staffService";
import { getSalonAppointments } from "../../services/appointmentService";
import { getRevenueStats } from "../../services/revenueService";

import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Table from "../../components/ui/Table";
import Skeleton from "../../components/ui/Skeleton";
import { API_BASE } from "../../config";

export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [salons, setSalons] = useState([]);
  const [staff, setStaff] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [revenueStats, setRevenueStats] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [salonsRes, staffRes, apptsRes, revRes] = await Promise.allSettled([
          getSalons(),
          getStaff(),
          getSalonAppointments("all"),
          getRevenueStats("30days")
        ]);

        if (isMounted) {
          if (salonsRes.status === "fulfilled") setSalons(salonsRes.value.data || []);
          if (staffRes.status === "fulfilled") setStaff(staffRes.value.data || []);
          if (apptsRes.status === "fulfilled") setAppointments(apptsRes.value.data || []);
          if (revRes.status === "fulfilled") setRevenueStats(revRes.value.data || null);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => { isMounted = false; };
  }, []);

  // Compute monthly appointments
  const monthlyAppointmentsCount = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return appointments.filter(a => {
      const d = new Date(a.appointment_date || a.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
  }, [appointments]);

  // Chart data calculation (Last 7 Days timeline)
  const chartData = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });

      const dayAppts = appointments.filter(a => {
        const aDate = a.appointment_date || (a.createdAt && a.createdAt.split("T")[0]);
        return aDate === dateStr;
      });

      const dayRevenue = dayAppts.reduce((sum, a) => {
        const price = a.total_price || a.service_id?.price || 0;
        return sum + price;
      }, 0);

      days.push({
        day: dayLabel,
        bookings: dayAppts.length,
        revenue: dayRevenue
      });
    }
    return days;
  }, [appointments]);

  // Stats definition
  const stats = [
    {
      icon: Building2,
      label: "Total Salons",
      value: loading ? "—" : salons.length.toString(),
      trend: `${salons.length} Active`,
      subtitle: "active locations",
      path: "/salons"
    },
    {
      icon: Users,
      label: "Total Staff",
      value: loading ? "—" : staff.length.toString(),
      trend: `+${staff.length}`,
      subtitle: "across all salons",
      path: "/Staff"
    },
    {
      icon: Calendar,
      label: "Appointments",
      value: loading ? "—" : appointments.length.toString(),
      trend: `${monthlyAppointmentsCount} this month`,
      subtitle: "total bookings",
      path: "/Appointments"
    },
    {
      icon: Wallet,
      label: "Platform Revenue",
      value: loading ? "—" : `LKR ${(revenueStats?.grossRevenue || 0).toLocaleString()}`,
      trend: revenueStats?.grossGrowth ? `${revenueStats.grossGrowth >= 0 ? "+" : ""}${revenueStats.grossGrowth}%` : "Stable",
      subtitle: "last 30 days",
      path: "/Analytics"
    },
  ];

  const quickActions = [
    { label: "Register New Salon", icon: Store, path: "AddSalon", color: "text-accent" },
    { label: "Add Staff Member", icon: UserPlus, path: "AddStaff", color: "text-info" },
    { label: "Create Appointment", icon: CalendarPlus, path: "AddAppointment", color: "text-success" },
    { label: "View Analytics", icon: DollarSign, path: "Analytics", color: "text-purple" },
  ];

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
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status || "Pending"}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Super Admin Dashboard"
        subtitle="Overview of platform performance, salons, staff, and bookings"
      >
        <Button variant="ghost" size="sm" icon={Download} onClick={() => navigate("/Analytics")}>
          Export Data
        </Button>
        <Button variant="primary" size="md" icon={Plus} onClick={() => navigate("/AddSalon")}>
          Add Salon
        </Button>
      </PageHeader>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            {loading ? (
              <div className="p-5 bg-surface border border-border rounded-xl space-y-3">
                <Skeleton className="w-9 h-9 rounded-lg" />
                <Skeleton className="w-24 h-3" />
                <Skeleton className="w-16 h-7" />
              </div>
            ) : (
              <StatCard
                icon={s.icon}
                label={s.label}
                value={s.value}
                trend={s.trend}
                subtitle={s.subtitle}
                onClick={() => navigate(s.path)}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Main Insights Grid (Chart + Quick Actions & System Health) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Analytics Chart (Takes 2 columns) */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <Card.Header className="flex items-center justify-between">
            <div>
              <Card.Title>Weekly Booking & Revenue Activity</Card.Title>
              <Card.Subtitle>Overview of daily appointments and earnings over the past 7 days</Card.Subtitle>
            </div>
            <Button variant="ghost" size="xs" icon={ArrowRight} onClick={() => navigate("/Analytics")}>
              Analytics Page
            </Button>
          </Card.Header>

          <div className="p-4 pt-2">
            {loading ? (
              <div className="h-[220px] flex items-center justify-center">
                <Skeleton className="w-full h-full rounded-xl" />
              </div>
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="day" stroke="#a3a3a3" fontSize={11} tickLine={false} />
                    <YAxis stroke="#a3a3a3" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#171717", borderColor: "#404040", borderRadius: "8px", fontSize: "12px", color: "#ffffff" }}
                    />
                    <Area type="monotone" dataKey="bookings" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorBookings)" name="Bookings" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 px-4 pb-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
              <span className="text-muted-2">Total Bookings (7 Days):</span>
              <span className="font-bold text-white">{chartData.reduce((sum, d) => sum + d.bookings, 0)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span className="text-muted-2">Est. Income (7 Days):</span>
              <span className="font-bold text-accent">LKR {chartData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}</span>
            </div>
          </div>
        </Card>

        {/* Quick Actions & System Health */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <Card>
            <Card.Header>
              <Card.Title>Quick Management Actions</Card.Title>
              <Card.Subtitle>Direct shortcuts to perform common admin operations</Card.Subtitle>
            </Card.Header>
            <div className="flex flex-col gap-2.5">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => navigate(`/${action.path}`)}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-left text-sm font-bold text-white hover:border-accent/40 hover:bg-accent-dim/20 transition-all duration-200 group shadow-sm"
                >
                  <div className={`p-2 rounded-lg bg-surface border border-border ${action.color}`}>
                    <action.icon className="w-4 h-4" />
                  </div>
                  <span className="flex-1">{action.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-2 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 group-hover:text-accent transition-all duration-200" />
                </button>
              ))}
            </div>
          </Card>

          {/* System Health */}
          <Card className="bg-surface-2/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-success-dim border border-success-border flex items-center justify-center text-success">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">System Status</h4>
                <p className="text-xs text-success font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                  All Systems Operational
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Dual Tables/Cards Section: Recent Appointments & Top Salons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Appointments */}
        <Card>
          <Card.Header className="flex items-center justify-between">
            <div>
              <Card.Title>Recent Appointments</Card.Title>
              <Card.Subtitle>Latest customer bookings across all salon branches</Card.Subtitle>
            </div>
            <Button variant="ghost" size="xs" icon={ArrowRight} onClick={() => navigate("/Appointments")}>
              View All
            </Button>
          </Card.Header>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="w-full h-10 rounded-lg" />
              <Skeleton className="w-full h-10 rounded-lg" />
              <Skeleton className="w-full h-10 rounded-lg" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-8 text-center text-muted-2 text-xs">No recent appointments found.</div>
          ) : (
            <Table>
              <Table.Head>
                <Table.Th>Customer</Table.Th>
                <Table.Th>Salon Branch</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th align="right">Amount</Table.Th>
              </Table.Head>
              <Table.Body>
                {appointments.slice(0, 5).map((appt, i) => {
                  const customerName = appt.customer_name || appt.customer_id?.name || appt.guest_name || "Guest";
                  const salonName = appt.salon_id?.name || appt.salon_name || "Salon";
                  const price = appt.total_price || appt.service_id?.price || 0;

                  return (
                    <tr key={appt._id || i} className="hover:bg-surface-2/60 transition-colors">
                      <Table.Td bold>{customerName}</Table.Td>
                      <Table.Td className="text-muted-2 text-xs">{salonName}</Table.Td>
                      <Table.Td>{getStatusBadge(appt.status)}</Table.Td>
                      <Table.Td align="right" className="text-accent font-extrabold text-xs">
                        LKR {price.toLocaleString()}
                      </Table.Td>
                    </tr>
                  );
                })}
              </Table.Body>
            </Table>
          )}
        </Card>

        {/* Top Registered Salons */}
        <Card>
          <Card.Header className="flex items-center justify-between">
            <div>
              <Card.Title>Registered Salons</Card.Title>
              <Card.Subtitle>Active salon locations and locations overview</Card.Subtitle>
            </div>
            <Button variant="ghost" size="xs" icon={ArrowRight} onClick={() => navigate("/salons")}>
              Manage Salons
            </Button>
          </Card.Header>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="w-full h-12 rounded-xl" />
              <Skeleton className="w-full h-12 rounded-xl" />
            </div>
          ) : salons.length === 0 ? (
            <div className="py-8 text-center text-muted-2 text-xs">No salons registered yet.</div>
          ) : (
            <div className="space-y-3">
              {salons.slice(0, 4).map((salon) => (
                <div 
                  key={salon._id} 
                  className="flex items-center justify-between p-3.5 bg-surface-2 border border-border rounded-xl hover:border-accent/30 transition-all duration-200"
                >
<div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-accent-dim border border-accent/20 flex items-center justify-center text-accent overflow-hidden">
                      {salon.logo ? (
                        <img
                          src={salon.logo.startsWith("http") ? salon.logo : `${API_BASE}/${salon.logo.replace(/\\/g, "/")}`}
                          alt={`${salon.name} logo`}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ) : (
                        <Store className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{salon.name}</h4>
                      <p className="text-xs text-muted-2">{salon.location || "Location specified"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="success">Active</Badge>
                    <button
                      onClick={() => navigate(`/salons`)}
                      className="p-1.5 rounded-lg bg-surface text-muted-2 hover:text-white hover:bg-accent-dim/40 transition-colors"
                      title="View Salon"
                    >
                      <ArrowRight className="w-4 h-4 text-accent" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}
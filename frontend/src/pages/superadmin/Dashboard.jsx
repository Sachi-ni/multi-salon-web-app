import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, Users, Calendar, Wallet, Plus, Download, 
  ArrowRight, Store, UserPlus, CalendarPlus, DollarSign, 
  ShieldCheck, ChevronRight, UserCheck, Phone, Mail, MapPin, Search
} from "lucide-react";
import { motion } from "framer-motion";
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
  const [searchTerm, setSearchTerm] = useState("");

  const getSalonManagerInfo = useCallback((salon) => {
    let name = salon.managerName;
    let email = salon.managerEmail;
    let phone = salon.managerPhone;

    if (!name || !email) {
      const mgr = staff.find(
        (s) => String(s.salon_id) === String(salon._id) && s.role === "manager"
      );
      if (mgr) {
        name = name || mgr.full_name || `${mgr.first_name || ""} ${mgr.last_name || ""}`.trim();
        email = email || mgr.email;
        phone = phone || mgr.phone;
      }
    }

    return {
      managerName: name || "Not Assigned",
      managerEmail: email || "N/A",
      managerPhone: phone || "N/A",
    };
  }, [staff]);

  const filteredSalons = useMemo(() => {
    if (!searchTerm.trim()) return salons;
    const q = searchTerm.toLowerCase();
    return salons.filter((s) => {
      const mgr = getSalonManagerInfo(s);
      return (
        s.name?.toLowerCase().includes(q) ||
        s.location?.toLowerCase().includes(q) ||
        mgr.managerName?.toLowerCase().includes(q) ||
        mgr.managerEmail?.toLowerCase().includes(q) ||
        mgr.managerPhone?.toLowerCase().includes(q)
      );
    });
  }, [salons, searchTerm, getSalonManagerInfo]);

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
        
        {/* Recent Appointments Card (Replaces weekly chart) */}
        <Card className="lg:col-span-2 flex flex-col">
          <Card.Header className="flex items-center justify-between pb-3 border-b border-border mb-3">
            <div>
              <Card.Title className="flex items-center gap-2 text-base font-extrabold text-white">
                <Calendar className="w-5 h-5 text-accent" />
                Recent Appointments
              </Card.Title>
              <Card.Subtitle className="text-xs text-muted-2">
                Latest customer bookings across all salon branches
              </Card.Subtitle>
            </div>
            <Button variant="ghost" size="xs" icon={ArrowRight} onClick={() => navigate("/Appointments")}>
              View All
            </Button>
          </Card.Header>

          {loading ? (
            <div className="space-y-3 p-4">
              <Skeleton className="w-full h-11 rounded-xl" />
              <Skeleton className="w-full h-11 rounded-xl" />
              <Skeleton className="w-full h-11 rounded-xl" />
              <Skeleton className="w-full h-11 rounded-xl" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-12 text-center text-muted-2 text-xs">No recent appointments found.</div>
          ) : (
            <Table className="w-full">
              <Table.Head>
                <Table.Th className="w-[28%]">Customer</Table.Th>
                <Table.Th className="w-[24%]">Salon Branch</Table.Th>
                <Table.Th className="w-[20%]">Date & Time</Table.Th>
                <Table.Th className="w-[14%]">Status</Table.Th>
                <Table.Th align="right" className="w-[14%]">Amount</Table.Th>
              </Table.Head>
              <Table.Body>
                {appointments.slice(0, 6).map((appt, i) => {
                  const customerName = appt.customer_name || appt.customer_id?.name || appt.guest_name || "Guest";
                  const salonName = appt.salon_id?.name || appt.salon_name || "Salon Branch";
                  const price = appt.total_price || appt.service_id?.price || 0;
                  const apptDate = appt.appointment_date || (appt.createdAt && appt.createdAt.split("T")[0]) || "N/A";
                  const timeRange = appt.start_time ? `${appt.start_time}${appt.end_time ? ` - ${appt.end_time}` : ""}` : "";

                  return (
                    <tr key={appt._id || i} className="hover:bg-surface-2/60 transition-colors">
                      <Table.Td bold className="text-white w-[28%]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-accent-dim border border-accent/20 flex items-center justify-center text-accent font-black text-xs uppercase shrink-0">
                            {customerName.charAt(0)}
                          </div>
                          <span className="font-bold text-white text-xs truncate">{customerName}</span>
                        </div>
                      </Table.Td>
                      <Table.Td className="text-muted-2 text-xs font-medium w-[24%]">
                        <span className="flex items-center gap-1.5 min-w-0">
                          <Store className="w-3.5 h-3.5 text-accent/70 shrink-0" />
                          <span className="truncate">{salonName}</span>
                        </span>
                      </Table.Td>
                      <Table.Td className="w-[20%]">
                        <div className="font-semibold text-white text-xs whitespace-nowrap">{apptDate}</div>
                        {timeRange && <div className="text-[10px] text-muted-2 font-mono whitespace-nowrap">{timeRange}</div>}
                      </Table.Td>
                      <Table.Td className="w-[14%] whitespace-nowrap">{getStatusBadge(appt.status)}</Table.Td>
                      <Table.Td align="right" className="text-accent font-extrabold text-xs w-[14%] whitespace-nowrap">
                        LKR {Number(price).toLocaleString()}
                      </Table.Td>
                    </tr>
                  );
                })}
              </Table.Body>
            </Table>
          )}
        </Card>

        {/* Quick Actions & System Health */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <Card>
            <Card.Header className="flex flex-col items-start gap-1 mb-4">
              <Card.Title className="text-base font-extrabold text-white">Quick Management Actions</Card.Title>
              <Card.Subtitle className="text-xs text-muted-2">Direct shortcuts to perform common admin operations</Card.Subtitle>
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

      {/* Salons & Managers Contact Directory Section */}
      <Card>
        <Card.Header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <Card.Title className="flex items-center gap-2 text-base font-extrabold text-white">
              <Building2 className="w-5 h-5 text-accent" />
              Salons & Salon Managers Directory
            </Card.Title>
            <Card.Subtitle className="text-xs text-muted-2">
              Overview of registered salon branches, assigned managers, email addresses, and contact phone numbers
            </Card.Subtitle>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-muted-2 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search salon or manager..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-surface-2 border border-border rounded-xl text-xs text-white placeholder-muted-2 focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <Button variant="ghost" size="xs" icon={ArrowRight} onClick={() => navigate("/salons")}>
              Manage Salons
            </Button>
          </div>
        </Card.Header>

        {loading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="w-full h-12 rounded-xl" />
            <Skeleton className="w-full h-12 rounded-xl" />
            <Skeleton className="w-full h-12 rounded-xl" />
          </div>
        ) : filteredSalons.length === 0 ? (
          <div className="py-10 text-center text-muted-2 text-sm">
            {searchTerm ? "No salons or managers match your search criteria." : "No salons registered yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <Table.Head>
                <Table.Th>Salon Branch</Table.Th>
                <Table.Th>Salon Manager</Table.Th>
                <Table.Th>Manager Phone</Table.Th>
                <Table.Th>Manager Email</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th align="right">Action</Table.Th>
              </Table.Head>
              <Table.Body>
                {filteredSalons.map((salon) => {
                  const managerInfo = getSalonManagerInfo(salon);
                  const isActive = salon.status !== "deactivated";

                  return (
                    <tr key={salon._id} className="hover:bg-surface-2/60 transition-colors">
                      <Table.Td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-accent-dim border border-accent/20 flex items-center justify-center text-accent overflow-hidden shrink-0">
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
                            <p className="text-xs text-muted-2 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-accent/70 shrink-0" />
                              {salon.location || "Location specified"}
                            </p>
                          </div>
                        </div>
                      </Table.Td>

                      <Table.Td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-surface-2 border border-border flex items-center justify-center text-accent text-xs font-bold shrink-0">
                            <UserCheck className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-white block">
                              {managerInfo.managerName}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-accent font-semibold">
                              Manager
                            </span>
                          </div>
                        </div>
                      </Table.Td>

                      <Table.Td>
                        {managerInfo.managerPhone !== "N/A" ? (
                          <a
                            href={`tel:${managerInfo.managerPhone}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-2 border border-border text-xs text-white hover:text-accent hover:border-accent/40 transition-colors"
                          >
                            <Phone className="w-3 h-3 text-accent shrink-0" />
                            <span className="font-mono">{managerInfo.managerPhone}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-muted-2">—</span>
                        )}
                      </Table.Td>

                      <Table.Td>
                        {managerInfo.managerEmail !== "N/A" ? (
                          <a
                            href={`mailto:${managerInfo.managerEmail}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-2 border border-border text-xs text-white hover:text-accent hover:border-accent/40 transition-colors max-w-[220px] truncate"
                          >
                            <Mail className="w-3 h-3 text-info shrink-0" />
                            <span className="truncate">{managerInfo.managerEmail}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-muted-2">—</span>
                        )}
                      </Table.Td>

                      <Table.Td>
                        <Badge variant={isActive ? "success" : "danger"}>
                          {isActive ? "Active" : "Deactivated"}
                        </Badge>
                      </Table.Td>

                      <Table.Td align="right">
                        <button
                          onClick={() => navigate("/salons")}
                          className="p-1.5 rounded-lg bg-surface-2 text-muted-2 hover:text-white hover:bg-accent-dim/40 transition-colors"
                          title="View & Manage Salon"
                        >
                          <ArrowRight className="w-4 h-4 text-accent" />
                        </button>
                      </Table.Td>
                    </tr>
                  );
                })}
              </Table.Body>
            </Table>
          </div>
        )}
      </Card>


    </div>
  );
}
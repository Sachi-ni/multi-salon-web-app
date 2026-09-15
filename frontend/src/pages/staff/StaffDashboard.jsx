import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";
import { 
  Store, UserCheck, Phone, Calendar, Clock, Loader2, 
  CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Sparkles, User
} from "lucide-react";
import clsx from "clsx";
import { API_URL } from "../../config";

const StaffDashboard = () => {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Today");

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        const res = await fetch(`${API_URL}/staff/dashboard`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await res.json();
        if (isMounted) {
          setProfile(data.profile);
          setAppointments(data.appointments || []);
        }
      } catch (error) {
        console.error("Error fetching staff dashboard:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
    }
    return () => { isMounted = false; };
  }, [token]);

  const filteredAppointments = useMemo(() => {
    if (!Array.isArray(appointments)) return [];
    const now = new Date();
    
    return appointments.filter(app => {
      if (!app?.appointment_date) return false;
      const appDate = new Date(`${app.appointment_date}T12:00:00`); 
      
      if (filter === "Today") {
        return appDate.toDateString() === now.toDateString();
      } else if (filter === "This Week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); 
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + (6 - now.getDay())); 
        return appDate >= startOfWeek && appDate <= endOfWeek;
      } else if (filter === "This Month") {
        return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [appointments, filter]);

  const completedCount = useMemo(() => {
    return appointments.filter(a => a.status === "completed").length;
  }, [appointments]);

  const pendingCount = useMemo(() => {
    return appointments.filter(a => a.status === "pending" || a.status === "confirmed").length;
  }, [appointments]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending": return <Badge variant="warning">Pending</Badge>;
      case "confirmed": return <Badge variant="success">Confirmed</Badge>;
      case "completed": return <Badge variant="info">Completed</Badge>;
      case "cancelled": return <Badge variant="danger">Cancelled</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const statCardsData = [
    {
      icon: Store,
      label: "Assigned Salon",
      value: loading ? "—" : (profile?.salonName || "N/A"),
      trend: "Active Branch",
      subtitle: "working location",
    },
    {
      icon: Calendar,
      label: "Total Bookings",
      value: loading ? "—" : appointments.length.toString(),
      trend: `${filteredAppointments.length} ${filter.toLowerCase()}`,
      subtitle: "scheduled appointments",
    },
    {
      icon: CheckCircle2,
      label: "Completed",
      value: loading ? "—" : completedCount.toString(),
      trend: `${pendingCount} upcoming`,
      subtitle: "fulfilled sessions",
    },
    {
      icon: UserCheck,
      label: "Branch Manager",
      value: loading ? "—" : (profile?.managerName || "N/A"),
      trend: profile?.managerPhone ? `Phone: ${profile.managerPhone}` : "Supervised",
      subtitle: "salon administrator",
    },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in pb-10">
      
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-surface-2 via-surface-2 to-surface border border-border p-6 rounded-2xl shadow-card relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent via-accent-hover to-transparent" />
        <div className="space-y-1 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-dim/40 border border-accent/20 text-accent text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Staff Dashboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
            Welcome back, <span className="text-gradient">{profile?.staffName || user?.name || "Stylist"}</span>
          </h1>
          <p className="text-sm text-muted-2">
            Manage your schedule, customer appointments, and salon branch services efficiently.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <div className="px-4 py-2.5 bg-surface-3/80 backdrop-blur-md border border-border rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[0.65rem] uppercase tracking-wider text-muted-2 font-bold">Role</p>
              <p className="text-xs font-extrabold text-white capitalize">{user?.role || "Staff Member"}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCardsData.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
          >
            {loading ? (
              <Skeleton className="w-full h-32 rounded-2xl" />
            ) : (
              <StatCard
                icon={stat.icon}
                label={stat.label}
                value={stat.value}
                trend={stat.trend}
                subtitle={stat.subtitle}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Appointments List Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="p-0 overflow-hidden border border-border">
          <div className="p-5 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface-2/40">
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2 font-display">
                <Calendar className="w-5 h-5 text-accent" /> 
                Your Appointments
              </h2>
              <p className="text-xs text-muted-2 mt-0.5">
                Overview of bookings assigned to you
              </p>
            </div>
            
            <div className="flex bg-surface rounded-xl p-1 border border-border w-full sm:w-auto">
              {["Today", "This Week", "This Month"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={clsx(
                    "flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200",
                    filter === f 
                      ? "bg-accent text-primary shadow-glow-sm" 
                      : "text-muted-2 hover:text-white hover:bg-surface-2"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            {loading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="w-full h-12 rounded-xl" />
                <Skeleton className="w-full h-12 rounded-xl" />
                <Skeleton className="w-full h-12 rounded-xl" />
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  icon={Clock}
                  title={`No appointments ${filter.toLowerCase()}`}
                  message="You have no scheduled bookings for this selected period."
                />
              </div>
            ) : (
              <Table>
                <Table.Head>
                  <Table.Th>Customer</Table.Th>
                  <Table.Th>Services</Table.Th>
                  <Table.Th>Date & Time</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Head>
                <Table.Body>
                  {filteredAppointments.map((app) => {
                    const servicesList = app.service_ids?.length 
                      ? app.service_ids.map(s => s.service_name).join(", ")
                      : (app.service_id?.service_name || "N/A");
                    const customerName = app.customer_id?.name || app.guest_name || "Guest";

                    return (
                      <Table.Tr key={app._id} className="hover:bg-surface-2/60 transition-colors">
                        <Table.Td bold className="text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-accent-dim border border-accent/20 flex items-center justify-center text-accent font-black text-xs uppercase">
                              {customerName.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-white block">{customerName}</span>
                              {app.customer_id?.phone && (
                                <span className="text-[0.7rem] text-muted-2">{app.customer_id.phone}</span>
                              )}
                            </div>
                          </div>
                        </Table.Td>
                        <Table.Td className="text-muted-2 text-xs font-medium max-w-[220px] truncate">{servicesList}</Table.Td>
                        <Table.Td>
                          <div className="font-extrabold text-white text-xs">{new Date(app.appointment_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                          <div className="text-[0.7rem] text-accent font-semibold mt-0.5">{app.start_time} - {app.end_time}</div>
                        </Table.Td>
                        <Table.Td>{getStatusBadge(app.status)}</Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Body>
              </Table>
            )}
          </div>
        </Card>
      </motion.div>

    </div>
  );
};

export default StaffDashboard;

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import { Store, UserCheck, Phone, Calendar, Clock, Loader2 } from "lucide-react";
import clsx from "clsx";
import { API_URL } from "../../config";

const StaffDashboard = () => {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Today");

  useEffect(() => {
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
        setProfile(data.profile);
        setAppointments(data.appointments || []);
      } catch (error) {
        console.error("Error fetching staff dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const getFilteredAppointments = () => {
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
  };

  const filteredAppointments = getFilteredAppointments();

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending": return <Badge variant="warning">Pending</Badge>;
      case "confirmed": return <Badge variant="success">Confirmed</Badge>;
      case "completed": return <Badge variant="info">Completed</Badge>;
      case "cancelled": return <Badge variant="danger">Cancelled</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full text-text-primary animate-fade-in">
      <div className="w-full space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <PageHeader 
            title="Staff Dashboard" 
            subtitle={`Welcome back, ${profile?.staffName || user?.name || "Stylist"}`}
            className="!mb-0"
          />
        </div>

        {/* Profile Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={Store}
            label="Assigned Salon"
            value={profile?.salonName || "N/A"}
          />
          <StatCard
            icon={UserCheck}
            label="Branch Manager"
            value={profile?.managerName || "N/A"}
          />
          <StatCard
            icon={Phone}
            label="Manager Contact"
            value={profile?.managerPhone || "N/A"}
          />
        </div>

        {/* Appointments Section */}
        <Card className="p-0 overflow-hidden">
          <div className="p-5 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" /> 
              Your Appointments
            </h2>
            
            <div className="flex bg-surface-2 rounded-lg p-1 border border-border w-full sm:w-auto">
              {["Today", "This Week", "This Month"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={clsx(
                    "flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-colors",
                    filter === f 
                      ? "bg-accent text-bg" 
                      : "text-muted-2 hover:text-white hover:bg-surface"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            {filteredAppointments.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  icon={Clock}
                  title={`No appointments ${filter.toLowerCase()}`}
                  message="You have no scheduled bookings for this time period."
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
                      <Table.Tr key={app._id}>
                        <Table.Td bold className="text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-accent font-bold text-xs uppercase">
                              {customerName.charAt(0)}
                            </div>
                            <span>{customerName}</span>
                          </div>
                        </Table.Td>
                        <Table.Td className="text-muted-2 text-sm">{servicesList}</Table.Td>
                        <Table.Td>
                          <div className="font-bold text-white">{new Date(app.appointment_date).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-2 mt-0.5">{app.start_time} - {app.end_time}</div>
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

      </div>
    </div>
  );
};

export default StaffDashboard;

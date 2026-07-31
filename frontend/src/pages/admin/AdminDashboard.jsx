import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSalon } from "../../services/salonService";

import {
  Calendar,
  Wallet,
  Users,
  Star,
  ArrowRight,
  CalendarPlus,
  UserPlus,
  DollarSign,
  ClipboardList,
  Building2,
} from "lucide-react";

import { motion } from "framer-motion";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { salonId } = useParams();

  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSalon = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSalon(salonId);
      setSalon(res.data);
    } catch (err) {
      console.error("Failed to load salon:", err);
    } finally {
      setLoading(false);
    }
  }, [salonId]);

  useEffect(() => {
    fetchSalon();
  }, [fetchSalon]);

  const stats = [
    {
      icon: Calendar,
      label: "Appointments",
      value: salon?.appointmentsCount || 0,
      subtitle: "Total Appointments",
    },
    {
      icon: Wallet,
      label: "Revenue",
      value: `Rs. ${salon?.revenue || 0}`,
      subtitle: "Salon Revenue",
    },
    {
      icon: Users,
      label: "Staff",
      value: salon?.staffCount || 0,
      subtitle: "Total Staff",
    },
    {
      icon: Star,
      label: "Rating",
      value: salon?.rating || "0.0",
      subtitle: "Customer Rating",
    },
  ];

  const quickActions = [
    {
      label: "Create Appointment",
      icon: CalendarPlus,
      path: "/AddAppointment",
    },
    {
      label: "Add Staff Member",
      icon: UserPlus,
      path: "/AddStaff",
    },
    {
      label: "Manage Report",
      icon: DollarSign,
      path: "/Billing",
    },
    {
      label: "View Reports",
      icon: ClipboardList,
      path: "/Reports",
    },
  ];

  if (loading) {
    return (
      <div className="text-white p-6">
        Loading salon dashboard...
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Salon Dashboard" subtitle={`Welcome back, ${salon?.name || "Salon Owner"}!`} >
        <Button
          variant="primary"
          icon={CalendarPlus}
          onClick={() => navigate(`/salon-admin/${salonId}/AddAppointment`)}
        >
          New Appointment
        </Button>
      </PageHeader>

      {/* Salon Information */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <Building2 className="w-10 h-10 text-accent" />

          <div>
            <h2 className="text-lg font-bold text-white">
              {salon?.name}
            </h2>

            <p className="text-sm font-medium text-muted-2 mt-0.5">
              {salon?.location || salon?.address}
            </p>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <StatCard
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              subtitle={stat.subtitle}
            />
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="mb-6">
        <Card.Header>
          <Card.Title>Quick Actions</Card.Title>
        </Card.Header>

        <div className="flex flex-col gap-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                // Ensure appointment creation is salon-scoped (no salon selection step)
                if (action.path === "/AddAppointment") {
                  navigate(`/salon-admin/${salonId}/AddAppointment`);
                  return;
                }

                navigate(`/salon-admin/${salonId}${action.path}`);
              }}

              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-surface-2 border border-border text-left text-sm font-semibold text-muted-2 hover:text-white hover:border-accent/30 hover:bg-accent-dim/30 transition-all duration-200 group"
            >
              <action.icon className="w-4 h-4 text-accent flex-shrink-0" />

              <span className="flex-1 text-left">
                {action.label}
              </span>

              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 text-accent" />
            </button>
          ))}
        </div>
      </Card>

      {/* Recent Appointments */}
      <Card>
        <Card.Header>
          <Card.Title>Recent Appointments</Card.Title>
        </Card.Header>

        <div className="p-6 text-center text-muted-2">
          Appointment data will appear here once connected to the backend.
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
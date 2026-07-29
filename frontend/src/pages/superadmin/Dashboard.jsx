import React from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Users, Calendar, Wallet, Plus, Download, ArrowRight, Store, UserPlus, CalendarPlus, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

const Dashboard = () => {
  const navigate = useNavigate();

  const stats = [
    { icon: Building2, label: "Total Salons", value: "", trend: "", subtitle: "active locations" },
    { icon: Users, label: "Total Staff", value: "", trend: "", subtitle: "across all salons" },
    { icon: Calendar, label: "Appointments", value: "", trend: "", subtitle: "this month" },
    { icon: Wallet, label: "Platform Revenue", value: "", trend: "", subtitle: "this month" },
  ];

  const statPages = ["salons", "Staff", "Appointments", "Analytics"];

  const quickActions = [
    { label: "Register New Salon", icon: Store, path: "AddSalon" },
    { label: "Add Staff Member", icon: UserPlus, path: "AddStaff" },
    { label: "Create Appointment", icon: CalendarPlus, path: "AddAppointment" },
    { label: "View Analytics", icon: DollarSign, path: "Analytics" },
  ];

  return (
    <div>
      {/* Header */}
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back, Super Admin"
      >
        <Button variant="ghost" size="sm" icon={Download}>
          Export
        </Button>
        <Button variant="primary" size="md" icon={Plus} onClick={() => navigate("/AddSalon")}>
          Add Salon
        </Button>
      </PageHeader>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 mb-6">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <StatCard
              icon={s.icon}
              label={s.label}
              value={s.value}
              trend={s.trend}
              subtitle={s.subtitle}
              onClick={() => navigate(`/${statPages[i]}`)}
            />
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      {/* Simplified Revenue Section + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="flex flex-col justify-between">
          <Card.Header>
            <Card.Title>Platform Revenue Summary</Card.Title>
            <Card.Subtitle>Overview of total earnings across all salons</Card.Subtitle>
          </Card.Header>
          <div className="flex-1 flex flex-col items-center justify-center py-10">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <DollarSign className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-sm font-bold text-muted-2 mb-2">Want to dive deeper?</h3>
            <p className="text-xs text-muted-2 text-center max-w-[250px] mb-6">
              View comprehensive charts, top performing salons, and detailed metrics on the Analytics page.
            </p>
            <Button variant="primary" size="sm" onClick={() => navigate("/Analytics")}>
              Go to Analytics
            </Button>
          </div>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Quick Actions</Card.Title>
          </Card.Header>
          <div className="flex flex-col gap-2">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => navigate(`/${action.path}`)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-surface-2 border border-border text-left text-sm font-semibold text-muted-2 hover:text-white hover:border-accent/30 hover:bg-accent-dim/30 transition-all duration-200 group"
              >
                <action.icon className="w-4 h-4 text-accent flex-shrink-0" />
                <span className="flex-1">{action.label}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 text-accent" />
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Salons Section */}
      {/* <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-accent" />
          All Salons
        </h3>
        <Button variant="ghost" size="sm" onClick={() => navigate("/salons")}>
          Manage all salons
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      <Card padding="p-6">
        <EmptyState
          title="No salons registered"
          description="Start by adding your first salon location."
          actionLabel="Add Salon"
          onAction={() => navigate("/AddSalon")}
          icon={Store}
        />
      </Card> */}
    </div>
  );
};

export default Dashboard;
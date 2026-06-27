import { useState } from "react";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
import { motion } from "framer-motion";
//import clsx from "clsx";
import { BarChart3, DollarSign, Calendar, Users } from "lucide-react";

const stats = [
  {
    icon: Calendar,
    label: "Total Bookings",
    value: "",
    trend: "",
    subtitle: "all bookings",
  },
  {
    icon: DollarSign,
    label: "Gross Revenue",
    value: "",
    trend: "",
    subtitle: "total earnings",
  },
  {
    icon: BarChart3,
    label: "Avg Booking Value",
    value: "",
    trend: "",
    subtitle: "per booking",
  },
  {
    icon: Users,
    label: "Client Retention",
    value: "",
    trend: "",
    subtitle: "returning clients",
  },
];

const Analytics = () => {

  const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

  const [analytics] = useState({
    metrics: [],
    topSalons: [],
    services: [],
    monthlyRevenue: []
  });

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Platform-wide performance insights"
        backTo="/superAdminDashboard"
      />

      {/* Analytics Stats */}
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
              />
            </motion.div>
          ))}
        </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {analytics.metrics.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <StatCard
              icon={BarChart3}
              label={card.label}
              value={card.value}
              trend={`↑ ${card.trend}`}
            />
          </motion.div>
        ))}
      </div>

      {/* Top Salons + Service Breakdown*/}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

        <Card>
          <Card.Header>
            <Card.Title>Top Salons</Card.Title>
            <Card.Subtitle>Revenue share</Card.Subtitle>
          </Card.Header>

          <div className="space-y-5">
            {analytics.topSalons.map((s, i) => (
              <div key={i}>
                <div className="flex justify-between mb-2">
                  <span>{s.name}</span>
                  <span>{s.percentage}%</span>
                </div>

                <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${s.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${s.percentage}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Service Breakdown</Card.Title>
            <Card.Subtitle>Most used services</Card.Subtitle>
          </Card.Header>

          <div className="space-y-5">
            {analytics.services.map((s, i) => (
              <div key={i}>
                <div className="flex justify-between mb-2">
                  <span>{s.name}</span>
                  <span>{s.percentage}%</span>
                </div>

                <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${s.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${s.percentage}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>
      {/* Revenue Trend Chart */}
      <Card>
        <Card.Header>
          <Card.Title>Revenue Trend</Card.Title>
          <Card.Subtitle>12 month overview</Card.Subtitle>
        </Card.Header>

        <div className="flex items-end gap-2 h-32 mt-4">
          {analytics.monthlyRevenue.map((value, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end"
            >
              <motion.div
                className="w-full bg-accent rounded-t"
                initial={{ height: 0 }}
                animate={{ height: `${value}px` }}
                transition={{ duration: 0.5 }}
              />

              <span className="text-xs text-muted-2 mt-1">
                {months[i]}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Analytics;
import React from "react";
import { BarChart3 } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
import { motion } from "framer-motion";
import clsx from "clsx";

const Analytics = () => {
  const metricCards = [
    { label: "Total Bookings", value: "3,847", change: "+18.2%" },
    { label: "Gross Revenue", value: "$427K", change: "+9.8%" },
    { label: "Avg Booking Value", value: "$36.90", change: "+4.1%" },
    { label: "Client Retention", value: "78%", change: "+1.2%" },
  ];

  const topSalons = [
    { name: "Kathura", percentage: 75, color: "bg-success" },
    { name: "Liyo", percentage: 45, color: "bg-info" },
    { name: "89", percentage: 35, color: "bg-danger" },
  ];

  const services = [
    { name: "Haircut", percentage: 35, color: "bg-purple" },
    { name: "Hair Color", percentage: 25, color: "bg-info" },
    { name: "Highlights", percentage: 18, color: "bg-success" },
    { name: "Blowout", percentage: 12, color: "bg-accent" },
    { name: "Other", percentage: 10, color: "bg-danger" },
  ];

  const monthlyData = [40, 55, 30, 70, 60, 80, 65, 90, 75, 85, 95, 100];
  const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Platform-wide performance insights" />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 mb-6">
        {metricCards.map((card, i) => (
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
              trend={`↑ ${card.change}`}
            />
          </motion.div>
        ))}
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Top Salons */}
        <Card>
          <Card.Header>
            <Card.Title>Top Salons</Card.Title>
            <Card.Subtitle>Revenue share</Card.Subtitle>
          </Card.Header>
          <div className="space-y-4">
            {topSalons.map((s, i) => (
              <div key={i}>
                <div className="flex justify-between items-center text-sm mb-1.5">
                  <span className="text-muted-2 text-xs">{s.name}</span>
                  <span className="font-semibold text-white text-xs">{s.percentage}%</span>
                </div>
                <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <motion.div
                    className={clsx("h-full rounded-full", s.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${s.percentage}%` }}
                    transition={{ duration: 0.8, delay: i * 0.15 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Service Breakdown */}
        <Card>
          <Card.Header>
            <Card.Title>Service Breakdown</Card.Title>
            <Card.Subtitle>Most used services</Card.Subtitle>
          </Card.Header>
          <div className="space-y-4">
            {services.map((s, i) => (
              <div key={i}>
                <div className="flex justify-between items-center text-sm mb-1.5">
                  <span className="text-muted-2 text-xs">{s.name}</span>
                  <span className="font-semibold text-white text-xs">{s.percentage}%</span>
                </div>
                <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <motion.div
                    className={clsx("h-full rounded-full", s.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${s.percentage}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
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
        <div className="flex items-end gap-1.5 h-24 mt-2">
          {monthlyData.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                className="w-full rounded-t bg-accent opacity-80 hover:opacity-100 transition-opacity duration-150"
                initial={{ height: 0 }}
                animate={{ height: `${h}px` }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
              />
              <span className="text-[0.58rem] text-muted-2">{months[i]}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Analytics;
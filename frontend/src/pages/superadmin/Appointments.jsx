import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Calendar } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import Table from "../../components/ui/Table";
import EmptyState from "../../components/ui/EmptyState";
import { getAppointments, updateAppointment } from "../../services/bookingService";
import clsx from "clsx";

const Appointments = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await getAppointments();
      setAppointments(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load appointments from the database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateAppointment(id, { status: newStatus });
      setAppointments((prev) =>
        prev.map((app) => (app._id === id ? { ...app, status: newStatus } : app))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update status on the server.");
    }
  };

  const filteredData = filter === "All" ? appointments : appointments.filter((a) => a.status === filter);
  const tabs = ["All", "Pending", "Confirmed", "Completed", "Canceled"];

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) + " " + date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div>
      <PageHeader title="Appointments" subtitle="Manage all customer bookings">
        <Button variant="primary" icon={Plus} onClick={() => navigate("/AddAppointment")}>
          New Appointment
        </Button>
      </PageHeader>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-accent-dim border border-accent-muted text-sm text-white mb-4">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="text-muted-2 hover:text-white text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-2 rounded-xl p-1 mb-4 border border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={clsx(
              "px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all duration-150 whitespace-nowrap",
              filter === tab
                ? "bg-surface text-white shadow-[0_1px_6px_rgba(0,0,0,0.4)]"
                : "text-muted-2 hover:text-white"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent border-r-2" />
        </div>
      ) : filteredData.length === 0 ? (
        <EmptyState
          title="No appointments found"
          description="No appointments match the selected filter."
          icon={Calendar}
        />
      ) : (
        <Table>
          <Table.Head>
            <Table.Th>Client</Table.Th>
            <Table.Th>Service</Table.Th>
            <Table.Th>Salon</Table.Th>
            <Table.Th>Staff</Table.Th>
            <Table.Th>Date / Time</Table.Th>
            <Table.Th>Status (Interactive)</Table.Th>
            <Table.Th>Amount</Table.Th>
          </Table.Head>
          <Table.Body>
            {filteredData.map((a, i) => {
              const clientName = a.customer_id?.name || "Walk-in Client";
              const serviceName = a.service_id?.service_name || "Custom Service";
              const salonName = a.salon_id?.name || "General";
              const staffName = a.staff_id?.name || "Not Assigned";
              const formattedTime = formatDateTime(a.appointment_date);
              const amount = a.amount ? `$${a.amount}` : `$0`;

              return (
                <tr key={a._id || i}>
                  <Table.Td bold>{clientName}</Table.Td>
                  <Table.Td>{serviceName}</Table.Td>
                  <Table.Td className="text-muted-2">{salonName}</Table.Td>
                  <Table.Td>{staffName}</Table.Td>
                  <Table.Td>{formattedTime}</Table.Td>
                  <Table.Td>
                    <div className="relative inline-block">
                      <select
                        value={a.status || "Pending"}
                        onChange={(e) => handleStatusChange(a._id, e.target.value)}
                        className={clsx(
                          "appearance-none pr-8 pl-3.5 py-1.5 rounded-full text-[0.68rem] font-bold border outline-none cursor-pointer transition-all duration-150 uppercase tracking-wider",
                          a.status === "Confirmed" && "bg-info-dim text-info border-info-border",
                          a.status === "Pending" && "bg-accent-dim text-accent border-accent-muted",
                          a.status === "Completed" && "bg-success-dim text-success border-success-border",
                          a.status === "Canceled" && "bg-danger-dim text-danger border-danger-border"
                        )}
                      >
                        <option value="Pending" className="bg-surface text-white">Pending</option>
                        <option value="Confirmed" className="bg-surface text-white">Confirmed</option>
                        <option value="Completed" className="bg-surface text-white">Completed</option>
                        <option value="Canceled" className="bg-surface text-white">Canceled</option>
                      </select>
                      <span className={clsx(
                        "absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[0.55rem] transition-colors duration-150",
                        a.status === "Confirmed" && "text-info",
                        a.status === "Pending" && "text-accent",
                        a.status === "Completed" && "text-success",
                        a.status === "Canceled" && "text-danger"
                      )}>
                        ▼
                      </span>
                    </div>
                  </Table.Td>
                  <Table.Td bold>{amount}</Table.Td>
                </tr>
              );
            })}
          </Table.Body>
        </Table>
      )}
    </div>
  );
};

export default Appointments;
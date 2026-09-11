import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getSalonAppointments,
  confirmAppointment,
  rejectAppointment,
  completeAppointment,
  adminCancelAppointment,
  updateAppointmentDuration,
  deleteAppointment
} from "../../services/appointmentService";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Table from "../../components/ui/Table";
import EmptyState from "../../components/ui/EmptyState";
import { 
  Calendar, Clock, User, Search, LayoutGrid, 
  List, CheckCircle2, AlertCircle, Trash2, 
  Check, X, Plus, Hash, Edit2
} from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import EditStaffAssignmentModal from "../../components/booking/EditStaffAssignmentModal";

const SALARY_REFRESH_KEY = "salary-refresh-token";

const triggerSalaryRefresh = () => {
  localStorage.setItem(SALARY_REFRESH_KEY, String(Date.now()));
  window.dispatchEvent(new Event("salary-refresh"));
};

const STATUS_FILTERS = ["all", "pending", "confirmed", "completed", "rejected", "cancelled"];

export default function AdminBookings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { salonId: routeSalonId } = useParams();
  const salonId = routeSalonId || user?.salon_id || "";

  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [actionError, setActionError] = useState("");

  const [editingDuration, setEditingDuration] = useState("");
  const [newDuration, setNewDuration] = useState(60);
  const [editingStaffAppointment, setEditingStaffAppointment] = useState(null);

  const fetchAppointments = useCallback(() => {
    setLoading(true);
    setError("");
    getSalonAppointments(salonId, filter === "all" ? "" : filter, dateFilter)
      .then(res => setAppointments(res.data || []))
      .catch(() => setError("Failed to load appointments."))
      .finally(() => setLoading(false));
  }, [salonId, filter, dateFilter]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const formatTime = (time) => {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
  };

  const handleConfirm = async (id) => {
    setActionLoading(id);
    setActionError("");
    try {
      await confirmAppointment(id);
      fetchAppointments();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to confirm appointment.";
      setActionError(`${id}:${message}`);
    } finally {
      setActionLoading("");
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Are you sure you want to reject this booking?")) return;
    setActionLoading(id);
    setActionError("");
    try {
      await rejectAppointment(id);
      fetchAppointments();
    } catch {
      setActionError(`${id}:Failed to reject appointment.`);
    } finally {
      setActionLoading("");
    }
  };

  const handleComplete = async (id) => {
    setActionLoading(id);
    setActionError("");
    try {
      await completeAppointment(id);
      triggerSalaryRefresh();
      fetchAppointments();
    } catch {
      setActionError(`${id}:Failed to complete appointment.`);
    } finally {
      setActionLoading("");
    }
  };

  const handleAdminCancel = async (id) => {
    if (!window.confirm("Cancel this confirmed appointment? The time slots will be freed up.")) return;
    setActionLoading(id);
    setActionError("");
    try {
      await adminCancelAppointment(id);
      fetchAppointments();
    } catch {
      setActionError(`${id}:Failed to cancel appointment.`);
    } finally {
      setActionLoading("");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this appointment? This action cannot be undone.")) return;
    setActionLoading(id);
    setActionError("");
    try {
      await deleteAppointment(id);
      fetchAppointments();
    } catch {
      setActionError(`${id}:Failed to delete appointment.`);
    } finally {
      setActionLoading("");
    }
  };

  const handleSaveDuration = async (id) => {
    setActionLoading(id);
    setActionError("");
    try {
      await updateAppointmentDuration(id, newDuration);
      setEditingDuration("");
      fetchAppointments();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update duration.";
      setActionError(`${id}:${message}`);
    } finally {
      setActionLoading("");
    }
  };

  const getActionError = (id) => {
    if (!actionError) return null;
    const [errId, ...msg] = actionError.split(":");
    return errId === id ? msg.join(":") : null;
  };

  const filteredAppointments = useMemo(() => {
    if (!searchTerm) return appointments;
    const term = searchTerm.toLowerCase();

    return appointments.filter(a => {
      const custName = (a.customer_id?.name || a.guest_name || "").toLowerCase();
      const phone = (a.customer_id?.phone || a.guest_phone || "").toLowerCase();
      const email = (a.customer_id?.email || "").toLowerCase();
      const idStr = (a._id || "").toLowerCase();

      return custName.includes(term) || phone.includes(term) || email.includes(term) || idStr.includes(term);
    });
  }, [appointments, searchTerm]);

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

  const getCardBorderStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "border-l-4 border-l-amber-400 bg-gradient-to-r from-amber-500/5 via-surface to-surface";
      case "confirmed":
        return "border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-500/5 via-surface to-surface";
      case "completed":
        return "border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-500/5 via-surface to-surface";
      case "rejected":
      case "cancelled":
        return "border-l-4 border-l-rose-500 bg-gradient-to-r from-rose-500/5 via-surface to-surface";
      default:
        return "border-l-4 border-l-neutral-600 bg-surface";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Appointments Management" subtitle="Manage and confirm customer bookings for your salon branch" backTo={`/salon-admin/${salonId}/adminDashboard`}>
        <Button variant="primary" icon={Plus} onClick={() => navigate(`/salon-admin/${salonId}/AddAppointment`)}>
          Create Booking
        </Button>
      </PageHeader>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-danger-dim border border-danger-border text-sm text-danger">
          <span className="flex-1 font-semibold">{error}</span>
          <button onClick={() => setError("")} className="text-danger hover:text-white text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Status Filter Tabs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-2 overflow-x-auto">
          {STATUS_FILTERS.map((f) => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  "px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap",
                  isActive
                    ? "bg-amber-400 text-black shadow-sm font-extrabold"
                    : "bg-surface border border-border text-neutral-400 hover:text-white hover:border-amber-400/30"
                )}
              >
                {f}
              </button>
            );
          })}
        </div>
        <Button variant="secondary" icon={Calendar} onClick={() => navigate(`/salon-admin/${salonId}/adminSchedule`)}>
          Staff Schedule
        </Button>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              placeholder="Search by customer name, phone, email, or #ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all duration-200 focus:border-amber-400 placeholder:text-neutral-500 font-medium"
            />
          </div>

          {/* Date Filter */}
          <div className="relative flex items-center">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ colorScheme: "dark" }}
              className="bg-surface border border-border rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none cursor-pointer transition-all duration-200 focus:border-amber-400"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter("")}
                className="ml-2 p-2 rounded-lg bg-surface-2 text-neutral-400 hover:text-white transition-colors"
                title="Clear date"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex items-center bg-surface border border-border rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewMode("grid")}
            className={clsx(
              "p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
              viewMode === "grid"
                ? "bg-amber-400 text-black shadow-sm"
                : "text-neutral-400 hover:text-white"
            )}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Grid</span>
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={clsx(
              "p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
              viewMode === "table"
                ? "bg-amber-400 text-black shadow-sm"
                : "text-neutral-400 hover:text-white"
            )}
            title="Table View"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Table</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 bg-surface border border-border rounded-2xl animate-pulse space-y-3">
              <div className="h-4 w-40 bg-surface-2 rounded" />
              <div className="h-3 w-64 bg-surface-2 rounded" />
              <div className="h-16 w-full bg-surface-2 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredAppointments.length === 0 ? (
        <EmptyState
          title="No appointments found"
          description="No customer bookings match your current filters."
          icon={Calendar}
          actionLabel="Create Booking"
          onAction={() => navigate(`/salon-admin/${salonId}/AddAppointment`)}
        />
      ) : viewMode === "grid" ? (
        /* Card View */
        <div className="space-y-5">
          {filteredAppointments.map((a, index) => {
            const isActionLoading = actionLoading === a._id;
            const appointmentError = getActionError(a._id);

            const totalDurationMins = a.appointment_services && a.appointment_services.length > 0
              ? a.appointment_services.reduce((sum, s) => sum + (s.service_id?.duration || 0), 0)
              : (a.duration || 60);
            const durationHours = Math.ceil(totalDurationMins / 60);

            const customerName = a.customer_id?.name || a.guest_name || "Guest Customer";
            const isGuest = !a.customer_id && a.guest_name;
            const totalPrice = a.total_price || a.service_id?.base_price || 0;
            const refCode = `#APT-${a._id.slice(-6).toUpperCase()}`;

            return (
              <motion.div
                key={a._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.25 }}
                className={clsx(
                  "border border-border/80 rounded-2xl p-5 shadow-card hover:border-amber-400/40 transition-all space-y-4",
                  getCardBorderStyle(a.status)
                )}
              >
                {/* Top Reference Banner */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-surface-2 border border-border text-amber-400 font-black tracking-wider text-2xs flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      {refCode}
                    </span>
                    <span className="text-neutral-400 font-medium">
                      Date: <strong className="text-white font-extrabold">{a.appointment_date}</strong>
                    </span>
                  </div>

                  <div>{getStatusBadge(a.status)}</div>
                </div>

                {/* Customer Information Row */}
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-black font-black flex items-center justify-center text-lg shadow-sm flex-shrink-0">
                    {customerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-white leading-tight truncate">{customerName}</h3>
                      {isGuest && (
                        <span className="text-[0.65rem] bg-amber-400/10 text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Guest
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5 flex flex-wrap items-center gap-2 truncate">
                      <span>{a.customer_id?.email || (isGuest ? "Guest Booking" : "No Email")}</span>
                      {(a.customer_id?.phone || a.guest_phone) && (
                        <>
                          <span>·</span>
                          <span className="text-neutral-300 font-semibold">{a.customer_id?.phone || a.guest_phone}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Service Breakdown Box */}
                <div className="bg-surface-2/40 border border-border/60 rounded-2xl p-4 space-y-2.5">
                  {a.appointment_services && a.appointment_services.length > 0 ? (
                    a.appointment_services.map((svc, idx) => (
                      <div key={idx} className="p-3 bg-surface/90 border border-border/80 rounded-xl hover:border-amber-400/30 transition-colors shadow-sm">
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
                            {svc.service_id?.service_name || "Service"}
                          </h4>
                          <span className="text-sm font-black text-amber-400">
                            LKR {(svc.sub_price || svc.service_id?.base_price || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between text-xs text-neutral-400 gap-2 pl-3.5">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-blue-400" />
                            Staff: <strong className="text-white font-semibold">{svc.staff_id?.full_name || "Any Staff"}</strong>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                            Time: <strong className="text-white font-semibold">{formatTime(svc.service_start_time)} — {formatTime(svc.service_end_time)}</strong>
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-surface/90 border border-border/80 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <h4 className="text-white font-extrabold text-sm mb-1">
                          {a.service_ids && a.service_ids.length > 0 
                            ? a.service_ids.map(s => s.service_name).join(", ") 
                            : (a.service_id?.service_name || "Service")}
                        </h4>
                        <p className="text-neutral-400 flex items-center gap-2">
                          <span>Staff: <strong className="text-white">{a.staff_id?.full_name || "Staff"}</strong></span>
                          <span>·</span>
                          <span>Time: <strong className="text-white">{formatTime(a.start_time)} — {formatTime(a.end_time)}</strong></span>
                        </p>
                      </div>
                      <span className="text-sm font-black text-amber-400">
                        LKR {totalPrice.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Summary Footer Line inside Box */}
                  <div className="pt-2.5 border-t border-border/50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400 font-medium">Duration:</span>
                      {a.status?.toLowerCase() === "pending" && editingDuration !== a._id && (!a.appointment_services || a.appointment_services.length <= 1) && (
                        <button 
                          onClick={() => { setEditingDuration(a._id); setNewDuration(a.duration || 60); }}
                          className="text-amber-400 text-2xs hover:underline font-bold"
                        >
                          Edit
                        </button>
                      )}
                      {editingDuration === a._id ? (
                        <div className="flex items-center gap-1.5">
                          <select 
                            value={newDuration} 
                            onChange={(e) => setNewDuration(Number(e.target.value))}
                            className="bg-surface border border-border text-white text-xs rounded-lg px-2 py-0.5"
                          >
                            <option value={60}>1 Hour</option>
                            <option value={120}>2 Hours</option>
                            <option value={180}>3 Hours</option>
                            <option value={240}>4 Hours</option>
                          </select>
                          <button onClick={() => handleSaveDuration(a._id)} className="text-emerald-400 text-2xs font-bold hover:underline">Save</button>
                          <button onClick={() => setEditingDuration("")} className="text-neutral-400 text-2xs font-bold hover:underline">Cancel</button>
                        </div>
                      ) : (
                        <span className="text-white font-extrabold">{durationHours} {durationHours === 1 ? "Hour" : "Hours"}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400 font-medium font-semibold">Total Amount:</span>
                      <span className="text-amber-400 font-black text-base">LKR {totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Action Error Notification */}
                {appointmentError && (
                  <div className="p-3 bg-danger-dim border border-danger-border rounded-xl flex items-center gap-2 text-xs text-danger">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="font-semibold">{appointmentError}</span>
                  </div>
                )}

                {/* Footer Bar Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-border/80 text-xs">
                  <span className="text-neutral-500 text-2xs">
                    Booked on {new Date(a.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    {a.status?.toLowerCase() === "pending" && (
                      <>
                        <button
                          onClick={() => handleConfirm(a._id)}
                          disabled={isActionLoading}
                          className="px-5 py-2 rounded-xl bg-emerald-500 text-black text-xs font-black hover:bg-emerald-400 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-40 flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          {isActionLoading ? "..." : "Accept Booking"}
                        </button>
                        <button
                          onClick={() => handleReject(a._id)}
                          disabled={isActionLoading}
                          className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold hover:bg-rose-500 hover:text-white transition-all disabled:opacity-40 flex items-center gap-1.5"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    )}

                    {a.status?.toLowerCase() === "confirmed" && (
                      <>
                        <button
                          onClick={() => setEditingStaffAppointment(a)}
                          disabled={isActionLoading}
                          className="px-4 py-2 rounded-xl bg-surface-2 text-amber-400 hover:bg-amber-400 hover:text-black transition-all text-xs font-bold flex items-center gap-1.5 border border-border"
                          title="Reassign Staff"
                        >
                        <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleComplete(a._id)}
                          disabled={isActionLoading}
                          className="px-5 py-2 rounded-xl bg-blue-500 text-white text-xs font-black hover:bg-blue-400 shadow-md shadow-blue-500/20 transition-all disabled:opacity-40 flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {isActionLoading ? "..." : "Mark Complete"}
                        </button>
                        <button
                          onClick={() => handleAdminCancel(a._id)}
                          disabled={isActionLoading}
                          className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold hover:bg-rose-500 hover:text-white transition-all disabled:opacity-40"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {["completed", "rejected", "cancelled"].includes(a.status) && (
                      <button
                        onClick={() => handleDelete(a._id)}
                        disabled={isActionLoading}
                        className="px-4 py-2 rounded-xl bg-surface-2 text-rose-400 hover:bg-rose-500 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 border border-border"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Booking
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Table>
          <Table.Head>
            <Table.Th>Reference & Customer</Table.Th>
            <Table.Th>Date & Time</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th align="right">Amount</Table.Th>
            <Table.Th align="right">Actions</Table.Th>
          </Table.Head>
          <Table.Body>
            {filteredAppointments.map((a) => {
              const customerName = a.customer_id?.name || a.guest_name || "Guest Customer";
              const totalPrice = a.total_price || a.service_id?.base_price || 0;
              const isActionLoading = actionLoading === a._id;
              const refCode = `#APT-${a._id.slice(-6).toUpperCase()}`;

              return (
                <tr key={a._id} className="hover:bg-surface-2/60 transition-colors">
                  <Table.Td bold className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-extrabold text-xs">
                      {customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-2xs text-amber-400 font-black block">{refCode}</span>
                      <p className="text-white font-extrabold text-sm">{customerName}</p>
                      <p className="text-2xs text-neutral-400">{a.customer_id?.phone || a.guest_phone || "No phone"}</p>
                    </div>
                  </Table.Td>
                  <Table.Td className="text-xs text-neutral-300">
                    <p className="font-bold text-white">{a.appointment_date}</p>
                    <p className="text-2xs text-neutral-400">{formatTime(a.start_time)}</p>
                  </Table.Td>
                  <Table.Td>{getStatusBadge(a.status)}</Table.Td>
                  <Table.Td align="right" className="text-amber-400 font-extrabold text-xs">
                    LKR {totalPrice.toLocaleString()}
                  </Table.Td>
                  <Table.Td align="right">
                    <div className="flex items-center justify-end gap-2">
                      {a.status?.toLowerCase() === "pending" && (
                        <>
                          <button
                            onClick={() => handleConfirm(a._id)}
                            disabled={isActionLoading}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-extrabold text-2xs hover:bg-emerald-400 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleReject(a._id)}
                            disabled={isActionLoading}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-colors text-2xs font-extrabold"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {a.status?.toLowerCase() === "confirmed" && (
                        <>
                          <button
                            onClick={() => setEditingStaffAppointment(a)}
                            disabled={isActionLoading}
                            className="p-1.5 rounded-lg bg-surface-2 text-accent hover:bg-accent hover:text-primary transition-colors"
                            title="Reassign Staff"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleComplete(a._id)}
                            disabled={isActionLoading}
                            className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-2xs font-extrabold hover:bg-blue-400 transition-colors"
                          >
                            Complete
                          </button>
                        </>
                      )}
                      {["completed", "rejected", "cancelled"].includes(a.status) && (
                        <button
                          onClick={() => handleDelete(a._id)}
                          disabled={isActionLoading}
                          className="p-1.5 rounded-lg bg-surface-2 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                          title="Delete Appointment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </Table.Td>
                </tr>
              );
            })}
          </Table.Body>
        </Table>
      )}
      {editingStaffAppointment && (
        <EditStaffAssignmentModal
          appointment={editingStaffAppointment}
          salonId={salonId}
          onClose={() => setEditingStaffAppointment(null)}
          onSuccess={() => {
            setEditingStaffAppointment(null);
            fetchAppointments();
          }}
        />
      )}
    </div>
  );
}
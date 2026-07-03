import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import {
  getSalonAppointments,
  confirmAppointment,
  rejectAppointment,
  completeAppointment,
  adminCancelAppointment,
  updateAppointmentDuration,
  deleteAppointment
} from "../../services/appointmentService";

const STATUS_FILTERS = ["all", "pending", "confirmed", "completed", "rejected", "cancelled"];

const STATUS_COLORS = {
  pending:   "bg-warning-dim text-warning border-warning-border",
  confirmed: "bg-success-dim text-success border-success-border",
  cancelled: "bg-danger-dim text-danger border-danger-border",
  rejected:  "bg-danger-dim text-danger border-danger-border",
  completed: "bg-info-dim text-info border-info-border",
};

export default function Appointments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter]             = useState("all");
  const [dateFilter, setDateFilter]     = useState("");
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [actionError, setActionError]     = useState("");
  
  // Duration edit state
  const [editingDuration, setEditingDuration] = useState("");
  const [newDuration, setNewDuration] = useState(60);

  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const fetchAppointments = () => {
    setLoading(true);
    setError("");
    // Superadmin doesn't need to pass a specific salonId to get all appointments now
    getSalonAppointments("all", filter === "all" ? "" : filter, dateFilter)
      .then(res => setAppointments(res.data))
      .catch((err) => {
        console.error("API Error in fetchAppointments:", err, err.response);
        setError("Failed to load appointments.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAppointments(); }, [filter, dateFilter]);

  useEffect(() => {
    if (highlightId && !loading && appointments.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`appointment-${highlightId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add("ring-2", "ring-accent", "ring-offset-2", "ring-offset-background", "transition-all", "duration-1000");
          setTimeout(() => el.classList.remove("ring-2", "ring-accent", "ring-offset-2", "ring-offset-background"), 3000);
        }
      }, 100); // small delay to ensure DOM is ready
    }
  }, [highlightId, loading, appointments]);

  // Convert 24h time to 12h format
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

  // Parse action error for a specific appointment
  const getActionError = (id) => {
    if (!actionError) return null;
    const [errId, ...msg] = actionError.split(":");
    return errId === id ? msg.join(":") : null;
  };

  return (
    <div>
      <PageHeader title="All Appointments" subtitle="Manage and view all customer bookings across all salons" backTo="/superAdminDashboard">
        <button
          onClick={() => navigate("/AddAppointment")}
          className="px-5 py-2.5 bg-accent text-primary text-sm font-extrabold rounded-lg hover:bg-accent-hover transition-all duration-200 hover:shadow-glow flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Create Appointment
        </button>
      </PageHeader>

      {/* FILTERS */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all duration-200 ${
                filter === f
                  ? "bg-accent text-primary shadow-glow"
                  : "bg-surface text-muted-2 hover:bg-surface-hover hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        
        {/* Date Filter */}
        <div className="flex items-center gap-3 bg-surface-2 p-1.5 pl-4 rounded-xl border border-surface group focus-within:border-accent transition-all duration-300">
          <label className="text-sm font-bold text-muted-2 whitespace-nowrap flex items-center gap-2">
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Date:
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ colorScheme: 'dark' }}
            className="bg-transparent text-white text-sm font-bold focus:outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter("")}
              title="Clear date filter"
              className="w-7 h-7 rounded-lg bg-danger-dim text-danger hover:bg-danger hover:text-white flex items-center justify-center transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="p-3 bg-danger-dim border border-danger-border rounded-lg mb-4">
          <p className="text-danger text-xs font-bold">{error}</p>
        </div>
      )}

      {!loading && appointments.length === 0 && (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center">
          <p className="text-muted-2 text-sm">No {filter === "all" ? "" : filter} appointments found.</p>
        </div>
      )}

      <div className="space-y-4">
        {appointments.map(a => {
          const isActionLoading = actionLoading === a._id;
          const appointmentError = getActionError(a._id);

          const requiredSlots = a.duration ? Math.ceil(a.duration / 60) : 1;
          const durationHours = a.duration ? (a.duration / 60).toFixed(1).replace(/\.0$/, "") : "1";

          return (
            <div
              key={a._id}
              id={`appointment-${a._id}`}
              className={`bg-surface border border-surface rounded-xl overflow-hidden transition-all duration-200 
                hover:shadow-modal hover:-translate-y-1 hover:border-accent/30 flex flex-col relative p-5`}
            >
              {/* Header — Customer + Status */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white font-extrabold flex items-center gap-2">
                    <span>{a.customer_id?.name || a.guest_name || "Unknown Customer"}</span>
                    {!a.customer_id && a.guest_name && (
                      <span className="text-[0.6rem] bg-accent/20 text-accent px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                        Guest
                      </span>
                    )}
                  </p>
                  <p className="text-muted-2 text-xs mt-0.5">
                    {a.customer_id?.email || (a.guest_name ? "Guest Booking" : "No email provided")}
                    {(a.customer_id?.phone || a.guest_phone) ? ` · ${a.customer_id?.phone || a.guest_phone}` : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${STATUS_COLORS[a.status]}`}>
                      {a.status?.toUpperCase()}
                    </span>
                    <span className="text-muted-2 text-xs">{a.appointment_date}</span>
                  </div>
                  {a.salon_id && (
                     <span className="text-accent text-xs font-bold bg-accent/10 px-2 py-0.5 rounded">
                       Salon: {a.salon_id?.name}
                     </span>
                  )}
                </div>
              </div>

              {/* Service + Staff + Time details */}
              <div className="bg-surface-2 rounded-lg p-4 mb-4 space-y-3">
                {/* Service */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider mb-1">Service</p>
                    <p className="text-white font-bold text-sm">{a.service_id?.service_name}</p>
                  </div>
                  <p className="text-accent font-extrabold text-sm">LKR {a.total_price || a.service_id?.base_price}</p>
                </div>

                {/* Staff + Time */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                  <div>
                    <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider mb-1">Staff</p>
                    <p className="text-white text-xs font-bold">{a.staff_id?.full_name}</p>
                    {a.staff_id?.specification && (
                      <p className="text-muted-2 text-2xs">{a.staff_id?.specification}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider mb-1">Time</p>
                    <p className="text-white text-xs font-bold">
                      {formatTime(a.start_time)} — {formatTime(a.end_time)}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider">Duration</p>
                      {a.status === "pending" && editingDuration !== a._id && (
                        <button 
                          onClick={() => { setEditingDuration(a._id); setNewDuration(a.duration || 60); }}
                          className="text-accent text-[0.6rem] hover:underline"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    {editingDuration === a._id ? (
                      <div className="flex items-center gap-2">
                        <select 
                          value={newDuration} 
                          onChange={(e) => setNewDuration(Number(e.target.value))}
                          className="bg-surface border border-border text-white text-xs rounded px-1 py-0.5"
                        >
                          <option value={60}>1 Hour</option>
                          <option value={120}>2 Hours</option>
                          <option value={180}>3 Hours</option>
                          <option value={240}>4 Hours</option>
                        </select>
                        <button onClick={() => handleSaveDuration(a._id)} className="text-success text-[0.6rem] hover:underline font-bold">Save</button>
                        <button onClick={() => setEditingDuration("")} className="text-danger text-[0.6rem] hover:underline font-bold">Cancel</button>
                      </div>
                    ) : (
                      <p className="text-white text-xs font-bold">
                        {durationHours} {durationHours === 1 ? "Hour" : "Hours"}
                        <span className="text-muted-2 ml-1">({requiredSlots} {requiredSlots === 1 ? "slot" : "slots"})</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action error */}
              {appointmentError && (
                <div className="mb-3 p-3 bg-danger-dim border border-danger-border rounded-lg flex items-start gap-2">
                  <svg className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-danger text-xs font-bold">{appointmentError}</p>
                </div>
              )}

              {/* Footer — Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <p className="text-muted-2 text-xs">
                  Booked {new Date(a.createdAt).toLocaleDateString()}
                </p>

                <div className="flex gap-2">
                  {a.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleConfirm(a._id)}
                        disabled={isActionLoading}
                        className="px-4 py-1.5 bg-success-dim text-success border border-success-border text-xs font-extrabold rounded-lg hover:bg-success/20 transition-all duration-200 disabled:opacity-40"
                      >
                        {isActionLoading ? "..." : "Accept"}
                      </button>
                      <button
                        onClick={() => handleReject(a._id)}
                        disabled={isActionLoading}
                        className="px-4 py-1.5 bg-danger-dim text-danger border border-danger-border text-xs font-extrabold rounded-lg hover:bg-danger/20 transition-all duration-200 disabled:opacity-40"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {a.status === "confirmed" && (
                    <>
                      <button
                        onClick={() => handleComplete(a._id)}
                        disabled={isActionLoading}
                        className="px-4 py-1.5 bg-info-dim text-info border border-info-border text-xs font-extrabold rounded-lg hover:bg-info/20 transition-all duration-200 disabled:opacity-40"
                      >
                        {isActionLoading ? "..." : "Complete"}
                      </button>
                      <button
                        onClick={() => handleAdminCancel(a._id)}
                        disabled={isActionLoading}
                        className="px-4 py-1.5 bg-danger-dim text-danger border border-danger-border text-xs font-extrabold rounded-lg hover:bg-danger/20 transition-all duration-200 disabled:opacity-40"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {["completed", "rejected", "cancelled"].includes(a.status) && (
                    <button
                      onClick={() => handleDelete(a._id)}
                      disabled={isActionLoading}
                      className="px-4 py-1.5 bg-danger-dim text-danger border border-danger-border text-xs font-extrabold rounded-lg hover:bg-danger hover:text-white transition-all duration-200 disabled:opacity-40 flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

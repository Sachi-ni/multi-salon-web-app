import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getSalonAppointments,
  confirmAppointment,
  rejectAppointment,
  completeAppointment,
  adminCancelAppointment,
  updateAppointmentDuration
} from "../../services/appointmentService";
import PageHeader from "../../components/ui/PageHeader";

const STATUS_FILTERS = ["all", "pending", "confirmed", "completed", "rejected", "cancelled"];

const STATUS_COLORS = {
  pending:   "bg-warning-dim text-warning border-warning-border",
  confirmed: "bg-success-dim text-success border-success-border",
  cancelled: "bg-danger-dim text-danger border-danger-border",
  rejected:  "bg-danger-dim text-danger border-danger-border",
  completed: "bg-info-dim text-info border-info-border",
};

export default function AdminBookings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const salonId  = user?.salon_id || "";

  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter]             = useState("pending");
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [actionError, setActionError]     = useState("");
  
  // Duration edit state
  const [editingDuration, setEditingDuration] = useState("");
  const [newDuration, setNewDuration] = useState(60);

  const fetchAppointments = () => {
    setLoading(true);
    setError("");
    getSalonAppointments(salonId, filter === "all" ? "" : filter)
      .then(res => setAppointments(res.data))
      .catch(() => setError("Failed to load appointments."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAppointments(); }, [filter]);

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
      <PageHeader 
        title="Appointments"
        subtitle="Manage and confirm customer bookings"
        backTo={`/salon-admin/${salonId}/adminDashboard`}
      >
        <button
          onClick={() => navigate(`/salon-admin/${salonId}/AddAppointment`)}
          className="px-5 py-2.5 bg-accent text-primary text-sm font-extrabold rounded-lg hover:bg-accent-hover transition-all duration-200 hover:shadow-glow flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Create Appointment
        </button>
      </PageHeader>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-xs font-extrabold border transition-all duration-200
              ${filter === s
                ? "bg-accent text-primary border-accent"
                : "bg-surface-2 text-muted-2 border-border hover:border-border-hover"
              }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
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
          const totalDurationMins = a.appointment_services && a.appointment_services.length > 0
            ? a.appointment_services.reduce((sum, s) => sum + (s.service_id?.duration || 0), 0)
            : (a.duration || 60);
          const durationHours = Math.ceil(totalDurationMins / 60);
          const requiredSlots = durationHours;
          const appointmentError = getActionError(a._id);
          const isActionLoading = actionLoading === a._id;

          return (
            <div key={a._id} className="bg-surface border border-border rounded-2xl p-5 shadow-card">

              {/* Header — Customer + Status */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white font-extrabold">{a.customer_id?.name || "Unknown Customer"}</p>
                  <p className="text-muted-2 text-xs mt-0.5">
                    {a.customer_id?.email || "No email provided"}
                    {a.customer_id?.phone ? ` · ${a.customer_id.phone}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${STATUS_COLORS[a.status]}`}>
                    {a.status.toUpperCase()}
                  </span>
                  <span className="text-muted-2 text-xs">{a.appointment_date}</span>
                </div>
              </div>

              {/* Service + Staff + Time details */}
              <div className="bg-surface-2 rounded-lg p-4 mb-4 space-y-3">
                {a.appointment_services && a.appointment_services.length > 0 ? (
                  a.appointment_services.map((svc, idx) => (
                    <div key={idx} className="pb-3 mb-3 border-b border-border last:pb-0 last:mb-0 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider mb-1">Service</p>
                          <p className="text-white font-bold text-sm">{svc.service_id?.service_name || "Unknown Service"}</p>
                        </div>
                        <p className="text-accent font-extrabold text-sm">LKR {svc.sub_price || svc.service_id?.base_price}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider mb-1">Staff</p>
                          <p className="text-white text-xs font-bold">{svc.staff_id?.full_name || "Any Stylist"}</p>
                        </div>
                        <div>
                          <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider mb-1">Time</p>
                          <p className="text-white text-xs font-bold">
                            {formatTime(svc.service_start_time)} — {formatTime(svc.service_end_time)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="pb-3 mb-3 border-b border-border">
                    {/* Fallback for single service */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider mb-1">Service</p>
                        <p className="text-white font-bold text-sm">
                          {a.service_ids && a.service_ids.length > 0 
                            ? a.service_ids.map(s => s.service_name).join(", ") 
                            : a.service_id?.service_name}
                        </p>
                      </div>
                      <p className="text-accent font-extrabold text-sm">LKR {a.total_price || a.service_id?.base_price}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider mb-1">Staff</p>
                        <p className="text-white text-xs font-bold">{a.staff_id?.full_name}</p>
                      </div>
                      <div>
                        <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider mb-1">Time</p>
                        <p className="text-white text-xs font-bold">
                          {formatTime(a.start_time)} — {formatTime(a.end_time)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Total Duration */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider">Total Duration</p>
                    {a.status === "pending" && editingDuration !== a._id && (!a.appointment_services || a.appointment_services.length <= 1) && (
                      <button 
                        onClick={() => { setEditingDuration(a._id); setNewDuration(a.duration || 60); }}
                        className="text-accent text-[0.6rem] hover:underline"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  <div>
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
                        <span className="text-muted-2 ml-1 font-normal">({requiredSlots} {requiredSlots === 1 ? "slot" : "slots"})</span>
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
                      {user?.role === "super-admin" && (
                        <button
                          onClick={() => handleConfirm(a._id)}
                          disabled={isActionLoading}
                          className="px-4 py-1.5 bg-success-dim text-success border border-success-border text-xs font-extrabold rounded-lg hover:bg-success/20 transition-all duration-200 disabled:opacity-40"
                        >
                          {isActionLoading ? "..." : "Accept"}
                        </button>
                      )}
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
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
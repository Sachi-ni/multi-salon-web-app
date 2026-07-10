import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMyAppointments, cancelAppointment } from "../../services/appointmentService";
import { Calendar, PlusCircle, Clock, CheckCircle, XCircle } from "lucide-react";

const STATUS_COLORS = {
  pending:   "bg-warning-dim text-warning border-warning-border",
  confirmed: "bg-success-dim text-success border-success-border",
  cancelled: "bg-danger-dim text-danger border-danger-border",
  rejected:  "bg-danger-dim text-danger border-danger-border",
  completed: "bg-info-dim text-info border-info-border",
};

const STATUS_ICONS = {
  pending:   "⏳",
  confirmed: "✓",
  cancelled: "✕",
  rejected:  "✕",
  completed: "★",
};

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState("");

  const fetchAppointments = () => {
    setLoading(true);
    getMyAppointments()
      .then(res => setAppointments(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAppointments(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    setCancelling(id);
    try {
      await cancelAppointment(id);
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel appointment.");
    } finally {
      setCancelling("");
    }
  };

  const formatTime = (time) => {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
  };

  const pending = appointments.filter(a => a.status === "pending").length;
  const confirmed = appointments.filter(a => a.status === "confirmed").length;
  const completed = appointments.filter(a => a.status === "completed").length;
  const cancelled = appointments.filter(a => a.status === "cancelled" || a.status === "rejected").length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">My Appointments</h1>
        <p className="text-muted-2 text-sm mt-1">View and manage your salon appointments.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Pending",   value: pending,   icon: Clock,       color: "text-warning", bg: "bg-warning-dim border-warning-border" },
          { label: "Confirmed", value: confirmed, icon: CheckCircle, color: "text-success", bg: "bg-success-dim border-success-border" },
          { label: "Completed", value: completed, icon: Calendar,    color: "text-info",    bg: "bg-info-dim border-info-border" },
          { label: "Cancelled", value: cancelled, icon: XCircle,     color: "text-danger",  bg: "bg-danger-dim border-danger-border" },
        ].map(stat => (
          <div key={stat.label} className="bg-surface border border-border rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-2 text-sm font-bold">{stat.label}</span>
              <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-3xl font-black text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Book New Appointment CTA */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/book")}
          className="w-full sm:w-auto px-8 py-4 bg-accent hover:bg-accent-hover text-primary font-extrabold rounded-2xl transition-all duration-200 hover:shadow-glow hover:-translate-y-0.5 flex items-center justify-center gap-3 text-lg"
        >
          <PlusCircle className="w-6 h-6" />
          Book New Appointment
        </button>
      </div>

      {/* Appointments List */}
      <div>
        <h2 className="text-xl font-extrabold text-white mb-5">Your Appointments</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-12 bg-surface border border-border rounded-2xl">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center shadow-card">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-2 border border-border flex items-center justify-center">
              <Calendar className="w-8 h-8 text-muted-2" />
            </div>
            <p className="text-white font-bold text-base mb-1">No Appointments Yet</p>
            <p className="text-muted-2 text-sm">Book your first appointment to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map(a => {
              const durationHours = Math.ceil((a.duration || 60) / 60);
              return (
                <div key={a._id} className="bg-surface border border-border rounded-2xl p-5 shadow-card">
                  {/* Header — Salon + Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-white font-extrabold text-lg">{a.salon_id?.name}</p>
                      <p className="text-muted-2 text-sm mt-0.5">{a.appointment_date}</p>
                    </div>
                    <span className={`self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-extrabold border flex items-center gap-1.5 ${STATUS_COLORS[a.status]}`}>
                      <span>{STATUS_ICONS[a.status]}</span>
                      {a.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Service details */}
                  <div className="bg-surface-2 rounded-xl p-4 mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <p className="text-white font-bold">{a.service_id?.service_name}</p>
                      <p className="text-accent font-extrabold text-lg">LKR {a.total_price || a.service_id?.base_price}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-2">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {a.staff_id?.full_name}
                      </span>
                      <span className="hidden sm:inline">·</span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatTime(a.start_time)} — {formatTime(a.end_time)}
                      </span>
                      <span className="hidden sm:inline">·</span>
                      <span>{durationHours} {durationHours === 1 ? "hr" : "hrs"}</span>
                    </div>
                  </div>

                  {/* Footer — Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border">
                    <p className="text-muted-2 text-sm">
                      Booked {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                    
                    <div className="flex items-center gap-3">
                      {a.status === "pending" && (
                        <button
                          onClick={() => handleCancel(a._id)}
                          disabled={cancelling === a._id}
                          className="px-5 py-2 bg-danger-dim text-danger border border-danger-border text-sm font-extrabold rounded-xl hover:bg-danger/20 transition-all duration-200 disabled:opacity-40"
                        >
                          {cancelling === a._id ? "Cancelling..." : "Cancel Booking"}
                        </button>
                      )}
                      
                      {a.status === "confirmed" && (
                        <span className="text-success text-sm font-bold flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4" />
                          Confirmed {a.confirmed_at ? `on ${new Date(a.confirmed_at).toLocaleDateString()}` : ""}
                        </span>
                      )}
                      
                      {a.status === "completed" && !a.feedback_submitted && (
                        <button
                          onClick={() => navigate(`/customer/give-feedback/${a._id}`, { state: { appointment: a } })}
                          className="px-5 py-2 bg-accent text-primary text-sm font-extrabold rounded-xl hover:bg-accent-hover transition-all duration-200"
                        >
                          Give Feedback
                        </button>
                      )}
                      
                      {a.status === "completed" && a.feedback_submitted && (
                        <span className="text-info text-sm font-bold">Feedback submitted</span>
                      )}
                      
                      {a.status === "rejected" && (
                        <span className="text-danger text-sm font-bold flex items-center gap-1.5">
                          <XCircle className="w-4 h-4" />
                          Rejected {a.rejected_at ? `on ${new Date(a.rejected_at).toLocaleDateString()}` : ""}
                        </span>
                      )}

                      {(a.status === "cancelled" || a.status === "rejected") && (
                        <button
                          onClick={() => navigate("/book")}
                          className="px-5 py-2 bg-surface-2 text-white border border-border hover:border-border-hover text-sm font-extrabold rounded-xl transition-all duration-200"
                        >
                          Book Again
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
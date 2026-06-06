import { useEffect, useState } from "react";
import { getMyAppointments, cancelAppointment } from "../../services/appointmentService";

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

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [cancelling, setCancelling]     = useState("");

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

  // Convert 24h time to 12h format
  const formatTime = (time) => {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
  };

  if (loading) return (
    <div className="min-h-screen bg-primary flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">My Appointments</h1>
          <p className="text-muted-2 text-sm mt-1">Track all your salon bookings</p>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-2 border border-border flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-white font-bold text-sm mb-1">No Appointments Yet</p>
            <p className="text-muted-2 text-xs">Book your first appointment to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map(a => {
              const durationHours = Math.ceil((a.duration || 60) / 60);
              return (
                <div key={a._id} className="bg-surface border border-border rounded-2xl p-5 shadow-card">

                  {/* Header — Salon + Status */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-white font-extrabold">{a.salon_id?.name}</p>
                      <p className="text-muted-2 text-sm mt-0.5">{a.appointment_date}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${STATUS_COLORS[a.status]}`}>
                      {STATUS_ICONS[a.status]} {a.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Service details */}
                  <div className="bg-surface-2 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white font-bold text-sm">{a.service_id?.service_name}</p>
                      <p className="text-accent font-extrabold text-sm">LKR {a.total_price || a.service_id?.base_price}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-2">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {a.staff_id?.full_name}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatTime(a.start_time)} — {formatTime(a.end_time)}
                      </span>
                      <span>·</span>
                      <span>{durationHours} {durationHours === 1 ? "hr" : "hrs"}</span>
                    </div>
                  </div>

                  {/* Footer — Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <p className="text-muted-2 text-xs">
                      Booked {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                    {a.status === "pending" && (
                      <button
                        onClick={() => handleCancel(a._id)}
                        disabled={cancelling === a._id}
                        className="px-4 py-1.5 bg-danger-dim text-danger border border-danger-border text-xs font-extrabold rounded-lg hover:bg-danger/20 transition-all duration-200 disabled:opacity-40"
                      >
                        {cancelling === a._id ? "Cancelling..." : "Cancel Booking"}
                      </button>
                    )}
                    {a.status === "confirmed" && (
                      <span className="text-success text-xs font-bold flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Confirmed {a.confirmed_at ? `on ${new Date(a.confirmed_at).toLocaleDateString()}` : ""}
                      </span>
                    )}
                    {a.status === "rejected" && (
                      <span className="text-danger text-xs font-bold">
                        Rejected {a.rejected_at ? `on ${new Date(a.rejected_at).toLocaleDateString()}` : ""}
                      </span>
                    )}
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
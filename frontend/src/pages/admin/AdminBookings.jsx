import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getSalonAppointments, updateAppointmentStatus } from "../../services/appointmentService";

const STATUS_FILTERS = ["all", "pending", "confirmed", "completed", "cancelled"];

const STATUS_COLORS = {
  pending:   "bg-warning-dim text-warning border-warning-border",
  confirmed: "bg-success-dim text-success border-success-border",
  cancelled: "bg-danger-dim text-danger border-danger-border",
  completed: "bg-info-dim text-info border-info-border",
};

export default function AdminBookings() {
  const { user } = useAuth();
  const salonId  = user?.salon_id || "";

  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter]             = useState("pending");
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");

  const fetchAppointments = () => {
    setLoading(true);
    getSalonAppointments(salonId, filter === "all" ? "" : filter)
      .then(res => setAppointments(res.data))
      .catch(() => setError("Failed to load appointments."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAppointments(); }, [filter]);

  const changeStatus = async (id, status) => {
    try {
      await updateAppointmentStatus(id, status);
      fetchAppointments();
    } catch {
      alert("Failed to update status.");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Appointments</h1>
        <p className="text-muted-2 text-sm mt-1">Manage and confirm customer bookings</p>
      </div>

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
        {appointments.map(a => (
          <div key={a._id} className="bg-surface border border-border rounded-2xl p-5 shadow-card">

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white font-extrabold">{a.customer_id?.name}</p>
                <p className="text-muted-2 text-xs mt-0.5">{a.customer_id?.email} · {a.customer_id?.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${STATUS_COLORS[a.status]}`}>
                  {a.status.toUpperCase()}
                </span>
                <span className="text-muted-2 text-xs">{a.date}</span>
              </div>
            </div>

            {/* Services */}
            <div className="space-y-2 mb-4">
              {a.services.map((s, i) => (
                <div key={i} className="bg-surface-2 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-sm">{s.service_id?.service_name}</p>
                    <p className="text-muted-2 text-xs mt-0.5">
                      with {s.staff_id?.full_name} · {s.slot?.start_time} – {s.slot?.end_time}
                    </p>
                  </div>
                  <p className="text-accent font-extrabold text-sm">LKR {s.service_id?.base_price}</p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <p className="text-accent font-black">Total: LKR {a.total_price}</p>

              <div className="flex gap-2">
                {a.status === "pending" && (
                  <>
                    <button
                      onClick={() => changeStatus(a._id, "confirmed")}
                      className="px-4 py-1.5 bg-success-dim text-success border border-success-border text-xs font-extrabold rounded-lg hover:bg-success/20 transition-all duration-200"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => changeStatus(a._id, "cancelled")}
                      className="px-4 py-1.5 bg-danger-dim text-danger border border-danger-border text-xs font-extrabold rounded-lg hover:bg-danger/20 transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {a.status === "confirmed" && (
                  <>
                    <button
                      onClick={() => changeStatus(a._id, "completed")}
                      className="px-4 py-1.5 bg-info-dim text-info border border-info-border text-xs font-extrabold rounded-lg hover:bg-info/20 transition-all duration-200"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => changeStatus(a._id, "cancelled")}
                      className="px-4 py-1.5 bg-danger-dim text-danger border border-danger-border text-xs font-extrabold rounded-lg hover:bg-danger/20 transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
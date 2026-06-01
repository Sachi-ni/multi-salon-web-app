import { useEffect, useState } from "react";
import { getMyAppointments } from "../../services/appointmentService";

const STATUS_COLORS = {
  pending:   "bg-warning-dim text-warning border-warning-border",
  confirmed: "bg-success-dim text-success border-success-border",
  cancelled: "bg-danger-dim text-danger border-danger-border",
  completed: "bg-info-dim text-info border-info-border",
};

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    getMyAppointments()
      .then(res => setAppointments(res.data))
      .finally(() => setLoading(false));
  }, []);

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
            <p className="text-muted-2 text-sm">You have no appointments yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map(a => (
              <div key={a._id} className="bg-surface border border-border rounded-2xl p-5 shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white font-extrabold">{a.salon_id?.name}</p>
                    <p className="text-muted-2 text-sm mt-0.5">{a.date}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${STATUS_COLORS[a.status]}`}>
                    {a.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2">
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

                <div className="flex justify-end mt-4 pt-4 border-t border-border">
                  <p className="text-accent font-black">Total: LKR {a.total_price}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
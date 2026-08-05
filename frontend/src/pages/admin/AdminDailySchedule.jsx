// Force Webpack reload
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDailySchedule } from "../../services/appointmentService";

export default function AdminDailySchedule() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const salonId = user?.salon_id || "";

  const [date, setDate]         = useState(new Date().toISOString().split("T")[0]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const fetchSchedule = useCallback(() => {
    setLoading(true);
    setError("");
    getDailySchedule(salonId, date)
      .then((res) => setSchedule(res.data.schedule || []))
      .catch((err) => {
        console.error("fetchSchedule error:", err);
        setError("Failed to load schedule.");
      })
      .finally(() => setLoading(false));
  }, [salonId, date]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchSchedule(); }, [date]);

  // Convert 24h time to 12h format
  const formatTime = (time) => {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Daily Schedule</h1>
          <p className="text-muted-2 text-sm mt-1">View all confirmed appointments for a day</p>
        </div>
        <button
          onClick={() => navigate(`/salon-admin/${salonId}/AddAppointment`)}
          className="px-5 py-2.5 bg-accent text-primary text-sm font-extrabold rounded-lg hover:bg-accent-hover transition-all duration-200 hover:shadow-glow flex items-center gap-2 w-fit"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Create Appointment
        </button>
      </div>

      {/* Date picker */}
      <div className="mb-6">
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-accent transition-all duration-200 cursor-pointer"
        />
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

      {!loading && schedule.length === 0 && (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-2 border border-border flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-white font-bold text-sm mb-1">No Appointments</p>
          <p className="text-muted-2 text-xs">No confirmed appointments for {date}.</p>
        </div>
      )}

      {/* Schedule grouped by staff */}
      {!loading && schedule.length > 0 && (
        <div className="space-y-6">
          {schedule.map((group, idx) => (
            <div key={idx} className="bg-surface border border-border rounded-2xl p-5 shadow-card">

              {/* Staff header */}
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
                <div className="w-10 h-10 rounded-full bg-accent text-primary flex items-center justify-center flex-shrink-0">
                  <span className="font-black text-sm">
                    {group.staff?.full_name?.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
                <div>
                  <p className="text-white font-extrabold text-sm">{group.staff?.full_name}</p>
                  {group.staff?.specification && (
                    <p className="text-muted-2 text-xs">{group.staff?.specification}</p>
                  )}
                </div>
                <span className="ml-auto px-2.5 py-1 bg-accent-dim text-accent text-xs font-extrabold rounded-lg border border-accent/20">
                  {group.appointments.length} {group.appointments.length === 1 ? "appointment" : "appointments"}
                </span>
              </div>

              {/* Appointments timeline */}
              <div className="space-y-2">
                {group.appointments.map(apt => (
                  <div key={apt._id} className="bg-surface-2 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[80px]">
                        <p className="text-accent font-bold text-xs">{formatTime(apt.start_time)}</p>
                        <p className="text-muted-2 text-2xs">to {formatTime(apt.end_time)}</p>
                      </div>
                      <div className="w-px h-8 bg-border" />
                      <div>
                        <p className="text-white font-bold text-sm">{apt.service_id?.service_name}</p>
                        <p className="text-muted-2 text-xs">
                          {apt.customer_id?.name} · {Math.ceil((apt.duration || 60) / 60)} hr
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-2xs font-extrabold border ${
                      apt.status === "confirmed"
                        ? "bg-success-dim text-success border-success-border"
                        : "bg-info-dim text-info border-info-border"
                    }`}>
                      {apt.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

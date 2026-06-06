import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getStaffAppointments } from "../../services/appointmentService";
import api from "../../services/api";

const STATUS_COLORS = {
  pending:   "bg-warning-dim text-warning border-warning-border",
  confirmed: "bg-success-dim text-success border-success-border",
  cancelled: "bg-danger-dim text-danger border-danger-border",
  rejected:  "bg-danger-dim text-danger border-danger-border",
  completed: "bg-info-dim text-info border-info-border",
};

export default function AdminStaffSchedule() {
  const { user } = useAuth();
  const salonId = user?.salon_id || "";

  const [staffList, setStaffList]     = useState([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [date, setDate]               = useState("");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [staffLoading, setStaffLoading] = useState(true);

  // Fetch staff for this salon
  useEffect(() => {
    api.get("/staff", { params: { salonId } })
      .then(res => setStaffList(res.data))
      .finally(() => setStaffLoading(false));
  }, [salonId]);

  // Fetch appointments when staff or date changes
  useEffect(() => {
    if (!selectedStaff) return;
    setLoading(true);
    getStaffAppointments(selectedStaff, "", date)
      .then(res => setAppointments(res.data))
      .finally(() => setLoading(false));
  }, [selectedStaff, date]);

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
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Staff Schedule</h1>
        <p className="text-muted-2 text-sm mt-1">View appointments assigned to a staff member</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select
          value={selectedStaff}
          onChange={e => setSelectedStaff(e.target.value)}
          className="bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-accent transition-all duration-200 cursor-pointer min-w-[200px]"
        >
          <option value="">Select a staff member</option>
          {staffList.map(s => (
            <option key={s._id} value={s._id}>{s.full_name} — {s.role}</option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-accent transition-all duration-200 cursor-pointer"
          placeholder="Filter by date"
        />
        {date && (
          <button
            onClick={() => setDate("")}
            className="px-4 py-2.5 bg-surface-2 text-muted-2 text-xs font-bold rounded-xl border border-border hover:border-border-hover transition-all"
          >
            Clear Date
          </button>
        )}
      </div>

      {staffLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!selectedStaff && !staffLoading && (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-2 border border-border flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-white font-bold text-sm mb-1">Select a Staff Member</p>
          <p className="text-muted-2 text-xs">Choose a staff member to view their schedule.</p>
        </div>
      )}

      {selectedStaff && loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {selectedStaff && !loading && appointments.length === 0 && (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center">
          <p className="text-muted-2 text-sm">No appointments found for this staff member{date ? ` on ${date}` : ""}.</p>
        </div>
      )}

      {selectedStaff && !loading && appointments.length > 0 && (
        <div className="space-y-3">
          {appointments.map(a => {
            const durationHours = Math.ceil((a.duration || 60) / 60);
            return (
              <div key={a._id} className="bg-surface border border-border rounded-xl p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[80px]">
                      <p className="text-accent font-bold text-xs">{formatTime(a.start_time)}</p>
                      <p className="text-muted-2 text-2xs">to {formatTime(a.end_time)}</p>
                    </div>
                    <div className="w-px h-10 bg-border" />
                    <div>
                      <p className="text-white font-bold text-sm">{a.service_id?.service_name}</p>
                      <p className="text-muted-2 text-xs mt-0.5">
                        {a.customer_id?.name} · {a.appointment_date} · {durationHours} {durationHours === 1 ? "hr" : "hrs"}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${STATUS_COLORS[a.status]}`}>
                    {a.status.toUpperCase()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

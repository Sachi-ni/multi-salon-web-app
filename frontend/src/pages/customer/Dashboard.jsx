import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMyAppointments } from "../../services/appointmentService";
import { Calendar, PlusCircle, Clock, CheckCircle } from "lucide-react";

const STATUS_COLORS = {
  pending:   "bg-warning-dim text-warning border-warning-border",
  confirmed: "bg-success-dim text-success border-success-border",
  cancelled: "bg-danger-dim text-danger border-danger-border",
  completed: "bg-info-dim text-info border-info-border",
};

export default function CustomerDashboard() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    getMyAppointments()
      .then(res => setAppointments(res.data))
      .finally(() => setLoading(false));
  }, []);

  const pending   = appointments.filter(a => a.status === "pending").length;
  const confirmed = appointments.filter(a => a.status === "confirmed").length;
  const completed = appointments.filter(a => a.status === "completed").length;
  const recent    = appointments.slice(0, 3);

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">
          Welcome back, <span className="text-accent">{user?.name?.split(" ")[0]}</span> 👋
        </h1>
        <p className="text-muted-2 text-sm mt-1">Manage your salon appointments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Pending",   value: pending,   icon: Clock,         color: "text-warning", bg: "bg-warning-dim border-warning-border" },
          { label: "Confirmed", value: confirmed, icon: CheckCircle,   color: "text-success", bg: "bg-success-dim border-success-border" },
          { label: "Completed", value: completed, icon: Calendar,      color: "text-info",    bg: "bg-info-dim border-info-border" },
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

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => navigate("/book")}
          className="bg-accent hover:bg-accent-hover text-primary font-extrabold rounded-2xl p-5 text-left transition-all duration-200 hover:shadow-glow hover:-translate-y-0.5 flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-lg font-black">New Booking</p>
            <p className="text-sm font-medium opacity-75">Book an appointment now</p>
          </div>
        </button>

        <button
          onClick={() => navigate("/my-appointments")}
          className="bg-surface hover:bg-surface-2 border border-border hover:border-border-hover text-white font-extrabold rounded-2xl p-5 text-left transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-accent-dim border border-accent/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="text-lg font-black">My Bookings</p>
            <p className="text-sm font-medium text-muted-2">View all your appointments</p>
          </div>
        </button>
      </div>

      {/* Recent appointments */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-extrabold">Recent Appointments</h2>
          <button
            onClick={() => navigate("/my-appointments")}
            className="text-accent text-xs font-bold hover:underline"
          >
            View all →
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-2 text-sm">No appointments yet.</p>
            <button
              onClick={() => navigate("/book")}
              className="mt-3 px-4 py-2 bg-accent text-primary text-xs font-extrabold rounded-lg hover:bg-accent-hover transition-all"
            >
              Book Now
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map(a => (
              <div key={a._id} className="bg-surface-2 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">{a.salon_id?.name}</p>
                  <p className="text-muted-2 text-xs mt-0.5">
                    {a.appointment_date} · {a.service_id?.service_name}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${STATUS_COLORS[a.status]}`}>
                  {a.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
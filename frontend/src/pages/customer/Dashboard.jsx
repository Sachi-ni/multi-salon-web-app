import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { getMyAppointments, cancelAppointment, deleteAppointment } from "../../services/appointmentService";
import {
  Calendar, Plus, Clock, CheckCircle2, XCircle, 
  Search, Star, Scissors
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CustomerDashboardBackground from "../../components/ui/CustomerDashboardBackground";

const STATUS_COLORS = {
  pending:   "text-warning bg-warning/10 border-warning/30",
  confirmed: "text-success bg-success/10 border-success/30",
  cancelled: "text-danger bg-danger/10 border-danger/30",
  rejected:  "text-danger bg-danger/10 border-danger/30",
  completed: "text-info bg-info/10 border-info/30",
};

const STATUS_ICONS = {
  pending:   <Clock className="w-3.5 h-3.5" />,
  confirmed: <CheckCircle2 className="w-3.5 h-3.5" />,
  cancelled: <XCircle className="w-3.5 h-3.5" />,
  rejected:  <XCircle className="w-3.5 h-3.5" />,
  completed: <Star className="w-3.5 h-3.5" />,
};

const TABS = ["All", "Pending", "Confirmed", "Completed", "Cancelled"];

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState("");
  const [deleting, setDeleting] = useState("");
  
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this appointment record?")) return;
    setDeleting(id);
    try {
      await deleteAppointment(id);
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete appointment.");
    } finally {
      setDeleting("");
    }
  };

  const formatTime = (time) => {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
  };

  const filteredAppointments = useMemo(() => {
    let filtered = appointments;

    // Filter by Tab
    if (activeTab !== "All") {
      filtered = filtered.filter(a => a.status.toLowerCase() === activeTab.toLowerCase());
    }

    // Filter by Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.salon_id?.name?.toLowerCase().includes(q) ||
        a.service_id?.service_name?.toLowerCase().includes(q) ||
        a.staff_id?.full_name?.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [appointments, activeTab, searchQuery]);

  return (
    <div className="min-h-screen bg-primary pt-28 pb-20 relative overflow-hidden">
      {/* Premium Salon-Themed Background */}
      <CustomerDashboardBackground />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tight mb-3 drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              My Appointments
            </h1>
            <p className="text-muted-2 text-sm md:text-base font-medium">
              View, manage and track all your salon appointments.
            </p>
          </div>
          <button
            onClick={() => navigate("/book")}
            className="w-full md:w-auto px-6 py-3.5 bg-gradient-to-r from-[#d4af37] to-[#aa8123] text-primary font-bold rounded-xl transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2 shrink-0 border border-yellow-300/30"
          >
            <Plus className="w-5 h-5" />
            Book New Appointment
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col lg:flex-row gap-6 mb-10">
          {/* Tabs */}
          <div className="flex overflow-x-auto gap-3 pb-2 lg:pb-0 flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm border ${
                  activeTab === tab 
                    ? "bg-white text-primary border-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                    : "bg-surface/80 backdrop-blur-md text-muted-2 border-border hover:bg-surface-2 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full lg:w-80 shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-2" />
            <input 
              type="text"
              placeholder="Search salon, service or staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-surface/80 backdrop-blur-md border border-border rounded-full text-sm text-white placeholder:text-muted-2 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-surface/50 rounded-2xl p-4 sm:p-6 border border-border/50 animate-pulse flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-72 h-56 bg-surface-2/50 rounded-xl shrink-0" />
                <div className="flex-1 space-y-4 py-4">
                  <div className="h-8 bg-surface-2/50 rounded-md w-1/3" />
                  <div className="h-5 bg-surface-2/50 rounded-md w-1/4" />
                  <div className="flex gap-4 pt-6">
                    <div className="h-10 bg-surface-2/50 rounded-lg w-32" />
                    <div className="h-10 bg-surface-2/50 rounded-lg w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-surface/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-12 md:p-16 text-center flex flex-col items-center shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <div className="w-24 h-24 mb-6 rounded-full bg-surface-2 flex items-center justify-center border border-white/5 shadow-inner">
              <Calendar className="w-12 h-12 text-accent/70" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">You don't have any appointments yet.</h3>
            <p className="text-muted-2 text-base max-w-sm mx-auto mb-8">
              {searchQuery || activeTab !== "All" 
                ? "Try adjusting your filters or search terms." 
                : "Book your first appointment to experience premium salon services."}
            </p>
            {(!searchQuery && activeTab === "All") && (
              <button
                onClick={() => navigate("/book")}
                className="px-8 py-4 bg-gradient-to-r from-[#d4af37] to-[#aa8123] text-primary font-bold rounded-xl transition-all hover:scale-[1.02] flex items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.3)] border border-yellow-300/30"
              >
                <Plus className="w-5 h-5" />
                Book New Appointment
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {filteredAppointments.map((a) => {

                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    key={a._id}
                    className="relative bg-gradient-to-r from-surface to-surface-2/80 border border-white/10 hover:border-accent/40 rounded-3xl overflow-hidden transition-all duration-500 shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:shadow-[0_0_25px_rgba(212,175,55,0.15)] group"
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Left Image Section */}
                      <div className="w-full md:w-80 h-64 md:h-auto shrink-0 relative overflow-hidden">
                        {/* Beautiful Placeholder Image */}
                        <img 
                          src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80" 
                          alt="Salon Interior" 
                          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent" />
                        
                        {/* Metallic Scissor Icon Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                           <div className="w-24 h-24 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                             <Scissors className="w-12 h-12 text-[#d4af37] drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
                           </div>
                        </div>

                        {/* Status Badge */}
                        <div className="absolute top-5 left-5 z-10">
                          <span className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 backdrop-blur-md border shadow-lg ${STATUS_COLORS[a.status]}`}>
                            {STATUS_ICONS[a.status]}
                            {a.status}
                          </span>
                        </div>
                      </div>

                      {/* Right Content Section */}
                      <div className="flex-1 p-6 md:p-8 flex flex-col justify-between relative z-10">
                        <div>
                          {/* Services List */}
                          <div className="mb-6 space-y-4">
                            {a.appointment_services && a.appointment_services.length > 0 ? (
                              a.appointment_services.map((svc, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                                  <div>
                                    <h3 className="text-xl font-display font-black text-white mb-0.5 drop-shadow-sm">
                                      {svc.service_id?.service_name || "Unknown Service"}
                                    </h3>
                                    <p className="text-sm text-muted-2 font-medium">
                                      with {svc.staff_id?.full_name || "Any Stylist"} • {formatTime(svc.service_start_time)} - {formatTime(svc.service_end_time)}
                                    </p>
                                  </div>
                                  <div className="text-left sm:text-right shrink-0">
                                    <p className="text-lg font-black text-[#d4af37] drop-shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                                      LKR {svc.sub_price || svc.service_id?.base_price}
                                    </p>
                                  </div>
                                </div>
                              ))
                            ) : a.service_ids && a.service_ids.length > 0 ? (
                              a.service_ids.map((svc, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                                  <div>
                                    <h3 className="text-xl font-display font-black text-white mb-0.5 drop-shadow-sm">
                                      {svc.service_name || "Unknown Service"}
                                    </h3>
                                    <p className="text-sm text-muted-2 font-medium">
                                      with {a.staff_id?.full_name || "Any Stylist"}
                                    </p>
                                  </div>
                                  <div className="text-left sm:text-right shrink-0">
                                    <p className="text-lg font-black text-[#d4af37] drop-shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                                      LKR {svc.base_price}
                                    </p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                  <h3 className="text-xl font-display font-black text-white mb-0.5 drop-shadow-sm">
                                    {a.service_id?.service_name || "Unknown Service"}
                                  </h3>
                                  <p className="text-sm text-muted-2 font-medium">
                                    with {a.staff_id?.full_name || "Any Stylist"}
                                  </p>
                                </div>
                                <div className="text-left sm:text-right shrink-0">
                                  <p className="text-lg font-black text-[#d4af37] drop-shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                                    LKR {a.total_price || a.service_id?.base_price}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Overall Time & Date Info */}
                          <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                            <div className="flex flex-wrap gap-3">
                              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/5 shadow-inner">
                                <Calendar className="w-4 h-4 text-[#d4af37]" />
                                <span className="text-white/90 text-sm font-semibold">
                                  {new Date(a.appointment_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/5 shadow-inner">
                                <span className="text-muted-2 text-sm font-medium">Overall Time:</span>
                                <span className="text-white/90 text-sm font-semibold">
                                  {formatTime(a.appointment_services?.length > 0 ? a.appointment_services.reduce((min, s) => s.service_start_time < min ? s.service_start_time : min, a.appointment_services[0].service_start_time) : a.start_time)} - {formatTime(a.appointment_services?.length > 0 ? a.appointment_services.reduce((max, s) => s.service_end_time > max ? s.service_end_time : max, a.appointment_services[0].service_end_time) : a.end_time)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/5 shadow-inner">
                                <span className="text-muted-2 text-sm font-medium">Total Duration:</span>
                                <span className="text-white/90 text-sm font-semibold">
                                  {(() => {
                                    const mins = a.appointment_services?.length > 0 
                                      ? a.appointment_services.reduce((sum, s) => sum + (s.service_id?.duration || 0), 0)
                                      : (a.duration || 60);
                                    const hrs = Math.ceil(mins / 60);
                                    return `${hrs} ${hrs === 1 ? 'hr' : 'hrs'}`;
                                  })()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-2 font-bold text-sm">Total Amount:</span>
                              <span className="text-[#d4af37] font-black text-2xl">
                                LKR {a.total_price}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="mt-8 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-t border-white/5">
                          <p className="text-xs text-muted-2 font-medium uppercase tracking-widest">
                            Booked on {new Date(a.createdAt).toLocaleDateString()}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">

                            {a.status === "pending" && (
                              <button
                                onClick={() => handleCancel(a._id)}
                                disabled={cancelling === a._id}
                                className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-red-950/40 to-red-900/20 text-red-400 border border-red-500/20 hover:from-red-900/60 hover:to-red-800/40 hover:text-red-300 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 text-center shadow-inner"
                              >
                                {cancelling === a._id ? "Cancelling..." : "Cancel Appointment"}
                              </button>
                            )}

                            {a.status === "completed" && !a.feedback_submitted && (
                              <button
                                onClick={() => navigate(`/customer/give-feedback/${a._id}`, { state: { appointment: a } })}
                                className="flex-1 sm:flex-none px-6 py-2.5 bg-black/40 hover:bg-black/60 text-white text-sm font-semibold rounded-xl transition-all border border-white/10 text-center shadow-inner"
                              >
                                Leave Feedback
                              </button>
                            )}

                            {(a.status === "cancelled" || a.status === "rejected" || a.status === "completed") && (
                              <button
                                onClick={() => navigate("/book")}
                                className="flex-1 sm:flex-none px-7 py-2.5 bg-gradient-to-r from-[#d4af37] to-[#aa8123] text-primary text-sm font-bold rounded-xl transition-all hover:scale-[1.02] text-center border border-yellow-300/30 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                              >
                                Book Again
                              </button>
                            )}

                            {(a.status === "cancelled" || a.status === "rejected") && (
                              <button
                                onClick={() => handleDelete(a._id)}
                                disabled={deleting === a._id}
                                className="flex-1 sm:flex-none px-6 py-2.5 bg-black/40 text-danger hover:bg-red-950/40 border border-red-500/10 hover:border-red-500/30 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 text-center shadow-inner"
                              >
                                {deleting === a._id ? "Deleting..." : "Delete"}
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
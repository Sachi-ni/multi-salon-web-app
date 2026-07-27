import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Store, UserCheck, Phone, Calendar, Clock, Sparkles } from "lucide-react";

const backgroundParticles = [...Array(150)].map((_, i) => ({
  id: i,
  y: [0, (Math.random() - 0.5) * 80, 0],
  x: [0, (Math.random() - 0.5) * 80, 0],
  scale: [0, Math.random() + 0.5, 0],
  duration: Math.random() * 20 + 30,
  delay: Math.random() * 5,
  size: Math.random() * 3 + 1,
  left: Math.random() * 100 + "%",
  top: Math.random() * 100 + "%",
}));

const StaffDashboard = () => {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Today"); // Today, This Week, This Month

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/staff/dashboard", {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await res.json();
        setProfile(data.profile);
        setAppointments(data.appointments);
      } catch (error) {
        console.error("Error fetching staff dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  // Date filtering logic
  const getFilteredAppointments = () => {
    if (!appointments || !Array.isArray(appointments)) return [];
    const now = new Date();
    
    return appointments.filter(app => {
      if (!app || !app.appointment_date) return false;
      // Append time to prevent UTC timezone shift issues when parsing YYYY-MM-DD
      const appDate = new Date(`${app.appointment_date}T12:00:00`); 
      
      if (filter === "Today") {
        return appDate.toDateString() === now.toDateString();
      } else if (filter === "This Week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as start
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + (6 - now.getDay())); // Saturday as end
        return appDate >= startOfWeek && appDate <= endOfWeek;
      } else if (filter === "This Month") {
        return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  const filteredAppointments = getFilteredAppointments();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-primary">
        <svg className="animate-spin h-10 w-10 text-accent" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-white p-6 sm:p-12 font-sans relative overflow-hidden grid-bg">
      {/* Dynamic Floating Particles */}
      {backgroundParticles.map((p) => (
        <motion.div
          key={p.id}
          animate={{
            y: p.y,
            x: p.x,
            opacity: [0, 0.8, 0],
            scale: p.scale,
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
          className="absolute rounded-full bg-white pointer-events-none z-0"
          style={{
            width: p.size + "px",
            height: p.size + "px",
            left: p.left,
            top: p.top,
            boxShadow: "0 0 15px 3px rgba(245,200,0,0.7)",
          }}
        />
      ))}


      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="max-w-6xl mx-auto relative z-10"
      >
        <div className="mb-10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
          <div className="absolute -bottom-2 left-0 w-full h-[1px] bg-gradient-to-r from-border via-accent/30 to-border" />
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70 flex items-center gap-3">
              Staff Dashboard <Sparkles className="text-accent w-8 h-8" />
            </h1>
            <p className="text-muted-2 text-sm uppercase tracking-widest font-bold">
              Welcome back, <span className="text-accent">{profile?.staffName}</span>
            </p>
          </div>
        </div>

        {/* Profile Card Container with Stagger */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.15 }
            }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            whileHover={{ y: -6, scale: 1.02 }} 
            className="bg-surface/40 backdrop-blur-xl border border-border/50 hover:border-accent/40 rounded-3xl p-7 shadow-glass transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-[4px] h-full bg-gradient-to-b from-accent to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-colors" />
            <div className="flex items-center gap-5 relative z-10">
              <div className="bg-gradient-to-br from-accent/20 to-accent/5 p-4 rounded-2xl text-accent shadow-inner">
                <Store size={28} />
              </div>
              <div>
                <h3 className="text-[0.65rem] font-extrabold text-accent tracking-widest uppercase mb-1.5 opacity-80">Assigned Salon</h3>
                <p className="text-2xl font-black text-white tracking-tight">{profile?.salonName}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            whileHover={{ y: -6, scale: 1.02 }} 
            className="bg-surface/40 backdrop-blur-xl border border-border/50 hover:border-accent/40 rounded-3xl p-7 shadow-glass transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-[4px] h-full bg-gradient-to-b from-accent to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-colors" />
            <div className="flex items-center gap-5 relative z-10">
              <div className="bg-gradient-to-br from-accent/20 to-accent/5 p-4 rounded-2xl text-accent shadow-inner">
                <UserCheck size={28} />
              </div>
              <div>
                <h3 className="text-[0.65rem] font-extrabold text-accent tracking-widest uppercase mb-1.5 opacity-80">Manager</h3>
                <p className="text-2xl font-black text-white tracking-tight">{profile?.managerName}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            whileHover={{ y: -6, scale: 1.02 }} 
            className="bg-surface/40 backdrop-blur-xl border border-border/50 hover:border-accent/40 rounded-3xl p-7 shadow-glass transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-[4px] h-full bg-gradient-to-b from-accent to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-colors" />
            <div className="flex items-center gap-5 relative z-10">
              <div className="bg-gradient-to-br from-accent/20 to-accent/5 p-4 rounded-2xl text-accent shadow-inner">
                <Phone size={28} />
              </div>
              <div>
                <h3 className="text-[0.65rem] font-extrabold text-accent tracking-widest uppercase mb-1.5 opacity-80">Manager Contact</h3>
                <p className="text-2xl font-black text-accent tracking-tight drop-shadow-sm">{profile?.managerPhone}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Appointments Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-surface/40 backdrop-blur-2xl border border-border/50 rounded-3xl shadow-modal overflow-hidden relative"
        >
          <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calendar className="text-accent" /> Your Appointments
            </h2>
            <div className="flex bg-surface-2 rounded-xl p-1 border border-border shadow-inner">
              {["Today", "This Week", "This Month"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-5 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wide transition-all ${
                    filter === f 
                      ? "bg-accent text-primary shadow-glow scale-[1.02]" 
                      : "text-muted-2 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-2/50 border-b border-border/50">
                  <th className="p-5 text-[0.7rem] font-extrabold text-muted-2 tracking-widest uppercase">Customer</th>
                  <th className="p-5 text-[0.7rem] font-extrabold text-muted-2 tracking-widest uppercase">Services</th>
                  <th className="p-5 text-[0.7rem] font-extrabold text-muted-2 tracking-widest uppercase">Date & Time</th>
                  <th className="p-5 text-[0.7rem] font-extrabold text-muted-2 tracking-widest uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredAppointments.length === 0 ? (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td colSpan="4" className="p-12 text-center text-muted-2">
                        <div className="flex flex-col items-center gap-3">
                          <Clock size={32} className="text-muted/50" />
                          <p>No appointments found for {filter.toLowerCase()}.</p>
                        </div>
                      </td>
                    </motion.tr>
                  ) : (
                    filteredAppointments.map((app, idx) => {
                      const servicesList = app.service_ids && app.service_ids.length > 0 
                        ? app.service_ids.map(s => s.service_name).join(", ")
                        : (app.service_id ? app.service_id.service_name : "N/A");
                      
                      const customerName = app.customer_id ? app.customer_id.name : (app.guest_name || "Guest");
                      
                      const statusColors = {
                        pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
                        confirmed: "text-green-400 bg-green-400/10 border-green-400/20",
                        completed: "text-blue-400 bg-blue-400/10 border-blue-400/20",
                        cancelled: "text-red-400 bg-red-400/10 border-red-400/20",
                        rejected: "text-red-400 bg-red-400/10 border-red-400/20",
                      };

                      const statusColor = statusColors[app.status] || "text-muted bg-surface-2 border-border";

                      return (
                        <motion.tr 
                          key={app._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="border-b border-border hover:bg-surface-2/50 transition-colors group"
                        >
                          <td className="p-5 font-bold text-white group-hover:text-accent transition-colors">{customerName}</td>
                          <td className="p-5 text-muted-2 text-sm">{servicesList}</td>
                          <td className="p-5">
                            <div className="font-bold text-white">{new Date(app.appointment_date).toLocaleDateString()}</div>
                            <div className="text-xs text-accent mt-0.5">{app.start_time} - {app.end_time}</div>
                          </td>
                          <td className="p-5">
                            <span className={`px-3 py-1.5 rounded-full text-[0.65rem] font-extrabold uppercase tracking-wider border ${statusColor}`}>
                              {app.status}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default StaffDashboard;

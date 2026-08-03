import { useEffect, useState, useMemo } from "react";
import PageHeader from "../../components/ui/PageHeader";
import { getSalonFeedback } from "../../services/feedbackService";
import { getSalons } from "../../services/salonService";
import { Star, MessageSquare, User, Scissors, Calendar, Clock, Quote, Store, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function StarDisplay({ rating, max = 5 }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <Star 
          key={i} 
          className={`w-4 h-4 ${i < rating ? "text-accent fill-accent" : "text-white/10"}`} 
        />
      ))}
    </div>
  );
}

export default function SuperAdminReviews() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [salons, setSalons] = useState([]);
  const [selectedSalon, setSelectedSalon] = useState("all");
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getSalons()
      .then(res => setSalons(res.data))
      .catch(err => console.error("Failed to fetch salons", err));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    getSalonFeedback(selectedSalon)
      .then(res => setFeedbacks(res.data))
      .catch(err => setError(err.response?.data?.message || "Failed to load feedbacks."))
      .finally(() => setLoading(false));
  }, [selectedSalon]);

  const stats = useMemo(() => {
    if (!feedbacks.length) return null;
    const totalService = feedbacks.reduce((acc, curr) => acc + curr.serviceRating, 0);
    const totalStaff = feedbacks.reduce((acc, curr) => acc + curr.staffRating, 0);
    const avgService = (totalService / feedbacks.length).toFixed(1);
    const avgStaff = (totalStaff / feedbacks.length).toFixed(1);
    const overall = (((totalService + totalStaff) / 2) / feedbacks.length).toFixed(1);

    return { avgService, avgStaff, overall, count: feedbacks.length };
  }, [feedbacks]);

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
        <PageHeader 
          title="All Reviews" 
          subtitle="Monitor customer feedback across your entire network" 
          backTo="/superAdminDashboard" 
        />
        
        {/* Salon Filter Dropdown */}
        <div className="w-full sm:w-64 shrink-0">
           <label className="block text-muted-2 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
             <Store className="w-3.5 h-3.5 text-accent" />
             Filter by Salon
           </label>
           <select
             value={selectedSalon}
             onChange={(e) => setSelectedSalon(e.target.value)}
             className="w-full bg-surface border border-border text-white text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all appearance-none cursor-pointer hover:bg-surface-2"
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
           >
             <option value="all">All Salons</option>
             {salons.map(s => (
               <option key={s._id} value={s._id}>{s.name}</option>
             ))}
           </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-2 text-sm font-medium">Loading reviews...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-2xl mb-6">
          <p className="text-danger text-sm font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-danger" />
            {error}
          </p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="bg-surface border border-border rounded-3xl p-16 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4">
             <MessageSquare className="w-8 h-8 text-muted-2" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Reviews Found</h3>
          <p className="text-muted-2 text-sm max-w-sm">There is no feedback available for the selected filters.</p>
        </div>
      ) : (
        <div className="space-y-8 mt-6">
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-surface border border-border rounded-3xl p-6 flex items-center gap-6 shadow-card">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20 shrink-0">
                   <Star className="w-8 h-8 text-accent fill-accent" />
                </div>
                <div>
                   <p className="text-muted-2 text-xs uppercase tracking-widest mb-1 font-bold">Overall Rating</p>
                   <p className="text-4xl font-black text-white">{stats.overall} <span className="text-lg text-muted-2 font-medium">/ 5</span></p>
                   <p className="text-muted-2 text-sm mt-1">Based on {stats.count} review{stats.count !== 1 ? 's' : ''}</p>
                </div>
             </div>
             
             <div className="bg-surface border border-border rounded-3xl p-6 flex flex-col justify-center md:col-span-2 shadow-card">
                <div className="max-w-md">
                    <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-bold text-sm">Average Service Rating</p>
                    <span className="text-accent font-bold bg-accent/10 px-2 py-1 rounded-md text-xs">{stats.avgService}</span>
                    </div>
                    <div className="w-full bg-surface-2 rounded-full h-2">
                    <div className="bg-accent h-2 rounded-full transition-all duration-1000" style={{ width: `${(stats.avgService / 5) * 100}%` }} />
                    </div>
                    
                    <div className="flex items-center justify-between mb-2 mt-6">
                    <p className="text-white font-bold text-sm">Average Staff Rating</p>
                    <span className="text-accent font-bold bg-accent/10 px-2 py-1 rounded-md text-xs">{stats.avgStaff}</span>
                    </div>
                    <div className="w-full bg-surface-2 rounded-full h-2">
                    <div className="bg-accent h-2 rounded-full transition-all duration-1000" style={{ width: `${(stats.avgStaff / 5) * 100}%` }} />
                    </div>
                </div>
             </div>
          </div>

          {/* Feedback List */}
          <div className="space-y-5">
            <AnimatePresence>
              {feedbacks.map((f, i) => {
                const customerName = f.customer_id?.name || 'Guest User';
                const initials = customerName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
                
                // For superadmin, we should ideally show the salon name if we have it
                const salonName = salons.find(s => s._id === f.salon_id)?.name || "Unknown Salon";
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={f._id} 
                    className="bg-surface border border-border hover:border-white/10 transition-colors rounded-3xl p-6 md:p-8 shadow-card"
                  >
                    <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                      
                      {/* Customer & Meta Info */}
                      <div className="md:w-64 shrink-0 flex items-start gap-4 border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0 pr-0 md:pr-6">
                        <div className="w-12 h-12 rounded-full bg-surface-2 border border-white/5 flex items-center justify-center shrink-0 mt-1">
                           <span className="text-white font-bold">{initials}</span>
                        </div>
                        <div>
                          <p className="text-white font-bold text-lg">{customerName}</p>
                          <div className="flex items-center gap-1.5 text-muted-2 text-xs mt-2 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-accent" />
                            {salonName}
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-2 text-xs mt-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            {f.appointment_id?.appointment_date || "N/A"}
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-2 text-xs mt-1 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {f.appointment_id?.start_time || "N/A"}
                          </div>
                        </div>
                      </div>

                      {/* Ratings & Details */}
                      <div className="flex-1">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                            <div className="bg-surface-2 rounded-2xl p-4 border border-white/5">
                               <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-1.5 text-muted-2 text-xs font-bold uppercase tracking-widest">
                                     <Scissors className="w-3.5 h-3.5 text-accent" />
                                     Service
                                  </div>
                                  <StarDisplay rating={f.serviceRating} />
                               </div>
                               <p className="text-white font-bold">{f.service_id?.service_name || "Unknown Service"}</p>
                            </div>
                            
                            <div className="bg-surface-2 rounded-2xl p-4 border border-white/5">
                               <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-1.5 text-muted-2 text-xs font-bold uppercase tracking-widest">
                                     <User className="w-3.5 h-3.5 text-accent" />
                                     Staff
                                  </div>
                                  <StarDisplay rating={f.staffRating} />
                               </div>
                               <p className="text-white font-bold">{f.staff_id?.full_name || "Unknown Staff"}</p>
                            </div>
                         </div>

                        {f.comment && (
                          <div className="bg-primary/50 rounded-2xl p-5 border border-border relative overflow-hidden">
                            <Quote className="absolute top-3 left-3 w-8 h-8 text-white/5 pointer-events-none" />
                            <p className="text-muted-2 text-sm leading-relaxed relative z-10 pl-6 italic font-medium">
                               "{f.comment}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

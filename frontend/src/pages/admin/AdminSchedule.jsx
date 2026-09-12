import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { getSalonAppointments } from "../../services/appointmentService";
import { getStaff } from "../../services/staffService";
import PageHeader from "../../components/ui/PageHeader";
import { Calendar, Clock, User, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminSchedule() {
  const { salonId } = useParams();

  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [staffFilter, setStaffFilter] = useState("all");
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      const [apptsRes, staffRes] = await Promise.all([
        getSalonAppointments(salonId, "confirmed"),
        getStaff(salonId)
      ]);

      const data = apptsRes.data || [];
      const nowStr = new Date().toISOString().split("T")[0];
      
      // Filter for upcoming dates only
      const upcoming = data.filter(a => {
        const d = a.appointment_date || (a.createdAt && a.createdAt.split("T")[0]);
        return d && d >= nowStr;
      });

      // Sort chronologically
      upcoming.sort((a, b) => {
        const dateA = new Date(`${a.appointment_date}T${a.start_time}`);
        const dateB = new Date(`${b.appointment_date}T${b.start_time}`);
        return dateA - dateB;
      });

      setAppointments(upcoming);
      setStaffList(staffRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load schedule data.");
    } finally {
      setLoading(false);
    }
  }, [salonId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived filtered appointments based on selected staff
  const filteredAppointments = useMemo(() => {
    if (staffFilter === "all") return appointments;
    
    return appointments.filter(a => {
      // Check multi-service
      if (a.appointment_services && a.appointment_services.length > 0) {
        return a.appointment_services.some(asv => {
          const sid = typeof asv.staff_id === "object" ? asv.staff_id?._id : asv.staff_id;
          return sid === staffFilter;
        });
      }
      // Check primary
      const sid = typeof a.staff_id === "object" ? a.staff_id?._id : a.staff_id;
      return sid === staffFilter;
    });
  }, [appointments, staffFilter]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups = {};
    filteredAppointments.forEach(a => {
      const dateStr = a.appointment_date;
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(a);
    });
    return groups;
  }, [filteredAppointments]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Staff Schedule" 
        subtitle="View upcoming confirmed bookings assigned to staff" 
        backTo={`/salon-admin/${salonId}/adminAppointments`}
      />

      <div className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 text-accent rounded-lg">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Filter by Staff</h3>
            <p className="text-xs text-muted-2">Isolate the schedule for a specific team member</p>
          </div>
        </div>
        <select
          value={staffFilter}
          onChange={(e) => setStaffFilter(e.target.value)}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-surface-2 border border-border text-white focus:outline-none focus:border-accent cursor-pointer min-w-[200px]"
        >
          <option value="all">All Staff Members</option>
          {staffList.map(s => (
            <option key={s._id} value={s._id}>
              {s.user_id?.name || s.name || "Unknown Staff"}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-2 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-sm font-medium">Loading schedule...</p>
        </div>
      ) : error ? (
        <div className="px-4 py-3 rounded-xl bg-danger-dim border border-danger/30 text-sm text-danger font-medium text-center">
          {error}
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-neutral-500" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Upcoming Bookings</h3>
          <p className="text-sm text-muted-2 max-w-sm">
            {staffFilter === "all" 
              ? "There are no confirmed upcoming appointments in the schedule."
              : "This staff member doesn't have any confirmed upcoming appointments."}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(groupedByDate).sort().map(dateStr => (
            <motion.div 
              key={dateStr}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-black text-white flex items-center gap-2 border-b border-border pb-2">
                <span className="w-2 h-2 rounded-full bg-accent"></span>
                {new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {groupedByDate[dateStr].map(appt => (
                  <div key={appt._id} className="bg-surface border border-border hover:border-accent/30 rounded-xl p-4 transition-all flex flex-col h-full relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                    
                    <div className="flex items-start justify-between mb-3 pl-2">
                      <div>
                        <h4 className="text-sm font-bold text-white capitalize mb-0.5">
                          {appt.guest_name || appt.customer_id?.name || "Unknown Customer"}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-muted-2 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {appt.start_time} - {appt.end_time} ({appt.duration}m)
                        </div>
                      </div>
                      <div className="px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500">
                        {appt.status}
                      </div>
                    </div>
                    
                    <div className="mt-auto pl-2 space-y-3">
                      <div className="pt-3 border-t border-border">
                        <div className="text-[0.65rem] font-extrabold text-muted-2 uppercase tracking-widest mb-2">Assigned Staff & Services</div>
                        
                        {appt.appointment_services && appt.appointment_services.length > 0 ? (
                          <div className="space-y-2">
                            {appt.appointment_services.map((asv, idx) => {
                               // Highlight staff if they match the filter
                               const sId = typeof asv.staff_id === "object" ? asv.staff_id?._id : asv.staff_id;
                               const isHighlighted = staffFilter !== "all" && sId === staffFilter;
                               
                               return (
                                <div key={idx} className={`flex flex-col gap-0.5 ${isHighlighted ? "bg-accent/5 -mx-2 px-2 py-1 rounded" : ""}`}>
                                  <div className="flex items-center gap-1.5 text-xs text-white">
                                    <User className={`w-3.5 h-3.5 ${isHighlighted ? "text-accent" : "text-muted-2"}`} />
                                    <span className={isHighlighted ? "font-bold text-accent" : "font-semibold"}>{asv.staff_id?.full_name || "Unknown Staff"}</span>
                                  </div>
                                  <div className="text-[0.7rem] text-muted-2 ml-5">
                                    {asv.service_id?.service_name || "Service"} &bull; {asv.service_start_time} - {asv.service_end_time}
                                  </div>
                                </div>
                               );
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-surface-3 flex items-center justify-center text-xs font-bold text-muted-2 uppercase">
                              {(appt.staff_id?.full_name || "?").substring(0, 1)}
                            </div>
                            <span className="text-xs font-medium text-white">{appt.staff_id?.full_name || "Unknown"}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

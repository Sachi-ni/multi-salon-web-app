import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { getAvailableStaff, updateStaffAssignment, getAvailableSlots } from "../../services/appointmentService";

export default function EditStaffAssignmentModal({ appointment, salonId, onClose, onSuccess }) {
  const [services, setServices] = useState([]);
  const [availableStaffMap, setAvailableStaffMap] = useState({});
  const [alternateTimeOpenMap, setAlternateTimeOpenMap] = useState({});
  const [loadingStaff, setLoadingStaff] = useState({});
  const [availableSlotsMap, setAvailableSlotsMap] = useState({});
  const [loadingSlots, setLoadingSlots] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const parseTimeToDate = (t) => {
    if (!t) return new Date(NaN);
    if (/^\d{1,2}:\d{2}/.test(t)) { const [h, m] = t.split(":").map(Number); const d = new Date(); d.setHours(h, m, 0, 0); return d; }
    return new Date(t);
  };
  const computeEndTime = useCallback((start, dur) => { const d = parseTimeToDate(start); if (isNaN(d.getTime())) return ""; d.setMinutes(d.getMinutes() + (dur || 30)); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; }, []);
  const toHHMM = (t) => { if (!t) return ""; const s = String(t).trim(); const d = /^(\d{1,2}):(\d{2})/.exec(s); if (d) return `${String(Number(d[1])).padStart(2, "0")}:${d[2]}`; const e = /[T\s](\d{1,2}):(\d{2})/.exec(s); if (e) return `${String(Number(e[1])).padStart(2, "0")}:${e[2]}`; return s; };
  const formatTime = (t) => { if (!t) return ""; const m = /^(\d{1,2}):(\d{2})/.exec(t); if (m) { let h = Number(m[1]); const m2 = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return `${h}:${m[2]} ${m2}`; } const d = new Date(t); if (isNaN(d.getTime())) return t; return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); };

  const isStaffDoubleBooked = useCallback((staffId, startTime, endTime, excludeIndex) => {
    if (!staffId || !startTime || !endTime) return false;
    for (let i = 0; i < services.length; i++) {
      if (i === excludeIndex) continue;
      const s = services[i];
      if (s.staffId === staffId && s.startTime && s.endTime) {
        if (startTime < s.endTime && s.startTime < endTime) return true;
      }
    }
    return false;
  }, [services]);

  useEffect(() => {
    if (!appointment) return;
    const serviceIds = appointment.service_ids || (appointment.service_id ? [appointment.service_id] : []);
    const initialServices = serviceIds.map((svc) => {
      const svcId = typeof svc === "object" ? (svc._id || svc) : svc;
      const svcIdStr = String(svcId);
      const assignment = appointment.appointment_services?.find((a) => String(a.service_id?._id || a.service_id) === svcIdStr);
      return {
        serviceId: svcIdStr,
        serviceName: assignment?.service_id?.service_name || appointment.service_id?.service_name || "Service",
        duration: assignment?.service_id?.duration || 30,
        subPrice: assignment?.sub_price || 0,
        staffId: (assignment?.staff_id?._id || assignment?.staff_id)?.toString() || "",
        staffName: assignment?.staff_id?.full_name || appointment.staff_id?.full_name || "",
        originalStaffId: (assignment?.staff_id?._id || assignment?.staff_id || appointment.staff_id?._id || appointment.staff_id)?.toString() || "",
        startTime: toHHMM(assignment?.service_start_time || appointment.start_time),
        endTime: toHHMM(assignment?.service_end_time || appointment.end_time),
      };
    });
    setServices(initialServices);
    setLoading(false);
  }, [appointment]);

  const fetchAvailableStaff = useCallback(async (index, startTime, endTimeOverride) => {
    const svc = services[index];
    if (!svc || !svc.serviceId) return;
    const st = toHHMM(startTime || svc.startTime);
    const en = toHHMM(endTimeOverride || svc.endTime || computeEndTime(st, svc.duration));
    setLoadingStaff((prev) => ({ ...prev, [index]: true }));
    try {
      const res = await getAvailableStaff(appointment.appointment_date, [svc.serviceId], salonId, { startTime: st, endTime: en, ignoreAppointmentId: appointment._id });
      const staff = (res.data || []).filter((candidate) => candidate.staff_id?.toString() !== svc.originalStaffId);
      setAvailableStaffMap((prev) => ({ ...prev, [index]: staff }));
      if (staff.length === 0 && services[index]?.staffId) {
        setServices((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], staffId: "", staffName: "" };
          return next;
        });
      }
    } catch {
      setAvailableStaffMap((prev) => ({ ...prev, [index]: [] }));
      setError("Failed to load available staff.");
    } finally {
      setLoadingStaff((prev) => ({ ...prev, [index]: false }));
    }
  }, [services, appointment.appointment_date, appointment._id, salonId, computeEndTime]);

  const fetchAlternateTimeSlots = useCallback(async (index) => {
    const svc = services[index];
    if (!svc?.serviceId) return;
    setLoadingSlots((prev) => ({ ...prev, [index]: true }));
    try {
      const staffRes = await getAvailableStaff(appointment.appointment_date, [svc.serviceId], salonId, { ignoreAppointmentId: appointment._id });
      const replacementStaff = (staffRes.data || []).filter((staff) => staff.staff_id?.toString() !== svc.originalStaffId);
      const slotResponses = await Promise.all(replacementStaff.map((staff) =>
        getAvailableSlots(staff.staff_id, appointment.appointment_date, [svc.serviceId], salonId, { ignoreAppointmentId: appointment._id })
      ));
      const uniqueSlots = new Map();
      slotResponses.forEach((response) => {
        (response.data || []).forEach((slot) => uniqueSlots.set(`${slot.start_time}-${slot.end_time}`, slot));
      });
      setAvailableSlotsMap((prev) => ({ ...prev, [index]: [...uniqueSlots.values()] }));
    } catch {
      setAvailableSlotsMap((prev) => ({ ...prev, [index]: [] }));
      setError("Failed to load alternate time slots.");
    } finally {
      setLoadingSlots((prev) => ({ ...prev, [index]: false }));
    }
  }, [services, appointment.appointment_date, appointment._id, salonId]);

  useEffect(() => {
    services.forEach((svc, index) => {
      if (svc.startTime) fetchAvailableStaff(index, svc.startTime, svc.endTime);
    });
  }, [services, fetchAvailableStaff]);

  const handleTimeChange = useCallback((index, newStart) => {
    setServices((prev) => { const next = [...prev]; const svcObj = { ...next[index], staffId: "", staffName: "" }; svcObj.startTime = newStart; svcObj.endTime = computeEndTime(newStart, svcObj.duration); next[index] = svcObj; return next; });
    setAvailableSlotsMap((prev) => ({ ...prev, [index]: [] }));
    setAlternateTimeOpenMap((prev) => ({ ...prev, [index]: false }));
    fetchAvailableStaff(index, newStart);
  }, [computeEndTime, fetchAvailableStaff]);

  const handleStaffSelect = useCallback(async (index, staffId, staffName) => {
    setServices((prev) => { const next = [...prev]; next[index] = { ...next[index], staffId: staffId?.toString() || "", staffName: staffName || "" }; return next; });
    setAvailableSlotsMap((prev) => ({ ...prev, [index]: [] }));
    const svc = services[index];
    fetchAvailableStaff(index, svc?.startTime || "");
  }, [services, fetchAvailableStaff]);

  const handleSlotSelect = useCallback((index, slot) => {
    setServices((prev) => { const next = [...prev]; next[index] = { ...next[index], startTime: slot.start_time, endTime: slot.end_time }; return next; });
  }, []);

  const handleSave = async () => {
    const unassigned = services.filter((s) => !s.staffId || !s.startTime || !s.endTime);
    if (unassigned.length > 0) { setError("Please assign staff and time for all services."); return; }
    for (let i = 0; i < services.length; i++) {
      const s = services[i];
      if (isStaffDoubleBooked(s.staffId, s.startTime, s.endTime, i)) { setError(`Staff ${s.staffName} cannot serve two services at the same time`); return; }
    }
    setSaving(true);
    setError("");
    try {
      const payload = services.map((s) => ({ service_id: s.serviceId, staff_id: s.staffId, service_start_time: s.startTime, service_end_time: s.endTime, sub_price: s.subPrice || 0 }));
      await updateStaffAssignment(appointment._id, payload);
      setSuccess("Staff assignment updated successfully!");
      setError("");
      setTimeout(() => { setSaving(false); onSuccess?.(appointment); onClose?.(); }, 600);
    } catch (err) {
      setSaving(false);
      setError(err.response?.data?.message || err.message || "Failed to save.");
    }
  };


  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-base text-base-foreground rounded-2xl p-6 w-full max-w-md shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center"><Clock className="w-5 h-5 text-accent" /></div>
            <p className="font-semibold text-lg">Loading staff...</p>
          </div>
          <div className="flex justify-center"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div key="edit-staff-modal" initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 12 }} transition={{ duration: 0.18 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.2 }} className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-base border border-border shadow-2xl">
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center"><Clock className="w-5 h-5 text-accent" /></div>
              <div><p className="font-semibold text-white text-sm">Edit Staff Assignment</p></div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-2 hover:text-white hover:bg-surface-3 transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <div className="px-5 py-3 bg-surface-2/40 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center text-accent text-sm font-bold">{appointment.customer_id?.name?.charAt(0) || "?"}</div>
              <div>
                <p className="font-semibold text-white text-xs">{appointment.customer_id?.name || "Customer"}</p>
                <p className="text-2xs text-muted-2">{appointment.appointment_date} · {services.length} service {services.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </div>
          <div className="px-5 py-4 space-y-5">
            {services.map((svc, index) => {
              const staffList = availableStaffMap[index] || [];
              const slots = availableSlotsMap[index] || [];
              const pickingSlot = !!svc.staffId && !!slots.length;
              const staffCount = staffList.length;
              const computedEndTime = svc.endTime || computeEndTime(svc.startTime, svc.duration);
              return (


                <div key={index} className="rounded-xl bg-surface-2/30 border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-white text-sm">{svc.serviceName}</p>
                      <p className="text-2xs text-muted-2 mt-0.5">Duration: {svc.duration} min {svc.subPrice ? ` · ${svc.subPrice}` : ""}</p>
                    </div>
                    {svc.startTime && computedEndTime && (
                      <div className="flex items-center gap-1.5 text-2xs text-muted-2 bg-surface-3 px-2 py-1 rounded-lg">
                        <Clock className="w-3 h-3" />
                        <span>Current: <span className="text-white font-bold">{svc.staffName}</span> ({formatTime(svc.startTime)} - {formatTime(computedEndTime)})</span>
                      </div>
                    )}
                  </div>
                  {!pickingSlot ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-2xs text-muted-2 font-medium">Available staff for this service</p>
                        {loadingStaff[index] && <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />}
                      </div>
                      {staffCount === 0 && !loadingStaff[index] && (
                        <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 space-y-2">
                          <p className="text-xs text-amber-200 font-semibold">There is no other staff available at this appointment time.</p>
                          <p className="text-2xs text-muted-2">Change the time to find another staff member for this service.</p>
                          {!alternateTimeOpenMap[index] && (
                            <button onClick={() => { setAlternateTimeOpenMap((prev) => ({ ...prev, [index]: true })); fetchAlternateTimeSlots(index); }} className="px-3 py-1.5 rounded-lg bg-accent text-primary text-2xs font-bold hover:bg-accent-hover transition-colors">
                              Choose another time
                            </button>
                          )}
                        </div>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                        {staffList.map((staff) => {
                          const booked = isStaffDoubleBooked(staff.staff_id.toString(), svc.startTime || computeEndTime(svc.startTime || "09:00", svc.duration), computedEndTime, index) && svc.staffId !== staff.staff_id.toString();
                          return (
                            <button key={staff.staff_id.toString()} disabled={booked || loadingStaff[index]} onClick={() => handleStaffSelect(index, staff.staff_id, staff.full_name)} className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${booked ? "border-muted cursor-not-allowed opacity-50" : svc.staffId === staff.staff_id.toString() ? "border-accent bg-accent/10" : "border-border hover:border-accent/40 hover:bg-surface-3"}`}>
                              <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-2xs font-bold text-muted-2 overflow-hidden">
                                {staff.image ? <img src={staff.image} alt={staff.full_name} className="w-full h-full object-cover" /> : staff.full_name?.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-2xs font-semibold text-white truncate">{staff.full_name}</p>
                                <p className="text-2xs text-muted-2 truncate">{staff.role}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {staffCount === 0 && alternateTimeOpenMap[index] && (
                        <div className="flex items-center gap-2 mt-3">
                          <div className="w-full space-y-2">
                            <p className="text-2xs text-muted-2 font-medium">Available time slots</p>
                            {loadingSlots[index] ? (
                              <div className="flex justify-center py-2"><div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
                            ) : slots.length === 0 ? (
                              <p className="text-2xs text-rose/70 italic">No alternate time slots are available.</p>
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto">
                                {slots.map((slot) => (
                                  <button key={`${slot.start_time}-${slot.end_time}`} onClick={() => handleTimeChange(index, slot.start_time)} className="px-2 py-2 rounded-lg border border-border bg-surface-3 hover:border-accent/50 hover:bg-accent/10 text-white text-2xs font-semibold transition-all">
                                    {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-2xs text-muted-2 font-medium">Available time slots</p>
                        <button onClick={() => setAvailableSlotsMap((prev) => ({ ...prev, [index]: [] }))} className="text-2xs text-muted-2 hover:text-white transition-colors">Back to staff</button>
                      </div>
                      {loadingSlots[index] ? (
                        <div className="flex justify-center py-2"><div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
                      ) : slots.length === 0 ? (
                        <p className="text-2xs text-rose/70 italic">No free slots for this staff at this time. Choose a different staff or time.</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 mt-1 max-h-40 overflow-y-auto">
                          {slots.map((slot) => {
                            const isSelected = svc.startTime === slot.start_time;
                            return (
                              <button key={`${slot.start_time}-${slot.end_time}`} onClick={() => handleSlotSelect(index, slot)} className={`px-2 py-1.5 rounded-lg border text-2xs font-medium transition-all ${isSelected ? "border-accent bg-accent/15 text-accent" : "border-border bg-surface-3 hover:border-accent/40 text-white"}`}>
                                {formatTime(slot.start_time)}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <button onClick={() => setAvailableSlotsMap((prev) => ({ ...prev, [index]: [] }))} className="text-2xs text-muted-2 hover:text-white font-bold">Back to staff</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {error && <div className="mx-5 mb-3 p-3 bg-rose/10 border border-rose/30 rounded-lg text-2xs text-rose font-medium"><AlertCircle className="w-3.5 h-3.5 inline mr-1.5" />{error}</div>}
          {success && <div className="mx-5 mb-3 p-3 bg-emerald/10 border border-emerald/30 rounded-lg text-2xs text-emerald font-medium"><CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />{success}</div>}
          <div className="flex gap-3 px-5 py-4 border-t border-border">
            <button onClick={onClose} className="flex-1 px-4 py-2 bg-surface-3 hover:bg-surface-3/80 border border-border rounded-lg text-sm font-medium text-muted-2 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving || !services.every((s) => s.staffId && s.startTime && s.endTime)} className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${saving || !services.every((s) => s.staffId && s.startTime && s.endTime) ? "bg-surface-3 cursor-not-allowed text-muted-2" : "bg-accent hover:bg-accent-hover text-primary"}`}>
              {saving ? (<><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />Saving...</>) : (<><CheckCircle2 className="w-4 h-4" />Save Changes</>)}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

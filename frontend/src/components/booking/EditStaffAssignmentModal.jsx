import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, CheckCircle2 } from "lucide-react";
import { getAvailableStaff, reassignStaff } from "../../services/appointmentService";
import { getUploadUrl } from "../../config";
import { formatDuration } from "../../utils/formatDuration";

const toHHMM = (value) => {
  if (!value) return "";
  const match = /^(\d{1,2}):(\d{2})/.exec(String(value));
  return match ? `${String(Number(match[1])).padStart(2, "0")}:${match[2]}` : String(value);
};

export default function EditStaffAssignmentModal({ appointment, salonId, onClose, onSuccess }) {
  const [services, setServices] = useState([]);
  const [availableStaff, setAvailableStaff] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const initial = (appointment.appointment_services || []).map((service) => ({
      serviceId: String(service.service_id?._id || service.service_id),
      serviceName: service.service_id?.service_name || "Service",
      duration: service.service_id?.duration || 0,
      startTime: toHHMM(service.service_start_time || appointment.start_time),
      endTime: toHHMM(service.service_end_time || appointment.end_time),
      staffId: String(service.staff_id?._id || service.staff_id || ""),
      staffName: service.staff_id?.full_name || "",
    }));
    setServices(initial);

    Promise.all(initial.map(async (service) => {
      const response = await getAvailableStaff(appointment.appointment_date, [service.serviceId], salonId, {
        startTime: service.startTime,
        endTime: service.endTime,
        ignoreAppointmentId: appointment._id,
      });
      return response.data || [];
    })).then((results) => {
      if (active) setAvailableStaff(Object.fromEntries(results.map((staff, index) => [index, staff])));
    }).catch((requestError) => {
      if (active) setError(requestError?.response?.data?.message || "Failed to load available staff.");
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [appointment, salonId]);

  const selectStaff = (index, staff) => {
    setServices((current) => current.map((service, serviceIndex) => serviceIndex === index
      ? { ...service, staffId: String(staff.staff_id), staffName: staff.full_name }
      : service));
  };

  const handleSave = async () => {
    if (services.some((service) => !service.staffId)) {
      setError("Please assign staff for every service.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const assignments = services.map(({ serviceId, staffId }) => ({ service_id: serviceId, staff_id: staffId }));
      const response = await reassignStaff(appointment._id, assignments);
      onSuccess?.(response.data);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to reassign staff.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div key="staff-reassignment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-base border border-border shadow-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div><p className="font-semibold text-white">Reassign Staff</p><p className="text-2xs text-muted-2">Only staff assignment can be changed.</p></div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-2 hover:text-white hover:bg-surface-3"><X className="w-4 h-4" /></button>
          </div>
          <div className="px-5 py-4 space-y-4">
            {loading && <p className="text-sm text-muted-2">Loading available staff...</p>}
            {!loading && services.map((service, index) => (
              <div key={service.serviceId} className="rounded-xl bg-surface-2/30 border border-border p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div><p className="font-semibold text-white text-sm">{service.serviceName}</p><p className="text-2xs text-muted-2">{appointment.appointment_date} · {service.startTime} - {service.endTime} · {formatDuration(service.duration)}</p></div>
                  <span className="text-2xs text-muted-2">{service.staffName || "Unassigned"}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(availableStaff[index] || []).map((staff) => (
                    <button key={String(staff.staff_id)} onClick={() => selectStaff(index, staff)} className={`flex items-center gap-2 p-2.5 rounded-lg border text-left ${service.staffId === String(staff.staff_id) ? "border-accent bg-accent/10" : "border-border hover:border-accent/40"}`}>
                      <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-2xs font-bold text-muted-2 overflow-hidden">{staff.image ? <img src={getUploadUrl(staff.image)} alt="" className="w-full h-full object-cover" /> : staff.full_name?.charAt(0).toUpperCase()}</div>
                      <span className="text-2xs font-semibold text-white truncate">{staff.full_name}</span>
                    </button>
                  ))}
                </div>
                {!availableStaff[index]?.length && <p className="mt-2 text-2xs text-amber-200">No other staff are available at this appointment time.</p>}
              </div>
            ))}
          </div>
          {error && <div className="mx-5 mb-3 p-3 bg-rose/10 border border-rose/30 rounded-lg text-2xs text-rose"><AlertCircle className="w-3.5 h-3.5 inline mr-1.5" />{error}</div>}
          <div className="flex gap-3 px-5 py-4 border-t border-border"><button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl bg-surface-2 text-muted-2 text-sm font-bold">Cancel</button><button onClick={handleSave} disabled={saving || loading || services.some((service) => !service.staffId)} className="flex-1 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-black disabled:opacity-40">{saving ? "Saving..." : <><CheckCircle2 className="w-4 h-4 inline mr-1" />Save Staff Assignment</>}</button></div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

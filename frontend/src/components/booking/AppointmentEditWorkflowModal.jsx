import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, User, Scissors, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { updateAppointmentDetails } from "../../services/appointmentService";
import { getStaff } from "../../services/staffService";
import { formatDuration } from "../../utils/formatDuration";

const toHHMM = (value) => {
  if (!value) return "09:00";
  const match = /^(\d{1,2}):(\d{2})/.exec(String(value));
  return match ? `${String(Number(match[1])).padStart(2, "0")}:${match[2]}` : String(value).slice(0, 5);
};

const addMinutesToTime = (time, minutes) => {
  if (!time) return "10:00";
  const [h, m] = time.split(":").map(Number);
  const total = (h || 0) * 60 + (m || 0) + Number(minutes || 0);
  const normalizedH = Math.floor(total / 60) % 24;
  const normalizedM = total % 60;
  return `${String(normalizedH).padStart(2, "0")}:${String(normalizedM).padStart(2, "0")}`;
};

const formatTime12h = (timeStr) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const period = (h || 0) >= 12 ? "PM" : "AM";
  const hours12 = (h || 0) % 12 || 12;
  return `${hours12}:${String(m || 0).padStart(2, "0")} ${period}`;
};

export default function AppointmentEditWorkflowModal({ appointment, salonId, onClose, onSuccess }) {
  const [appointmentDate, setAppointmentDate] = useState(appointment.appointment_date || "");
  const [allStaff, setAllStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Extract all services in the appointment
  const initialServices = useMemo(() => {
    if (appointment.appointment_services && appointment.appointment_services.length > 0) {
      return appointment.appointment_services.map((svc) => {
        const sStart = toHHMM(svc.service_start_time || appointment.start_time);
        const dur = Number(svc.service_id?.duration || 60);
        const sEnd = svc.service_end_time ? toHHMM(svc.service_end_time) : addMinutesToTime(sStart, dur);
        return {
          service_id: String(svc.service_id?._id || svc.service_id),
          service_name: svc.service_id?.service_name || "Service",
          duration: dur,
          sub_price: Number(svc.sub_price !== undefined ? svc.sub_price : (svc.service_id?.base_price || 0)),
          staff_id: String(svc.staff_id?._id || svc.staff_id || ""),
          staff_name: svc.staff_id?.full_name || "",
          start_time: sStart,
          end_time: sEnd,
        };
      });
    }

    const sId = String(appointment.service_id?._id || appointment.service_id || appointment.service_ids?.[0]?._id || appointment.service_ids?.[0] || "");
    const sName = appointment.service_id?.service_name || appointment.service_ids?.[0]?.service_name || "Service";
    const sDuration = Number(appointment.duration || appointment.service_id?.duration || 60);
    const sPrice = Number(appointment.total_price || appointment.service_id?.base_price || 0);
    const sStart = toHHMM(appointment.start_time);
    const sEnd = toHHMM(appointment.end_time || addMinutesToTime(sStart, sDuration));
    return [{
      service_id: sId,
      service_name: sName,
      duration: sDuration,
      sub_price: sPrice,
      staff_id: String(appointment.staff_id?._id || appointment.staff_id || ""),
      staff_name: appointment.staff_id?.full_name || "",
      start_time: sStart,
      end_time: sEnd,
    }];
  }, [appointment]);

  const [services, setServices] = useState(initialServices);

  useEffect(() => {
    let active = true;
    getStaff(salonId)
      .then((res) => {
        if (active) {
          setAllStaff(res.data || []);
        }
      })
      .catch((err) => {
        console.error("Failed to load staff:", err);
      })
      .finally(() => {
        if (active) setLoadingStaff(false);
      });
    return () => { active = false; };
  }, [salonId]);

  const updateServiceStartTime = (index, newStart) => {
    setServices((current) =>
      current.map((svc, i) => {
        if (i !== index) return svc;
        const newEnd = addMinutesToTime(newStart, svc.duration);
        return { ...svc, start_time: newStart, end_time: newEnd };
      })
    );
  };

  const updateServiceEndTime = (index, newEnd) => {
    setServices((current) =>
      current.map((svc, i) => {
        if (i !== index) return svc;
        return { ...svc, end_time: newEnd };
      })
    );
  };

  const updateServiceStaff = (index, newStaffId) => {
    const matchedStaff = allStaff.find((s) => String(s._id) === String(newStaffId));
    setServices((current) =>
      current.map((svc, i) => {
        if (i !== index) return svc;
        return {
          ...svc,
          staff_id: newStaffId,
          staff_name: matchedStaff?.full_name || svc.staff_name,
        };
      })
    );
  };

  const getEligibleStaff = (serviceId, currentStaffId) => {
    return allStaff.filter((st) => {
      if (st.status && st.status !== "Active") return false;
      const canDoService = st.services?.some((s) => String(s._id || s) === String(serviceId));
      const isManager = /^manager$/i.test(st.role || "");
      const isCurrent = String(st._id) === String(currentStaffId);
      return canDoService || isManager || isCurrent;
    });
  };

  const canSave =
    Boolean(appointmentDate) &&
    services.length > 0 &&
    services.every(
      (s) => s.staff_id && s.start_time && s.end_time && s.start_time < s.end_time
    );

  const handleSave = async () => {
    if (!canSave) {
      setError("Please ensure all services have an assigned staff member and valid time slots.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        appointment_date: appointmentDate,
        services: services.map((s) => ({
          service_id: s.service_id,
          staff_id: s.staff_id,
          service_start_time: s.start_time,
          service_end_time: s.end_time,
          duration: s.duration,
          sub_price: s.sub_price,
        })),
      };

      const response = await updateAppointmentDetails(appointment._id, payload);
      onSuccess?.(response.data?.appointment || response.data);
      onClose();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to update appointment.");
    } finally {
      setSaving(false);
    }
  };

<<<<<<< HEAD
  const bookingCode = appointment._id ? `#APT-${String(appointment._id).slice(-6).toUpperCase()}` : "";
  const customerName = appointment.customer_id?.name || appointment.guest_name || "Guest";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-base border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">Edit Appointment</h3>
              {bookingCode && (
                <span className="text-2xs font-extrabold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  {bookingCode}
                </span>
              )}
            </div>
            <p className="text-2xs text-muted-2 mt-0.5">
              Customer: <span className="text-neutral-300 font-medium">{customerName}</span>
              {appointment.status && (
                <span className="ml-2 uppercase tracking-wide text-3xs font-semibold px-1.5 py-0.5 rounded bg-surface-2 text-neutral-400 border border-border">
                  {appointment.status}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-2 hover:text-white hover:bg-surface-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Appointment Date Field */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Appointment Date
            </label>
            <input
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl p-2.5 text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Services List Header */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-amber-400" />
                Services ({services.length})
              </label>
              <span className="text-2xs text-muted-2">
                Time slot and staff can be edited for each service
              </span>
            </div>

            {/* List of services in this appointment */}
            <div className="space-y-3.5">
              {services.map((svc, idx) => {
                const eligibleStaff = getEligibleStaff(svc.service_id, svc.staff_id);

                return (
                  <div
                    key={`${svc.service_id}-${idx}`}
                    className="p-4 bg-surface-2/30 border border-border/80 rounded-xl space-y-3 shadow-sm hover:border-border transition-colors"
                  >
                    {/* Service Row: Title & Price */}
                    <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <h4 className="font-extrabold text-white text-sm">
                          {svc.service_name}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-amber-400">
                          LKR {svc.sub_price.toLocaleString()}
                        </span>
                        <span className="text-2xs text-neutral-400 block">
                          {formatDuration(svc.duration)}
                        </span>
                      </div>
                    </div>

                    {/* Controls Grid: Staff & Time Slot */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                      {/* Staff Member Selection */}
                      <div>
                        <label className="block text-2xs font-semibold text-neutral-400 mb-1 flex items-center gap-1">
                          <User className="w-3 h-3 text-blue-400" />
                          Staff Member
                        </label>
                        <select
                          value={svc.staff_id}
                          disabled={loadingStaff}
                          onChange={(e) => updateServiceStaff(idx, e.target.value)}
                          className="w-full bg-surface border border-border rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors disabled:opacity-60"
                        >
                          <option value="">{loadingStaff ? "Loading staff..." : "Select staff"}</option>
                          {eligibleStaff.map((staff) => (
                            <option key={String(staff._id)} value={String(staff._id)}>
                              {staff.full_name} {staff.role && `(${staff.role})`}
                            </option>
                          ))}
                          {svc.staff_id && !eligibleStaff.some((st) => String(st._id) === svc.staff_id) && (
                            <option value={svc.staff_id}>
                              {svc.staff_name || "Current Staff"}
                            </option>
                          )}
                        </select>
                      </div>

                      {/* Time Slot (Start Time & End Time) */}
                      <div>
                        <label className="block text-2xs font-semibold text-neutral-400 mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          Time Slot (Start — End)
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="time"
                            value={svc.start_time}
                            onChange={(e) => updateServiceStartTime(idx, e.target.value)}
                            className="flex-1 bg-surface border border-border rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                            title="Service Start Time"
                          />
                          <span className="text-neutral-500 text-xs">—</span>
                          <input
                            type="time"
                            value={svc.end_time}
                            onChange={(e) => updateServiceEndTime(idx, e.target.value)}
                            className="flex-1 bg-surface border border-border rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                            title="Service End Time"
                          />
                        </div>
                        <p className="text-3xs text-neutral-400 mt-1 pl-0.5">
                          {formatTime12h(svc.start_time)} – {formatTime12h(svc.end_time)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-border bg-surface/50">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-surface-2 text-neutral-300 text-xs font-bold hover:bg-surface-3 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-amber-400 text-black text-xs font-black hover:bg-amber-300 transition-all shadow-md shadow-amber-400/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {saving ? (
              "Saving..."
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

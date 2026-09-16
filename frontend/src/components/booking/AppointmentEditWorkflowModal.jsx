import { useEffect, useMemo, useState } from "react";
import { CalendarClock, ClipboardPenLine, Scissors, UserRound, X } from "lucide-react";
import { getAvailableStaff, updateAppointmentDetails } from "../../services/appointmentService";
import { getServices } from "../../services/serviceService";

const toHHMM = (value) => String(value || "").slice(0, 5);

export default function AppointmentEditWorkflowModal({ appointment, salonId, onClose, onReassign, onSuccess }) {
  const [mode, setMode] = useState("menu");
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const currentServiceId = String(appointment.service_id?._id || appointment.service_id || appointment.service_ids?.[0]?._id || appointment.service_ids?.[0] || "");
  const currentStaffId = String(appointment.staff_id?._id || appointment.staff_id || "");
  const [form, setForm] = useState({ service_id: currentServiceId, staff_id: currentStaffId, appointment_date: appointment.appointment_date || "", start_time: toHHMM(appointment.start_time), duration: Number(appointment.duration || 0), total_price: Number(appointment.total_price || 0), isManualOverride: false });

  const selectedService = useMemo(() => services.find((service) => String(service._id) === String(form.service_id)), [services, form.service_id]);

  useEffect(() => {
    let active = true;
    getServices(salonId).then((response) => {
      if (active) setServices(response.data || []);
    }).catch(() => active && setError("Failed to load services."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [salonId]);

  useEffect(() => {
    if (mode !== "full" || !form.service_id || !form.appointment_date || !form.start_time) return;
    const endMinutes = Number(form.duration || 0);
    const [hour, minute] = form.start_time.split(":").map(Number);
    const end = new Date(2000, 0, 1, hour, minute + endMinutes);
    const endTime = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
    getAvailableStaff(form.appointment_date, [form.service_id], salonId, { startTime: form.start_time, endTime, ignoreAppointmentId: appointment._id })
      .then((response) => setStaff(response.data || []))
      .catch(() => setStaff([]));
  }, [mode, form.service_id, form.appointment_date, form.start_time, form.duration, salonId, appointment._id]);

  const chooseService = (serviceId) => {
    const service = services.find((item) => String(item._id) === String(serviceId));
    setForm((current) => ({ ...current, service_id: serviceId, ...(current.isManualOverride || !service ? {} : { duration: Number(service.duration), total_price: Number(service.base_price) }) }));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, edit_type: mode };
      if (mode === "reschedule") {
        payload.service_id = currentServiceId;
        payload.staff_id = currentStaffId;
        payload.duration = Number(appointment.duration);
        payload.total_price = Number(appointment.total_price);
        payload.isManualOverride = false;
      }
      if (mode === "service") payload.staff_id = currentStaffId;
      const response = await updateAppointmentDetails(appointment._id, payload);
      onSuccess?.(response.data.appointment || response.data);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to update appointment.");
    } finally {
      setSaving(false);
    }
  };

  const menuItem = (nextMode, Icon, title, description) => <button onClick={() => setMode(nextMode)} className="w-full flex items-center gap-3 p-3 text-left border border-border rounded-lg hover:bg-surface-2 hover:border-accent/50"><Icon className="w-5 h-5 text-accent" /><span><span className="block text-sm font-bold text-white">{title}</span><span className="block text-2xs text-muted-2">{description}</span></span></button>;
  const canSave = mode === "reschedule" ? form.appointment_date && form.start_time : form.service_id && form.staff_id && form.appointment_date && form.start_time && form.duration > 0;

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/50" onClick={onClose} /><div className="relative w-full max-w-md bg-base border border-border rounded-xl shadow-2xl"><div className="flex items-center justify-between p-4 border-b border-border"><div><p className="font-bold text-white">Edit Appointment</p><p className="text-2xs text-muted-2">Choose the change you need to make.</p></div><button onClick={onClose} className="p-2 text-muted-2 hover:text-white"><X className="w-4 h-4" /></button></div>{mode === "menu" ? <div className="p-4 space-y-2">{menuItem("reassign", UserRound, "Reassign Staff", "Keep date, time, service, duration, and amount unchanged.")}{menuItem("reschedule", CalendarClock, "Reschedule", "Change only the appointment date and time.")}{menuItem("service", Scissors, "Change Service", "Use the selected service's standard duration and amount.")}{menuItem("full", ClipboardPenLine, "Full Edit", "Change service, staff, date, and time together.")}</div> : mode === "reassign" ? <div className="p-4"><button onClick={onReassign} className="w-full px-4 py-2 bg-accent text-primary font-bold rounded-lg">Open Staff Reassignment</button></div> : <div className="p-4 space-y-4">{loading && <p className="text-sm text-muted-2">Loading...</p>}{mode !== "reschedule" && <label className="block text-xs text-muted-2">Service<select value={form.service_id} onChange={(event) => chooseService(event.target.value)} className="mt-1 w-full bg-surface border border-border rounded-lg p-2 text-white"><option value="">Select service</option>{services.map((service) => <option key={service._id} value={service._id}>{service.service_name}</option>)}</select></label>}{mode === "full" && <label className="block text-xs text-muted-2">Staff<select value={form.staff_id} onChange={(event) => setForm((current) => ({ ...current, staff_id: event.target.value }))} className="mt-1 w-full bg-surface border border-border rounded-lg p-2 text-white"><option value={currentStaffId}>{appointment.staff_id?.full_name || "Current staff"}</option>{staff.filter((item) => String(item.staff_id) !== currentStaffId).map((item) => <option key={item.staff_id} value={item.staff_id}>{item.full_name}</option>)}</select></label>}<div className="grid grid-cols-2 gap-3"><label className="block text-xs text-muted-2">Date<input type="date" value={form.appointment_date} onChange={(event) => setForm((current) => ({ ...current, appointment_date: event.target.value }))} className="mt-1 w-full bg-surface border border-border rounded-lg p-2 text-white" /></label><label className="block text-xs text-muted-2">Time<input type="time" value={form.start_time} onChange={(event) => setForm((current) => ({ ...current, start_time: event.target.value }))} className="mt-1 w-full bg-surface border border-border rounded-lg p-2 text-white" /></label></div>{mode !== "reschedule" && <label className="flex gap-2 items-center text-xs text-muted-2"><input type="checkbox" checked={form.isManualOverride} onChange={(event) => setForm((current) => ({ ...current, isManualOverride: event.target.checked, ...(!event.target.checked && selectedService ? { duration: Number(selectedService.duration), total_price: Number(selectedService.base_price) } : {}) }))} />Override service duration and amount</label>}{mode !== "reschedule" && form.isManualOverride && <div className="grid grid-cols-2 gap-3"><label className="text-xs text-muted-2">Duration<input type="number" min="1" value={form.duration} onChange={(event) => setForm((current) => ({ ...current, duration: Number(event.target.value) }))} className="mt-1 w-full bg-surface border border-border rounded-lg p-2 text-white" /></label><label className="text-xs text-muted-2">Amount<input type="number" min="0" value={form.total_price} onChange={(event) => setForm((current) => ({ ...current, total_price: Number(event.target.value) }))} className="mt-1 w-full bg-surface border border-border rounded-lg p-2 text-white" /></label></div>}{error && <p className="text-xs text-rose-400">{error}</p>}<div className="flex gap-2"><button onClick={() => setMode("menu")} className="flex-1 p-2 rounded-lg bg-surface-2 text-muted-2">Back</button><button disabled={!canSave || saving} onClick={save} className="flex-1 p-2 rounded-lg bg-accent text-primary font-bold disabled:opacity-50">{saving ? "Saving..." : "Save"}</button></div></div>}</div></div>;
}

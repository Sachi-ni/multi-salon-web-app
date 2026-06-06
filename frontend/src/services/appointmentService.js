import api from "./api";

// ── Customer endpoints ──────────────────────────────────────────────────────

export const getAvailableStaff = (date, serviceId, salonId) =>
  api.get("/appointments/available-staff", { params: { date, serviceId, salonId } });

export const getAvailableSlots = (staffId, date, serviceId, salonId) =>
  api.get("/appointments/available-slots", { params: { staffId, date, serviceId, salonId } });

export const createAppointment = (data) =>
  api.post("/appointments", data);

export const getMyAppointments = () =>
  api.get("/appointments/my");

export const cancelAppointment = (id) =>
  api.patch(`/appointments/${id}/cancel`);

// ── Admin endpoints ─────────────────────────────────────────────────────────

export const getSalonAppointments = (salonId, status = "") =>
  api.get("/appointments", { params: { salonId, status } });

export const confirmAppointment = (id) =>
  api.patch(`/appointments/${id}/confirm`);

export const rejectAppointment = (id) =>
  api.patch(`/appointments/${id}/reject`);

export const completeAppointment = (id) =>
  api.patch(`/appointments/${id}/complete`);

export const adminCancelAppointment = (id) =>
  api.patch(`/appointments/${id}/admin-cancel`);

export const updateAppointmentDuration = (id, duration) =>
  api.patch(`/appointments/${id}/duration`, { duration });

export const getStaffAppointments = (staffId, status = "", date = "") =>
  api.get(`/appointments/staff/${staffId}`, { params: { status, date } });

export const getDailySchedule = (salonId, date) =>
  api.get("/appointments/daily-schedule", { params: { salonId, date } });
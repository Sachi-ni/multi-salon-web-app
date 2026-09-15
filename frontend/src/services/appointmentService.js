import api from "./api";

// ── Customer endpoints ──────────────────────────────────────────────────────

export const getAvailableStaff = (date, serviceIds, salonId, options = {}) =>
  api.get("/appointments/available-staff", {
    params: {
      date,
      serviceIds: Array.isArray(serviceIds) ? serviceIds.join(",") : serviceIds,
      salonId,
      ...(options.startTime ? { startTime: options.startTime } : {}),
      ...(options.endTime ? { endTime: options.endTime } : {}),
      ...(options.ignoreAppointmentId ? { ignoreAppointmentId: options.ignoreAppointmentId } : {})
    }
  });

export const getAvailableSlots = (staffId, date, serviceIds, salonId, options = {}) =>
  api.get("/appointments/available-slots", {
    params: {
      staffId,
      date,
      serviceIds: Array.isArray(serviceIds) ? serviceIds.join(",") : serviceIds,
      salonId,
      ...(options.ignoreAppointmentId ? { ignoreAppointmentId: options.ignoreAppointmentId } : {})
    }
  });

export const createAppointment = (data) =>
  api.post("/appointments", data);

export const getMyAppointments = () =>
  api.get("/appointments/my");

export const getAppointment = (id) =>
  api.get(`/appointments/${id}`);

export const cancelAppointment = (id) =>
  api.patch(`/appointments/${id}/cancel`);

// ── Admin endpoints ─────────────────────────────────────────────────────────

export const getSalonAppointments = (salonId, status = "", date = "") =>
  api.get("/appointments", { params: { salonId, status, date } });

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

export const updateStaffAssignment = (id, services) =>
  api.patch(`/appointments/${id}/assign-staff`, { services });

export const getStaffAppointments = (staffId, status = "", date = "") =>
  api.get(`/appointments/staff/${staffId}`, { params: { status, date } });

export const getDailySchedule = (salonId, date) =>
  api.get("/appointments/daily-schedule", { params: { salonId, date } });

export const deleteAppointment = (id) =>
  api.delete(`/appointments/${id}`);
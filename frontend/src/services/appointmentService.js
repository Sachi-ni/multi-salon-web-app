import api from "./api";

export const getAvailableStaff = (date, serviceId, salonId) =>
  api.get("/appointments/available-staff", { params: { date, serviceId, salonId } });

export const createAppointment = (data) =>
  api.post("/appointments", data);

export const getMyAppointments = () =>
  api.get("/appointments/my");

export const getSalonAppointments = (salonId, status = "") =>
  api.get("/appointments", { params: { salonId, status } });

export const updateAppointmentStatus = (id, status) =>
  api.patch(`/appointments/${id}/status`, { status });
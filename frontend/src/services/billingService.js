import api from "./api";

// ── Billing endpoints ───────────────────────────────────────────────────────

export const getDailyReport = (startDate, endDate, salonId) =>
  api.get("/bills/daily-report", { params: { startDate, endDate, salonId } });

export const createBill = (billData) => api.post("/bills", billData);

export const getBillByAppointment = (appointmentId) =>
  api.get(`/bills/appointment/${appointmentId}`);

export const getBills = () => api.get("/bills");



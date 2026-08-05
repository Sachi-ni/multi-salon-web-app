import api from "./api";

// ── Billing endpoints ───────────────────────────────────────────────────────

export const getDailyReport = (startDate, endDate, salonId) =>
  api.get("/bills/daily-report", { params: { startDate, endDate, salonId } });


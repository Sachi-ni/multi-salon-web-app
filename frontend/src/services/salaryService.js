import api from "./api";

// Backend currently exposes Salary usage via /revenue/stats aggregation.
// This service provides best-effort calls for payroll listing + processing.
// If the backend doesn’t implement these endpoints yet, the UI will fall back to an empty state.

export const getSalarySummary = (params = {}) => api.get("/revenue/stats", { params });

// Salary management
export const ensureSalaryForMonth = (params = {}) => api.get("/salary/ensure", { params });
export const getSalaries = (params = {}) => api.get("/salary", { params });
export const upsertMonthlySalary = (body = {}) => api.post("/salary/upsert", body);
export const generateMonthForSalon = (body = {}) => api.post("/salary/generate-monthly", body);



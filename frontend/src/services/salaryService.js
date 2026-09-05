import api from "./api";

export const getSalaries = (params = {}) => api.get("/salary", { params });
export const getSalarySummary = (params = {}) => api.get("/salary/summary", { params });
export const getStaffWithSalaries = (params = {}) => api.get("/salary/staff", { params });
export const getSalaryDetails = (salaryId) => api.get(`/salary/details/${salaryId}`);
export const markAsPaid = (salaryId) => api.patch(`/salary/${salaryId}/paid`);
export const createSalaryAndMarkPaid = (body = {}) => api.post("/salary/pay", body);
export const generatePayroll = (body = {}) => api.post("/salary/generate-payroll", body);
export const initializeSalaries = (body = {}) => api.post("/salary/initialize", body);
export const updateRate = (salaryId, rate) => api.patch(`/salary/${salaryId}/rate`, { rate });
export const updateStaffRate = (staffId, body = {}) =>
  api.patch(`/salary/staff/${staffId}/rate`, body);
// Mark/unmark an absent day (salary for that date becomes 0)
export const markDayAbsent = (salaryId, body = {}) =>
  api.patch(`/salary/${salaryId}/day-absent`, body);
export const markStaffDayAbsent = (staffId, body = {}) =>
  api.patch(`/salary/staff/${staffId}/day-absent`, body);
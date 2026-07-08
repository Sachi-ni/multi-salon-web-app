

import api from "./api";

export const getRevenueStats = (period = "30days") =>
  api.get(`/revenue/stats?period=${period}`);

export const getSalonRevenue = (period = "30days") =>
  api.get(`/revenue/salons?period=${period}`);

export const getMonthlyRevenue = () =>
  api.get("/revenue/monthly");
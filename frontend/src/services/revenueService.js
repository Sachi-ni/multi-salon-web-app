import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api"
});

export const getRevenueStats = () =>
  API.get("/revenue/stats");

export const getSalonRevenue = () =>
  API.get("/revenue/salons");

export const getMonthlyRevenue = () =>
  API.get("/revenue/monthly");
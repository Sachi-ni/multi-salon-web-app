import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api"
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getAppointments = () =>
  API.get("/appointments");

export const createAppointment = (data) =>
  API.post("/appointments", data);

export const updateAppointment = (id, data) =>
  API.put(`/appointments/${id}`, data);

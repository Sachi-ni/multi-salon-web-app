import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api"
});

// Add token to requests
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

export const getStaff = () =>
  API.get("/staff");

export const createStaff = (data) =>
  API.post("/staff", data);

export const updateStaff = (id, data) =>
  API.put(`/staff/${id}`, data);

export const deleteStaff = (id) =>
  API.delete(`/staff/${id}`);
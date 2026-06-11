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

export const getStaff = () =>
  API.get("/staff");

export const createStaff = (data) =>
  API.post("/staff", data);

export const updateStaff = (id, data) =>
  API.put(`/staff/${id}`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const deleteStaff = (id) =>
  API.delete(`/staff/${id}`);
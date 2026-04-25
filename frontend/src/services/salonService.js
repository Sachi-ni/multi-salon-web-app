import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api"
});

export const getSalons = () =>
  API.get("/salons");

export const getSalon = (id) =>
  API.get(`/salons/${id}`);

export const createSalon = (data) =>
  API.post("/salons", data);

export const updateSalon = (id, data) =>
  API.put(`/salons/${id}`, data);

export const deleteSalon = (id) =>
  API.delete(`/salons/${id}`);


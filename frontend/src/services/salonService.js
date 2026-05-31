import api from "./api";

export const getSalons = () =>
  api.get("/salons");

export const getSalon = (id) =>
  api.get(`/salons/${id}`);

export const createSalon = (data) =>
  api.post("/salons", data);

export const updateSalon = (id, data) =>
  api.put(`/salons/${id}`, data);

export const deleteSalon = (id) =>
  api.delete(`/salons/${id}`);

export const getSalonServices = (salonId) =>
  api.get("/services", { params: { salonId } });
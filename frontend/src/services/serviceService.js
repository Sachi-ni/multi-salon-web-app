import api from "./api";

// ── Services ──

export const getServices = (salonId) =>
  api.get("/services", { params: salonId ? { salonId } : {} });

export const createService = (data) =>
  api.post("/services", data);

export const updateService = (id, data) =>
  api.put(`/services/${id}`, data);

export const deleteService = (id) =>
  api.delete(`/services/${id}`);

// ── Service Categories ──

export const getServiceCategories = () =>
  api.get("/services/categories");

export const createServiceCategory = (data) =>
  api.post("/services/categories", data);

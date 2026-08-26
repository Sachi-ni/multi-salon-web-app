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

export const getSalonById = (id) =>
  api.get(`/salons/${id}`); // ✅ FIXED

export const uploadSalonImages = (id, files) => {
  const data = new FormData();
  files.forEach((file) => data.append("images", file));
  return api.post(`/salons/${id}/images`, data);
};

export const removeSalonImage = (id, filename) =>
  api.delete(`/salons/${id}/images/${filename}`);

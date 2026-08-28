import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getStaff = (salonId) =>
  API.get("/staff", {
    params: salonId ? { salonId } : {},
  });

export const getTeam = (salonId, serviceId) => {
  const params = new URLSearchParams();

  if (salonId) {
    params.append("salonId", salonId);
  }

  if (serviceId) {
    params.append("serviceId", serviceId);
  }

  return API.get(`/team?${params.toString()}`);
};

export const createStaff = (data) =>
  API.post("/staff", data);

/* ─────────────────────────────────────────────
   UPDATE STAFF
   ───────────────────────────────────────────── */
export const updateStaff = async (id, data) => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    // Services must be sent as JSON string
    if (key === "services") {
      formData.append(
        "services",
        JSON.stringify(Array.isArray(value) ? value : [])
      );
      return;
    }

    formData.append(key, value);
  });

  // Debug - you can remove this later
  console.log("UPDATE STAFF FORMDATA:");

  for (const [key, value] of formData.entries()) {
    console.log(key, value);
  }

  // IMPORTANT:
  // Use API, NOT api
  return API.put(`/staff/${id}`, formData);
};

export const deleteStaff = (id) =>
  API.delete(`/staff/${id}`);
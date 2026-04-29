import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// =======================
// SALONS
// =======================
export const getSalons = async () => {
  const res = await API.get("/salons");
  return res.data;
};

// =======================
// SERVICES
// =======================
export const getServices = async (salonId) => {
  const res = await API.get(`/services?salon=${salonId}`);
  return res.data;
};

// =======================
// AVAILABILITY
// =======================
export const getAvailability = async (salon_id, service_id, date) => {
  const res = await API.post("/availability", {
    salon_id,
    service_id,
    date,
  });
  return res.data;
};

// =======================
// BOOK APPOINTMENT
// =======================
export const bookAppointment = async (payload) => {
  const res = await API.post("/appointments/book", payload);
  return res.data;
};
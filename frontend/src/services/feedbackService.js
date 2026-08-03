import api from "./api";

export const submitFeedback = (data) => api.post("/feedback", data);
export const getMyFeedback = () => api.get("/feedback/my");
export const getSalonFeedback = (salonId, staffId = "", serviceId = "") =>
  api.get("/feedback/salon", { params: { salonId, staffId, serviceId } });

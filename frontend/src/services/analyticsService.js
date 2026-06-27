import api from "./api";

export const getAnalytics = async () => {
  return api.get("/analytics");
};
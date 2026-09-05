import api from "./api";

export const sendChatMessage = (message) =>
  api.post("/chatbot/message", { message });

const API_ORIGIN = (process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

export const mediaUrl = (value) => {
  if (!value) return "";
  const normalized = value.replace(/\\/g, "/");
  return /^https?:\/\//i.test(normalized)
    ? normalized
    : `${API_ORIGIN}/${normalized.replace(/^\/+/, "")}`;
};

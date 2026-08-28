/**
 * Centralized app configuration.
 * All API/backend URLs should use these helpers instead of hardcoding localhost.
 */

// Base URL for the backend server (without /api)
// In development: http://localhost:5000
// In production:  https://your-backend.onrender.com
export const API_BASE = (
  process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace(/\/api\/?$/, "")
    : "http://localhost:5000"
);

// Base URL for API endpoints (with /api)
export const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

/**
 * Converts a relative upload path (e.g. "uploads/abc.jpg") into a full URL.
 * Handles:
 *  - Already-absolute URLs (returns as-is)
 *  - Backslash paths from Windows (normalizes to forward slashes)
 *  - Paths with or without leading slash
 *
 * @param {string} path - The upload path stored in the database
 * @returns {string} Full URL to the uploaded file
 */
export const getUploadUrl = (path) => {
  if (!path) return "";
  const normalized = path.replace(/\\/g, "/");
  if (normalized.startsWith("http")) return normalized;
  if (normalized.startsWith("/")) return `${API_BASE}${normalized}`;
  return `${API_BASE}/${normalized}`;
};

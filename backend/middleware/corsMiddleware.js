import cors from "cors";

export const createCorsMiddleware = () => {
  const allowedOrigins = [
    "http://localhost:3000",
    "https://multi-salon-web-app.vercel.app",
    ...(process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",").map((url) => url.trim().replace(/\/+$/, ""))
      : [])
  ];

  return cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      const error = new Error(`CORS blocked for origin: ${origin}`);
      error.status = 403;
      return callback(error);
    },
    credentials: true
  });
};
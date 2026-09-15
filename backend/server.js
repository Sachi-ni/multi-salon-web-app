import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import dns from "dns";
import connectDB from "./config/db.js";

// Force IPv4 first to prevent ENETUNREACH in cloud containers (Render, Docker, AWS)
dns.setDefaultResultOrder("ipv4first");

import authRoutes from "./routes/authRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import salonRoutes from "./routes/salonRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";

import billRoutes from "./routes/billRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import staffAvailabilityRoutes from "./routes/staffAvailabilityRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import salaryRoutes from "./routes/salaryRoutes.js";
import revenueRoutes from "./routes/revenueRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import utilsRoutes from "./routes/utilsRoutes.js";


dotenv.config();
connectDB();

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((url) => url.trim().replace(/\/+$/, ""))
    : [])
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app")
    ) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/salons", salonRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/availability", staffAvailabilityRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/revenue", revenueRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/utils", utilsRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("Salon Management API Running");
});

// Server startup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




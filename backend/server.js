import express from "express";
import dotenv from "dotenv";
import dns from "dns";
import connectDB from "./config/db.js";
import { createCorsMiddleware } from "./middleware/corsMiddleware.js";
import requestSizeErrorHandler from "./middleware/requestSizeErrorHandler.js";
import securityHeaders from "./middleware/securityHeaders.js";

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
import staffUnavailabilityRoutes from "./routes/staffUnavailabilityRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import salaryRoutes from "./routes/salaryRoutes.js";
import revenueRoutes from "./routes/revenueRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import utilsRoutes from "./routes/utilsRoutes.js";


dotenv.config();
await connectDB();

const app = express();
app.use(securityHeaders);
app.use(createCorsMiddleware());
app.use(express.json({ limit: "10kb" }));
app.use("/uploads", express.static("uploads"));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/salons", salonRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/availability", staffAvailabilityRoutes);
app.use("/api/unavailability", staffUnavailabilityRoutes);
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

app.use(requestSizeErrorHandler);

// Server startup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




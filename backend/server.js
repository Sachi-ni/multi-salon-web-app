import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import salonRoutes from "./routes/salonRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import serviceCategoryRoutes from "./routes/serviceCategoryRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import appointmentServiceRoutes from "./routes/appointmentServiceRoutes.js";
import billRoutes from "./routes/billRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Salon Management API running");
});

app.use("/api/admins", adminRoutes);
app.use("/api/salons", salonRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/service-categories", serviceCategoryRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/appointment-services", appointmentServiceRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
import express from "express";
import {
  getAvailableStaff,
  createAppointment,
  getSalonAppointments,
  updateAppointmentStatus,
  getMyAppointments
} from "../controllers/appointmentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";


const router = express.Router();

// Customer routes
router.get("/available-staff", protect, getAvailableStaff);
router.post("/",              protect, createAppointment);
router.get("/my",             protect, getMyAppointments);

// Admin routes
router.get("/",               protect, authorizeRoles("super-admin", "staff-admin"), getSalonAppointments);
router.patch("/:id/status",   protect, authorizeRoles("super-admin", "staff-admin"), updateAppointmentStatus);

export default router;
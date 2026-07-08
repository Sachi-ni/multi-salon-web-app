import express from "express";
import {
  getAvailableStaff,
  getAvailableSlots,
  createAppointment,
  getMyAppointments,
  getAppointment,
  cancelAppointment,
  getSalonAppointments,
  confirmAppointment,
  rejectAppointment,
  completeAppointment,
  adminCancelAppointment,
  getStaffAppointments,
  getDailySchedule,
  updateAppointmentDuration,
  deleteAppointment
} from "../controllers/appointmentController.js";
import { protect, optionalProtect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ── Customer routes ─────────────────────────────────────────────────────────
router.get("/available-staff", optionalProtect, getAvailableStaff);
router.get("/available-slots", optionalProtect, getAvailableSlots);
router.post("/", optionalProtect, createAppointment);
router.get("/my", protect, getMyAppointments);
router.get("/:id", protect, getAppointment);
router.patch("/:id/cancel", protect, cancelAppointment);

// ── Admin routes ────────────────────────────────────────────────────────────
router.get("/daily-schedule", protect, authorizeRoles("super-admin", "staff-admin", "manager"), getDailySchedule);
router.get("/staff/:staffId", protect, authorizeRoles("super-admin", "staff-admin", "manager"), getStaffAppointments);
router.get("/", protect, authorizeRoles("super-admin", "staff-admin", "manager"), getSalonAppointments);
router.patch("/:id/duration", protect, authorizeRoles("super-admin", "staff-admin", "manager"), updateAppointmentDuration);
router.patch("/:id/confirm", protect, authorizeRoles("super-admin"), confirmAppointment);
router.patch("/:id/reject", protect, authorizeRoles("super-admin", "staff-admin", "manager"), rejectAppointment);
router.patch("/:id/complete", protect, authorizeRoles("super-admin", "staff-admin", "manager"), completeAppointment);
router.patch("/:id/admin-cancel", protect, authorizeRoles("super-admin", "staff-admin", "manager"), adminCancelAppointment);
router.delete("/:id", protect, authorizeRoles("super-admin", "staff-admin", "manager"), deleteAppointment);

export default router;
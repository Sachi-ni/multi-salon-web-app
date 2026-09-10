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
  updateStaffAssignment,
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
router.patch("/:id/reject", protect, authorizeRoles("super-admin", "manager"), rejectAppointment);
router.patch("/:id/complete", protect, authorizeRoles("super-admin", "manager"), completeAppointment);
router.patch("/:id/admin-cancel", protect, authorizeRoles("super-admin", "manager"), adminCancelAppointment);
router.patch("/:id/assign-staff", protect, authorizeRoles("super-admin", "staff-admin", "manager"), updateStaffAssignment);
router.delete("/:id", protect, deleteAppointment);

export default router;
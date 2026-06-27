import express from "express";
import {
  getAvailableStaff,
  getAvailableSlots,
  createAppointment,
  getMyAppointments,
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
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ── Customer routes ─────────────────────────────────────────────────────────
router.get("/available-staff",  protect, getAvailableStaff);
router.get("/available-slots",  protect, getAvailableSlots);
router.post("/",                protect, createAppointment);
router.get("/my",               protect, getMyAppointments);
router.patch("/:id/cancel",     protect, cancelAppointment);

// ── Admin routes ────────────────────────────────────────────────────────────
router.get("/daily-schedule",        protect, authorizeRoles("super-admin", "staff-admin"), getDailySchedule);
router.get("/staff/:staffId",        protect, authorizeRoles("super-admin", "staff-admin"), getStaffAppointments);
router.get("/",                      protect, authorizeRoles("super-admin", "staff-admin"), getSalonAppointments);
router.patch("/:id/duration",        protect, authorizeRoles("super-admin", "staff-admin"), updateAppointmentDuration);
router.patch("/:id/confirm",        protect, authorizeRoles("super-admin", "staff-admin"), confirmAppointment);
router.patch("/:id/reject",         protect, authorizeRoles("super-admin", "staff-admin"), rejectAppointment);
router.patch("/:id/complete",       protect, authorizeRoles("super-admin", "staff-admin"), completeAppointment);
router.patch("/:id/admin-cancel",   protect, authorizeRoles("super-admin", "staff-admin"), adminCancelAppointment);
router.delete("/:id",               protect, authorizeRoles("super-admin", "staff-admin"), deleteAppointment);

export default router;
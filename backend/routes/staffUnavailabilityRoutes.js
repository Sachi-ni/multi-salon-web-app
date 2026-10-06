import express from "express";
import {
  createStaffUnavailability,
  listStaffUnavailability,
  deleteStaffUnavailability,
  getAffectedAppointments,
} from "../controllers/staffUnavailabilityController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();
const adminRoles = authorizeRoles("super-admin", "staff-admin", "manager");

router.get("/", protect, adminRoles, listStaffUnavailability);
router.post("/", protect, adminRoles, createStaffUnavailability);
router.delete("/:id", protect, adminRoles, deleteStaffUnavailability);
router.get("/staff/:staffId/appointments", protect, adminRoles, getAffectedAppointments);

export default router;

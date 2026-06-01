import express from "express";
import {
  setAvailability,
  getStaffAvailability,
  getSalonAvailability,
  deleteAvailability,
  updateSlots
} from "../controllers/staffAvailabilityController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/",                  protect, authorizeRoles("super-admin", "staff-admin"), setAvailability);
router.get("/staff/:staffId",     protect, authorizeRoles("super-admin", "staff-admin"), getStaffAvailability);
router.get("/salon",              protect, authorizeRoles("super-admin", "staff-admin"), getSalonAvailability);
router.delete("/:id",             protect, authorizeRoles("super-admin", "staff-admin"), deleteAvailability);
router.patch("/:id/slots",        protect, authorizeRoles("super-admin", "staff-admin"), updateSlots);

export default router;
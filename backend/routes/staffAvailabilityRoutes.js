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

router.post("/",                  protect, authorizeRoles("super-admin", "manager"), setAvailability);
router.get("/staff/:staffId",     protect, authorizeRoles("super-admin", "manager"), getStaffAvailability);
router.get("/salon",              protect, authorizeRoles("super-admin", "manager"), getSalonAvailability);
router.delete("/:id",             protect, authorizeRoles("super-admin", "manager"), deleteAvailability);
router.patch("/:id/slots",        protect, authorizeRoles("super-admin", "manager"), updateSlots);

export default router;
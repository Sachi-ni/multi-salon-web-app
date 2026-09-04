import express from "express";
import { createBill, getBills, getDailyReport } from "../controllers/billController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/daily-report", protect, getDailyReport);
router.post("/", protect, requireRole(["super-admin", "manager"]), createBill);
router.get("/", protect, requireRole(["super-admin", "manager"]), getBills);

export default router;

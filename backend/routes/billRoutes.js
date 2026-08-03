import express from "express";
import { createBill, getBills, getDailyReport } from "../controllers/billController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/daily-report", protect, getDailyReport);
router.post("/", createBill);
router.get("/", getBills);

export default router;

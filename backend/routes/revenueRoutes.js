import express from "express";
import { getRevenueStats, getSalonRevenue, getMonthlyRevenue, getAIForecast } from "../controllers/revenueController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
const router = express.Router();

router.use(protect, authorizeRoles('super-admin'));

router.get('/stats', getRevenueStats);
router.get('/salons', getSalonRevenue);
router.get('/monthly', getMonthlyRevenue);
router.get('/ai-forecast', getAIForecast);

export default router;

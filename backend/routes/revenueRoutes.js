import express from "express";
import { getRevenueStats, getSalonRevenue, getMonthlyRevenue } from "../controllers/revenueController.js";
import protect from "../middleware/authMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
const router = express.Router();

router.use(protect, authorizeRoles('superadmin'));

router.get('/stats', getRevenueStats);
router.get('/salons', getSalonRevenue);
router.get('/monthly', getMonthlyRevenue);

export default router;

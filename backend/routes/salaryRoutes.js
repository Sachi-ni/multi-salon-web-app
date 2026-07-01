import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getSalaries,
  upsertMonthlySalary,
  generateMonthForSalon,
  ensureMonthForSalon,
} from "../controllers/salaryController.js";

const router = express.Router();

// Salary management: super-admin + staff-admin/managers
router.use(protect);
router.use(authorizeRoles("super-admin", "staff-admin", "manager"));

router.get("/", getSalaries);
router.post("/upsert", upsertMonthlySalary);

// Create missing monthly salary rows for active staff.
router.post("/generate-monthly", generateMonthForSalon);

// Alias that supports ensure semantics.
router.get("/ensure", ensureMonthForSalon);


export default router;


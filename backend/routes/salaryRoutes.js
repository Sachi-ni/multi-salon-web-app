import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getSalaries,
  getSalarySummary,
  markAsPaid,
  createAndMarkPaid,
  getStaffSalaryList,
  getStaffWithSalaries,
  generatePayroll,
  getSalaryDetails,
  initializeSalaries,
  updateRate,
  updateStaffRate,
  markDayAbsent,
  markStaffDayAbsent,
} from "../controllers/salaryController.js";
const router = express.Router();
// Salary management: super-admin + managers
router.use(protect);
router.use(authorizeRoles("super-admin", "manager"));
// Get salaries with filters
router.get("/", getSalaries);
// Get salary summary
router.get("/summary", getSalarySummary);
// Get staff with their salary info
router.get("/staff", getStaffWithSalaries);
router.get("/staff/list", getStaffSalaryList);
router.get("/staff/with-salaries", getStaffWithSalaries);
// Get salary details for PDF
router.get("/details/:salaryId", getSalaryDetails);
router.get("/:salaryId/details", getSalaryDetails);
router.get("/:salaryId/pdf", getSalaryDetails);
router.get("/pdf/:salaryId", getSalaryDetails);
// Mark salary as paid
router.patch("/:salaryId/paid", markAsPaid);
router.patch("/:salaryId/pay", markAsPaid);
// Create (if missing) a salary record for a staff member and mark it paid
// (used by the salary tables for rows that do not have a record yet)
router.post("/pay", createAndMarkPaid);
// Generate payroll for a period
router.post("/generate-payroll", generatePayroll);
// Initialize/ensure salary records exist for staff
router.post("/initialize", initializeSalaries);
// Update rate for a salary record and recalculate
router.patch("/:salaryId/rate", updateRate);
// Update rate by staff id (persists on staff and ensures a period salary record)
router.patch("/staff/:staffId/rate", updateStaffRate);
// Mark/unmark an absent day on an existing salary record (manual override:
// the absent date's salary becomes 0 and period totals are recalculated)
router.patch("/staff/:staffId/day-absent", markStaffDayAbsent);
router.patch("/:salaryId/day-absent", markDayAbsent);
export default router;
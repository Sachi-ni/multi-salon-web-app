import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getSalaries,
  getSalarySummary,
  markAsPaid,
  getStaffSalaryList,
  getStaffWithSalaries,
  generatePayroll,
  getSalaryDetails,
  initializeSalaries,
  updateRate,
} from "../controllers/salaryController.js";
const router = express.Router();
// Salary management: super-admin + staff-admin/managers
router.use(protect);
router.use(authorizeRoles("super-admin", "staff-admin", "manager"));
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
// Generate payroll for a period
router.post("/generate-payroll", generatePayroll);
// Initialize/ensure salary records exist for staff
router.post("/initialize", initializeSalaries);
// Update rate and recalculate
router.patch("/:salaryId/rate", updateRate);
export default router;
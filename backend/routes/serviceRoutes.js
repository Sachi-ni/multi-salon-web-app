import express from "express";
import {
  createService,
  getServices,
  updateService,
  deleteService,
  getCategories,
  createCategory,
} from "../controllers/serviceController.js";
import { protect, optionalProtect } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Category routes (placed before /:id to avoid conflicts)
router.get("/categories", getCategories);
router.post("/categories", protect, requireRole(["super-admin", "manager"]), createCategory);

// Service CRUD
router.get("/", optionalProtect, getServices);
router.post("/", protect, requireRole(["super-admin", "manager"]), createService);
router.put("/:id", protect, requireRole(["super-admin", "manager"]), updateService);
router.delete("/:id", protect, requireRole(["super-admin", "manager"]), deleteService);

export default router;

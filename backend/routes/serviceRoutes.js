import express from "express";
import {
  createService,
  getServices,
  updateService,
  deleteService,
  getCategories,
  createCategory,
} from "../controllers/serviceController.js";

const router = express.Router();

// Category routes (placed before /:id to avoid conflicts)
router.get("/categories", getCategories);
router.post("/categories", createCategory);

// Service CRUD
router.get("/", getServices);
router.post("/", createService);
router.put("/:id", updateService);
router.delete("/:id", deleteService);

export default router;

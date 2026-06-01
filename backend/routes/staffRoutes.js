import express from "express";
import multer from "multer";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";
import {
	createStaff,
	getStaff,
	updateStaff,
	deleteStaff
} from "../controllers/staffController.js";

const router = express.Router();

// Configure multer for simple disk storage
const upload = multer({ dest: "uploads/" });

// Only Superadmin can create or view staff
router.post("/", protect, authorize("super-admin"), upload.single("image"), createStaff);
router.get("/", protect, authorize("super-admin"), getStaff);
router.put("/:id", protect, authorize("super-admin"), updateStaff);
router.delete("/:id", protect, authorize("super-admin"), deleteStaff);

export default router;
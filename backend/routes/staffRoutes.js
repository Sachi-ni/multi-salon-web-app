import express from "express";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { loginStaff } from "../controllers/authController.js";
import {
	createStaff,
	getStaff,
	updateStaff,
	deleteStaff
} from "../controllers/staffController.js";

const router = express.Router();

// Configure multer for simple disk storage
const upload = multer({ dest: "uploads/" });

// Customers can view staff — only admins can create/edit/delete
router.post("/login", loginStaff);
router.get("/",       protect, getStaff);
router.post("/",      protect, authorizeRoles("super-admin", "staff-admin"), upload.single("image"), createStaff);
router.put("/:id",    protect, authorizeRoles("super-admin", "staff-admin"), upload.single("image"), updateStaff);
router.delete("/:id", protect, authorizeRoles("super-admin", "staff-admin"), deleteStaff);

export default router;
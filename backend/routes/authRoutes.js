import express from "express";
import multer from "multer";
import { loginAdmin, registerAdmin, getProfile, updateProfile, changePassword, setupMfa } from "../controllers/authController.js";
import { protect, protectHardening } from "../middleware/authMiddleware.js";
import rateLimit from "express-rate-limit";


const router = express.Router();

// Configure multer for simple disk storage (profile pictures)
const upload = multer({ dest: "uploads/" });
const registrationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });

// Customer-only by contract; admin, manager, and staff creation must never be added here.
router.post("/register", registrationLimiter, registerAdmin);
router.post("/login", loginAdmin);
router.get("/profile", protect, getProfile);
router.put("/user/:id", protect, upload.single("image"), updateProfile);
router.post("/change-password", protectHardening("change-password"), changePassword);
router.post("/mfa/setup", protectHardening("mfa-setup"), setupMfa);

export default router;

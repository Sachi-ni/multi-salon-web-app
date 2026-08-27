import express from "express";
import multer from "multer";
import { loginAdmin, registerAdmin, getProfile, updateProfile } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";


const router = express.Router();

// Configure multer for simple disk storage (profile pictures)
const upload = multer({ dest: "uploads/" });

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/profile", protect, getProfile);
router.put("/user/:id", protect, upload.single("image"), updateProfile);

export default router;

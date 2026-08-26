import express from "express";
import multer from "multer";
import {loginAdmin, registerAdmin} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { updateProfile } from "../controllers/authController.js";


const router = express.Router();

// Configure multer for simple disk storage (profile pictures)
const upload = multer({ dest: "uploads/" });

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.put("/user/:id", protect, upload.single("image"), updateProfile);

export default router;

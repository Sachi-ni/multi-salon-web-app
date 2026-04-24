import express from "express";
import {loginAdmin, registerAdmin} from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";
import { updateProfile } from "../controllers/authController.js";


const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.put("/user/:id", protect, updateProfile);

export default router;
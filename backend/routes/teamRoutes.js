import express from "express";
import { getPublicTeam, getTeam } from "../controllers/staffController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public profiles contain only fields needed by the team and salon pages.
router.get("/public", getPublicTeam);

// Authenticated team endpoint
router.get("/", protect, getTeam);

export default router;

import express from "express";
import { getTeam } from "../controllers/staffController.js";

const router = express.Router();

// Public endpoint to get active staff members for the Team page
router.get("/", getTeam);

export default router;

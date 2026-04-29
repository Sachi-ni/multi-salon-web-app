import express from "express";
import { getAvailability } from "../controllers/availabilityController.js";

const router = express.Router();

router.post("/", getAvailability);

export default router;
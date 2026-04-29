import express from "express";
import { bookAppointment } from "../controllers/appointmentController.js";
import { getAvailability } from "../controllers/availabilityController.js";

const router = express.Router();

// Check availability (time slots)
router.post("/availability", getAvailability);

// Book appointment
router.post("/book", bookAppointment);

export default router;
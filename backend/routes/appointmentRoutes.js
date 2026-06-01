import express from "express";
import { createAppointment, getAppointments, updateAppointment } from "../controllers/appointmentController.js";

const router = express.Router();

// Get all appointments
router.get("/", getAppointments);

// Create appointment
router.post("/", createAppointment);

// Update appointment
router.put("/:id", updateAppointment);

export default router;

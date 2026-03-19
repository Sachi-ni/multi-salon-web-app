import express from "express";
import { createAppointment, getAppointments } from "../controllers/appointmentController.js";

const router = express.Router();

// Get all appointments
router.get("/", getAppointments);

// Create appointment
router.post("/", createAppointment);

export default router;

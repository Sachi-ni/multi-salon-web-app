import express from "express";
import {
  addServiceToAppointment,
  getAppointmentServices,
  deleteAppointmentService
} from "../controllers/appointmentServiceController.js";

const router = express.Router();

router.post("/", addServiceToAppointment);
router.get("/", getAppointmentServices);
router.delete("/:id", deleteAppointmentService);

export default router;
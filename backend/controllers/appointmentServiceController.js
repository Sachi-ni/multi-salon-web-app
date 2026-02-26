import AppointmentService from "../models/AppointmentService.js";

export const addServiceToAppointment = async (req, res) => {
  const service = await AppointmentService.create(req.body);
  res.status(201).json(service);
};

export const getAppointmentServices = async (req, res) => {
  const services = await AppointmentService.find()
    .populate("appointment_id")
    .populate("service_id")
    .populate("staff_id");
  res.json(services);
};

export const deleteAppointmentService = async (req, res) => {
  await AppointmentService.findByIdAndDelete(req.params.id);
  res.json({ message: "Appointment service removed" });
};
import Appointment from "../models/Appointment.js";

export const createAppointment = async (req, res) => {
  const appointment = await Appointment.create(req.body);
  res.status(201).json(appointment);
};

export const getAppointments = async (req, res) => {
  const appointments = await Appointment.find()
    .populate("customer_id")
    .populate("salon_id")
    .populate("staff_id");
  res.json(appointments);
};

export const updateAppointment = async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(appointment);
};

export const deleteAppointment = async (req, res) => {
  await Appointment.findByIdAndDelete(req.params.id);
  res.json({ message: "Appointment deleted" });
};
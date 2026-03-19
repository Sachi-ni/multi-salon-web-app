import Appointment from "../models/Appointment.js";

export const createAppointment = async (req, res) => {
   try {
      const appointment = await Appointment.create(req.body);
      res.status(201).json(appointment);
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

export const getAppointments = async (req, res) => {
   try {
      const appointments = await Appointment.find()
         .populate("customer_id")
         .populate("salon_id")
         .populate("staff_id");
      res.json(appointments);
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

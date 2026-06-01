import Appointment from "../models/Appointment.js";
import Customer from "../models/Customer.js";

export const createAppointment = async (req, res) => {
   try {
      let customerId = req.body.customer_id;

      // If a clientName is provided instead of customer_id, resolve or create the Customer
      if (req.body.clientName) {
         let customer = await Customer.findOne({ name: req.body.clientName });
         if (!customer) {
            customer = await Customer.create({
               name: req.body.clientName,
               phone: req.body.phone || "",
               email: req.body.email || "",
               registration_date: new Date()
            });
         }
         customerId = customer._id;
      }

      const appointmentData = {
         customer_id: customerId,
         salon_id: req.body.salon_id,
         staff_id: req.body.staff_id,
         service_id: req.body.service_id,
         amount: req.body.amount,
         status: req.body.status || "Pending",
         appointment_date: req.body.appointment_date || new Date(),
         scheduled_start_time: req.body.scheduled_start_time || "",
         scheduled_end_time: req.body.scheduled_end_time || ""
      };

      const appointment = await Appointment.create(appointmentData);
      const populated = await Appointment.findById(appointment._id)
         .populate("customer_id")
         .populate("salon_id")
         .populate("staff_id")
         .populate("service_id");

      res.status(201).json(populated);
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

export const getAppointments = async (req, res) => {
   try {
      const appointments = await Appointment.find()
         .populate("customer_id")
         .populate("salon_id")
         .populate("staff_id")
         .populate("service_id");
      res.json(appointments);
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

export const updateAppointment = async (req, res) => {
   try {
      const appointment = await Appointment.findByIdAndUpdate(
         req.params.id,
         req.body,
         { new: true }
      )
      .populate("customer_id")
      .populate("salon_id")
      .populate("staff_id")
      .populate("service_id");

      if (!appointment) {
         return res.status(404).json({ message: "Appointment not found" });
      }
      res.json(appointment);
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

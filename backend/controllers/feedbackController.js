import Feedback from "../models/Feedback.js";
import Appointment from "../models/Appointment.js";
import Salon from "../models/Salon.js";
import Customer from "../models/Customer.js";
import Service from "../models/Service.js";
import Staff from "../models/Staff.js";

export const submitFeedback = async (req, res) => {
  try {
    const { appointment_id, serviceRating, staffRating, comment } = req.body;

    if (!appointment_id || serviceRating == null || staffRating == null) {
      return res.status(400).json({ message: "appointment_id, serviceRating, and staffRating are required." });
    }

    const ratingValues = [1, 2, 3, 4, 5];
    if (!ratingValues.includes(Number(serviceRating)) || !ratingValues.includes(Number(staffRating))) {
      return res.status(400).json({ message: "Ratings must be integers between 1 and 5." });
    }

    const appointment = await Appointment.findById(appointment_id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    if (appointment.customer_id?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to submit feedback for this appointment." });
    }

    if (appointment.status !== "completed") {
      return res.status(400).json({ message: "Feedback can only be submitted for completed appointments." });
    }

    if (appointment.feedback_submitted) {
      return res.status(400).json({ message: "Feedback has already been submitted for this appointment." });
    }

    const feedback = await Feedback.create({
      appointment_id,
      salon_id: appointment.salon_id,
      customer_id: appointment.customer_id,
      service_id: appointment.service_id,
      staff_id: appointment.staff_id,
      serviceRating,
      staffRating,
      comment: comment?.trim() || ""
    });

    appointment.feedback_submitted = true;
    await appointment.save();

    res.status(201).json(feedback);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Feedback already exists for this appointment." });
    }
    res.status(500).json({ message: err.message });
  }
};

export const getMyFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ customer_id: req.user.id })
      .populate("appointment_id", "appointment_date start_time end_time status")
      .populate("salon_id", "name")
      .populate("service_id", "service_name")
      .populate("staff_id", "full_name")
      .sort({ createdAt: -1 });

    res.status(200).json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSalonFeedback = async (req, res) => {
  try {
    const salon_id = req.user.role === "super-admin"
      ? req.query.salonId || req.user.salon_id
      : req.user.salon_id;

    if (!salon_id) {
      return res.status(400).json({ message: "salonId is required." });
    }

    const filter = {};
    if (salon_id !== "all") {
      filter.salon_id = salon_id;
    }
    if (req.query.staffId) filter.staff_id = req.query.staffId;
    if (req.query.serviceId) filter.service_id = req.query.serviceId;

    const feedbacks = await Feedback.find(filter)
      .populate("appointment_id", "appointment_date start_time status")
      .populate("customer_id", "name email")
      .populate("service_id", "service_name")
      .populate("staff_id", "full_name")
      .sort({ createdAt: -1 });

    res.status(200).json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

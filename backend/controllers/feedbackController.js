import Feedback from "../models/Feedback.js";
import Appointment from "../models/Appointment.js";
import AppointmentService from "../models/AppointmentService.js";
import Salon from "../models/Salon.js";
import Customer from "../models/Customer.js";
import Service from "../models/Service.js";
import Staff from "../models/Staff.js";
import Admin from "../models/Admin.js";

export const submitFeedback = async (req, res) => {
  try {
    const { appointment_id, serviceRating, staffRating, serviceRatings, staffRatings, comment } = req.body;

    if (!appointment_id) {
      return res.status(400).json({ message: "appointment_id is required." });
    }

    const ratingValues = [1, 2, 3, 4, 5];

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

    const appointmentServices = await AppointmentService.find({ appointment_id })
      .select("service_id staff_id")
      .lean();
    const serviceIds = [...new Set(
      appointmentServices.map((service) => service.service_id?.toString()).filter(Boolean)
    )];
    if (serviceIds.length === 0 && appointment.service_id) {
      serviceIds.push(appointment.service_id.toString());
    }

    const staffIds = [...new Set(
      appointmentServices.map((service) => service.staff_id?.toString()).filter(Boolean)
    )];
    if (staffIds.length === 0 && appointment.staff_id) {
      staffIds.push(appointment.staff_id.toString());
    }
    if (serviceIds.length === 0 || staffIds.length === 0) {
      return res.status(400).json({
        message: "Feedback requires at least one assigned service and staff member."
      });
    }

    const normalizeRatings = (ratings, validIds, fallbackRating, key) => {
      const source = Array.isArray(ratings) && ratings.length > 0
        ? ratings
        : validIds.map((id) => ({ [`${key}_id`]: id, rating: fallbackRating }));

      if (source.length !== validIds.length || source.some((entry) => (
        !validIds.includes(String(entry[`${key}_id`]))
        || !ratingValues.includes(Number(entry.rating))
      ))) {
        return null;
      }

      return source.map((entry) => ({
        [`${key}_id`]: entry[`${key}_id`],
        rating: Number(entry.rating)
      }));
    };

    const normalizedServiceRatings = normalizeRatings(
      serviceRatings,
      serviceIds,
      serviceRating,
      "service"
    );
    const normalizedStaffRatings = normalizeRatings(
      staffRatings,
      staffIds,
      staffRating,
      "staff"
    );

    if (!normalizedServiceRatings || !normalizedStaffRatings) {
      return res.status(400).json({
        message: "Provide a valid rating for every service and staff member in the appointment."
      });
    }

    const feedback = await Feedback.create({
      appointment_id,
      salon_id: appointment.salon_id,
      customer_id: appointment.customer_id,
      service_id: normalizedServiceRatings[0].service_id,
      staff_id: normalizedStaffRatings[0].staff_id,
      serviceRating: normalizedServiceRatings[0].rating,
      staffRating: normalizedStaffRatings[0].rating,
      serviceRatings: normalizedServiceRatings,
      staffRatings: normalizedStaffRatings,
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
      .populate("serviceRatings.service_id", "service_name")
      .populate("staffRatings.staff_id", "full_name")
      .sort({ createdAt: -1 });

    res.set("Cache-Control", "no-store");
    res.status(200).json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Public landing-page testimonials. Only real submitted comments are exposed.
export const getPublicFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ comment: { $exists: true, $ne: "" } })
      .populate("customer_id", "name image")
      .populate("salon_id", "name")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json(feedbacks.map((feedback) => {
      const ratings = [
        ...(feedback.serviceRatings?.map((entry) => entry.rating) || [feedback.serviceRating]),
        ...(feedback.staffRatings?.map((entry) => entry.rating) || [feedback.staffRating]),
      ].filter((rating) => Number.isFinite(rating));
      const rating = ratings.length
        ? Math.round(ratings.reduce((sum, value) => sum + value, 0) / ratings.length)
        : 0;

      return {
        id: feedback._id,
        name: feedback.customer_id?.name || "Customer",
        image: feedback.customer_id?.image || "",
        salon: feedback.salon_id?.name || "",
        text: feedback.comment,
        rating,
      };
    }));
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    const relationFilters = [];
    if (salon_id !== "all") {
      filter.salon_id = salon_id;
    }
    if (req.query.staffId) {
      relationFilters.push({
        $or: [
          { staff_id: req.query.staffId },
          { "staffRatings.staff_id": req.query.staffId }
        ]
      });
    }
    if (req.query.serviceId) {
      relationFilters.push({
        $or: [
          { service_id: req.query.serviceId },
          { "serviceRatings.service_id": req.query.serviceId }
        ]
      });
    }
    if (relationFilters.length > 0) filter.$and = relationFilters;

    const rawFeedbacks = await Feedback.find(filter)
      .populate("appointment_id", "appointment_date start_time status")
      .populate("service_id", "service_name")
      .populate("staff_id", "full_name")
      .populate("serviceRatings.service_id", "service_name")
      .populate("staffRatings.staff_id", "full_name")
      .sort({ createdAt: -1 })
      .lean();

    for (const f of rawFeedbacks) {
      if (f.customer_id) {
        let customer = await Customer.findById(f.customer_id, "name email phone").lean();
        if (!customer) {
          const admin = await Admin.findById(f.customer_id, "full_name email phone").lean();
          if (admin) {
            customer = {
              _id: admin._id,
              name: admin.full_name,
              email: admin.email,
              phone: admin.phone
            };
          }
        }
        f.customer_id = customer || null;
      }
    }

    res.set("Cache-Control", "no-store");
    res.status(200).json(rawFeedbacks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

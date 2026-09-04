import express from "express";
import Review from "../models/Review.js";
import Appointment from "../models/Appointment.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Get all reviews
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find().populate("appointment_id");
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add review
router.post("/", protect, requireRole(["customer"]), async (req, res) => {
  try {
    const { appointment_id, rating, comment } = req.body;
    const appointment = await Appointment.findOne({
      _id: appointment_id,
      customer_id: req.user.id,
      status: "completed",
    });
    if (!appointment) {
      return res.status(403).json({ message: "Only the customer of a completed appointment can review it" });
    }
    const review = await Review.create({ appointment_id: appointment._id, rating, comment, review_date: new Date() });
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

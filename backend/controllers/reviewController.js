import Review from "../models/Review.js";

export const createReview = async (req, res) => {
  const review = await Review.create(req.body);
  res.status(201).json(review);
};

export const getReviews = async (req, res) => {
  const reviews = await Review.find().populate("appointment_id");
  res.json(reviews);
};

export const deleteReview = async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  res.json({ message: "Review deleted" });
};
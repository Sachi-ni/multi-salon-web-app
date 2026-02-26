import express from "express";
import {
  createReview,
  getReviews,
  deleteReview
} from "../controllers/reviewController.js";

const router = express.Router();

router.post("/", createReview);
router.get("/", getReviews);
router.delete("/:id", deleteReview);

export default router;
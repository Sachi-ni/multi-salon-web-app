import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { submitFeedback, getMyFeedback, getSalonFeedback, getPublicFeedback } from "../controllers/feedbackController.js";

const router = express.Router();

router.post("/", protect, submitFeedback);
router.get("/public", getPublicFeedback);
router.get("/my", protect, getMyFeedback);
router.get("/salon", protect, authorizeRoles("super-admin", "manager"), getSalonFeedback);

export default router;

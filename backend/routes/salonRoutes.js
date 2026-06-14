import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {createSalon,getSalons,getSalonById,updateSalon,deleteSalon} from "../controllers/salonController.js";

const router = express.Router();

router.post("/", protect, authorizeRoles("super-admin"), createSalon);
router.get("/",getSalons);
router.get("/:id",getSalonById);
router.put("/:id",updateSalon);
router.delete("/:id",deleteSalon);

export default router;

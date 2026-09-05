import express from "express";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {createSalon,getSalons,getSalonById,updateSalon,deleteSalon,uploadSalonImages,removeSalonImage} from "../controllers/salonController.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Configure multer for simple disk storage (salon logos)
const upload = multer({ dest: "uploads/" });

router.post("/", protect, authorizeRoles("super-admin"), upload.single("logo"), createSalon);
router.get("/",getSalons);
router.get("/:id",getSalonById);
router.put("/:id", protect, requireRole(["super-admin"]), upload.single("logo"), updateSalon);
router.delete("/:id", protect, requireRole(["super-admin"]), deleteSalon);

// Salon gallery photo upload/removal (super-admin & manager)
router.post("/:id/images", protect, authorizeRoles("super-admin", "manager"), upload.array("images", 10), uploadSalonImages);
router.delete("/:id/images/:filename", protect, authorizeRoles("super-admin", "manager"), removeSalonImage);

export default router;

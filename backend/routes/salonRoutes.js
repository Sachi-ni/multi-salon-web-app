import express from "express";
import {createSalon,getSalons,getSalonById,updateSalon,deleteSalon} from "../controllers/salonController.js";

const router = express.Router();

router.post("/",createSalon);
router.get("/",getSalons);
router.get("/:id",getSalonById);
router.put("/:id",updateSalon);
router.delete("/:id",deleteSalon);

export default router;

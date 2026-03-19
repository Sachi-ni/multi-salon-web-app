import express from "express";
import {createSalon,getSalons} from "../controllers/salonController.js";

const router = express.Router();

router.post("/",createSalon);
router.get("/",getSalons);

export default router;
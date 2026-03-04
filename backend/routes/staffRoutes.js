import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
createStaff,
getStaff
} from "../controllers/staffController.js";

const router = express.Router();

router.post("/",protect,createStaff);
router.get("/",protect,getStaff);

export default router;
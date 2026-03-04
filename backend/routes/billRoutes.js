import express from "express";
import { createBill, getBills } from "../controllers/billController.js";

const router = express.Router();

router.post("/", createBill);
router.get("/", getBills);

export default router;

import express from "express";
import {
  createBill,
  getBills,
  deleteBill
} from "../controllers/billController.js";

const router = express.Router();

router.post("/", createBill);
router.get("/", getBills);
router.delete("/:id", deleteBill);

export default router;
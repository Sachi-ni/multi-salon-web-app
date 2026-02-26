import Bill from "../models/Bill.js";

export const createBill = async (req, res) => {
  const bill = await Bill.create(req.body);
  res.status(201).json(bill);
};

export const getBills = async (req, res) => {
  const bills = await Bill.find().populate("appointment_id");
  res.json(bills);
};

export const deleteBill = async (req, res) => {
  await Bill.findByIdAndDelete(req.params.id);
  res.json({ message: "Bill deleted" });
};
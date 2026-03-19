import Bill from "../models/Bill.js";

export const createBill = async (req, res) => {
   try {
      const bill = await Bill.create(req.body);
      res.status(201).json(bill);
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

export const getBills = async (req, res) => {
   try {
      const bills = await Bill.find().populate("appointment_id");
      res.json(bills);
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

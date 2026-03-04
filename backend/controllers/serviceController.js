import Service from "../models/Service.js";

export const createService = async (req, res) => {
   try {
      const service = await Service.create(req.body);
      res.status(201).json(service);
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

export const getServices = async (req, res) => {
   try {
      const services = await Service.find().populate("staff_id").populate("category_id");
      res.json(services);
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

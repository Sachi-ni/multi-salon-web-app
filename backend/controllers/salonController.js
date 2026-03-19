import Salon from "../models/Salon.js";

export const createSalon = async(req,res)=>{
   try {
      const salon = await Salon.create(req.body);
      res.status(201).json(salon);
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

export const getSalons = async(req,res)=>{
   try {
      const salons = await Salon.find();
      res.json(salons);
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};
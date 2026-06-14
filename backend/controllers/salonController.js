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

export const getSalonById = async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.id);

    if (!salon) {
      return res.status(404).json({
        message: "Salon not found"
      });
    }

    res.json(salon);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

export const updateSalon = async(req,res)=>{
   try {
      const salon = await Salon.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if(!salon) return res.status(404).json({ message: "Salon not found" });
      res.json(salon);
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

export const deleteSalon = async(req,res)=>{
   try {
      const salon = await Salon.findByIdAndDelete(req.params.id);
      if(!salon) return res.status(404).json({ message: "Salon not found" });
      res.json({ message: "Salon deleted successfully" });
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

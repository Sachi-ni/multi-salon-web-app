import Staff from "../models/Staff.js";

export const createStaff = async(req,res)=>{
   try{

      const staff = await Staff.create(req.body);

      res.status(201).json(staff);

   }catch(error){
      res.status(500).json({message:error.message});
   }
};

export const getStaff = async(req,res)=>{
   try {
      const staff = await Staff.find();
      res.json(staff);
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};
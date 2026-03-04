import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";

export const loginAdmin = async(req,res)=>{
   try{

      const {email,password} = req.body;

      const admin = await Admin.findOne({email});

      if(!admin){
         return res.status(400).json({message:"Admin not found"});
      }

      const isMatch = await bcrypt.compare(password,admin.password_hash);

      if(!isMatch){
         return res.status(400).json({message:"Invalid password"});
      }

      res.json({
         id:admin._id,
         name:admin.full_name,
         role:admin.role,
         token:generateToken(admin._id)
      });

   }catch(error){
      res.status(500).json({message:error.message});
   }
};
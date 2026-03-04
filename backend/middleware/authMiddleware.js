import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const protect = async(req,res,next)=>{

   let token;

   if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){

      try {
         token = req.headers.authorization.split(" ")[1];

         const decoded = jwt.verify(token,process.env.JWT_SECRET);

         req.user = await Admin.findById(decoded.id);

         next();
      } catch (error) {
         res.status(401).json({message:"Not authorized, token failed"});
      }

   }else{

      res.status(401).json({message:"Not authorized, no token"});

   }

};

export default protect;
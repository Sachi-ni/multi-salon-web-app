import bcrypt from "bcryptjs";
import Salon from "../models/Salon.js";
import Staff from "../models/Staff.js";

export const createSalon = async(req,res)=>{
   try {
         console.log("createSalon called with body:", req.body);
      const {
        name,
        phone,
        location,
        about,
        managerName,
        managerEmail,
        managerPhone,
        managerPassword
      } = req.body;

      if (!managerName || !managerEmail || !managerPassword) {
        return res.status(400).json({ message: "Manager name, email and password are required." });
      }

         const salon = await Salon.create({
            name,
            location,
            phone,
            about,
         });

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(managerPassword, salt);

      const manager = await Staff.create({
        full_name: managerName,
        email: managerEmail,
        phone: managerPhone,
        password_hash,
        role: "manager",
        status: "Active",
        salon_id: salon._id,
      });

      salon.staffCount = 1;
      await salon.save();

      res.status(201).json({ salon, manager });
   } catch (error) {
      console.error("createSalon error:", error);
      if (process.env.NODE_ENV !== "production") {
        res.status(500).json({ message: error.message, stack: error.stack });
      } else {
        res.status(500).json({ message: "Server error" });
      }
   }
};

export const getSalons = async(req,res)=>{
   try {
      const salons = await Salon.find();

      // attach manager name and calculate actual staffCount for each salon
      const salonsWithManagers = await Promise.all(salons.map(async (s) => {
        const manager = await Staff.findOne({ salon_id: s._id, role: "manager" }).select("full_name");
        
        // Count actual staff members in the database for this salon
        const actualStaffCount = await Staff.countDocuments({ salon_id: s._id });
        
        const obj = s.toObject();
        obj.managerName = manager ? manager.full_name : null;
        obj.staffCount = actualStaffCount; // Use actual count from database
        
        return obj;
      }));

      res.json(salonsWithManagers);
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

export const getSalonById = async(req,res)=>{
   try {
      const salon = await Salon.findById(req.params.id);
      if(!salon) return res.status(404).json({ message: "Salon not found" });
      
      // Count actual staff members for this salon
      const actualStaffCount = await Staff.countDocuments({ salon_id: salon._id });
      
      // Get manager info
      const manager = await Staff.findOne({ salon_id: salon._id, role: "manager" });

      const salonObj = salon.toObject();
      salonObj.staffCount = actualStaffCount;
      if (manager) {
        salonObj.managerName = manager.full_name;
        salonObj.managerEmail = manager.email;
        salonObj.managerPhone = manager.phone;
      }
      
      res.json(salonObj);
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

export const updateSalon = async(req,res)=>{
   try {
      const salon = await Salon.findById(req.params.id);
      if(!salon) return res.status(404).json({ message: "Salon not found" });

      const userRole = req.user?.role?.toLowerCase();
      const isManager = userRole === "manager";
      const isSuperAdmin = userRole === "super-admin";

      if (isManager) {
         if (req.user.salon_id?.toString() !== salon._id.toString()) {
            return res.status(403).json({ message: "Forbidden: cannot update another salon" });
         }

         if (req.body.about === undefined) {
            return res.status(400).json({ message: "Only salon vision may be updated." });
         }

         salon.about = req.body.about;
         await salon.save();

         const manager = await Staff.findOne({ salon_id: salon._id, role: "manager" });
         const salonObj = salon.toObject();
         if (manager) {
            salonObj.managerName = manager.full_name;
            salonObj.managerEmail = manager.email;
            salonObj.managerPhone = manager.phone;
         }

         return res.json(salonObj);
      }

      if (!isSuperAdmin) {
         return res.status(403).json({ message: "Forbidden: insufficient permissions" });
      }

      const { managerEmail, managerPassword, ...salonData } = req.body;
      const updatedSalon = await Salon.findByIdAndUpdate(req.params.id, salonData, { new: true });
      if(!updatedSalon) return res.status(404).json({ message: "Salon not found" });

      if (managerEmail || managerPassword) {
         const manager = await Staff.findOne({ salon_id: updatedSalon._id, role: "manager" });
         if (manager) {
            if (managerEmail) manager.email = managerEmail;
            if (managerPassword) {
               const salt = await bcrypt.genSalt(10);
               manager.password_hash = await bcrypt.hash(managerPassword, salt);
            }
            await manager.save();
         } else if (managerEmail && managerPassword) {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(managerPassword, salt);
            await Staff.create({
               full_name: updatedSalon.name + " Manager",
               email: managerEmail,
               phone: updatedSalon.phone || "",
               password_hash,
               role: "manager",
               status: "Active",
               salon_id: updatedSalon._id,
            });
         }
      }

      res.json(updatedSalon);
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

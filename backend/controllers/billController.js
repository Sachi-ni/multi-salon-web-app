import Bill from "../models/Bill.js";
import Appointment from "../models/Appointment.js";
import Salon from "../models/Salon.js";
import Admin from "../models/Admin.js";
import mongoose from "mongoose";

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

/**
 * GET /api/bills/daily-report?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Returns billing statistics + appointment list for the logged-in branch manager's salon.
 */
export const getDailyReport = async (req, res) => {
   try {
      // Use salon_id from JWT first; fall back to query param (for super-admins viewing a specific salon)
      const salonId = req.user.salon_id || req.query.salonId || (req.user.role === "super-admin" ? "all" : null);
      const { startDate, endDate } = req.query;

      if (!salonId) {
         return res.status(403).json({ message: "No salon associated with this account." });
      }

      // Build the match filter
      const matchFilter = {};
      
      if (salonId !== "all") {
         matchFilter.salon_id = new mongoose.Types.ObjectId(salonId);
      }

      if (startDate && endDate) {
         matchFilter.appointment_date = { $gte: startDate, $lte: endDate };
      }

      // Fetch all appointments for the period (all statuses for stats)
      const appointments = await Appointment.find(matchFilter)
         .populate("customer_id", "name phone email")
         .populate("staff_id", "full_name")
         .populate("service_id", "service_name base_price duration")
         .sort({ appointment_date: -1, start_time: -1 })
         .lean();

      // Calculate stats across all statuses
      let totalAppointments = appointments.length;
      let paidAppointments = 0;
      let pendingAppointments = 0;
      let totalRevenue = 0;

      appointments.forEach((a) => {
         if (a.status === "completed") {
            paidAppointments++;
            totalRevenue += a.total_price || 0;
         } else if (a.status === "pending") {
            pendingAppointments++;
         }
      });

      const averageBill = paidAppointments > 0
         ? parseFloat((totalRevenue / paidAppointments).toFixed(2))
         : 0;

      // Fetch salon info + branch manager info for PDF header
      let salonName = "All Salons";
      let branchLocation = "";
      let managerName = "Super Admin";

      if (salonId !== "all") {
         const salon = await Salon.findById(salonId).select("name location").lean();
         const admin = await Admin.findOne({ salon_id: salonId }).select("full_name").lean();
         if (salon) salonName = salon.name;
         if (salon) branchLocation = salon.location;
         if (admin) managerName = admin.full_name;
      }

      res.json({
         totalAppointments,
         paidAppointments,
         pendingAppointments,
         totalRevenue,
         averageBill,
         appointments,
         salonName,
         branchLocation,
         managerName,
      });
   } catch (error) {
      console.error("getDailyReport error:", error);
      res.status(500).json({ message: error.message });
   }
};

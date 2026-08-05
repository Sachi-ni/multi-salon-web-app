import Bill from "../models/Bill.js";
import Appointment from "../models/Appointment.js";
import AppointmentService from "../models/AppointmentService.js";
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
 * Returns billing statistics + appointment list for the logged-in branch manager's salon or super admin.
 */
export const getDailyReport = async (req, res) => {
   try {
      const salonId = req.user.salon_id || req.query.salonId || (req.user.role === "super-admin" ? "all" : null);
      const { startDate, endDate } = req.query;

      if (!salonId) {
         return res.status(403).json({ message: "No salon associated with this account." });
      }

      const matchFilter = {};
      
      if (salonId !== "all") {
         matchFilter.salon_id = new mongoose.Types.ObjectId(salonId);
      }

      if (startDate && endDate) {
         matchFilter.appointment_date = { $gte: startDate, $lte: endDate };
      }

      const appointments = await Appointment.find(matchFilter)
         .populate("customer_id", "name phone email")
         .populate("staff_id", "full_name")
         .populate("service_id", "service_name base_price duration")
         .populate("service_ids", "service_name base_price duration")
         .sort({ appointment_date: -1, start_time: -1 })
         .lean();

      // Populate multi-service details for each appointment & resolve accurate prices
      for (const a of appointments) {
         const apptServices = await AppointmentService.find({ appointment_id: a._id })
            .populate("service_id", "service_name base_price duration")
            .populate("staff_id", "full_name")
            .lean();

         a.appointment_services = apptServices;

         // Resolve real price of the appointment
         let resolvedPrice = a.total_price || 0;
         if (resolvedPrice === 0) {
            if (apptServices && apptServices.length > 0) {
               resolvedPrice = apptServices.reduce((sum, s) => sum + (s.sub_price || s.service_id?.base_price || 0), 0);
            } else if (a.service_ids && a.service_ids.length > 0) {
               resolvedPrice = a.service_ids.reduce((sum, s) => sum + (s.base_price || 0), 0);
            } else if (a.service_id?.base_price) {
               resolvedPrice = a.service_id.base_price;
            }
         }
         a.total_price = resolvedPrice;
      }

      let totalAppointments = appointments.length;
      let paidAppointments = 0;
      let confirmedAppointments = 0;
      let pendingAppointments = 0;
      let completedRevenue = 0;
      let confirmedRevenue = 0;

      appointments.forEach((a) => {
         const price = a.total_price || 0;
         if (a.status === "completed") {
            paidAppointments++;
            completedRevenue += price;
         } else if (a.status === "confirmed") {
            confirmedAppointments++;
            confirmedRevenue += price;
         } else if (a.status === "pending") {
            pendingAppointments++;
         }
      });

      const totalProjectedRevenue = completedRevenue + confirmedRevenue;
      // Show actual completed revenue if > 0, otherwise total projected revenue for visibility
      const totalRevenue = completedRevenue;

      const activeBillCount = paidAppointments > 0 ? paidAppointments : (paidAppointments + confirmedAppointments);
      const averageBill = paidAppointments > 0
         ? parseFloat((completedRevenue / paidAppointments).toFixed(2))
         : (confirmedAppointments > 0 ? parseFloat((confirmedRevenue / confirmedAppointments).toFixed(2)) : 0);

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
         confirmedAppointments,
         pendingAppointments,
         completedRevenue,
         confirmedRevenue,
         totalProjectedRevenue,
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

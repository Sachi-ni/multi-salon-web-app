import Bill from "../models/Bill.js";
import Appointment from "../models/Appointment.js";
import AppointmentService from "../models/AppointmentService.js";
import Salon from "../models/Salon.js";
import Admin from "../models/Admin.js";
import Customer from "../models/Customer.js";
import mongoose from "mongoose";
import nodemailer from "nodemailer";

export const createBill = async (req, res) => {
   try {
      const {
        appointment_id,
        payment_method = "cash",
        payment_status = "paid",
        discount = 0,
        tax = 0,
        notes = "",
        bill_date
      } = req.body;

      if (!appointment_id) {
         return res.status(400).json({ message: "appointment_id is required" });
      }

      const appointment = await Appointment.findById(appointment_id)
        .populate("customer_id", "name email phone")
        .populate("salon_id", "name location phone email")
        .populate("service_id", "service_name base_price duration")
        .populate("service_ids", "service_name base_price duration")
        .populate("staff_id", "full_name");

      if (!appointment) {
         return res.status(404).json({ message: "Appointment not found" });
      }

      // Check permissions
      const apptSalonId = appointment.salon_id?._id?.toString() || appointment.salon_id?.toString();
      const userSalonId = req.user.salon_id?.toString();

      if (req.user.role !== "super-admin" && apptSalonId !== userSalonId) {
         return res.status(403).json({ message: "Not authorized for this salon" });
      }

      // Check if bill already exists
      let existingBill = await Bill.findOne({ appointment_id: appointment._id });
      if (existingBill) {
        return res.status(200).json({
          message: "Bill already exists for this appointment",
          bill: existingBill
        });
      }

      // Populate appointment_services if available
      const apptServices = await AppointmentService.find({ appointment_id: appointment._id })
        .populate("service_id", "service_name base_price duration")
        .populate("staff_id", "full_name")
        .lean();

      // Resolve items
      const items = [];
      if (apptServices && apptServices.length > 0) {
        apptServices.forEach(as => {
          items.push({
            service_name: as.service_id?.service_name || "Salon Service",
            price: as.sub_price || as.service_id?.base_price || 0,
            duration: as.service_id?.duration || 0,
            staff_name: as.staff_id?.full_name || appointment.staff_id?.full_name || ""
          });
        });
      } else if (appointment.service_ids && appointment.service_ids.length > 0) {
        appointment.service_ids.forEach(s => {
          items.push({
            service_name: s.service_name || "Salon Service",
            price: s.base_price || 0,
            duration: s.duration || 0,
            staff_name: appointment.staff_id?.full_name || ""
          });
        });
      } else if (appointment.service_id) {
        items.push({
          service_name: appointment.service_id.service_name || "Salon Service",
          price: appointment.service_id.base_price || 0,
          duration: appointment.service_id.duration || 0,
          staff_name: appointment.staff_id?.full_name || ""
        });
      }

      const calculatedSubtotal = items.reduce((sum, it) => sum + (it.price || 0), 0);
      // The appointment is the authoritative source for what was charged.
      // Client totals are display values and must not be able to reduce a
      // bill below the completed appointment amount.
      const subtotal = appointment.total_price || calculatedSubtotal || 0;
      const discountNum = Math.max(0, Number(discount) || 0);
      const taxNum = Math.max(0, Number(tax) || 0);
      const total_amount = Math.max(0, Math.round(subtotal - discountNum + taxNum));

      // Generate invoice number e.g. INV-2609-8421
      const now = new Date();
      const yr = String(now.getFullYear()).slice(-2);
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const rand = Math.floor(1000 + Math.random() * 9000);
      const bill_number = `INV-${yr}${mo}-${rand}`;

      // Customer info
      let customerName = appointment.customer_id?.name || appointment.guest_name || "Guest Customer";
      let customerEmail = appointment.customer_id?.email || "";
      let customerPhone = appointment.customer_id?.phone || appointment.guest_phone || "";

      if (!customerEmail && appointment.customer_id) {
        const adminCust = await Admin.findById(appointment.customer_id).select("full_name email phone").lean();
        if (adminCust) {
          customerName = adminCust.full_name || customerName;
          customerEmail = adminCust.email || "";
          customerPhone = adminCust.phone || customerPhone;
        }
      }

      const bill = await Bill.create({
         appointment_id: appointment._id,
         bill_number,
         salon_id: appointment.salon_id?._id || appointment.salon_id,
         customer_name: customerName,
         customer_email: customerEmail,
         customer_phone: customerPhone,
         items: items.length > 0 ? items : [{
           service_name: "Completed Appointment Service",
           price: subtotal,
           duration: appointment.duration || 60,
           staff_name: appointment.staff_id?.full_name || ""
         }],
         subtotal,
         discount: discountNum,
         tax: taxNum,
         total_amount,
         payment_method,
         payment_status,
         notes,
         issued_by: req.user.full_name || req.user.username || (req.user.role === "super-admin" ? "Super Admin" : "Salon Manager"),
         issued_by_id: req.user._id,
         bill_date: bill_date ? new Date(bill_date) : new Date(),
         // Payout is an internal settlement state; issuing a bill does not
         // settle it, and clients cannot override it in this endpoint.
         payout_status: "pending",
         paid_out_at: null
      });

      // Send email receipt to customer if customer has an email
      if (customerEmail && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
            }
          });

          const salonName = appointment.salon_id?.name || "SalonHub";
          await transporter.sendMail({
            from: `"${salonName}" <${process.env.EMAIL_USER}>`,
            to: customerEmail,
            subject: `Receipt: ${bill.bill_number} - ${salonName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 12px; background: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <h2 style="color: #d97706; margin: 0; font-size: 24px;">${salonName}</h2>
                  <p style="color: #6b7280; font-size: 13px; margin-top: 4px;">Official Payment Receipt</p>
                </div>
                <div style="background: #fdfbf7; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: flex; justify-content: space-between;">
                  <div>
                    <span style="font-size: 12px; color: #92400e; font-weight: bold;">INVOICE NO:</span>
                    <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1f2937;">${bill.bill_number}</p>
                  </div>
                  <div>
                    <span style="font-size: 12px; color: #92400e; font-weight: bold;">DATE:</span>
                    <p style="margin: 0; font-size: 14px; color: #1f2937;">${new Date(bill.bill_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <p style="font-size: 14px; color: #374151;">Dear <strong>${customerName}</strong>,</p>
                <p style="font-size: 14px; color: #4b5563;">Thank you for your visit. Your payment has been received and verified.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <thead>
                    <tr style="background: #f9fafb; text-align: left; border-bottom: 2px solid #e5e7eb;">
                      <th style="padding: 10px; font-size: 12px; text-transform: uppercase; color: #6b7280;">Service</th>
                      <th style="padding: 10px; font-size: 12px; text-transform: uppercase; color: #6b7280; text-align: right;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${bill.items.map(it => `
                      <tr style="border-bottom: 1px solid #f3f4f6;">
                        <td style="padding: 10px; font-size: 13px; color: #1f2937;">
                          <strong>${it.service_name}</strong>
                          ${it.staff_name ? `<br/><span style="font-size: 11px; color: #9ca3af;">Stylist: ${it.staff_name}</span>` : ""}
                        </td>
                        <td style="padding: 10px; font-size: 13px; color: #1f2937; text-align: right; font-weight: bold;">
                          LKR ${Number(it.price || 0).toLocaleString()}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td style="padding: 8px 10px; color: #6b7280; font-size: 13px;">Subtotal:</td>
                      <td style="padding: 8px 10px; text-align: right; font-size: 13px; color: #374151;">LKR ${subtotal.toLocaleString()}</td>
                    </tr>
                    ${discountNum > 0 ? `
                      <tr>
                        <td style="padding: 8px 10px; color: #16a34a; font-size: 13px;">Discount:</td>
                        <td style="padding: 8px 10px; text-align: right; font-size: 13px; color: #16a34a;">- LKR ${discountNum.toLocaleString()}</td>
                      </tr>
                    ` : ''}
                    ${taxNum > 0 ? `
                      <tr>
                        <td style="padding: 8px 10px; color: #6b7280; font-size: 13px;">Tax:</td>
                        <td style="padding: 8px 10px; text-align: right; font-size: 13px; color: #374151;">+ LKR ${taxNum.toLocaleString()}</td>
                      </tr>
                    ` : ''}
                    <tr style="font-size: 15px; font-weight: bold; background: #fffbeb;">
                      <td style="padding: 12px 10px; border-top: 2px solid #f59e0b; color: #92400e;">Total Paid (${payment_method.toUpperCase()}):</td>
                      <td style="padding: 12px 10px; border-top: 2px solid #f59e0b; text-align: right; color: #b45309; font-size: 16px;">LKR ${total_amount.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>

                ${notes ? `<p style="font-size: 12px; color: #6b7280; font-style: italic; background: #f9fafb; padding: 8px 12px; border-radius: 6px;">Note: ${notes}</p>` : ""}

                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f3f4f6; color: #9ca3af; font-size: 12px;">
                  <p style="margin: 0;">Issued by ${bill.issued_by}</p>
                  <p style="margin: 4px 0 0;">Thank you for choosing ${salonName}!</p>
                </div>
              </div>
            `
          });
        } catch (mailErr) {
          console.warn("Bill email warning:", mailErr.message);
        }
      }

      res.status(201).json({
        message: "Bill generated successfully",
        ...bill.toObject(),
        bill
      });
   } catch (error) {
      console.error("createBill error:", error);
      res.status(500).json({ message: error.message });
   }
};

export const getBillByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const bill = await Bill.findOne({ appointment_id: appointmentId })
      .populate({
        path: "appointment_id",
        populate: [
          { path: "customer_id", select: "name email phone" },
          { path: "salon_id", select: "name location phone email address" },
          { path: "staff_id", select: "full_name specification image" },
          { path: "service_ids", select: "service_name base_price duration" },
          { path: "service_id", select: "service_name base_price duration" }
        ]
      })
      .populate("salon_id", "name location phone email address");

    if (!bill) {
      return res.status(404).json({ message: "No bill found for this appointment" });
    }

    // Authorization check
    if (req.user.role !== "super-admin") {
      const apptSalonId = bill.salon_id?._id?.toString() || bill.appointment_id?.salon_id?._id?.toString() || bill.salon_id?.toString();
      const userSalonId = req.user.salon_id?.toString();

      if (req.user.role === "manager" && apptSalonId !== userSalonId) {
        return res.status(403).json({ message: "Not authorized for this salon" });
      }
    }

    res.json(bill);
  } catch (error) {
    console.error("getBillByAppointment error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getBills = async (req, res) => {
   try {
      const filter = {};
      if (req.user.role !== "super-admin") {
        if (!req.user.salon_id) {
          return res.status(403).json({ message: "No salon associated with this account" });
        }
        filter.salon_id = req.user.salon_id;
      }
      const bills = await Bill.find(filter)
        .populate("appointment_id")
        .populate("salon_id", "name location")
        .sort({ createdAt: -1 });
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

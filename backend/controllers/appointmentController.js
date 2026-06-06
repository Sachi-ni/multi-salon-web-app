import Appointment from "../models/Appointment.js";
import StaffAvailability from "../models/StaffAvailability.js";
import Staff from "../models/Staff.js";
import Service from "../models/Service.js";
import Notification from "../models/Notification.js";
import Admin from "../models/Admin.js";
import mongoose from "mongoose";

// ─── Helper: add hours to a "HH:MM" string ──────────────────────────────────
const addHours = (timeStr, hours) => {
  const [h, m] = timeStr.split(":").map(Number);
  const totalMinutes = h * 60 + m + hours * 60;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
};

// ─── Helper: generate hourly slot start times between two times ──────────────
const generateSlotTimes = (startTime, endTime) => {
  const slots = [];
  let [h] = startTime.split(":").map(Number);
  const [endH] = endTime.split(":").map(Number);
  while (h < endH) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    h++;
  }
  return slots;
};

// ─── Helper: check if two time ranges overlap ───────────────────────────────
const timesOverlap = (s1, e1, s2, e2) => {
  return s1 < e2 && s2 < e1;
};

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOMER ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/appointments/available-staff
// Returns staff who can perform the service AND have free slots on that date
// Query: ?date=2026-07-01&serviceId=xxx&salonId=xxx
export const getAvailableStaff = async (req, res) => {
  try {
    const { date, serviceId, salonId } = req.query;

    if (!date || !serviceId || !salonId) {
      return res.status(400).json({ message: "date, serviceId and salonId are required" });
    }

    // Find active staff in this salon who can perform this service
    const staffList = await Staff.find({
      salon_id: salonId,
      services: serviceId,
      status: "Active"
    });

    if (!staffList.length) {
      return res.status(200).json([]);
    }

    const staffIds = staffList.map(s => s._id);

    // Normalize date range for query
    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Find availability records for those staff on that date
    const availabilityRecords = await StaffAvailability.find({
      staff_id: { $in: staffIds },
      available_date: { $gte: queryDate, $lt: nextDay }
    });

    // Build response — only staff with at least one free slot
    const result = availabilityRecords
      .filter(record => record.slots.some(slot => !slot.is_booked))
      .map(record => {
        const staff = staffList.find(s => s._id.equals(record.staff_id));
        return {
          staff_id:       staff._id,
          full_name:      staff.full_name,
          role:           staff.role,
          specification:  staff.specification,
          image:          staff.image,
          availabilityId: record._id,
          free_slots:     record.slots.filter(s => !s.is_booked)
        };
      });

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/appointments/available-slots
// Returns available start-time slots for a specific staff member on a date,
// considering the service duration and existing confirmed bookings.
// Query: ?staffId=xxx&date=2026-07-01&serviceId=xxx&salonId=xxx
export const getAvailableSlots = async (req, res) => {
  try {
    const { staffId, date, serviceId, salonId } = req.query;

    if (!staffId || !date || !serviceId) {
      return res.status(400).json({ message: "staffId, date, and serviceId are required" });
    }

    // 1. Get service duration
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    const requiredSlots = Math.ceil(service.duration / 60); // e.g. 120min = 2 slots

    // 2. Get staff availability for this date
    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const availability = await StaffAvailability.findOne({
      staff_id: staffId,
      available_date: { $gte: queryDate, $lt: nextDay }
    });

    if (!availability) {
      return res.status(200).json([]);
    }

    // 3. Get all confirmed/pending appointments for this staff on this date
    //    (We exclude slots occupied by confirmed appointments)
    const existingAppointments = await Appointment.find({
      staff_id: staffId,
      appointment_date: date,
      status: { $in: ["confirmed"] }
    });

    // 4. Build list of occupied time ranges from confirmed appointments
    const occupiedRanges = existingAppointments.map(a => ({
      start: a.start_time,
      end: a.end_time
    }));

    // 5. Filter available slots — not booked and not overlapping with confirmed appointments
    const freeSlots = availability.slots.filter(slot => {
      if (slot.is_booked) return false;

      // Check if this slot overlaps with any confirmed appointment
      for (const range of occupiedRanges) {
        if (timesOverlap(slot.start_time, slot.end_time, range.start, range.end)) {
          return false;
        }
      }
      return true;
    });

    // 6. For current date, remove past time slots
    const today = new Date().toISOString().split("T")[0];
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();
    const filteredSlots = date === today
      ? freeSlots.filter(slot => {
          const [slotH, slotM] = slot.start_time.split(":").map(Number);
          return slotH > currentHour || (slotH === currentHour && slotM > currentMinute);
        })
      : freeSlots;

    // 7. Sort slots by start_time
    filteredSlots.sort((a, b) => a.start_time.localeCompare(b.start_time));

    // 8. Find valid start times where N consecutive slots are available
    const validStartTimes = [];

    for (let i = 0; i <= filteredSlots.length - requiredSlots; i++) {
      let consecutive = true;

      for (let j = 0; j < requiredSlots - 1; j++) {
        const currentEnd = filteredSlots[i + j].end_time;
        const nextStart  = filteredSlots[i + j + 1].start_time;

        if (currentEnd !== nextStart) {
          consecutive = false;
          break;
        }
      }

      if (consecutive) {
        const startTime = filteredSlots[i].start_time;
        const endTime   = filteredSlots[i + requiredSlots - 1].end_time;

        validStartTimes.push({
          start_time: startTime,
          end_time: endTime,
          required_slots: requiredSlots,
          duration_hours: requiredSlots
        });
      }
    }

    res.status(200).json(validStartTimes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/appointments
// Customer creates a pending booking — does NOT mark slots
// Body: { salon_id, service_id, staff_id, appointment_date, start_time, notes }
export const createAppointment = async (req, res) => {
  try {
    const { salon_id, service_id, staff_id, appointment_date, start_time, notes } = req.body;
    let customer_id = req.user.id;
    if (req.user.role !== "customer" && req.user.role !== "user" && req.body.customer_id) {
      customer_id = req.body.customer_id;
    }

    if (!salon_id || !service_id || !staff_id || !appointment_date || !start_time) {
      return res.status(400).json({
        message: "salon_id, service_id, staff_id, appointment_date, and start_time are required"
      });
    }

    // Get service to calculate end_time and price
    const service = await Service.findById(service_id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const durationHours = Math.ceil(service.duration / 60);
    const end_time = addHours(start_time, durationHours);

    const appointment = await Appointment.create({
      customer_id,
      salon_id,
      service_id,
      staff_id,
      appointment_date,
      start_time,
      end_time,
      duration: service.duration,
      total_price: service.base_price,
      notes: notes || "",
      status: "pending"
    });

    // Populate for response
    const populated = await Appointment.findById(appointment._id)
      .populate("salon_id", "name location")
      .populate("service_id", "service_name base_price duration")
      .populate("staff_id", "full_name specification image")
      .populate("customer_id", "name email phone");

    // NOTIFICATION: Notify super-admins and staff-admins of this salon
    try {
      const adminsToNotify = await Admin.find({
        $or: [
          { role: "super-admin" },
          { role: "staff-admin", salon_id: salon_id }
        ]
      });
      const notifications = adminsToNotify.map(admin => ({
        recipient_id: admin._id,
        recipient_model: "Admin",
        title: "New Booking Received",
        message: `A new booking was made by ${populated.customer_id?.name} for ${populated.service_id?.service_name}.`,
        appointment_id: appointment._id
      }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.error("Failed to send admin notifications:", notifErr);
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/appointments/my
// Customer views their own appointments
export const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ customer_id: req.user.id })
      .populate("salon_id", "name location")
      .populate("service_id", "service_name base_price duration description")
      .populate("staff_id", "full_name specification image")
      .sort({ createdAt: -1 });

    res.status(200).json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/appointments/:id/cancel
// Customer cancels their own pending appointment
export const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Verify ownership
    if (appointment.customer_id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to cancel this appointment" });
    }

    // Can only cancel pending appointments
    if (appointment.status !== "pending") {
      return res.status(400).json({
        message: `Cannot cancel an appointment with status: ${appointment.status}. Only pending appointments can be cancelled by customers.`
      });
    }

    appointment.status = "cancelled";
    appointment.cancelled_at = new Date();
    await appointment.save();

    res.status(200).json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/appointments
// Admin — view appointments for their salon, optionally filter by status
// Query: ?salonId=xxx&status=pending
export const getSalonAppointments = async (req, res) => {
  try {
    const { status } = req.query;

    const salon_id = req.user.role === "super-admin"
      ? req.query.salonId || null
      : req.user.salon_id;

    if (req.user.role !== "super-admin" && !salon_id) {
      return res.status(400).json({ message: "salonId is required" });
    }

    const filter = {};
    if (salon_id && salon_id !== "all") {
      filter.salon_id = salon_id;
    }
    if (status) filter.status = status;

    console.log("=== GET SALON APPOINTMENTS DEBUG ===");
    console.log("req.query:", req.query);
    console.log("req.user.role:", req.user.role);
    console.log("req.user.salon_id:", req.user.salon_id);
    console.log("computed salon_id:", salon_id);
    console.log("filter object:", filter);

    const rawAppointments = await Appointment.find(filter)
      .populate("service_id", "service_name base_price duration description")
      .populate("staff_id", "full_name specification image role")
      .populate("salon_id", "name location")
      .sort({ appointment_date: 1, start_time: 1 })
      .lean();

    // Manually populate customer_id to fallback to Admin collection if user registered via admin auth
    for (const appt of rawAppointments) {
      if (appt.customer_id) {
        // Try fetching from Customer first
        let customer = await mongoose.model("Customer").findById(appt.customer_id, "name email phone").lean();
        if (!customer) {
          // Fallback to Admin collection if not found
          const admin = await mongoose.model("Admin").findById(appt.customer_id, "full_name email phone").lean();
          if (admin) {
             customer = {
               _id: admin._id,
               name: admin.full_name,
               email: admin.email,
               phone: admin.phone
             };
          }
        }
        appt.customer_id = customer || null;
      }
    }

    res.status(200).json(rawAppointments);
  } catch (err) {
    res.status(500).json({ message: err.message, stack: err.stack, query: req.query });
  }
};

// PATCH /api/appointments/:id/confirm
// Admin — confirms a pending appointment with conflict detection + slot reservation
export const confirmAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status !== "pending") {
      return res.status(400).json({
        message: `Cannot confirm an appointment with status: ${appointment.status}`
      });
    }

    // 1. Calculate required slots
    const requiredSlots = Math.ceil(appointment.duration / 60);
    const slotStartTimes = generateSlotTimes(appointment.start_time, appointment.end_time);

    // 2. Get staff availability for the date
    const queryDate = new Date(appointment.appointment_date);
    queryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const availability = await StaffAvailability.findOne({
      staff_id: appointment.staff_id,
      available_date: { $gte: queryDate, $lt: nextDay }
    });

    if (!availability) {
      return res.status(409).json({
        message: "Unable to confirm. Staff has no availability record for this date."
      });
    }

    // 3. Verify each required slot is available (not booked)
    for (const startTime of slotStartTimes) {
      const slot = availability.slots.find(s => s.start_time === startTime);
      if (!slot) {
        return res.status(409).json({
          message: `Unable to confirm. Required time slot ${startTime} does not exist in staff availability.`
        });
      }
      if (slot.is_booked) {
        return res.status(409).json({
          message: "Unable to confirm. Required consecutive time slots are no longer available."
        });
      }
    }

    // 4. Check for overlapping confirmed appointments
    const overlapping = await Appointment.findOne({
      _id: { $ne: appointment._id },
      staff_id: appointment.staff_id,
      appointment_date: appointment.appointment_date,
      status: "confirmed",
      $or: [
        {
          start_time: { $lt: appointment.end_time },
          end_time: { $gt: appointment.start_time }
        }
      ]
    });

    if (overlapping) {
      return res.status(409).json({
        message: "Unable to confirm. Required consecutive time slots are no longer available."
      });
    }

    // 5. All checks passed — mark slots as booked
    for (const startTime of slotStartTimes) {
      await StaffAvailability.updateOne(
        {
          staff_id: appointment.staff_id,
          available_date: { $gte: queryDate, $lt: nextDay },
          "slots.start_time": startTime
        },
        { $set: { "slots.$.is_booked": true } }
      );
    }

    // 6. Update appointment status
    appointment.status = "confirmed";
    appointment.confirmed_at = new Date();
    await appointment.save();

    // NOTIFICATION: Notify the customer
    try {
      await Notification.create({
        recipient_id: appointment.customer_id,
        recipient_model: "Customer",
        title: "Booking Confirmed",
        message: `Your booking for ${appointment.appointment_date} at ${appointment.start_time} has been confirmed.`,
        appointment_id: appointment._id
      });
    } catch (notifErr) {
      console.error("Failed to send customer notification:", notifErr);
    }

    // 7. Return populated appointment
    const populated = await Appointment.findById(appointment._id)
      .populate("customer_id", "name email phone")
      .populate("service_id", "service_name base_price duration")
      .populate("staff_id", "full_name specification image")
      .populate("salon_id", "name location");

    res.status(200).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/appointments/:id/duration
// Admin — change the duration of a pending appointment
export const updateAppointmentDuration = async (req, res) => {
  try {
    const { duration } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status !== "pending") {
      return res.status(400).json({ message: "Only pending appointments can be modified." });
    }

    if (!duration || duration < 60 || duration % 60 !== 0) {
      return res.status(400).json({ message: "Duration must be a multiple of 60 minutes." });
    }

    const durationHours = duration / 60;
    const newEndTime = addHours(appointment.start_time, durationHours);

    appointment.duration = duration;
    appointment.end_time = newEndTime;
    await appointment.save();

    res.status(200).json({ message: "Duration updated successfully", appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/appointments/:id/reject
// Admin — rejects a pending appointment
export const rejectAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status !== "pending") {
      return res.status(400).json({
        message: `Cannot reject an appointment with status: ${appointment.status}`
      });
    }

    appointment.status = "rejected";
    appointment.rejected_at = new Date();
    await appointment.save();

    // NOTIFICATION: Notify the customer
    try {
      await Notification.create({
        recipient_id: appointment.customer_id,
        recipient_model: "Customer",
        title: "Booking Rejected",
        message: `Your booking for ${appointment.appointment_date} at ${appointment.start_time} has been rejected by the salon.`,
        appointment_id: appointment._id
      });
    } catch (notifErr) {
      console.error("Failed to send customer notification:", notifErr);
    }

    res.status(200).json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/appointments/:id/complete
// Admin — marks a confirmed appointment as completed
export const completeAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status !== "confirmed") {
      return res.status(400).json({
        message: `Cannot complete an appointment with status: ${appointment.status}. Only confirmed appointments can be completed.`
      });
    }

    appointment.status = "completed";
    await appointment.save();

    // NOTIFICATION: Notify the customer
    try {
      await Notification.create({
        recipient_id: appointment.customer_id,
        recipient_model: "Customer",
        title: "Appointment Completed",
        message: `Your appointment for ${appointment.appointment_date} at ${appointment.start_time} has been marked as completed. Thank you for visiting!`,
        appointment_id: appointment._id
      });
    } catch (notifErr) {
      console.error("Failed to send customer notification:", notifErr);
    }

    res.status(200).json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/appointments/:id/admin-cancel
// Admin — cancels a confirmed appointment and frees up the slots
export const adminCancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status !== "confirmed") {
      return res.status(400).json({
        message: `Cannot cancel an appointment with status: ${appointment.status}. Only confirmed appointments can be cancelled.`
      });
    }

    // Free up the booked slots in StaffAvailability
    const slotStartTimes = generateSlotTimes(appointment.start_time, appointment.end_time);
    const queryDate = new Date(appointment.appointment_date);
    queryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1);

    for (const startTime of slotStartTimes) {
      await StaffAvailability.updateOne(
        {
          staff_id: appointment.staff_id,
          available_date: { $gte: queryDate, $lt: nextDay },
          "slots.start_time": startTime
        },
        { $set: { "slots.$.is_booked": false } }
      );
    }

    appointment.status = "cancelled";
    appointment.cancelled_at = new Date();
    await appointment.save();

    // NOTIFICATION: Notify the customer
    try {
      await Notification.create({
        recipient_id: appointment.customer_id,
        recipient_model: "Customer",
        title: "Booking Cancelled",
        message: `Your confirmed booking for ${appointment.appointment_date} at ${appointment.start_time} has been cancelled by the salon.`,
        appointment_id: appointment._id
      });
    } catch (notifErr) {
      console.error("Failed to send customer notification:", notifErr);
    }

    res.status(200).json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/appointments/staff/:staffId
// Admin/Staff — view appointments for a specific staff member
export const getStaffAppointments = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { status, date } = req.query;

    const filter = { staff_id: staffId };
    if (status) filter.status = status;
    if (date) filter.appointment_date = date;

    const appointments = await Appointment.find(filter)
      .populate("customer_id", "name email phone")
      .populate("service_id", "service_name base_price duration")
      .populate("staff_id", "full_name specification image")
      .populate("salon_id", "name location")
      .sort({ appointment_date: 1, start_time: 1 });

    res.status(200).json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/appointments/daily-schedule
// Admin — view all appointments for a salon on a specific date
// Query: ?salonId=xxx&date=2026-07-01
export const getDailySchedule = async (req, res) => {
  try {
    const { date } = req.query;

    const salon_id = req.user.role === "super-admin"
      ? req.query.salonId || null
      : req.user.salon_id;

    if (!salon_id || !date) {
      return res.status(400).json({ message: "salonId and date are required" });
    }

    const appointments = await Appointment.find({
      salon_id,
      appointment_date: date,
      status: { $in: ["confirmed", "completed"] }
    })
      .populate("customer_id", "name email phone")
      .populate("service_id", "service_name base_price duration")
      .populate("staff_id", "full_name specification image")
      .sort({ start_time: 1 });

    // Group by staff
    const grouped = {};
    for (const apt of appointments) {
      const staffId = apt.staff_id?._id?.toString() || "unknown";
      if (!grouped[staffId]) {
        grouped[staffId] = {
          staff: apt.staff_id,
          appointments: []
        };
      }
      grouped[staffId].appointments.push(apt);
    }

    res.status(200).json({
      date,
      salon_id,
      schedule: Object.values(grouped)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
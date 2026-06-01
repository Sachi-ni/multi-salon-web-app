import Appointment from "../models/Appointment.js";
import StaffAvailability from "../models/StaffAvailability.js";
import Staff from "../models/Staff.js";
import Service from "../models/Service.js";

// GET /api/appointments/available-staff?date=2026-06-10&serviceId=xxx&salonId=xxx
// Returns staff who can perform the service AND have free slots on that date
export const getAvailableStaff = async (req, res) => {
  try {
    const { date, serviceId, salonId } = req.query;

    if (!date || !serviceId || !salonId) {
      return res.status(400).json({ message: "date, serviceId and salonId are required" });
    }

    // Normalize date range for query
    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1);

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

// POST /api/appointments
// Body: { salon_id, date, services: [{ service_id, staff_id, slot: { start_time, end_time }, availabilityId }], notes }
export const createAppointment = async (req, res) => {
  try {
    const { salon_id, date, services, notes } = req.body;
    const customer_id = req.user.id; // from JWT middleware

    if (!salon_id || !date || !services?.length) {
      return res.status(400).json({ message: "salon_id, date and services are required" });
    }

    // Calculate total price from service base prices
    const serviceIds = services.map(s => s.service_id);
    const serviceRecords = await Service.find({ _id: { $in: serviceIds } });
    const total_price = serviceRecords.reduce((sum, s) => sum + s.base_price, 0);

    // Create the appointment
    const appointment = await Appointment.create({
      customer_id,
      salon_id,
      date,
      services: services.map(s => ({
        service_id: s.service_id,
        staff_id:   s.staff_id,
        slot: {
          start_time: s.slot.start_time,
          end_time:   s.slot.end_time
        }
      })),
      total_price,
      notes,
      status: "pending"
    });

    // Mark the booked slots as is_booked: true in StaffAvailability
    for (const s of services) {
      await StaffAvailability.updateOne(
        { _id: s.availabilityId, "slots.start_time": s.slot.start_time },
        { $set: { "slots.$.is_booked": true } }
      );
    }

    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/appointments?salonId=xxx&status=pending
// Admin — view appointments for their salon, optionally filter by status
export const getSalonAppointments = async (req, res) => {
  try {
    const { status } = req.query;

    // super-admin can pass salonId as query param to filter
    // staff-admin always gets their own salon only
    const salon_id = req.user.role === "super-admin"
      ? req.query.salonId || null
      : req.user.salon_id;

    if (!salon_id) {
      return res.status(400).json({ message: "salonId is required" });
    }

    const filter = { salon_id };
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .populate("customer_id", "name email phone")
      .populate("services.service_id", "service_name base_price duration")
      .populate("services.staff_id", "full_name specification image")
      .sort({ date: 1 });

    res.status(200).json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// PATCH /api/appointments/:id/status
// Admin — confirm, cancel or complete an appointment
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "confirmed", "cancelled", "completed"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate("customer_id", "full_name email")
      .populate("services.service_id", "service_name")
      .populate("services.staff_id", "full_name");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // If cancelled — free up the booked slots
    if (status === "cancelled") {
      for (const s of appointment.services) {
        const queryDate = new Date(appointment.date);
        queryDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(queryDate);
        nextDay.setDate(nextDay.getDate() + 1);

        await StaffAvailability.updateOne(
          {
            staff_id: s.staff_id,
            available_date: { $gte: queryDate, $lt: nextDay },
            "slots.start_time": s.slot.start_time
          },
          { $set: { "slots.$.is_booked": false } }
        );
      }
    }

    res.status(200).json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/appointments/my — Customer views their own appointments
export const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ customer_id: req.user.id })
      .populate("salon_id", "name address")
      .populate("services.service_id", "service_name base_price duration")
      .populate("services.staff_id", "full_name image")
      .sort({ date: -1 });

    res.status(200).json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
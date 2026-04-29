import Service from "../models/Service.js";
import Staff from "../models/Staff.js";
import Appointment from "../models/Appointment.js";

/* =========================
   GET AVAILABILITY
========================= */
export const getAvailability = async (req, res) => {
  try {
    const { salon_id, service_id, date } = req.body;
    
    console.log("HEADERS:", req.headers["content-type"]);
    console.log("BODY RECEIVED:", req.body);

    if (!salon_id || !service_id || !date) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const service = await Service.findById(service_id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const duration = service.duration;

    const staffList = await Staff.find({});
    console.log("DB STAFF COUNT:", staffList.length);
    console.log("DB STAFF:", staffList);
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const result = [];

    for (const staff of staffList) {
      const slots = generateSlots(
        staff.workingHours?.start || "09:00",
        staff.workingHours?.end || "18:00",
        duration
      );

      const appointments = await Appointment.find({
        staff_id: staff._id,
        appointment_date: { $gte: start, $lte: end },
        status: { $ne: "cancelled" }
      });

      const availableSlots = slots.filter(slot =>
        isSlotFree(slot, duration, appointments)
      );

      result.push({
        staff_id: staff._id,
        staff_name: staff.full_name,
        slots: availableSlots
      });
    }

    res.json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   BOOK APPOINTMENT
========================= */
export const bookAppointment = async (req, res) => {
  try {
    const {
      salon_id,
      service_id,
      staff_id,
      date,
      start_time,
      customer_id
    } = req.body;

    if (!salon_id || !service_id || !staff_id || !date || !start_time) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const service = await Service.findById(service_id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const duration = service.duration;

    const startMinutes = timeToMinutes(start_time);
    const end_time = minutesToTime(startMinutes + duration);

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const existing = await Appointment.findOne({
      staff_id,
      appointment_date: { $gte: start, $lte: end },
      status: { $ne: "cancelled" },
      $or: [
        {
          start_time: { $lt: end_time },
          end_time: { $gt: start_time }
        }
      ]
    });

    if (existing) {
      return res.status(409).json({ message: "Slot already booked" });
    }

    const appointment = new Appointment({
      customer_id,
      salon_id,
      staff_id,
      service_id,
      appointment_date: new Date(date),
      start_time,
      end_time,
      status: "booked"
    });

    await appointment.save();

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   HELPERS
========================= */
function generateSlots(start, end, duration) {
  const slots = [];
  let current = timeToMinutes(start);
  const endTime = timeToMinutes(end);

  while (current + duration <= endTime) {
    slots.push(minutesToTime(current));
    current += duration;
  }

  return slots;
}

function isSlotFree(slotStart, duration, appointments) {
  const slotStartMin = timeToMinutes(slotStart);
  const slotEndMin = slotStartMin + duration;

  return !appointments.some(app => {
    const appStart = timeToMinutes(app.start_time);
    const appEnd = timeToMinutes(app.end_time);

    return slotStartMin < appEnd && slotEndMin > appStart;
  });
}

function timeToMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}
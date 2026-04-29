import Appointment from "../models/Appointment.js";
import Service from "../models/Service.js";

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

    // 1. Validate input
    if (!salon_id || !service_id || !staff_id || !date || !start_time) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // 2. Get service
    const service = await Service.findById(service_id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const duration = service.duration;

    // 3. Calculate end time
    const startMinutes = timeToMinutes(start_time);
    const end_time = minutesToTime(startMinutes + duration);

    // 4. Normalize date (important for matching)
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    // 5. Check conflict (overlap check)
    const conflict = await Appointment.findOne({
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

    if (conflict) {
      return res.status(409).json({
        message: "Slot already booked"
      });
    }

    // 6. Create appointment
    const appointment = new Appointment({
      customer_id: customer_id || null,
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

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate booking prevented"
      });
    }

    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   GET APPOINTMENTS
========================= */
export const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("customer_id")
      .populate("salon_id")
      .populate("staff_id")
      .populate("service_id");

    res.json(appointments);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   HELPERS
========================= */
function timeToMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}
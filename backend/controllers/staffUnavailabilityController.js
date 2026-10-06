import StaffUnavailability from "../models/StaffUnavailability.js";
import Staff from "../models/Staff.js";
import Appointment from "../models/Appointment.js";
import AppointmentService from "../models/AppointmentService.js";

const canAccessStaff = (req, staff) =>
  req.user.role === "super-admin" || String(staff.salon_id) === String(req.user.salon_id);

const overlapQuery = (start, end) => ({
  start_date_time: { $lt: end },
  end_date_time: { $gt: start },
});

export const createStaffUnavailability = async (req, res) => {
  try {
    const { staff_id, start_date_time, end_date_time, reason = "" } = req.body;
    const start = new Date(start_date_time);
    const end = new Date(end_date_time);
    if (!staff_id || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
      return res.status(400).json({ message: "staff_id and a valid start/end range are required" });
    }
    const staff = await Staff.findById(staff_id).select("salon_id full_name");
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    if (!canAccessStaff(req, staff)) return res.status(403).json({ message: "Not authorized" });

    const record = await StaffUnavailability.create({
      staff_id,
      start_date_time: start,
      end_date_time: end,
      reason: String(reason).trim(),
      created_by: req.user.id,
      created_by_model: req.user.role === "staff-admin" ? "Staff" : "Admin",
    });

    const appointments = await Appointment.find({
      $or: [{ staff_id }, { _id: { $in: await AppointmentService.find({ staff_id }).distinct("appointment_id") } }],
      status: { $in: ["pending", "confirmed"] },
    }).select("_id appointment_date start_time end_time").lean();
    const affected = appointments.filter((appointment) => {
      const appointmentStart = new Date(`${appointment.appointment_date}T${appointment.start_time}:00`);
      const appointmentEnd = new Date(`${appointment.appointment_date}T${appointment.end_time}:00`);
      return appointmentStart < end && appointmentEnd > start;
    }).map((appointment) => appointment._id);

    res.status(201).json({ unavailability: record, affectedAppointmentIds: affected });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const listStaffUnavailability = async (req, res) => {
  try {
    const { staffId, salonId, start, end } = req.query;
    const staffFilter = {};
    if (staffId) staffFilter.staff_id = staffId;
    if (req.user.role === "super-admin" && salonId) {
      const staffIds = await Staff.find({ salon_id: salonId }).distinct("_id");
      staffFilter.staff_id = { $in: staffIds };
    } else if (req.user.role !== "super-admin") {
      staffFilter.staff_id = { $in: await Staff.find({ salon_id: req.user.salon_id }).distinct("_id") };
    }
    if (start && end) Object.assign(staffFilter, overlapQuery(new Date(start), new Date(end)));
    const records = await StaffUnavailability.find(staffFilter)
      .populate("staff_id", "full_name salon_id")
      .sort({ start_date_time: 1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteStaffUnavailability = async (req, res) => {
  try {
    const record = await StaffUnavailability.findById(req.params.id).populate("staff_id", "salon_id");
    if (!record) return res.status(404).json({ message: "Unavailability record not found" });
    if (!canAccessStaff(req, record.staff_id)) return res.status(403).json({ message: "Not authorized" });
    await record.deleteOne();
    res.json({ message: "Unavailability removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAffectedAppointments = async (req, res) => {
  try {
    const records = await StaffUnavailability.find({ staff_id: req.params.staffId }).lean();
    const ids = await AppointmentService.find({ staff_id: req.params.staffId }).distinct("appointment_id");
    const appointments = await Appointment.find({
      $or: [{ staff_id: req.params.staffId }, { _id: { $in: ids } }],
      status: { $in: ["pending", "confirmed"] },
    }).populate("customer_id", "name email phone").lean();
    const affected = appointments.filter((appointment) => records.some((record) => {
      const appointmentStart = new Date(`${appointment.appointment_date}T${appointment.start_time}:00`);
      const appointmentEnd = new Date(`${appointment.appointment_date}T${appointment.end_time}:00`);
      return appointmentStart < new Date(record.end_date_time) && appointmentEnd > new Date(record.start_date_time);
    }));
    res.json(affected);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

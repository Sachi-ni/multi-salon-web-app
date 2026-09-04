import StaffAvailability from "../models/StaffAvailability.js";
import Staff from "../models/Staff.js";

// ADMIN — Set availability for a staff member on a date
// POST /api/availability
export const setAvailability = async (req, res) => {
  try {
    const { staff_id, available_date, slots } = req.body;

    if (!staff_id || !available_date || !slots?.length) {
      return res.status(400).json({ message: "staff_id, available_date and slots are required" });
    }

    // Verify staff belongs to admin's salon
    const staff = await Staff.findById(staff_id);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    if (
      req.user.role !== "super-admin" &&
      staff.salon_id.toString() !== req.user.salon_id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized to manage this staff member" });
    }

    // Upsert — if record exists for that staff + date, replace slots
    const availability = await StaffAvailability.findOneAndUpdate(
      {
        staff_id,
        available_date: new Date(available_date)
      },
      {
        staff_id,
        available_date: new Date(available_date),
        slots: slots.map(s => ({
          start_time: s.start_time,
          end_time:   s.end_time,
          is_booked:  false // always reset to false when admin sets availability
        }))
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Availability saved", availability });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ADMIN — Get all availability records for a specific staff member
// GET /api/availability/staff/:staffId
export const getStaffAvailability = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Managers can only view their own salon's staff
    if (
      req.user.role !== "super-admin" &&
      staff.salon_id.toString() !== req.user.salon_id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const records = await StaffAvailability.find({ staff_id: req.params.staffId })
      .sort({ available_date: 1 });

    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ADMIN — Get all availability for all staff in a salon on a specific date
// GET /api/availability/salon?salonId=xxx&date=2026-06-10
export const getSalonAvailability = async (req, res) => {
  try {
    const { salonId, date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "date is required" });
    }

    // scope salonId based on role
    const targetSalonId = req.user.role === "super-admin"
      ? salonId
      : req.user.salon_id;

    if (!targetSalonId) {
      return res.status(400).json({ message: "salonId is required" });
    }

    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get all staff in the salon
    const staffList = await Staff.find({ salon_id: targetSalonId, status: "Active" });
    const staffIds  = staffList.map(s => s._id);

    // Get availability records for those staff on that date
    const records = await StaffAvailability.find({
      staff_id:       { $in: staffIds },
      available_date: { $gte: queryDate, $lt: nextDay }
    }).populate("staff_id", "full_name specification image");

    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ADMIN — Delete availability record for a staff member on a date
// DELETE /api/availability/:id
export const deleteAvailability = async (req, res) => {
  try {
    const record = await StaffAvailability.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Availability record not found" });
    }

    // Prevent deleting if any slot is already booked
    const hasBookedSlot = record.slots.some(s => s.is_booked);
    if (hasBookedSlot) {
      return res.status(400).json({
        message: "Cannot delete availability with already booked slots"
      });
    }

    await StaffAvailability.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Availability deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ADMIN — Add or remove individual slots from an existing availability record
// PATCH /api/availability/:id/slots
export const updateSlots = async (req, res) => {
  try {
    const { slots } = req.body;

    const record = await StaffAvailability.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Availability record not found" });
    }

    // Only update slots that aren't already booked
    const updatedSlots = slots.map(s => {
      const existing = record.slots.find(es => es.start_time === s.start_time);
      return {
        start_time: s.start_time,
        end_time:   s.end_time,
        is_booked:  existing?.is_booked || false // preserve booked status
      };
    });

    record.slots = updatedSlots;
    await record.save();

    res.status(200).json({ message: "Slots updated", record });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
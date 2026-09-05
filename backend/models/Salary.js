import mongoose from "mongoose";

const dailySalarySchema = new mongoose.Schema({
  date: { type: String, required: true }, // "2026-07-24"
  
  // Working amount from completed appointments for this day
  workingAmount: { type: Number, default: 0 },

  // Rate % (from staff's commission_rate)
  rate: { type: Number, default: 0 },

  // Work Rate = workingAmount * rate
  workRate: { type: Number, default: 0 },

  // Day Salary - calculated based on daily rules
  daySalary: { type: Number, default: 0 },

  // Total Salary accumulated (used for weekly/monthly rollup)
  totalSalary: { type: Number, default: 0 },

  // Status for daily
  status: {
    type: String,
    default: "Not Paid",
    enum: ["Paid", "Not Paid"],
  },

  paidAt: { type: Date, default: null },

  // Manually marked absent by a manager/admin. Absent days earn no salary:
  // daySalary is forced to 0 regardless of the salary-per-day amount.
  isAbsent: { type: Boolean, default: false },

  // When the absence was marked (audit information).
  absentMarkedAt: { type: Date, default: null },
});

const salarySchema = new mongoose.Schema(
  {
    salon_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salon",
      required: true,
      index: true,
    },
    staff_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
      index: true,
    },

    // Frequency: daily, weekly, monthly
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      required: true,
      default: "monthly",
    },

    // Period identifier
    // For daily: "2026-07-24"
    // For weekly: "2026-W30" (ISO week)
    // For monthly: "2026-07"
    period: {
      type: String,
      required: true,
      index: true,
    },

    // Staff snapshot data
    staff_name: { type: String, default: "" },
    staff_role: { type: String, default: "" },
    commission_rate: { type: Number, default: 0 },
    salary_payment_count_per_day: { type: Number, default: 1 },

    // Working amount accumulated from completed appointments this period
    workingAmount: { type: Number, default: 0 },

    // Rate % (from staff's commission_rate)
    rate: { type: Number, default: 0 },

    // Work Rate = workingAmount * rate
    workRate: { type: Number, default: 0 },

    // Day Salary - for daily records (calculated)
    daySalary: { type: Number, default: 0 },

    // Total Salary - calculated based on frequency rules
    totalSalary: { type: Number, default: 0 },

    // Total Salary at the time of payment (preserved for historical reporting)
    paidTotal: { type: Number, default: 0 },

    // Status
    status: {
      type: String,
      default: "Not Paid",
      enum: ["Paid", "Not Paid"],
    },

    paidAt: { type: Date, default: null },

    // Manually marked absent (daily frequency records represent one day).
    // Absent days earn no salary: daySalary is forced to 0.
    isAbsent: { type: Boolean, default: false },
    absentMarkedAt: { type: Date, default: null },

    // Array of daily records for weekly/monthly aggregation
    dailyRecords: [dailySalarySchema],

    // Dates covered (for weekly/monthly this stores which days are included)
    dateRange: {
      start: { type: String, default: "" },
      end: { type: String, default: "" },
    },

    // For weekly: store week number
    weekNumber: { type: Number, default: 0 },
    year: { type: Number, default: 0 },
    month: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// One record per staff per period per frequency per salon
salarySchema.index(
  { salon_id: 1, staff_id: 1, period: 1, frequency: 1 },
  { unique: true }
);

export default mongoose.model("Salary", salarySchema);
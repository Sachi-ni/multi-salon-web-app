import mongoose from "mongoose";

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

    // Month represented as YYYY-MM string (e.g. 2026-06)
    month: {
      type: String,
      required: true,
      index: true,
    },

    // Services snapshot used to compute basicSalary for this month
    servicesSnapshot: [
      {
        service_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Service",
        },
        service_name: String,
        base_price: Number,
      },
    ],

    basicSalary: {
      type: Number,
      default: 0,
    },

    // Work hours used to calculate monthly payout
    workHours: {
      type: Number,
      default: 1,
    },

    // Monthly commission amount (admin editable)
    commission: {
      type: Number,
      default: 0,
    },

    totalSalary: {
      type: Number,
      default: 0,
    },

    // Paid status for this month
    status: {
      type: String,
      default: "Not Paid",
      enum: ["Paid", "Not Paid"],
      index: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// One record per staff per month per salon
salarySchema.index({ salon_id: 1, staff_id: 1, month: 1 }, { unique: true });

export default mongoose.model("Salary", salarySchema);


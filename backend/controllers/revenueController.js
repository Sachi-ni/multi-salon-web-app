import Bill from '../models/Bill.js';
import Appointment from '../models/Appointment.js';
import Salon from '../models/Salon.js';
import Salary from '../models/Salary.js';

export const getRevenueStats = async (req, res) => {
  try {
    const { period = "30days" } = req.query;
    const now = new Date();

    let start, prevStart, prevEnd;
    if (period === "year") {
      start = new Date(now.getFullYear(), 0, 1); // Jan 1 this year
      prevStart = new Date(now.getFullYear() - 1, 0, 1); // Jan 1 last year
      prevEnd = start;
    } else {
      start = new Date();
      start.setDate(start.getDate() - 30);
      prevStart = new Date();
      prevStart.setDate(prevStart.getDate() - 60);
      prevEnd = start;
    }

    // Gross revenue for the selected period
    const recentBills = await Bill.aggregate([
      { $match: { bill_date: { $gte: start } } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } }
    ]);
    const grossRevenue = recentBills[0]?.total || 0;

    // Same-length previous period, for growth comparison
    const prevBills = await Bill.aggregate([
      { $match: { bill_date: { $gte: prevStart, $lt: prevEnd } } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } }
    ]);
    const prevRevenue = prevBills[0]?.total || 0;
    const grossGrowth = prevRevenue > 0 ? ((grossRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : 0;

    // Pending payouts & overdue (not period-dependent — these are always "current outstanding")
    const pendingBills = await Bill.aggregate([
      { $match: { payout_status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$total_amount' }, count: { $sum: 1 } } }
    ]);
    const pendingPayouts = pendingBills[0]?.total || 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const pendingOverdue = await Bill.countDocuments({
      payout_status: 'pending',
      bill_date: { $lte: sevenDaysAgo }
    });

    res.json({
      grossRevenue,
      grossGrowth: parseFloat(grossGrowth),
      pendingPayouts,
      pendingOverdue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSalonRevenue = async (req, res) => {
  try {
    const { period = "30days" } = req.query;
    const now = new Date();
    let start;
    if (period === "year") {
      start = new Date(now.getFullYear(), 0, 1);
    } else {
      start = new Date();
      start.setDate(start.getDate() - 30);
    }

    const salonsData = await Bill.aggregate([
      { $match: { bill_date: { $gte: start } } },
      {
        $lookup: {
          from: 'appointments',
          localField: 'appointment_id',
          foreignField: '_id',
          as: 'appointment'
        }
      },
      { $unwind: '$appointment' },
      {
        $lookup: {
          from: 'salons',
          localField: 'appointment.salon_id',
          foreignField: '_id',
          as: 'salon'
        }
      },
      { $unwind: '$salon' },
      {
        $group: {
          _id: '$salon._id',
          name: { $first: '$salon.name' },
          status: { $first: '$salon.status' },
          revenue: { $sum: '$total_amount' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.json(salonsData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMonthlyRevenue = async (req, res) => {
  try {
    const monthly = await Bill.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$bill_date' },
            month: { $month: '$bill_date' }
          },
          total: { $sum: '$total_amount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // Simplified: total last month, growth (mock), top month
    const total = monthly[0]?.total || 0;
    const growth = 15; // Calculate properly if more data
    const topMonth = monthly.reduce((prev, curr) => (curr.total > prev.total ? curr : prev), monthly[0]);
    const topMonthName = new Date(topMonth._id.year, topMonth._id.month - 1).toLocaleString('default', { month: 'long' });

    res.json({ total, growth, topMonth: topMonthName });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

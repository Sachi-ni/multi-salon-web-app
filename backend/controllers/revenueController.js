import Bill from '../models/Bill.js';
import Appointment from '../models/Appointment.js';
import Salon from '../models/Salon.js';
import Salary from '../models/Salary.js';

export const getRevenueStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Gross revenue last 30 days
    const recentBills = await Bill.aggregate([
      { $match: { bill_date: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } }
    ]);
    const grossRevenue = recentBills[0]?.total || 0;

    // Previous 30 days for growth
    const prevBills = await Bill.aggregate([
      { $match: { bill_date: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } }
    ]);
    const prevRevenue = prevBills[0]?.total || 0;
    const grossGrowth = prevRevenue > 0 ? ((grossRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : 0;

    // Pending payouts & overdue
    const salaries = await Salary.aggregate([
      { $match: { status: 'pending' } }
    ]);
    const pendingPayouts = salaries.reduce((sum, s) => sum + s.amount, 0);
    const now = new Date();
    const pendingOverdue = salaries.filter(s => new Date(s.due_date) < now).length;

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
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salonsData = await Bill.aggregate([
      { $match: { bill_date: { $gte: thirtyDaysAgo } } },
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
      {
        $lookup: {
          from: 'salons',
          localField: '_id',
          foreignField: '_id',
          as: 'salon'
        }
      },
      { $unwind: { path: '$salon', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ['$name', '$salon.name'] },
          status: { $ifNull: ['$status', 'Inactive'] },
          revenue: { $ifNull: ['$revenue', 0] },
          transactions: { $ifNull: ['$transactions', 0] },
          avg: {
            $cond: {
              if: { $gt: ['$transactions', 0] },
              then: { $divide: ['$revenue', '$transactions'] },
              else: 0
            }
          }
        }
      }
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

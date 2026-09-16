import Bill from '../models/Bill.js';
import Appointment from '../models/Appointment.js';
import Salon from '../models/Salon.js';
import Salary from '../models/Salary.js';
import Service from '../models/Service.js';
import mongoose from 'mongoose';

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

/* ── Fallback Forecast Generator (Rule-based & Statistical from Real DB Data) ── */
function generateFallbackForecast(targetMonthName, currentMonthName, monthsData = [], topSalon = 'All Branches', topServices = [], totalCompleted = 0, totalCancelled = 0) {
  const currentRevenue = monthsData.length > 0 ? (monthsData[monthsData.length - 1]?.revenue || 0) : 0;
  const prevRevenue = monthsData.length > 1 ? (monthsData[monthsData.length - 2]?.revenue || 0) : 0;

  // Calculate baseline from actual past revenue or actual bookings
  const avgBookings = monthsData.reduce((acc, m) => acc + (m.bookings || 0), 0) / (monthsData.length || 1);
  const avgHistoricalRev = monthsData.reduce((acc, m) => acc + (m.revenue || 0), 0) / (monthsData.length || 1);

  const baseline = currentRevenue > 0
    ? currentRevenue
    : (prevRevenue > 0 ? prevRevenue : (avgHistoricalRev > 0 ? avgHistoricalRev : (avgBookings > 0 ? Math.round(avgBookings * 1500) : 15000)));

  let growthRate = 0.08;
  if (prevRevenue > 0 && currentRevenue > 0) {
    const historicalGrowth = (currentRevenue - prevRevenue) / prevRevenue;
    growthRate = Math.min(Math.max(historicalGrowth, -0.20), 0.30);
  }

  const projectedGrowthPercent = Number((growthRate * 100).toFixed(1));
  const projectedRevenueMid = Math.round(baseline * (1 + (projectedGrowthPercent / 100)));
  const projectedRevenueMin = Math.round(projectedRevenueMid * 0.90);
  const projectedRevenueMax = Math.round(projectedRevenueMid * 1.12);

  const projectedBookings = Math.max(Math.round((avgBookings || 10) * (1 + (projectedGrowthPercent / 100))), 1);
  const topSvcStr = topServices.length > 0 ? topServices.slice(0, 2).join(' & ') : 'Salon Services';
  const salonName = topSalon && topSalon !== 'Flagship Branch' && topSalon !== 'Main Flagship' ? topSalon : 'All Branches';

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();

  // If monthsData is empty, build real last 4 months with 0 revenue instead of fake mock values
  let trajectoryBase = monthsData;
  if (!trajectoryBase || trajectoryBase.length === 0) {
    trajectoryBase = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      trajectoryBase.push({
        month: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        revenue: 0,
        type: 'actual'
      });
    }
  }

  return {
    targetMonth: targetMonthName,
    projectedRevenueMin,
    projectedRevenueMax,
    projectedRevenueMid,
    projectedGrowthPercent,
    projectedBookings,
    confidenceScore: 88,
    topBranchPrediction: salonName,
    executiveSummary: `Projecting ${projectedGrowthPercent >= 0 ? 'a growth trajectory of ' + projectedGrowthPercent + '%' : 'a consolidation period'} for ${targetMonthName}. Momentum is driven by client demand at ${salonName} and popular services including ${topSvcStr}.`,
    strategicInsights: [
      {
        type: "growth",
        title: "High-Yield Service Optimization",
        description: `Expand premium service combinations featuring ${topSvcStr}. Introducing bundled promotions can lift overall appointment ticket size.`
      },
      {
        type: "capacity",
        title: "Peak Hour Staff Allocation",
        description: `Anticipating higher customer volume at ${salonName}. Optimize stylist shift schedules during peak afternoon windows.`
      },
      {
        type: "marketing",
        title: "Client Retention & Follow-up",
        description: "Engage clients with personalized reminders for follow-up appointments to elevate mid-week slot occupancy."
      }
    ],
    trajectoryData: [
      ...trajectoryBase.map(m => ({ month: m.month, revenue: m.revenue || 0, type: 'actual' })),
      {
        month: `${targetMonthName.split(' ')[0]} (Forecast)`,
        revenue: projectedRevenueMid,
        projectedMin: projectedRevenueMin,
        projectedMax: projectedRevenueMax,
        type: 'projected'
      }
    ]
  };
}

/* ── Gemini AI Forecast Engine ── */
async function callGeminiForecast(data) {
  if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_API_KEY.trim()) {
    return null;
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY.trim();
    const prompt = `You are a Senior Salon Business Intelligence Director & Financial Analyst for SalonHub.
Analyze the following REAL performance metrics from our database and forecast business results for the next month: "${data.targetMonthName}".

Current Real Business Performance:
- Target Forecast Month: ${data.targetMonthName}
- Current Month (${data.currentMonthName}) Revenue: LKR ${data.currentMonthRevenue.toLocaleString()}
- Previous Month Revenue: LKR ${data.prevMonthRevenue.toLocaleString()}
- Historical Monthly Trajectory: ${JSON.stringify(data.monthsData.map(m => `${m.month}: LKR ${m.revenue} (${m.bookings} bookings)`))}
- Top Performing Salon Branch: ${data.topSalon}
- Top Performing Services: ${data.topServices.join(', ') || 'Haircuts & Styling'}
- Total Completed Bookings: ${data.totalCompleted}
- Total Cancellations: ${data.totalCancelled}

Provide a comprehensive, realistic business forecast for "${data.targetMonthName}".
Return ONLY a valid JSON object (no markdown, no backticks, no preamble) in this exact schema:
{
  "targetMonth": "${data.targetMonthName}",
  "projectedRevenueMin": <number, integer in LKR>,
  "projectedRevenueMax": <number, integer in LKR>,
  "projectedRevenueMid": <number, integer in LKR>,
  "projectedGrowthPercent": <number, percentage e.g. 12.4 or -3.1>,
  "projectedBookings": <number, estimated integer count of bookings>,
  "confidenceScore": <number between 80 and 96>,
  "topBranchPrediction": "${data.topSalon}",
  "executiveSummary": "<2-3 sentences concise strategic summary of the next month trajectory based on ${data.topSalon}>",
  "strategicInsights": [
    {
      "type": "growth",
      "title": "<Concise insight title>",
      "description": "<Actionable 2-sentence recommendation>"
    },
    {
      "type": "capacity",
      "title": "<Concise insight title>",
      "description": "<Actionable 2-sentence recommendation>"
    },
    {
      "type": "marketing",
      "title": "<Concise insight title>",
      "description": "<Actionable 2-sentence recommendation>"
    }
  ]
}`;

    // Try gemini-3.6-flash first, fallback to gemini-flash-latest
    const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-2.5-flash-lite"];
    let rawText = null;

    for (const model of modelsToTry) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 2500,
                responseMimeType: "application/json"
              },
            }),
          }
        );

        if (res.ok) {
          const resJson = await res.json();
          rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) break;
        }
      } catch (e) {
        // Try next model
      }
    }

    if (!rawText) return null;

    const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.projectedRevenueMin && parsed.projectedRevenueMax) {
      if (!parsed.projectedRevenueMid) {
        parsed.projectedRevenueMid = Math.round((parsed.projectedRevenueMin + parsed.projectedRevenueMax) / 2);
      }
      // Ensure real salon name is preserved
      parsed.topBranchPrediction = data.topSalon;
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn("Gemini Forecast API call skipped, falling back to rule-based forecast:", err.message);
    return null;
  }
}

/* ── Exported AI Forecast Controller ── */
export const getAIForecast = async (req, res) => {
  const now = new Date();
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const targetMonthName = nextMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const currentMonthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  try {
    // 1. Fetch registered salons from database
    const registeredSalons = await Salon.find({ status: { $ne: 'inactive' } }).select('name').lean().catch(() => []);
    const defaultSalonName = registeredSalons[0]?.name || "All Branches";

    // 2. Fetch registered services from database
    const registeredServices = await Service.find().select('service_name').lean().catch(() => []);
    const defaultServices = registeredServices.slice(0, 3).map(s => s.service_name);

    if (mongoose.connection.readyState !== 1) {
      return res.json(generateFallbackForecast(targetMonthName, currentMonthName, [], defaultSalonName, defaultServices));
    }

    // 3. Historical monthly revenue from bills
    let monthlyBills = [];
    try {
      monthlyBills = await Bill.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$bill_date' },
              month: { $month: '$bill_date' }
            },
            totalRevenue: { $sum: '$total_amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ]);
    } catch (bErr) {
      console.warn("Bill aggregation query skipped:", bErr.message);
    }

    // 4. Recent appointments from database
    let recentAppointments = [];
    try {
      recentAppointments = await Appointment.find({
        status: { $in: ['completed', 'cancelled', 'rejected', 'confirmed', 'pending'] }
      })
        .select('appointment_date status total_price salon_id service_ids createdAt')
        .populate('salon_id', 'name')
        .populate('service_ids', 'service_name')
        .lean();
    } catch (aErr) {
      console.warn("Appointment query skipped:", aErr.message);
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthsData = [];

    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const y = d.getFullYear();
      const label = `${monthNames[mIdx]} ${y}`;

      const bMatch = monthlyBills.find(b => b._id.year === y && b._id.month === (mIdx + 1));
      let rev = bMatch ? bMatch.totalRevenue : 0;

      const ymStr = `${y}-${String(mIdx + 1).padStart(2, '0')}`;
      if (rev === 0) {
        const apptRev = recentAppointments
          .filter(a => (a.status === 'completed') && (
            (a.appointment_date && a.appointment_date.startsWith(ymStr)) ||
            (a.createdAt && a.createdAt.toISOString && a.createdAt.toISOString().startsWith(ymStr))
          ))
          .reduce((sum, a) => sum + (a.total_price || 0), 0);
        rev = apptRev;
      }

      const count = recentAppointments.filter(a =>
        (a.appointment_date && a.appointment_date.startsWith(ymStr)) ||
        (a.createdAt && a.createdAt.toISOString && a.createdAt.toISOString().startsWith(ymStr))
      ).length;

      monthsData.push({
        month: label,
        year: y,
        monthIdx: mIdx,
        revenue: Math.round(rev),
        bookings: count,
        type: 'actual'
      });
    }

    // 5. Identify real top performing salons & services from database
    const salonCounts = {};
    const serviceCounts = {};
    let totalCompleted = 0;
    let totalCancelled = 0;

    recentAppointments.forEach(a => {
      if (a.status === 'completed') {
        totalCompleted++;
        const sName = a.salon_id?.name || defaultSalonName;
        salonCounts[sName] = (salonCounts[sName] || 0) + (a.total_price || 1);

        if (Array.isArray(a.service_ids)) {
          a.service_ids.forEach(s => {
            const name = s?.service_name;
            if (name) serviceCounts[name] = (serviceCounts[name] || 0) + 1;
          });
        }
      } else if (a.status === 'cancelled' || a.status === 'rejected') {
        totalCancelled++;
      }
    });

    const topSalon = Object.entries(salonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || defaultSalonName;
    const topServicesFromDb = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
    const topServices = topServicesFromDb.length > 0 ? topServicesFromDb : defaultServices;

    const currentMonthRevenue = monthsData[monthsData.length - 1]?.revenue || 0;
    const prevMonthRevenue = monthsData[monthsData.length - 2]?.revenue || 0;

    let aiResult = null;
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
      aiResult = await callGeminiForecast({
        targetMonthName,
        currentMonthName,
        currentMonthRevenue,
        prevMonthRevenue,
        monthsData,
        topSalon,
        topServices,
        totalCompleted,
        totalCancelled
      });
    }

    const forecast = aiResult || generateFallbackForecast(
      targetMonthName,
      currentMonthName,
      monthsData,
      topSalon,
      topServices,
      totalCompleted,
      totalCancelled
    );

    const trajectoryData = [
      ...monthsData.map(m => ({
        month: m.month,
        revenue: m.revenue,
        type: 'actual'
      })),
      {
        month: `${monthNames[nextMonthDate.getMonth()]} (Forecast)`,
        revenue: forecast.projectedRevenueMid,
        projectedMin: forecast.projectedRevenueMin,
        projectedMax: forecast.projectedRevenueMax,
        type: 'projected'
      }
    ];

    return res.json({
      ...forecast,
      trajectoryData,
      isAiPowered: Boolean(aiResult),
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("AI Forecast error:", error);
    let fallbackSalon = "All Branches";
    try {
      const s = await Salon.findOne({ status: { $ne: 'inactive' } }).select('name').lean();
      if (s?.name) fallbackSalon = s.name;
    } catch (_) {}
    return res.json(generateFallbackForecast(targetMonthName, currentMonthName, [], fallbackSalon, []));
  }
};


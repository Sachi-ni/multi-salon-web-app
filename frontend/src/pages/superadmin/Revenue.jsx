import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Revenue = () => {
  const navigate = useNavigate();
  const [isBlurred, setIsBlurred] = useState(true);
  const [grossRevenue, setGrossRevenue] = useState(120000);
  const [pendingPayouts, setPendingPayouts] = useState(6300);
  const [monthlyRevenue, setMonthlyRevenue] = useState({ total: 150000, growth: 15, topMonth: 'December' });
  const [salons, setSalons] = useState([
    { name: 'Salon A', revenue: 25000, transactions: 120, avg: 208, status: 'Active' },
    { name: 'Salon B', revenue: 30000, transactions: 150, avg: 200, status: 'Active' },
    { name: 'Salon C', revenue: 20000, transactions: 100, avg: 200, status: 'Inactive' }
  ]);

  // Simulate automatic updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate data updates
      setGrossRevenue(prev => prev + Math.floor(Math.random() * 1000));
      setPendingPayouts(prev => Math.max(0, prev + Math.floor(Math.random() * 500 - 250)));
      setMonthlyRevenue(prev => ({
        ...prev,
        total: prev.total + Math.floor(Math.random() * 2000 - 1000),
        growth: Math.max(0, prev.growth + Math.floor(Math.random() * 5 - 2))
      }));
      setSalons(prev => prev.map(salon => ({
        ...salon,
        revenue: salon.revenue + Math.floor(Math.random() * 1000 - 500),
        transactions: salon.transactions + Math.floor(Math.random() * 10 - 5)
      })));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const doExport = () => {
    console.log("Export clicked");
  };

  const nav = (page) => {
    navigate(`/${page}`);
  };

  const toast = (msg) => {
    console.log(msg);
  };

  const handleMonthlyClick = () => {
    const password = prompt("Enter confirmation password:");
    if (password === "superadmin") {
      setIsBlurred(false);
    } else {
      alert("Try again");
    }
  };

  return (
    <div className="page" id="pg-revenue" style={{ color: 'white', backgroundColor: 'black', padding: '20px', minHeight: '100vh' }}>

      {/* Header */}
      <div className="ph">
        <div className="ph-left">

          <button
            className="back-btn"
            onClick={() => nav("Dashboard")}
            title="Back to Dashboard"
          >
            ←
          </button>

          <div>
            <h1>Revenue</h1>
            <p>Financial overview across all salons</p>
          </div>
        </div>

        <div className="pactions">
          <button className="btn btn-g sm" onClick={doExport}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Top Cards */}
      <div className="rev-top">

        <div className="rev-card">
          <div className="ri">💰</div>
          <div className="rl">Gross Revenue</div>
          <div className="rv" id="rev-gross">Rs. {grossRevenue.toLocaleString()}</div>
          <div className="rc up">↑ 12.4%</div>
        </div>

        <div className="rev-card">
          <div className="ri">⏳</div>
          <div className="rl">Pending Payouts</div>
          <div className="rv">Rs. {pendingPayouts.toLocaleString()}</div>
          <div className="rs">3 overdue</div>
        </div>

        <div className="period-grp">
          <button
            className="period-btn"
            onClick={() => toast("Last 30 days selected")}
          >
            Last 30 days ▼
          </button>

          <button
            className="period-btn"
            onClick={() => toast("This year selected")}
          >
            This Year ▼
          </button>
        </div>

      </div>

      {/* Monthly Revenue Section */}
      <div 
        className="monthly-revenue" 
        style={{ 
          filter: isBlurred ? 'blur(5px)' : 'none', 
          cursor: isBlurred ? 'pointer' : 'default',
          margin: '20px 0',
          padding: '20px',
          border: '1px solid #333',
          borderRadius: '8px'
        }} 
        onClick={isBlurred ? handleMonthlyClick : undefined}
      >
        <h3>Monthly Revenue Details</h3>
        <p>Total Monthly Revenue: Rs. {monthlyRevenue.total.toLocaleString()}</p>
        <p>Growth: +{monthlyRevenue.growth}%</p>
        <p>Top Performing Month: {monthlyRevenue.topMonth}</p>
      </div>

      {/* Table Header */}
      <div className="rev-tbl-hdr">
        <h3>Revenue by Salon</h3>
        <button className="sort-btn">
          Sorted by revenue ▼
        </button>
      </div>

      {/* Table */}
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Salon</th>
              <th>Revenue</th>
              <th>Transactions</th>
              <th>Avg Value</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>

          <tbody id="revtb">
            {salons.map((salon, index) => (
              <tr key={index}>
                <td>{salon.name}</td>
                <td>Rs. {salon.revenue.toLocaleString()}</td>
                <td>{salon.transactions}</td>
                <td>Rs. {salon.avg}</td>
                <td>{salon.status}</td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn btn-g sm">View</button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

    </div>
  );
};

export default Revenue;
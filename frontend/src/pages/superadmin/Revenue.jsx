import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Revenue = () => {
  const navigate = useNavigate(); // Now used in the back-btn
  const [isBlurred, setIsBlurred] = useState(true);
  const [grossRevenue, setGrossRevenue] = useState(120000);
  
  // Removed 'set' functions since we are using static dummy data for these
  const [pendingPayouts] = useState(6300);
  const [salons] = useState([
    { name: 'Salon A', revenue: 25000, transactions: 120, status: 'Active' },
    { name: 'Salon B', revenue: 30000, transactions: 150, status: 'Active' },
    { name: 'Salon C', revenue: 20000, transactions: 100, status: 'Inactive' }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setGrossRevenue(prev => prev + Math.floor(Math.random() * 500));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleMonthlyClick = () => {
    const password = prompt("Enter confirmation password:");
    if (password === "superadmin") setIsBlurred(false);
    else alert("Try again");
  };

  return (
    <div id="pg-revenue" style={{ padding: "20px" }}>
      
      {/* Header */}
      <div className="ph" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          {/* USES NAVIGATE HERE */}
          <button 
            className="btn btn-g sm" 
            onClick={() => navigate("/Dashboard")}
            style={{ cursor: "pointer" }}
          >
            ← Back
          </button>
          <div>
            <h1 style={{ color: "white", margin: 0 }}>Revenue</h1>
          </div>
        </div>
        <button className="btn btn-g sm" onClick={() => console.log("Exporting...")}>
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <div className="card" style={{ flex: 1, padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--muted2)" }}>Gross Revenue</div>
          <h2 style={{ color: "#FFD700", margin: "10px 0" }}>Rs. {grossRevenue.toLocaleString()}</h2>
        </div>
        <div className="card" style={{ flex: 1, padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--muted2)" }}>Pending Payouts</div>
          <h2 style={{ color: "white", margin: "10px 0" }}>Rs. {pendingPayouts.toLocaleString()}</h2>
        </div>
      </div>

      {/* Blurred Section */}
      <div 
        className="card" 
        style={{ 
          padding: "20px", 
          marginBottom: "20px", 
          filter: isBlurred ? "blur(6px)" : "none",
          cursor: isBlurred ? "pointer" : "default"
        }}
        onClick={isBlurred ? handleMonthlyClick : undefined}
      >
        <h3 style={{ color: "white" }}>Monthly Revenue Details</h3>
        <p style={{ color: "var(--muted2)" }}>Click to unlock super-admin financial data</p>
      </div>

      {/* Table */}
      <div className="card" style={{ background: "#0c0c0c", borderRadius: "10px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead style={{ background: "#1a1a1a", color: "#666", fontSize: "0.8rem" }}>
            <tr>
              <th style={{ padding: "15px" }}>Salon</th>
              <th>Revenue</th>
              <th>Status</th>
              <th style={{ textAlign: "right", paddingRight: "15px" }}>Action</th>
            </tr>
          </thead>
          <tbody style={{ color: "white" }}>
            {salons.map((salon, index) => (
              <tr key={index} style={{ borderBottom: "1px solid #222" }}>
                <td style={{ padding: "15px" }}>{salon.name}</td>
                <td style={{ color: "#FFD700" }}>Rs. {salon.revenue.toLocaleString()}</td>
                <td>{salon.status}</td>
                <td style={{ textAlign: "right", paddingRight: "15px" }}>
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
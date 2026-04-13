import React from "react";

const Analytics = () => {
  const metricCards = [
    { label: "Total Booking", value: "3,847", change: "+ 18.2%", color: "#00e676" },
    { label: "Gross Revenue", value: "$427K", change: "+ 9.8%", color: "#00e676" },
    { label: "Avg Booking Value", value: "$36.90", change: "+ 4.1%", color: "#00e676" },
    { label: "Client Retention", value: "78%", change: "+ 1.2%", color: "#00e676" },
  ];

  const topSalons = [
    { name: "Kathura", percentage: 75, color: "#9c27b0" },
    { name: "Liyo", percentage: 45, color: "#00bcd4" },
    { name: "89", percentage: 35, color: "#ff5722" },
  ];

  const services = [
    { name: "Haircut", percentage: 35, color: "#9c27b0" },
    { name: "Hair Color", percentage: 25, color: "#00bcd4" },
    { name: "Highlights", percentage: 18, color: "#4caf50" },
    { name: "Blowout", percentage: 12, color: "#ffeb3b" },
    { name: "Other", percentage: 10, color: "#f44336" },
  ];

  return (
    <div id="pg-analytics" style={{ padding: "20px", color: "white" }}>
      <div className="ph" style={{ marginBottom: "25px" }}>
        <h1 style={{ margin: 0 }}>Analytics</h1>
        <p style={{ color: "var(--muted2)", fontSize: "0.9rem" }}>Platform-wide performance insights</p>
      </div>

      {/* Top Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "30px" }}>
        {metricCards.map((card, idx) => (
          <div key={idx} style={{ backgroundColor: "#FFD700", borderRadius: "20px", padding: "20px", textAlign: "center", color: "black" }}>
            <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{card.label}</div>
            <div style={{ fontSize: "2rem", fontWeight: "900", margin: "10px 0" }}>{card.value}</div>
            <div style={{ color: "#008000", fontWeight: "bold", fontSize: "0.9rem" }}>{card.change}</div>
          </div>
        ))}
      </div>

      {/* Middle Charts Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
        {/* Top Salons by Revenue */}
        <div className="card" style={{ border: "1px solid #FFD700", padding: "20px" }}>
          <h3>Top Salons by Revenue</h3>
          <div style={{ marginTop: "20px" }}>
            {topSalons.map((salon, idx) => (
              <div key={idx} style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span>{salon.name}</span>
                  <span style={{ fontSize: "0.8rem", color: "#666" }}>{salon.percentage}%</span>
                </div>
                <div style={{ height: "8px", backgroundColor: "#222", borderRadius: "4px" }}>
                  <div style={{ height: "100%", width: `${salon.percentage}%`, backgroundColor: salon.color, borderRadius: "4px" }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Breakdown */}
        <div className="card" style={{ padding: "20px" }}>
          <h3>Service Breakdown</h3>
          <div style={{ marginTop: "20px" }}>
            {services.map((service, idx) => (
              <div key={idx} style={{ marginBottom: "15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "4px" }}>
                  <span>{service.name}</span>
                  <span>{service.percentage}%</span>
                </div>
                <div style={{ height: "6px", backgroundColor: "#222", borderRadius: "3px" }}>
                  <div style={{ height: "100%", width: `${service.percentage}%`, backgroundColor: service.color, borderRadius: "3px" }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Trend Chart Placeholder */}
      <div className="card" style={{ padding: "20px" }}>
        <h3>12-Month Revenue Trend</h3>
        <div style={{ height: "150px", display: "flex", alignItems: "flex-end", gap: "2%", padding: "20px 0" }}>
          {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month, idx) => (
            <div key={idx} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ height: "10px", backgroundColor: "#9c27b0", borderRadius: "5px", marginBottom: "10px" }}></div>
              <span style={{ fontSize: "0.7rem", color: "#666" }}>{month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Appointments = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");

  const [allAppointments] = useState([
    { client: "Mia Taylor", service: "Haircut", salon: "Glow Studio", staff: "Alex Rivera", time: "2025-10-15 17:00", status: "Confirmed", amount: "$275" },
    { client: "Zoe White", service: "Hair Color", salon: "The Mane Event", staff: "Jordan Blake", time: "2025-10-04 11:30", status: "Pending", amount: "$236" },
    { client: "Ella Green", service: "Highlights", salon: "Scissors & Style", staff: "Sam Chen", time: "2025-12-02 16:00", status: "Completed", amount: "$344" },
    { client: "Hannah Black", service: "Blowout", salon: "Luxe Locks", staff: "Taylor Reyes", time: "2025-10-12 18:30", status: "Canceled", amount: "$322" },
    { client: "Sophie Blue", service: "Treatment", salon: "Chic Cuts", staff: "Morgan Fox", time: "2025-12-15 12:00", status: "Confirmed", amount: "$287" },
  ]);

  const filteredData = filter === "All" 
    ? allAppointments 
    : allAppointments.filter(app => app.status === filter);

  const getStatusColor = (status) => {
    switch (status) {
      case "Confirmed": return "#00d1ff";
      case "Pending": return "#ff9800";
      case "Completed": return "#4caf50";
      case "Canceled": return "#f44336";
      default: return "white";
    }
  };

  return (
    <div id="pg-appointments" style={{ padding: "20px" }}>
      
      {/* Header Section */}
      <div className="ph" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ color: "white", margin: 0 }}>Appointments</h1>
        <button 
            className="btn btn-p" 
            style={{ backgroundColor: "#FFD700", color: "black", fontWeight: "bold", borderRadius: "20px", padding: "10px 25px" }}
            onClick={() => navigate("/AddAppointment")}
        >
          + New Appointment
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {["All", "Pending", "Confirmed", "Completed", "Canceled"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              padding: "12px 30px",
              borderRadius: "15px",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
              backgroundColor: filter === tab ? "#FFD700" : "white",
              color: "black",
              transition: "0.3s"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Appointments Table */}
      <div className="card" style={{ background: "#0c0c0c", borderRadius: "10px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead style={{ background: "#1a1a1a", color: "#666", fontSize: "0.75rem", textTransform: "uppercase" }}>
            <tr>
              <th style={{ padding: "15px" }}>Client</th>
              <th>Service</th>
              <th>Salon</th>
              <th>Staff</th>
              <th>Date/Time</th>
              <th>Status</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody style={{ color: "white", fontSize: "0.9rem" }}>
            {filteredData.map((app, index) => (
              <tr key={index} style={{ borderBottom: "1px solid #222" }}>
                <td style={{ padding: "15px" }}>{app.client}</td>
                <td>{app.service}</td>
                <td style={{ color: "#aaa" }}>{app.salon}</td>
                <td>{app.staff}</td>
                <td>{app.time}</td>
                <td>
                  <span style={{ 
                    color: getStatusColor(app.status), 
                    background: `${getStatusColor(app.status)}15`, 
                    padding: "4px 12px", 
                    borderRadius: "15px", 
                    fontSize: "0.75rem",
                    border: `1px solid ${getStatusColor(app.status)}30`
                  }}>
                    {app.status}
                  </span>
                </td>
                <td style={{ fontWeight: "bold" }}>{app.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Appointments;
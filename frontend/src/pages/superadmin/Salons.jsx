import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Salons = () => {
  const navigate = useNavigate();
  const [salonList] = useState([
    { id: 1, name: "LIYO", owner: "Emma Wilson", revenue: "17.3K", staff: 7, created: "Aug 5, 2022", address: "Kadawatha" },
    { id: 2, name: "KATHURA", owner: "James Carter", revenue: "14.3K", staff: 5, created: "Oct 9, 2024", address: "Nugegoda" },
    { id: 3, name: "89", owner: "Sophia Lee", revenue: "10.1K", staff: 4, created: "Feb 5, 2021", address: "Kiribathgoda" },
  ]);

  return (
    <div id="pg-salons" style={{ padding: "20px", color: "white" }}>
      
      {/* Header Section */}
      <div className="ph" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: 0 }}>Salons</h1>
          <p style={{ color: "#aaa", fontSize: "0.9rem" }}>All registered salon locations</p>
        </div>
        <button 
          className="btn btn-p" 
          onClick={() => navigate("/AddSalon")}
          style={{ backgroundColor: "#FFD700", color: "black", fontWeight: "bold", borderRadius: "20px", padding: "10px 25px" }}
        >
          + Add Salon
        </button>
      </div>

      {/* Salons Grid Table */}
      <div style={{ border: "2px solid white", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid white" }}>
              <th style={{ padding: "15px", borderRight: "2px solid white" }}>Salon</th>
              <th style={{ borderRight: "2px solid white" }}>Owner</th>
              <th style={{ borderRight: "2px solid white" }}>Revenue/mo</th>
              <th style={{ borderRight: "2px solid white" }}>Staff</th>
              <th style={{ borderRight: "2px solid white" }}>Created</th>
              <th style={{ borderRight: "2px solid white" }}>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {salonList.map((salon) => (
              <tr key={salon.id} style={{ borderBottom: "2px solid white" }}>
                <td style={{ padding: "20px", borderRight: "2px solid white", fontWeight: "bold" }}>{salon.name}</td>
                <td style={{ borderRight: "2px solid white" }}>{salon.owner}</td>
                <td style={{ borderRight: "2px solid white" }}>Rs. {salon.revenue}</td>
                <td style={{ borderRight: "2px solid white" }}>{salon.staff}</td>
                <td style={{ borderRight: "2px solid white" }}>{salon.created}</td>
                <td style={{ borderRight: "2px solid white" }}>{salon.address}</td>
                <td style={{ padding: "10px" }}>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                    <button style={{ backgroundColor: "#FFD700", color: "black", border: "none", padding: "5px 15px", borderRadius: "15px", fontWeight: "bold", cursor: "pointer" }}>view</button>
                    <button style={{ backgroundColor: "#3498db", color: "black", border: "none", padding: "5px 15px", borderRadius: "15px", fontWeight: "bold", cursor: "pointer" }}>Edit</button>
                    <button style={{ backgroundColor: "#e74c3c", color: "black", border: "none", padding: "5px 15px", borderRadius: "15px", fontWeight: "bold", cursor: "pointer" }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Salons;
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Staff = () => {
  // Dummy data to match your screenshot
  const navigate = useNavigate();
  const [staffList] = useState([
    { id: 1, name: "Casey Quinn", role: "Stylist", salon: "Urban Bliss", status: "Inactive", bookings: 33, rating: 4.0 },
    { id: 2, name: "Riley Park", role: "Manager", salon: "The Beauty Bar", status: "Active", bookings: 90, rating: 4.2 },
    { id: 3, name: "Drew Hayes", role: "Colorist", salon: "Fade Factory", status: "Active", bookings: 16, rating: 4.5 },
    { id: 4, name: "Avery Stone", role: "Receptionist", salon: "Posh Hair Co", status: "Active", bookings: 22, rating: 4.3 },
  ]);

  return (
    <div id="pg-staff" style={{ padding: "20px", color: "white" }}>
      {/* Header Section */}
      <div className="ph" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: 0 }}>Staff</h1>
          <p style={{ color: "var(--muted2)", fontSize: "0.9rem" }}>All staff across all salons</p>
        </div>
        <button 
    className="btn btn-p" 
    onClick={() => navigate("/AddStaff")} // Add this line
    style={{ backgroundColor: "#FFD700", color: "black", fontWeight: "bold", borderRadius: "20px", padding: "10px 20px" }}
    >
        + Add Staff
    </button>
      </div>

      {/* Filters Section */}
      <div className="filters" style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
        <input 
          type="text" 
          placeholder="Search Staff..." 
          style={{ flex: 2, background: "transparent", border: "1px solid #FFD700", padding: "10px", borderRadius: "5px", color: "white" }} 
        />
        <select style={{ flex: 1, background: "black", border: "1px solid #FFD700", color: "white", padding: "10px", borderRadius: "5px" }}>
          <option>All Roles</option>
        </select>
        <select style={{ flex: 1, background: "black", border: "1px solid #FFD700", color: "white", padding: "10px", borderRadius: "5px" }}>
          <option>All Salons</option>
        </select>
      </div>

      {/* Staff Table */}
      <div className="card" style={{ background: "#0c0c0c", borderRadius: "10px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead style={{ background: "#1a1a1a", color: "#666", fontSize: "0.8rem", textTransform: "uppercase" }}>
            <tr>
              <th style={{ padding: "15px" }}>Name</th>
              <th>Role</th>
              <th>Salon</th>
              <th>Status</th>
              <th>Bookings</th>
              <th>Rating</th>
              <th style={{ textAlign: "right", paddingRight: "15px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map((staff) => (
              <tr key={staff.id} style={{ borderBottom: "1px solid #222" }}>
                <td style={{ padding: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#444", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "0.7rem" }}>
                    {staff.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  {staff.name}
                </td>
                <td><span style={{ color: "#00d1ff", background: "rgba(0, 209, 255, 0.1)", padding: "2px 8px", borderRadius: "10px", fontSize: "0.8rem" }}>{staff.role}</span></td>
                <td style={{ color: "#aaa" }}>{staff.salon}</td>
                <td>
                  <span style={{ 
                    color: staff.status === "Active" ? "#4caf50" : "#ff9800",
                    background: staff.status === "Active" ? "rgba(76, 175, 80, 0.1)" : "rgba(255, 152, 0, 0.1)",
                    padding: "2px 8px", borderRadius: "10px", fontSize: "0.8rem"
                  }}>
                    • {staff.status}
                  </span>
                </td>
                <td>{staff.bookings}</td>
                <td style={{ color: "#FFD700" }}>⭐ {staff.rating}</td>
                <td style={{ textAlign: "right", paddingRight: "15px" }}>
                  <button style={{ background: "transparent", color: "#4caf50", border: "1px solid #4caf50", borderRadius: "5px", padding: "2px 10px", marginRight: "5px", cursor: "pointer" }}>
                    {staff.status === "Active" ? "Deactivate" : "Activate"}
                  </button>
                  <button style={{ background: "transparent", color: "#f44336", border: "1px solid #f44336", borderRadius: "5px", padding: "2px 10px", cursor: "pointer" }}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Staff;
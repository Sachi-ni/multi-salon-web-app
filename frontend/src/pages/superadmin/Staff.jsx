import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Staff = () => {
  const navigate = useNavigate();

  const [staffList] = useState([
    { id: 1, name: "Casey Quinn", role: "Stylist", salon: "Urban Bliss", status: "Inactive", bookings: 33, rating: 4.0 },
    { id: 2, name: "Riley Park", role: "Manager", salon: "The Beauty Bar", status: "Active", bookings: 90, rating: 4.2 },
    { id: 3, name: "Drew Hayes", role: "Colorist", salon: "Fade Factory", status: "Active", bookings: 16, rating: 4.5 },
    { id: 4, name: "Avery Stone", role: "Receptionist", salon: "Posh Hair Co", status: "Active", bookings: 22, rating: 4.3 },
  ]);

  const getStatusClass = (status) => {
    return status === "Active" ? "pg" : "py";
  };

  return (
    <div className="page on" id="pg-staff">

      {/* HEADER */}
      <div className="ph">

        <div>
          <h1>Staff</h1>
          <p>All staff across all salons</p>
        </div>

        <div className="pactions">

          <button
            className="btn btn-p"
            onClick={() => navigate("/AddStaff")}
          >
            + Add Staff
          </button>

        </div>

      </div>

      {/* FILTER BAR */}
      <div className="fb">

        <div className="srch">

          <svg className="i" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.3-4.3"></path>
          </svg>

          <input placeholder="Search staff..." />

        </div>

        <select className="fsel">
          <option>All Roles</option>
        </select>

        <select className="fsel">
          <option>All Salons</option>
        </select>

      </div>

      {/* TABLE */}
      <div className="tw">

        <table>

          <thead>

            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Salon</th>
              <th>Status</th>
              <th>Bookings</th>
              <th>Rating</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>

          </thead>

          <tbody>

            {staffList.length === 0 ? (
              <tr>
                <td colSpan="7">No staff found</td>
              </tr>
            ) : (
              staffList.map((s) => (
                <tr key={s.id}>

                  <td style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 700 }}>

                    <div className="av" style={{ background: "var(--s2)" }}>
                      {s.name.split(" ").map(n => n[0]).join("")}
                    </div>

                    {s.name}

                  </td>

                  <td>
                    <span className="pill pb">
                      {s.role}
                    </span>
                  </td>

                  <td style={{ color: "var(--muted2)" }}>
                    {s.salon}
                  </td>

                  <td>
                    <span className={`pill ${getStatusClass(s.status)}`}>
                      {s.status}
                    </span>
                  </td>

                  <td>{s.bookings}</td>

                  <td style={{ color: "var(--yellow)" }}>
                    ⭐ {s.rating}
                  </td>

                  <td style={{ textAlign: "right" }}>

                    <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>

                      <button className="btn btn-s xs">
                        {s.status === "Active" ? "Deactivate" : "Activate"}
                      </button>

                      <button className="btn btn-d xs">
                        Remove
                      </button>

                    </div>

                  </td>

                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
};

export default Staff;
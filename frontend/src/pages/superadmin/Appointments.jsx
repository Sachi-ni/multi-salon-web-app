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

  const filteredData =
    filter === "All"
      ? allAppointments
      : allAppointments.filter((a) => a.status === filter);

  const getStatusClass = (status) => {
    switch (status) {
      case "Confirmed":
        return "pb";
      case "Pending":
        return "py";
      case "Completed":
        return "pg";
      case "Canceled":
        return "pr";
      default:
        return "";
    }
  };

  return (
    <div className="page on" id="pg-appointments">

      {/* HEADER */}
      <div className="ph">

        <div>
          <h1>Appointments</h1>
          <p>Manage all customer bookings</p>
        </div>

        <div className="pactions">

          <button
            className="btn btn-p"
            onClick={() => navigate("/AddAppointment")}
          >
            + New Appointment
          </button>

        </div>

      </div>

      {/* FILTER TABS */}
      <div className="tabs">

        {["All", "Pending", "Confirmed", "Completed", "Canceled"].map((tab) => (
          <div
            key={tab}
            className={`tab ${filter === tab ? "on" : ""}`}
            onClick={() => setFilter(tab)}
          >
            {tab}
          </div>
        ))}

      </div>

      {/* TABLE */}
      <div className="tw">

        <table>

          <thead>

            <tr>
              <th>Client</th>
              <th>Service</th>
              <th>Salon</th>
              <th>Staff</th>
              <th>Date / Time</th>
              <th>Status</th>
              <th>Amount</th>
            </tr>

          </thead>

          <tbody>

            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="7">
                  No appointments found
                </td>
              </tr>
            ) : (
              filteredData.map((a, i) => (
                <tr key={i}>

                  <td style={{ fontWeight: 700 }}>
                    {a.client}
                  </td>

                  <td>{a.service}</td>

                  <td style={{ color: "var(--muted2)" }}>
                    {a.salon}
                  </td>

                  <td>{a.staff}</td>

                  <td>{a.time}</td>

                  <td>
                    <span className={`pill ${getStatusClass(a.status)}`}>
                      {a.status}
                    </span>
                  </td>

                  <td style={{ fontWeight: 700 }}>
                    {a.amount}
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

export default Appointments;
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  // State (empty for now – will connect backend later)
  //const [stats, setStats] = useState([]);

  const doExport = () => {
    console.log("Export clicked");
  };

  const openModal = (name) => {
    console.log("Open modal:", name);
  };

  const nav = (page) => {
    navigate(`/${page.toLowerCase()}`);
  };

  const [stats] = useState([
    { ico: "🏠", lbl: "Total Salons", val: "", sub: "" },
    { ico: "👥", lbl: "Total Staff", val: "", sub: "" },
    { ico: "📅", lbl: "Appointments", val: "", sub: "" },
    { ico: "💰", lbl: "Platform Revenue", val: "", sub: "" },
  ]);

  return (
    <div id="pg-dashboard">

      {/* Header */}
      <div className="ph">
        <div>
          <h1>Dashboard</h1>
          <p id="dgreet">Welcome back, Super Admin</p>
        </div>

        <div className="pactions">
          <button className="btn btn-g sm" onClick={doExport}>
            Export
          </button>

          <button
            className="btn btn-p"
            onClick={() => nav("AddSalon")}
          >
            Add Salon
          </button>
        </div>
      </div>

      {/* Stats (dynamic placeholder) */}
      <div className="srow">
        {stats.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No data available yet</p>
        ) : (
          stats.map((item, index) => {
            // Map each stat to its page
            let page = "";
            switch (item.lbl) {
              case "Total Salons":
                page = "salons";
                break;
              case "Total Staff":
                page = "staff";
                break;
              case "Appointments":
                page = "appointments";
                break;
              case "Platform Revenue":
                page = "revenue";
                break;
              default:
                page = "";
            }

            return (
              <div
                className="sc"
                key={index}
                style={{ cursor: page ? "pointer" : "default" }}
                onClick={() => page && nav(page)}
              >
                <div className="sc-ico">{item.ico}</div>
                <div className="sc-lbl">{item.lbl}</div>
                <div className="sc-val">{item.val}</div>
                <div className="sc-sub">{item.sub}</div>
              </div>
            );
          })
        )}
      </div>

      {/* Charts Section */}
      <div className="g2 mb22">

        <div className="card">
          <div className="chdr">
            <h3>Revenue — Last 7 Days</h3>
            <span className="sub"></span>
          </div>
          <div className="rchart">
            <p style={{ opacity: 0.6 }}>Chart will load here</p>
          </div>
        </div>

        <div className="card">
          <div className="chdr">
            <h3>Top Salons by Revenue</h3>
            <span className="sub">This month</span>
          </div>
          <div>
            <p style={{ opacity: 0.6 }}>Data will load here</p>
          </div>
        </div>

      </div>

      {/* Activity + Quick Actions */}
      <div className="g2 mb16">

        <div className="card">
          <div className="chdr">
            <h3>Live Activity</h3>
          </div>
          <div>
            <p style={{ opacity: 0.6 }}>Activity will appear here</p>
          </div>
        </div>

        <div className="card">
          <div className="chdr">
            <h3>Quick Actions</h3>
          </div>

          <div className="fc">

            <button
              className="btn btn-g"
              style={{ justifyContent: "flex-start" }}
              onClick={() => nav("AddSalon")}
            >
              Register New Salon
            </button>

            <button
              className="btn btn-g"
              style={{ justifyContent: "flex-start" }}
              onClick={() => nav("AddStaff")}
            >
              Add Staff Member
            </button>

            <button
              className="btn btn-g"
              style={{ justifyContent: "flex-start" }}
              onClick={() => navigate("/AddAppointment")}
            >
              Create Appointment
            </button>

            <button
              className="btn btn-g"
              style={{ justifyContent: "flex-start" }}
              onClick={() => nav("revenue")}
            >
              Manage Revenue
            </button>

          </div>
        </div>

      </div>

      {/* Salons Section */}
      <div className="dsec-hdr">
        <h3>
          🏠 All Salons{" "}
          <span
            style={{
              fontSize: ".72rem",
              color: "var(--muted2)",
              fontWeight: 400,
              marginLeft: "6px",
            }}
          ></span>
        </h3>

        <button
          className="btn btn-g sm"
          onClick={() => nav("salons")}
        >
          Manage all salons →
        </button>
      </div>

      <div className="dsal-grid">
        <p style={{ opacity: 0.6 }}>Salon data will load here</p>
      </div>

    </div>
  );
};

export default Dashboard;
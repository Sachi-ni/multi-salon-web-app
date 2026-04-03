import React from "react";
import "../../App.css";

const Dashboard = () => {

  // Dummy functions (replace with real logic later)
  const doExport = () => {
    console.log("Export clicked");
  };

  const openModal = (name) => {
    console.log("Open modal:", name);
  };

  const nav = (page) => {
    console.log("Navigate to:", page);
  };

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

          <button className="btn btn-p" onClick={() => openModal("m-salon")}>
            Add Salon
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="srow" id="dstats"></div>

      {/* Charts Section */}
      <div className="g2 mb22">
        <div className="card">
          <div className="chdr">
            <h3>Revenue — Last 7 Days</h3>
            <span className="sub" id="rev7total"></span>
          </div>
          <div className="rchart" id="rchart7"></div>
        </div>

        <div className="card">
          <div className="chdr">
            <h3>Top Salons by Revenue</h3>
            <span className="sub">This month</span>
          </div>
          <div id="toplist"></div>
        </div>
      </div>

      {/* Activity + Quick Actions */}
      <div className="g2 mb16">

        <div className="card">
          <div className="chdr">
            <h3>Live Activity</h3>
          </div>
          <div id="afeed"></div>
        </div>

        <div className="card">
          <div className="chdr">
            <h3>Quick Actions</h3>
          </div>

          <div className="fc">

            <button
              className="btn btn-g"
              style={{ justifyContent: "flex-start" }}
              onClick={() => openModal("m-salon")}
            >
              Register New Salon
            </button>

            <button
              className="btn btn-g"
              style={{ justifyContent: "flex-start" }}
              onClick={() => openModal("m-staff")}
            >
              Add Staff Member
            </button>

            <button
              className="btn btn-g"
              style={{ justifyContent: "flex-start" }}
              onClick={() => openModal("m-appt")}
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
            id="dsal-count"
            style={{
              fontSize: ".72rem",
              color: "var(--muted2)",
              fontWeight: 400,
              marginLeft: "6px",
            }}
          ></span>
        </h3>

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            nav("salons");
          }}
        >
          Manage all salons →
        </a>
      </div>

      <div className="dsal-grid" id="dsal-grid"></div>

    </div>
  );
};

export default Dashboard;
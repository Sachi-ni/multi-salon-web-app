import React from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const doExport = () => {
    console.log("Export clicked");
  };

  return (
    <>
      {/* ----------header----------------- */}
      <div id="hdr" className="on">
        <div className="logo">
          <div className="logo-icon">S</div>
          <span>Salon</span>Hub
        </div>
        <div className="hdr-badge">Welcome Back</div>
        <div className="hdr-sp"></div>
        <div className="hbtn" title="Notifications" style={{ position: "relative" }}>
          🔔
          <span className="ndot" id="ndot" style={{ display: "none" }}></span>
        </div>
        <div className="hsep"></div>
        <div className="login" style={{ cursor: "pointer" }}>
          <button className="login" onClick={() => navigate('/login')}>Login</button>
        </div>
      </div>

      {/* ----------body----------------- */}
      <div id="pg-dashboard">
        <div className="ph">
          <div>
            <h1>Dashboard</h1>
            <p id="dgreet">Welcome back, Super Admin</p>
          </div>
          <div className="pactions">
            <button className="btn btn-g sm" onClick={doExport}>Export</button>
            <button className="btn btn-p">Add Salon</button>
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
            <div className="chdr"><h3>Live Activity</h3></div>
            <div id="afeed"></div>
          </div>
          <div className="card">
            <div className="chdr"><h3>Quick Actions</h3></div>
            <div className="fc">
              <button className="btn btn-g" style={{ justifyContent: "flex-start" }}>Register New Salon</button>
              <button className="btn btn-g" style={{ justifyContent: "flex-start" }}>Add Staff Member</button>
              <button className="btn btn-g" style={{ justifyContent: "flex-start" }}>Create Appointment</button>
              <button className="btn btn-g" style={{ justifyContent: "flex-start" }}>Manage Revenue</button>
            </div>
          </div>
        </div>

        {/* Salons Section */}
        <div className="dsec-hdr">
          <h3>
            🏠 All Salons{" "}
            <span id="dsal-count" style={{ fontSize: ".72rem", color: "var(--muted2)", fontWeight: 400, marginLeft: "6px" }}></span>
          </h3>
          <button className="btn btn-g sm">Manage all salons →</button>
        </div>
        <div className="dsal-grid" id="dsal-grid"></div>
      </div>
    </>
  );
};

export default Dashboard;
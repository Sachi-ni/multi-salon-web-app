import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../App.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? "ni on" : "ni";

  return (
    <div id="sidebar">

      <div className="ngrp">Overview</div>

      <div
        className={isActive("/dashboard")}
        id="ni-dashboard"
        onClick={() => navigate("/dashboard")}
      >
        Dashboard
      </div>

      <div
        className={isActive("/analytics")}
        id="ni-analytics"
        onClick={() => navigate("/analytics")}
      >
        Analytics
      </div>

      <div className="ngrp">Management</div>

      <div
        className={isActive("/salons")}
        id="ni-salons"
        onClick={() => navigate("/salons")}
      >
        Salons
        <span className="cnt" id="cnt-s">0</span>
      </div>

      <div
        className={isActive("/staff")}
        id="ni-staff"
        onClick={() => navigate("/staff")}
      >
        Staff
      </div>

      <div
        className={isActive("/appointments")}
        id="ni-appointments"
        onClick={() => navigate("/appointments")}
      >
        Appointments
        <span className="cnt b" id="cnt-a">0</span>
      </div>

      <div className="ngrp">Finance</div>

      <div
        className={isActive("/revenue")}
        id="ni-revenue"
        onClick={() => navigate("/revenue")}
      >
        Revenue
      </div>

    </div>
  );
};

export default Sidebar;
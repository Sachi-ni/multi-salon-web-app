import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = ({ isOpen = true }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => (location.pathname === path ? "ni on" : "ni");

  return (
    <div id="sidebar" className={isOpen ? "on" : ""}>

      <div className="ngrp">Overview</div>

      <div
        className={isActive("/Dashboard")}
        id="ni-dashboard"
        onClick={() => navigate("/Dashboard")}
      >
        Dashboard
      </div>

      <div
        className={isActive("/Analytics ")}
        id="ni-analytics "
        onClick={() => navigate("/Analytics ")}
      >
        Analytics
      </div>

      <div className="ngrp">Management</div>

      <div
        className={isActive("/Salons")}
        id="ni-salons"
        onClick={() => navigate("/Salons")}
      >
        Salons
      </div>

      <div
        className={isActive("/Staff")}
        id="ni-staff"
        onClick={() => navigate("/Staff")}
      >
        Staff
      </div>

      <div
        className={isActive("/Appointments")}
        id="ni-appointments"
        onClick={() => navigate("/Appointments")}
      >
        Appointments
      </div>

      <div className="ngrp">Finance</div>

      <div
        className={isActive("/Revenue")}
        id="ni-revenue"
        onClick={() => navigate("/Revenue")}
      >
        Revenue
      </div>

    </div>
  );
};

export default Sidebar;
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";


const Header = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  console.log("User in Header:", user);
  const navigate = useNavigate();
  const toggleSB = () => {
    console.log("Toggle Sidebar");
    if (onToggleSidebar) onToggleSidebar();
  };

  const showNotifs = () => {
    console.log("Show Notifications");
  };

  return (

    <div id="hdr" className="on">

      {/* Hamburger */}
      <div className="ham" onClick={onToggleSidebar || toggleSB}>
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* Logo */}
      <div className="logo">
        <div className="logo-icon">S</div>
        <span>Salon</span>Hub
      </div>

      {/* Role Badge */}
      <div className="hdr-badge">SUPER ADMIN</div>

      <div className="hdr-sp"></div>

      {/* Notifications */}
      <div
        className="hbtn"
        onClick={showNotifs}
        title="Notifications"
        style={{ position: "relative" }}
      >
        🔔
        <span
          className="ndot"
          id="ndot"
          style={{ display: "none" }}
        ></span>
      </div>

      <div className="hsep"></div>

      {/* Avatar */}
      <div
        className="hav"
        onClick={() => navigate('/profile')}
        title="Profile"
      >
        SA
      </div>

      {/* User Info */}
      <div
        className="hinfo"
        style={{ cursor: "pointer" }}
        onClick={() => navigate('/profile')}
      >
        <div className="hname">{user?.name || "Super Admin"}</div>
        <div className="hrole">{user?.email || "admin@salonhub.com"}</div>
      </div>

    </div>
  );
};

export default Header;
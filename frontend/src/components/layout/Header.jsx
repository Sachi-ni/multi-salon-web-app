import React from "react";
import "../../App.css";

const Header = () => {

  const toggleSB = () => {
    console.log("Toggle Sidebar");
  };

  const showNotifs = () => {
    console.log("Show Notifications");
  };

  const openProfile = () => {
    console.log("Open Profile");
  };

  return (
    <div id="hdr">

      {/* Hamburger */}
      <div className="ham" onClick={toggleSB}>
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
        onClick={openProfile}
        title="Profile"
      >
        SA
      </div>

      {/* User Info */}
      <div
        className="hinfo"
        style={{ cursor: "pointer" }}
        onClick={openProfile}
      >
        <div className="hname">Super Admin</div>
        <div className="hrole">admin@salonhub.com</div>
      </div>

    </div>
  );
};

export default Header;
import React from "react";
import { useNavigate } from "react-router-dom";

const CustomerHeader = ({ onToggleSidebar }) => {
  const navigate = useNavigate();

  return (
    <div id="hdr" className="on customer-header">
      {/* Hamburger for Customer Menu */}
      <div className="ham" onClick={onToggleSidebar}>
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* Logo */}
      <div className="logo" onClick={() => navigate('/customer/home')} style={{ cursor: "pointer" }}>
        <div className="logo-icon">S</div>
        <span>Salon</span>Hub
      </div>

      {/* Customer Specific Badge */}
      <div className="hdr-badge customer-badge">PREMIUM MEMBER</div>

      <div className="hdr-sp"></div>

      {/* Booking Shortcut (New for Customer) */}
      <div 
        className="hbtn" 
        onClick={() => navigate('/customer/bookings')}
        title="My Bookings"
      >
        📅
      </div>

      {/* Notifications */}
      <div
        className="hbtn"
        onClick={() => console.log("Customer Notifications")}
        title="Notifications"
      >
        🔔
      </div>

      <div className="hsep"></div>

      {/* Customer Avatar */}
      <div
        className="hav customer-av"
        onClick={() => navigate('/customer/profile')}
        title="My Profile"
      >
        WJ
      </div>

      {/* Customer Info */}
      <div
        className="hinfo"
        style={{ cursor: "pointer" }}
        onClick={() => navigate('/customer/profile')}
      >
        <div className="hname">Will Joseph</div>
        <div className="hrole">Gold Member</div>
      </div>
    </div>
  );
};

export default CustomerHeader;
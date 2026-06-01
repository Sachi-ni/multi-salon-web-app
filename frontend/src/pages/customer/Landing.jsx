import React from "react";
import { useNavigate } from "react-router-dom";
import LoginHeader from "../../components/layout/loginHeader";
import "./customer.css";
import { useAuth } from "../../context/AuthContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user }  = useAuth();

  const handleBooking = () => {
    if (user?.role === "customer" || user?.role === "user") {
      navigate("/book");
    } else {
      navigate("/customer/register");
    }
  };

  const doExport = () => {
    console.log("Export clicked");
  };

  return (
    <div className="customer-page">
      <LoginHeader />
    <div id="screen-home" className="screen active">
    <div className="hero">
        <div className="hero-left">
        <div className="hero-tag">Premium Grooming Studio</div>
        <div className="hero-title">LOOK<br /><span>SHARP.</span><br />FEEL<br />GREAT.</div>
        <p className="hero-sub">Expert cuts, flawless styling, and premium grooming services — crafted for the modern individual. Walk out a new you.</p>
        <div className="hero-btns">
            <button className="btn-primary" onClick={handleBooking}>Book Appointment</button>
            <button className="btn-outline">View Services</button>
        </div>
        </div>
        <div className="hero-right">
        <div className="hero-art">
            <div className="hero-circle"></div>
            <div className="hero-circle"></div>
            <div className="hero-scissors">✂</div>
            <div className="hero-stat-grid">
            <div className="stat"><div className="stat-num">2K+</div><div className="stat-label">Clients</div></div>
            <div className="stat"><div className="stat-num">12</div><div className="stat-label">Stylists</div></div>
            <div className="stat"><div className="stat-num">2</div><div className="stat-label">Branches</div></div>
            </div>
        </div>
        </div>
    </div>

    <div className="services-strip">
        <span className="strip-item">HAIR CUT</span><span className="strip-dot">◆</span>
        <span className="strip-item">BEARD TRIM</span><span className="strip-dot">◆</span>
        <span className="strip-item">FACIAL</span><span className="strip-dot">◆</span>
        <span className="strip-item">HAIR COLOUR</span><span className="strip-dot">◆</span>
        <span className="strip-item">HAIR WASH</span><span className="strip-dot">◆</span>
        <span className="strip-item">MASSAGE</span><span className="strip-dot">◆</span>
        <span className="strip-item">DRESSING</span><span className="strip-dot">◆</span>
        <span className="strip-item">GROOMING</span>
    </div>
    </div>
    </div>
        );
    };  

export default Dashboard;

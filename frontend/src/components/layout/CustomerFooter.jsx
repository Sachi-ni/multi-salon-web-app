import React from "react";
import { useNavigate } from "react-router-dom";
import "../../App.css";

const CustomerFooter = () => {
  const navigate = useNavigate();

  const handleBookingClick = () => {
    // This matches the path in App.js
    navigate("/customer/add-appointment");
  };

  return (
    <footer className="footer-container">
      <div className="footer-cta-bar">
        <button className="book-now-btn" onClick={handleBookingClick}>
          BOOK NOW
        </button>
      </div>

      <div className="footer-content">
        <div className="footer-col">
          <h2 className="footer-title">CONTACT US</h2>
          <address className="footer-address">
            123 Anywhere St., Any<br />
            City, ST 12345
          </address>
        </div>

        <div className="footer-col">
          <div className="contact-details">
            <p>123-456-7890</p>
            <p>(12) 3456-7890</p>
            <p className="footer-email">hello@reallygreatsite.com</p>
          </div>
        </div>

        <div className="footer-col">
          <p className="footer-info-text">
            We're here to assist you with any questions or inquiries. 
            Book your appointment or reach out for more information 
            about our services and special offers.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default CustomerFooter;
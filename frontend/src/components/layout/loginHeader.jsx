import React from "react";
import { useNavigate } from "react-router-dom";

const LoginHeader = () => {
  const navigate = useNavigate();

  const doExport = () => {
    console.log("Export clicked");
  };

  return (

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
  );
};

export default LoginHeader;
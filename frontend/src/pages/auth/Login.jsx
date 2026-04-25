import React from "react";
import { useNavigate } from "react-router-dom";
import "../../App.css";

const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-scene on" id="pg-login">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">S</div>
          <div className="auth-logo-text">SalonHub</div>
        </div>
        <div className="auth-sub">Super Admin Portal</div>
        <div className="auth-title">Welcome Back</div>
        <div className="fg">
          <label>Username</label>
          <input type="text" id="log-u" placeholder="Enter your username" />
        </div>
        <div className="fg">
          <label>Password</label>
          <input type="password" id="log-p" placeholder="Enter your password" />
        </div>
        <button className="auth-btn" onClick={() => navigate('/Dashboard')}>Sign In</button>
        <div className="auth-switch">
          No account? <span onClick={() => navigate('/signup')} style={{cursor:'pointer', color:'blue'}}>Register here</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
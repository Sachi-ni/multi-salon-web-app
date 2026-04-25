import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../App.css";

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  // Controlled inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("Status:", res.status);
      console.log("Data:", data);

      if (!res.ok) {
        alert(data.message || "Login failed");
        return;
      }

      // Save user in context + localStorage
      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));

      // Navigate based on role
      if (data.role === "super-admin") {
        navigate("/superAdminDashboard");
      } else if (data.role === "staff-admin") {
        navigate("/");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="auth-scene on" id="pg-login">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">S</div>
          <div className="auth-logo-text">SalonHub</div>
        </div>
        <div className="auth-title">Welcome Back</div>
        <div className="fg">
          <label>Email</label>
          <input 
            type="email" 
            id="log-u" 
            placeholder="Enter your email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="fg">
          <label>Password</label>
          <input 
            type="password" 
            id="log-p" 
            placeholder="Enter your password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button className="auth-btn" onClick={handleLogin}>Sign In</button>
        <div className="auth-switch">
          No account?{" "}
          <span 
            onClick={() => navigate("/signup")} 
            style={{ cursor: "pointer", color: "blue" }}
          >
            Register here
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;

import React from "react";
import { useNavigate } from "react-router-dom";
import "../../App.css";
import axios from "axios";

const Signup = () => {
  const [fname, setFname] = React.useState("");
  const [uname, setUname] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        full_name: fname,
        username: uname,
        email: email,
        password: password,
        role: "super-admin"
      });
      console.log('Registration successful:', response.data);
      alert('Registration successful! Redirecting to login...');
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      alert(error.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="auth-scene on" id="pg-reg">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">S</div>
          <div className="auth-logo-text">SalonHub</div>
        </div>
        <div className="auth-title">Create Account</div>
        <form onSubmit={handleRegister}>
        <div className="fg">
          <label>Full Name</label>
          <input 
          type="text" 
          id="reg-name" 
          placeholder="Enter your full name" 
          onChange={(e) => setFname(e.target.value)}
          value={fname}
          />
        </div>
        <div className="fr">
          <div className="fg">
            <label>Username</label>
            <input 
            type="text" 
            id="reg-user" 
            placeholder="Username" 
            onChange={(e) => setUname(e.target.value)}
            value={uname}
            />
          </div>
        </div>
        <div className="fg">
          <label>Email</label>
          <input 
          type="email" 
          id="reg-email" 
          placeholder="your@email.com" 
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          />
        </div>
        <div className="fg">
          <label>Phone</label>
          <input 
          type="tel" 
          id="reg-phone" 
          placeholder="07---XXXXXX" 
          onChange={(e) => setPhone(e.target.value)}
          value={phone}
          />
        </div>
        <div className="fr">
          <div className="fg">
            <label>Password</label>
            <input 
            type="password" 
            id="reg-pass" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="fg">
            <label>Confirm</label>
            <input 
            type="password" 
            id="reg-conf" 
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••" 
            />
          </div>
        </div>handleRegister
        <button className="auth-btn" type="submit">
          Register Now
        </button>
        </form>
        <div className="auth-switch">
          Already have an account?{' '}
          <span onClick={() => navigate('/login')} style={{ cursor: 'pointer', color: 'blue' }}>
            Sign in here
          </span>
        </div>
      </div>
    </div>
  );
};

export default Signup;
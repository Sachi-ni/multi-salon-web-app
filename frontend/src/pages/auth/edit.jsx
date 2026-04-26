import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../App.css";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

const Edit = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [fname, setFname] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const res = await axios.put(
        `http://localhost:5000/api/auth/user/${user.id}`,
        { full_name: fname, email, phone, username, password },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      // Update context + localStorage
      const updatedUser = {
        ...user,
        name: res.data.name,
        email: res.data.email,
        phone: res.data.phone,
        username: res.data.username,
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      alert("Profile updated successfully!");
      navigate("/Profile");
    } catch (error) {
      console.error("Update error:", error);
      alert(error.response?.data?.message || "Failed to update profile");
    }
  };

  return (
    <div className="auth-scene on" id="pg-edit">
      <div className="auth-card">
        <div className="auth-title">Edit Profile</div>
        <form onSubmit={handleUpdate}>
          <div className="fg">
            <label>Full Name</label>
            <input type="text" value={fname} onChange={(e) => setFname(e.target.value)} />
          </div>
          <div className="fg">
            <label>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="fg">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="fg">
            <label>Phone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="fg">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="fg">
            <label>Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <button className="auth-btn" type="submit">Save Changes</button>
        </form>
      </div>
    </div>
  );
};

export default Edit;

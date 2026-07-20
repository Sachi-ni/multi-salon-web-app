import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { X } from "lucide-react";
import axios from "axios";

const Edit = () => {
  const { user, setUser, token, login } = useAuth();
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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update context + localStorage and refresh token if provided
      const updatedUser = {
        ...user,
        name: res.data.name,
        email: res.data.email,
        phone: res.data.phone,
        username: res.data.username,
        salonName: res.data.salonName,
        role: res.data.role || user.role,
        id: res.data.id || user.id,
        salon_id: res.data.salon_id || user.salon_id,
      };

      // If backend returned a new token, use login to sync both user + token
      if (res.data.token) {
        login(updatedUser, res.data.token);
      } else {
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      alert("Profile updated successfully!");
      if (user?.role === "customer" || user?.role === "user") {
        navigate("/customer/dashboard");
      } else if (user?.role === "super-admin") {
        navigate("/super-profile");
      } else if (user?.role === "manager" || user?.role === "staff-admin") {
        navigate(-1);
      } else {
        navigate("/profile");
      }
    } catch (error) {
      console.error("Update error:", error);
      alert(error.response?.data?.message || "Failed to update profile");
    }
  };

  return (
    <div className="fixed inset-0 bg-primary flex items-center justify-center z-[1000] grid-bg py-4">
      <div className="relative z-10 w-[460px] max-w-[96vw] max-h-[90vh] overflow-y-auto overflow-x-hidden bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-modal">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-accent to-accent-hover rounded-t-2xl" />

        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center text-base font-black text-primary flex-shrink-0">
            S
          </div>
          <span className="text-xl font-black text-accent tracking-tight">SalonHub</span>
        </div>

        <h1 className="text-2xl font-extrabold text-white mb-6">Edit Profile</h1>

        <form onSubmit={handleUpdate}>
          <div className="mb-3.5">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={fname}
              onChange={(e) => setFname(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-muted focus:border-accent focus:bg-accent-dim/30"
            />
          </div>

          {user?.role !== "customer" && user?.role !== "user" && (
            <div className="mb-3.5">
              <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-muted focus:border-accent focus:bg-accent-dim/30"
              />
            </div>
          )}

          <div className="mb-3.5">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-muted focus:border-accent focus:bg-accent-dim/30"
            />
          </div>

          <div className="mb-3.5">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-muted focus:border-accent focus:bg-accent-dim/30"
            />
          </div>

          <div className="mb-3.5">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-muted focus:border-accent focus:bg-accent-dim/30"
            />
          </div>

          <div className="mb-4">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-muted focus:border-accent focus:bg-accent-dim/30"
            />
          </div>

          <button
            className="w-full mt-1.5 bg-accent text-primary border-none rounded-lg py-3.5 text-sm font-extrabold tracking-wider uppercase cursor-pointer transition-all duration-200 hover:bg-accent-hover hover:shadow-glow hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default Edit;


import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { API_URL } from "../../config";

const CustomerRegister = () => {
  const [name, setName]                   = useState("");
  const [email, setEmail]                 = useState("");
  const [phone, setPhone]                 = useState("");
  const [phoneError, setPhoneError]       = useState("");
  const [password, setPassword]           = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]             = useState(false);
  const navigate = useNavigate();

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/[^0-9+\s()-]/g, "");
    if (val.replace(/[\s()-]/g, "").replace(/^\+/, "").length <= 10) {
      setPhone(val);
      if (/^\+?[0-9]{10}$/.test(val.replace(/[\s()-]/g, ""))) {
        setPhoneError("");
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setPhoneError("");

    const normalizedPhone = phone.replace(/[\s()-]/g, "");
    if (!/^\+?[0-9]{10}$/.test(normalizedPhone)) {
      setPhoneError("Phone number must contain exactly 10 digits and may start with +");
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[\S]{8,}$/.test(password)) {
      alert("Password must be at least 8 characters and include uppercase, lowercase, number, and special character");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/register`, {
        fullName: name,
        email: email.trim().toLowerCase(),
        phone: normalizedPhone,
        password,
      });
      alert("Registration successful! Please login.");
      navigate("/login");
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-surface-2 border border-border rounded-lg px-3.5 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-muted focus:border-accent focus:bg-accent-dim/30";

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[1000] overflow-hidden">
      {/* Background Image with Overlay - Similar to Landing Page */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/60 to-primary/80 z-10" />
        <img
          src="https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2574&auto=format&fit=crop"
          alt="Premium Salon Background"
          className="w-full h-full object-cover object-center opacity-50"
        />
      </div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-[460px] max-w-[96vw] bg-surface/80 backdrop-blur-sm border border-border rounded-2xl p-10 shadow-modal max-h-[95vh] overflow-y-auto"
      >
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-accent to-accent-hover rounded-t-2xl" />

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center text-base font-black text-primary flex-shrink-0">
            S
          </div>
          <span className="text-xl font-black text-accent tracking-tight">SalonHub</span>
        </div>

        <h1 className="text-2xl font-extrabold text-white mb-1">Create Account</h1>
        <p className="text-muted-2 text-sm mb-6">Book appointments at your favourite salon</p>

        <form onSubmit={handleRegister} autoComplete="off">
          {/* Name */}
          <div className="mb-3.5">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
              Full Name <span className="text-accent/60 lowercase tracking-widest ml-1 font-bold">(required)</span>
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={e => setName(e.target.value)}
              className={inputClass}
              autoComplete="new-name"
              required
            />
          </div>

          {/* Email */}
          <div className="mb-3.5">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
              Email <span className="text-accent/60 lowercase tracking-widest ml-1 font-bold">(required)</span>
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={inputClass}
              autoComplete="new-email"
              required
            />
          </div>

          {/* Phone */}
          <div className="mb-3.5">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
              Phone <span className="text-accent/60 lowercase tracking-widest ml-1 font-bold">(required)</span>
            </label>
            <input
              type="tel"
              placeholder="+947XXXXXXXX"
              value={phone}
              onChange={handlePhoneChange}
              className={`${inputClass} ${phoneError ? "border-red-500/50 focus:border-red-500" : ""}`}
              autoComplete="new-phone"
              pattern="\\+?[0-9\\s()\-]{10,20}"
              required
            />
            {phoneError && (
              <span className="text-xs text-red-400 mt-1 block font-medium">
                {phoneError}
              </span>
            )}
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
                Password <span className="text-accent/60 lowercase tracking-widest ml-1 font-bold">(required)</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
                required
              />
            </div>
            <div>
              <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
                Confirm <span className="text-accent/60 lowercase tracking-widest ml-1 font-bold">(required)</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1.5 bg-accent text-primary border-none rounded-lg py-3.5 text-sm font-extrabold tracking-wider uppercase cursor-pointer transition-all duration-200 hover:bg-accent-hover hover:shadow-glow hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Registering..." : "Create Account"}
          </button>
        </form>

        <div className="text-center mt-4 text-[0.82rem] text-muted-2">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-accent cursor-pointer font-bold hover:underline"
          >
            Sign in here
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default CustomerRegister;
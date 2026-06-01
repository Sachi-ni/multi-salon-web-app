import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";

const Signup = () => {
  const [fname, setFname] = useState("");
  const [uname, setUname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/auth/register", {
        full_name: fname,
        username: uname,
        email: email,
        password: password,
        role: "super-admin",
      });
      console.log("Registration successful:", response.data);
      alert("Registration successful! Redirecting to login...");
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      alert(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-surface-2 border border-border rounded-lg px-3.5 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-muted focus:border-accent focus:bg-accent-dim/30";

  return (
    <div className="fixed inset-0 bg-primary flex items-center justify-center z-[1000] grid-bg">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-[460px] max-w-[96vw] bg-surface border border-border rounded-2xl p-10 shadow-modal max-h-[95vh] overflow-y-auto"
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

        <h1 className="text-2xl font-extrabold text-white mb-6">Create Account</h1>

        <form onSubmit={handleRegister}>
          {/* Full Name */}
          <div className="mb-3.5">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">Full Name</label>
            <input type="text" placeholder="Enter your full name" value={fname} onChange={(e) => setFname(e.target.value)} className={inputClass} required />
          </div>

          {/* Username */}
          <div className="mb-3.5">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">Username</label>
            <input type="text" placeholder="Username" value={uname} onChange={(e) => setUname(e.target.value)} className={inputClass} required />
          </div>

          {/* Email */}
          <div className="mb-3.5">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">Email</label>
            <input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
          </div>

          {/* Phone */}
          <div className="mb-3.5">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">Phone</label>
            <input type="tel" placeholder="07---XXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </div>

          {/* Passwords Row */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">Confirm</label>
              <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} required />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1.5 bg-accent text-primary border-none rounded-lg py-3.5 text-sm font-extrabold tracking-wider uppercase cursor-pointer transition-all duration-200 hover:bg-accent-hover hover:shadow-glow hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Registering..." : "Register Now"}
          </button>
        </form>

        {/* Switch */}
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

export default Signup;
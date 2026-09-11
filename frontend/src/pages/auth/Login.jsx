import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAlert } from "../../context/AlertContext";
import { motion } from "framer-motion";
import { API_URL } from "../../config";

const readResponse = async (response) => {
  const body = await response.text();
  if (!body) {
    return { message: `Login request failed (${response.status})` };
  }

  try {
    return JSON.parse(body);
  } catch {
    return { message: body };
  }
};

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showAlert } = useAlert();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      // Try admin login first
      let res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data = await readResponse(res);

      // Only try another account type when this email is not an Admin; a bad
      // SuperAdmin password must never silently become a customer session.
      if (res.status === 404) {
        res = await fetch(`${API_URL}/staff/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        data = await readResponse(res);
      }

      // Only try customer login when the email is not an Admin or Staff.
      if (res.status === 404) {
        res = await fetch(`${API_URL}/customers/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        data = await readResponse(res);
      }

      if (!res.ok) {
        const msg = data.message || "Login failed";
        setError(msg);
        showAlert(msg);
        setLoading(false);
        return;
      }

      if (data.requiresHardening) {
        navigate("/super-admin-hardening", {
          state: { token: data.token, hardeningStep: data.hardeningStep },
        });
        setLoading(false);
        return;
      }

      const { token, ...userData } = data;
      login(userData, token);

      // Redirect based on role
      if (data.role === "super-admin") {
        navigate("/superAdminDashboard");
      } else if (data.role === "customer") {
        navigate("/");
      } else if (userData.salon_id) {
        // If they have a salon_id, they are some kind of staff/manager
        if (data.role === "manager") {
          navigate(`/salon-admin/${userData.salon_id}/adminDashboard`);
        } else {
          // Normal staff go to staffDashboard
          navigate(`/staff/dashboard`);
        }
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Login error:", err);
      const msg = err.message || "Unable to reach the server. Please try again.";
      setError(msg);
      showAlert(msg);
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await handleLogin();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[1000] overflow-y-auto py-6 px-4">
      {/* Background Image with Overlay */}
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
        className="relative z-10 w-[460px] max-w-full bg-surface/80 backdrop-blur-sm border border-border rounded-2xl p-6 sm:p-10 shadow-modal my-auto"
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

        <h1 className="text-2xl font-extrabold text-white mb-6">Welcome Back</h1>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 px-3.5 py-2.5 rounded-xl bg-danger-dim border border-danger-border text-xs text-danger font-semibold flex items-center gap-2"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mb-3.5">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-muted focus:border-accent focus:bg-accent-dim/30"
              autoComplete="new-email"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-muted focus:border-accent focus:bg-accent-dim/30"
              autoComplete="new-password"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1.5 bg-accent text-primary border-none rounded-lg py-3.5 text-sm font-extrabold tracking-wider uppercase cursor-pointer transition-all duration-200 hover:bg-accent-hover hover:shadow-glow hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing In...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="text-right mt-3">
          <button type="button" onClick={() => navigate("/forgot-password")} className="text-sm text-accent font-bold hover:underline">
            Forgot password?
          </button>
        </div>

        {/* Switch */}
        <div className="text-center mt-4 text-[0.82rem] text-muted-2">
          No account?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-accent cursor-pointer font-bold hover:underline"
          >
            Register here
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { API_URL } from "../../config";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Please enter a valid email address");
      setMessage(data.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

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
        className="relative z-10 w-[460px] max-w-[96vw] bg-surface/80 backdrop-blur-sm border border-border rounded-2xl p-10 shadow-modal max-h-[95vh] overflow-y-auto"
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-accent to-accent-hover rounded-t-2xl" />
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center text-base font-black text-primary">S</div>
          <span className="text-xl font-black text-accent tracking-tight">SalonHub</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-2">Forgot Password</h1>
        <p className="text-sm text-muted-2 mb-6">Enter your email and we will send a reset link if an account exists.</p>

        {message ? (
          <div className="rounded-lg border border-accent/40 bg-accent-dim/30 px-4 py-3 text-sm text-accent">{message}</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent"
              autoComplete="email"
            />
            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-5 bg-accent text-primary border-none rounded-lg py-3.5 text-sm font-extrabold tracking-wider uppercase disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <Link to="/login" className="block text-center mt-5 text-sm text-accent font-bold hover:underline">Back to login</Link>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
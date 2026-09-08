import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { API_URL } from "../../config";

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[\S]{8,}$/;

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(token ? "" : "This reset link is missing its token.");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!success) return undefined;
    const timeout = setTimeout(() => navigate("/login"), 1800);
    return () => clearTimeout(timeout);
  }, [navigate, success]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!token) return setError("This reset link is missing its token.");
    if (!passwordPattern.test(newPassword)) {
      return setError("Password must be at least 8 characters and include uppercase, lowercase, number, and special character");
    }
    if (newPassword !== confirmPassword) return setError("Passwords do not match");

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to reset password");
      setSuccess(data.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-primary flex items-center justify-center z-[1000] grid-bg px-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 w-[460px] max-w-[96vw] bg-surface border border-border rounded-2xl p-10 shadow-modal">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-accent to-accent-hover rounded-t-2xl" />
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center text-base font-black text-primary">S</div>
          <span className="text-xl font-black text-accent tracking-tight">SalonHub</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-2">Reset Password</h1>
        <p className="text-sm text-muted-2 mb-6">Choose a new password for your account.</p>

        {success ? (
          <div className="rounded-lg border border-accent/40 bg-accent-dim/30 px-4 py-3 text-sm text-accent">{success}. Redirecting to login...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">New password</label>
            <input type="password" required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent" autoComplete="new-password" />
            <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mt-4 mb-1.5">Confirm password</label>
            <input type="password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent" autoComplete="new-password" />
            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
            <button type="submit" disabled={loading} className="w-full mt-5 bg-accent text-primary border-none rounded-lg py-3.5 text-sm font-extrabold tracking-wider uppercase disabled:opacity-50">{loading ? "Resetting..." : "Reset Password"}</button>
          </form>
        )}
        <Link to="/login" className="block text-center mt-5 text-sm text-accent font-bold hover:underline">Back to login</Link>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
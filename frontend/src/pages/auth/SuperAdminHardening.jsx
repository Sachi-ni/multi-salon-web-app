import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_URL } from "../../config";
import { useAuth } from "../../context/AuthContext";

const SuperAdminHardening = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(location.state?.hardeningStep || "change-password");
  const [token, setToken] = useState(location.state?.token || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const endpoint = step === "change-password" ? "/auth/change-password" : "/auth/mfa/setup";
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: step === "change-password" ? JSON.stringify({ password }) : undefined,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Security setup failed");

      if (step === "change-password") {
        if (data.token && data.role === "super-admin") {
          const { token: sessionToken, ...userData } = data;
          login(userData, sessionToken);
          navigate("/superAdminDashboard", { replace: true });
          return;
        }
        setPassword("");
        setToken(data.token);
        setStep("mfa-setup");
        return;
      }

      const profileResponse = await fetch(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      const profile = await profileResponse.json();
      if (!profileResponse.ok) throw new Error(profile.message || "Could not load your profile");
      login(profile, data.token);
      navigate("/superAdminDashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-primary flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-md bg-surface border border-border rounded-2xl p-8">
        <h1 className="text-2xl font-extrabold text-white mb-2">Secure your account</h1>
        <p className="text-sm text-muted-2 mb-6">
          {step === "change-password" ? "Choose a new password before continuing." : "Complete MFA setup before opening the dashboard."}
        </p>
        {step === "change-password" && (
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New strong password"
            className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-3 text-sm text-white outline-none focus:border-accent"
          />
        )}
        {step === "mfa-setup" && <p className="text-sm text-white mb-5">Click continue to enroll MFA for this account.</p>}
        {error && <p className="text-sm text-danger mt-4">{error}</p>}
        <button type="submit" disabled={loading} className="w-full mt-6 bg-accent text-primary rounded-lg py-3 font-bold disabled:opacity-60">
          {loading ? "Please wait..." : step === "change-password" ? "Continue to MFA setup" : "Finish and open dashboard"}
        </button>
      </form>
    </div>
  );
};

export default SuperAdminHardening;

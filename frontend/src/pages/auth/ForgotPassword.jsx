import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { API_URL } from "../../config";
import useFormValidation from "../../hooks/useFormValidation";
import { validateConfirmPassword, validateEmail, validatePassword } from "../../utils/validation";
import { readJsonResponse } from "../../utils/apiResponse";

const GENERIC_SENT_MESSAGE = "If this email is registered, an OTP has been sent.";
const INVALID_CODE_MESSAGE = "Invalid or expired code";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resetSessionToken, setResetSessionToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const emailForm = useFormValidation({ email }, { email: validateEmail });
  const passwordForm = useFormValidation(
    { newPassword, confirmPassword },
    { newPassword: validatePassword, confirmPassword: (value, values) => validateConfirmPassword(values.newPassword, value) },
  );

  useEffect(() => {
    if (resendTimer <= 0) return undefined;
    const timer = setInterval(() => setResendTimer((value) => Math.max(value - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  const sendOtp = async (isResend = false) => {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
    });
    const data = await readJsonResponse(response);
    if (!response.ok) throw new Error(data.message || "Unable to send code. Please try again.");
    setResendTimer(60);
    setMessage(data.message || GENERIC_SENT_MESSAGE);
    if (!isResend) setStep("otp");
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    setError(""); setMessage("");
    if (!emailForm.validateAll()) return;
    setLoading(true);
    try { await sendOtp(); } catch (requestError) { setError(requestError.message); } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    const code = otpCode.trim();
    if (code.length !== 6) { setError(INVALID_CODE_MESSAGE); return; }
    setError(""); setMessage(""); setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/verify-password-reset-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otpCode: code }),
      });
      const data = await readJsonResponse(response);
      if (!response.ok || !data.resetSessionToken) throw new Error(INVALID_CODE_MESSAGE);
      setResetSessionToken(data.resetSessionToken);
      setOtpCode("");
      setStep("password");
    } catch { setError(INVALID_CODE_MESSAGE); } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || resending) return;
    setError(""); setMessage(""); setResending(true);
    try { await sendOtp(true); } catch (requestError) { setError(requestError.message); } finally { setResending(false); }
  };

  const restart = (restartMessage = "") => {
    setStep("email"); setOtpCode(""); setResetSessionToken(""); setNewPassword(""); setConfirmPassword("");
    setResendTimer(0); setError(""); setMessage(restartMessage);
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!resetSessionToken) { restart("Your reset session has expired. Please request a new code."); return; }
    if (!passwordForm.validateAll()) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resetSessionToken, newPassword }),
      });
      const data = await readJsonResponse(response);
      if (!response.ok) throw new Error(data.message || INVALID_CODE_MESSAGE);
      restart();
      navigate("/login", { replace: true, state: { message: "Password reset successfully. Please sign in." } });
    } catch { restart("Your reset session has expired. Please request a new code."); } finally { setLoading(false); }
  };

  const inputClass = (hasError) => `w-full bg-surface-2 border border-border rounded-lg px-3.5 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent ${hasError ? "border-red-500/50 focus:border-red-500" : ""}`;
  const title = step === "email" ? "Forgot Password" : step === "otp" ? "Verify Your Code" : "Reset Password";
  const description = step === "email" ? "Enter your email to receive a password reset code." : step === "otp" ? "Enter the 6-digit code sent to your email." : "Choose a new password for your account.";

  return <div className="fixed inset-0 flex items-center justify-center z-[1000] overflow-hidden px-4">
    <div className="absolute inset-0 z-0"><div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/60 to-primary/80 z-10" /><img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2574&auto=format&fit=crop" alt="Premium Salon Background" className="w-full h-full object-cover object-center opacity-50" /></div>
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 w-[460px] max-w-[96vw] bg-surface/80 backdrop-blur-sm border border-border rounded-2xl p-10 shadow-modal max-h-[95vh] overflow-y-auto">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-accent to-accent-hover rounded-t-2xl" />
      <div className="flex items-center gap-2.5 mb-1.5"><div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center text-base font-black text-primary">S</div><span className="text-xl font-black text-accent tracking-tight">SalonHub</span></div>
      <h1 className="text-2xl font-extrabold text-white mb-2">{title}</h1><p className="text-sm text-muted-2 mb-6">{description}</p>
      {message && <div className="mb-4 rounded-lg border border-accent/40 bg-accent-dim/30 px-4 py-3 text-sm text-accent">{message}</div>}
      {error && <div className="mb-4 rounded-lg border border-red-500/40 bg-danger-dim px-4 py-3 text-sm text-red-300">{error}</div>}
      {step === "email" && <form onSubmit={handleEmailSubmit} noValidate><label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">Email</label><input type="email" required value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} onBlur={() => emailForm.handleBlur("email")} aria-invalid={Boolean(emailForm.errors.email)} className={inputClass(emailForm.errors.email)} autoComplete="email" />{emailForm.errors.email && <p className="mt-1 text-xs text-red-300">{emailForm.errors.email}</p>}{!emailForm.errors.email && emailForm.fieldMessages.email && <p className="mt-1 text-xs text-muted-2 font-medium">{emailForm.fieldMessages.email}</p>}<button type="submit" disabled={loading || !emailForm.isValid} className="w-full mt-5 bg-accent text-primary border-none rounded-lg py-3.5 text-sm font-extrabold tracking-wider uppercase disabled:opacity-50">{loading ? "Sending..." : "Send OTP"}</button></form>}
      {step === "otp" && <form onSubmit={handleVerifyOtp} noValidate><div className="mb-4"><label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-2">6-Digit Authentication Code</label><input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="------" value={otpCode} onChange={(event) => { setOtpCode(event.target.value.replace(/[^0-9]/g, "")); setError(""); }} className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-3 text-center text-2xl font-black text-accent tracking-[0.45em] outline-none transition-all duration-200 placeholder:text-muted focus:border-accent focus:bg-accent-dim/30" autoFocus /></div><div className="flex items-center justify-between text-xs mb-5"><span className="text-muted-2">Didn't receive the code?</span>{resendTimer > 0 ? <span className="text-muted font-semibold">Resend in {resendTimer}s</span> : <button type="button" onClick={handleResend} disabled={resending} className="text-accent font-bold hover:underline cursor-pointer disabled:opacity-50">{resending ? "Sending..." : "Resend Code"}</button>}</div><button type="submit" disabled={loading || otpCode.length !== 6} className="w-full bg-accent text-primary border-none rounded-lg py-3.5 text-sm font-extrabold tracking-wider uppercase cursor-pointer transition-all duration-200 hover:bg-accent-hover hover:shadow-glow hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed">{loading ? "Verifying Code..." : "Verify Code"}</button><div className="text-center mt-4"><button type="button" onClick={() => restart()} className="text-xs text-muted-2 hover:text-white font-semibold">&larr; Start over</button></div></form>}
      {step === "password" && <form onSubmit={handlePasswordSubmit} noValidate><label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">New password</label><div className="relative"><input type={showNewPassword ? "text" : "password"} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} onBlur={() => passwordForm.handleBlur("newPassword")} className={`${inputClass(passwordForm.errors.newPassword)} pr-10`} autoComplete="new-password" /><button type="button" onClick={() => setShowNewPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-2 hover:text-white" aria-label={showNewPassword ? "Hide password" : "Show password"}>{showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>{passwordForm.errors.newPassword && <p className="mt-1 text-xs text-red-300">{passwordForm.errors.newPassword}</p>}<label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mt-4 mb-1.5">Confirm password</label><div className="relative"><input type={showConfirmPassword ? "text" : "password"} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} onBlur={() => passwordForm.handleBlur("confirmPassword")} className={`${inputClass(passwordForm.errors.confirmPassword)} pr-10`} autoComplete="new-password" /><button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-2 hover:text-white" aria-label={showConfirmPassword ? "Hide password" : "Show password"}>{showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>{passwordForm.errors.confirmPassword && <p className="mt-1 text-xs text-red-300">{passwordForm.errors.confirmPassword}</p>}<button type="submit" disabled={loading || !passwordForm.isValid} className="w-full mt-5 bg-accent text-primary border-none rounded-lg py-3.5 text-sm font-extrabold tracking-wider uppercase disabled:opacity-50">{loading ? "Resetting..." : "Reset Password"}</button></form>}
      <Link to="/login" className="block text-center mt-5 text-sm text-accent font-bold hover:underline">Back to login</Link>
    </motion.div>
  </div>;
};

export default ForgotPassword;

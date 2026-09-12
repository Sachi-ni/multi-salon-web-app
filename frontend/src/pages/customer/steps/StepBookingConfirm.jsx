import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { createAppointment } from "../../../services/appointmentService";
import useFormValidation from "../../../hooks/useFormValidation";
import { validatePhoneGeneric } from "../../../utils/validation";

export default function StepBookingConfirm({ booking, onBack }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Guest details state
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const { errors, handleBlur, validateAll, isValid } = useFormValidation({ guestPhone }, {
    guestPhone: (value) => user ? { valid: true, message: "" } : validatePhoneGeneric(value),
  });

  // Convert 24h time to 12h format
  const formatTime = (time) => {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
  };

  const handleSubmit = async () => {
    if (!user && !validateAll()) return;
    if (!user && (!guestName || !guestPhone)) {
      setError("Please provide your Name and Phone Number to complete the booking.");
      return;
    }

    if (!user && !/^\+?[0-9]{10}$/.test(guestPhone.replace(/[\s()-]/g, ""))) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Map to the new per-service format
      const servicesPayload = booking.services.map(s => ({
        service_id: s.serviceId,
        staff_id: s.staffId,
        start_time: s.startTime
      }));

      await createAppointment({
        salon_id: booking.salonId,
        appointment_date: booking.date,
        services: servicesPayload,
        notes: "",
        guest_name: !user ? guestName : undefined,
        guest_phone: !user ? guestPhone : undefined,
      });

      if (!user) {
        window.alert("Your booking has been submitted as pending! Our salon will review and confirm it shortly.");
        navigate("/");
      } else {
        navigate("/customer/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Booking failed. Please try again.");
      setLoading(false);
    }
  };

  const totalPrice = booking.services.reduce((sum, s) => sum + s.servicePrice, 0);

  return (
    <div>
      <h2 className="text-lg font-extrabold text-white mb-1">Confirm Your Booking</h2>
      <p className="text-muted-2 text-sm mb-5">Review your appointment details before confirming</p>

      {/* Summary card */}
      <div className="bg-surface-2 border border-border rounded-xl p-4 space-y-4">
        {/* Salon + Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-surface-3 rounded-lg p-3">
            <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider mb-1">Salon</p>
            <p className="text-white font-bold text-sm">{booking.salonName}</p>
          </div>
          <div className="bg-surface-3 rounded-lg p-3">
            <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider mb-1">Date</p>
            <p className="text-white font-bold text-sm">{booking.date}</p>
          </div>
        </div>

        {/* Services & Staff */}
        <div className="bg-surface-3 rounded-lg p-3">
          <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider mb-2">
            Services & Assigned Staff
          </p>
          <div className="space-y-3">
            {booking.services.map((svc, idx) => {
              const svcHours = Math.ceil(svc.serviceDuration / 60);
              return (
                <div key={idx} className="pb-3 border-b border-border/50 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-white font-bold text-sm">{svc.serviceName}</p>
                    <p className="text-accent font-extrabold text-sm">LKR {svc.servicePrice}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-2">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-white font-semibold">{svc.staffName}</span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatTime(svc.startTime)} — {formatTime(svc.endTime)}
                    </span>
                    <span>·</span>
                    <span>{svcHours} {svcHours === 1 ? "hr" : "hrs"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-muted-2 text-sm font-bold">Total Amount</p>
          <p className="text-accent text-xl font-black">LKR {totalPrice}</p>
        </div>
      </div>

      {/* Guest Booking Details */}
      {!user && (
        <div className="mt-6 bg-surface-2 border border-border rounded-xl p-4">
          <h3 className="text-white font-bold text-sm mb-3">Your Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted-2 mb-1.5 uppercase tracking-wider">Full Name *</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-surface-3 border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:border-accent focus:outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-2 mb-1.5 uppercase tracking-wider">Phone Number *</label>
              <input
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                onBlur={() => handleBlur("guestPhone")}
                placeholder="Enter your phone number"
                inputMode="tel"
                className="w-full bg-surface-3 border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:border-accent focus:outline-none transition-colors"
                required
              />
              {errors.guestPhone && <p className="text-xs text-red-400 mt-1">{errors.guestPhone}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Status note */}
      <div className="mt-3 p-3 bg-info-dim border border-info-border rounded-lg flex items-start gap-2">
        <svg className="w-4 h-4 text-info flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-info text-xs font-semibold">
          Your booking will be submitted as <strong>Pending</strong>. The salon admin will review and confirm your appointment.
        </p>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-danger-dim border border-danger-border rounded-lg">
          <p className="text-danger text-xs font-bold">{error}</p>
        </div>
      )}

      <div className="flex justify-between mt-6">
        <button onClick={onBack} disabled={loading} className="px-6 py-2.5 bg-surface-2 text-muted-2 text-sm font-bold rounded-lg border border-border hover:border-border-hover transition-all duration-200 disabled:opacity-40">
          ← Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !isValid}
          className="px-6 py-2.5 bg-accent text-primary text-sm font-extrabold rounded-lg hover:bg-accent-hover transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-glow"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Booking...
            </span>
          ) : "Confirm Booking ✓"}
        </button>
      </div>
    </div>
  );
}

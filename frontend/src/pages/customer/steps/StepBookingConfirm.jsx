import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { createAppointment } from "../../../services/appointmentService";

export default function StepBookingConfirm({ booking, onBack }) {
  const navigate          = useNavigate();
  const { user }          = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  
  // Guest details state
  const [guestName, setGuestName]   = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const durationHours = Math.ceil(booking.serviceDuration / 60);

  // Convert 24h time to 12h format
  const formatTime = (time) => {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
  };

  const handleSubmit = async () => {
    if (!user && (!guestName || !guestPhone)) {
      setError("Please provide your Name and Phone Number to complete the booking.");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      await createAppointment({
        salon_id:         booking.salonId,
        service_id:       booking.serviceId,
        staff_id:         booking.staffId,
        appointment_date: booking.date,
        start_time:       booking.startTime,
        notes:            "",
        guest_name:       !user ? guestName : undefined,
        guest_phone:      !user ? guestPhone : undefined,
      });
      
      if (!user) {
        window.alert("Your booking has been submitted as pending! Our salon will review and confirm it shortly.");
        navigate("/");
      } else {
        navigate("/my-appointments");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Booking failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-extrabold text-white mb-1">Confirm Your Booking</h2>
      <p className="text-muted-2 text-sm mb-5">Review your appointment details before confirming</p>

      {/* Summary card */}
      <div className="bg-surface-2 border border-border rounded-xl p-4 space-y-4">

        {/* Salon + Date */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-3 rounded-lg p-3">
            <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider mb-1">Salon</p>
            <p className="text-white font-bold text-sm">{booking.salonName}</p>
          </div>
          <div className="bg-surface-3 rounded-lg p-3">
            <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider mb-1">Date</p>
            <p className="text-white font-bold text-sm">{booking.date}</p>
          </div>
        </div>

        {/* Service */}
        <div className="bg-surface-3 rounded-lg p-3">
          <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider mb-2">Service</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-sm">{booking.serviceName}</p>
              <p className="text-muted-2 text-xs mt-0.5">
                {durationHours} {durationHours === 1 ? "Hour" : "Hours"}
              </p>
            </div>
            <p className="text-accent font-extrabold text-sm">LKR {booking.servicePrice}</p>
          </div>
        </div>

        {/* Staff */}
        <div className="bg-surface-3 rounded-lg p-3">
          <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider mb-2">Staff Member</p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent text-primary flex items-center justify-center flex-shrink-0">
              <span className="font-black text-xs">
                {booking.staffName?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-white font-bold text-sm">{booking.staffName}</p>
              {booking.staffSpecification && (
                <p className="text-muted-2 text-xs">{booking.staffSpecification}</p>
              )}
            </div>
          </div>
        </div>

        {/* Time */}
        <div className="bg-surface-3 rounded-lg p-3">
          <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider mb-2">Time Slot</p>
          <div className="flex items-center justify-between">
            <p className="text-white font-bold text-sm">
              {formatTime(booking.startTime)} — {formatTime(booking.endTime)}
            </p>
            {durationHours > 1 && (
              <span className="px-2 py-0.5 bg-accent-dim text-accent text-xs font-bold rounded border border-accent/20">
                {durationHours} Slots
              </span>
            )}
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <p className="text-muted-2 text-sm font-bold">Total Amount</p>
          <p className="text-accent text-xl font-black">LKR {booking.servicePrice}</p>
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
                placeholder="Enter your phone number"
                className="w-full bg-surface-3 border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:border-accent focus:outline-none transition-colors"
                required
              />
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
          disabled={loading}
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

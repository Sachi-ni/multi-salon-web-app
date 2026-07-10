import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAppointment } from "../../../services/appointmentService";

export default function StepConfirm({ booking, onBack }) {
  const navigate          = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const total = booking.services.reduce((sum, s) => sum + s.base_price, 0);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      await createAppointment({
        salon_id: booking.salonId,
        date:     booking.date,
        services: booking.services.map(s => ({
          service_id: s.service_id, staff_id: s.staff_id,
          slot: s.slot, availabilityId: s.availabilityId,
        })),
        notes: "",
      });
      navigate("/customer/dashboard");
    } catch {
      setError("Booking failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-extrabold text-white mb-1">Confirm Booking</h2>
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

        {/* Services */}
        <div>
          <p className="text-muted-2 text-2xs font-bold uppercase tracking-wider mb-2">Services</p>
          <div className="space-y-2">
            {booking.services.map(s => (
              <div key={s.service_id} className="bg-surface-3 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-white font-bold text-sm">{s.service_name}</p>
                  <p className="text-accent font-extrabold text-sm">LKR {s.base_price}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-2">
                  <span>with {s.staff_name}</span>
                  <span>·</span>
                  <span>{s.slot?.start_time} – {s.slot?.end_time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <p className="text-muted-2 text-sm font-bold">Total</p>
          <p className="text-accent text-xl font-black">LKR {total}</p>
        </div>
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
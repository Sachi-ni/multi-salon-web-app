import { useEffect, useState } from "react";
import { getAvailableSlots } from "../../../services/appointmentService";

export default function StepSelectTimeSlot({ booking, onNext, onBack }) {
  const [slots, setSlots] = useState([]);
  const [selected, setSelected] = useState(booking.startTime || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const durationHours = Math.ceil((booking.totalDuration || booking.serviceDuration) / 60);

  useEffect(() => {
    // Collect all service IDs from the booking
    const serviceIds = booking.services && booking.services.length > 0
      ? booking.services.map(s => s.serviceId)
      : [booking.serviceId];

    getAvailableSlots(booking.staffId, booking.date, serviceIds, booking.salonId)
      .then(res => setSlots(res.data))
      .catch(err => setError(err?.response?.data?.message || "Failed to load available time slots."))
      .finally(() => setLoading(false));
  }, [booking.staffId, booking.date, booking.services, booking.serviceId, booking.salonId]);

  const handleNext = () => {
    const slot = slots.find(s => s.start_time === selected);
    if (!slot) return;
    onNext({
      startTime: slot.start_time,
      endTime: slot.end_time,
    });
  };

  // Convert 24h time to 12h format
  const formatTime = (time) => {
    const [h, m] = time.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return <p className="text-danger text-sm">{error}</p>;

  return (
    <div>
      <h2 className="text-lg font-extrabold text-white mb-1">Select a Time Slot</h2>
      <p className="text-muted-2 text-sm mb-2">Choose your preferred time for the appointment</p>

      {/* Info badge */}
      <div className="mb-5 p-3 bg-surface-2 border border-border rounded-xl">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-muted-2">Duration:</span>
            <span className="text-white font-bold">{durationHours} {durationHours === 1 ? "Hour" : "Hours"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-muted-2">Slots needed:</span>
            <span className="text-white font-bold">{durationHours}</span>
          </div>
        </div>
      </div>

      {slots.length === 0 ? (
        <div className="p-6 bg-surface-2 border border-border rounded-xl text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-warning-dim border border-warning-border flex items-center justify-center">
            <svg className="w-6 h-6 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-white font-bold text-sm mb-1">No Available Slots</p>
          <p className="text-muted-2 text-xs">
            No {durationHours > 1 ? `${durationHours} consecutive ` : ""}time slots are available for this staff member on {booking.date}.
          </p>
          <p className="text-muted-2 text-xs mt-1">Try selecting a different date or staff member.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {slots.map((slot, i) => {
            const isSelected = selected === slot.start_time;
            return (
              <button
                key={i}
                onClick={() => setSelected(slot.start_time)}
                className={`p-3.5 rounded-xl border text-left transition-all duration-200
                  ${isSelected
                    ? "border-accent bg-accent-dim shadow-glow-sm"
                    : "border-border bg-surface-2 hover:border-border-hover"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-bold text-sm ${isSelected ? "text-accent" : "text-white"}`}>
                      {formatTime(slot.start_time)} — {formatTime(slot.end_time)}
                    </p>
                    {slot.required_slots > 1 && (
                      <p className="text-muted-2 text-xs mt-0.5">
                        {slot.required_slots} consecutive slots
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex justify-between mt-6">
        <button onClick={onBack} className="px-6 py-2.5 bg-surface-2 text-muted-2 text-sm font-bold rounded-lg border border-border hover:border-border-hover transition-all duration-200">
          ← Back
        </button>
        <button
          disabled={!selected || slots.length === 0}
          onClick={handleNext}
          className="px-6 py-2.5 bg-accent text-primary text-sm font-extrabold rounded-lg hover:bg-accent-hover transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-glow"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

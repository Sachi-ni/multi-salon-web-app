import { useEffect, useState, useCallback } from "react";
import { getAvailableStaff, getAvailableSlots } from "../../../services/appointmentService";

export default function StepAssignStaffAndTime({ booking, onNext, onBack }) {
  // Each service entry: { serviceId, serviceName, serviceDuration, servicePrice, staffId?, staffName?, staffSpecification?, startTime?, endTime? }
  const [assignments, setAssignments] = useState(() =>
    (booking.services || []).map(s => ({
      ...s,
      staffId: s.staffId || "",
      staffName: s.staffName || "",
      staffSpecification: s.staffSpecification || "",
      startTime: s.startTime || "",
      endTime: s.endTime || "",
    }))
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState("staff"); // 'staff' | 'time'

  // Data for current step
  const [staffList, setStaffList] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const current = assignments[currentIndex];
  const totalServices = assignments.length;
  const allAssigned = assignments.every(a => a.staffId && a.startTime);

  // Fetch staff for current service
  const fetchStaff = useCallback(async () => {
    if (!current) return;
    setLoading(true);
    setError("");
    try {
      const res = await getAvailableStaff(booking.date, [current.serviceId], booking.salonId);
      setStaffList(res.data);
    } catch {
      setError("Failed to load available staff.");
    } finally {
      setLoading(false);
    }
  }, [booking.date, booking.salonId, current]);

  // Fetch time slots for current service + selected staff
  const fetchSlots = useCallback(async () => {
    if (!current?.staffId) return;
    setLoading(true);
    setError("");
    try {
      const res = await getAvailableSlots(current.staffId, booking.date, [current.serviceId], booking.salonId);
      
      // Filter out slots that overlap with previously assigned services
      const previousAssignments = assignments.slice(0, currentIndex).filter(a => a.startTime && a.endTime);
      
      const validSlots = res.data.filter(slot => {
        for (const prev of previousAssignments) {
          // Check if times overlap (start1 < end2 && start2 < end1)
          if (slot.start_time < prev.endTime && prev.startTime < slot.end_time) {
            return false;
          }
        }
        return true;
      });

      setSlots(validSlots);
    } catch {
      setError("Failed to load available time slots.");
    } finally {
      setLoading(false);
    }
  }, [booking.date, booking.salonId, current, assignments, currentIndex]);

  useEffect(() => {
    if (phase === "staff") {
      fetchStaff();
    } else {
      fetchSlots();
    }
  }, [phase, currentIndex, fetchStaff, fetchSlots]);

  const selectStaff = (member) => {
    const updated = [...assignments];
    updated[currentIndex] = {
      ...updated[currentIndex],
      staffId: member.staff_id,
      staffName: member.full_name,
      staffSpecification: member.specification || "",
      startTime: "",
      endTime: "",
    };
    setAssignments(updated);
    setPhase("time");
  };

  const selectTime = (slot) => {
    const updated = [...assignments];
    updated[currentIndex] = {
      ...updated[currentIndex],
      startTime: slot.start_time,
      endTime: slot.end_time,
    };
    setAssignments(updated);

    // Move to next service or show summary
    if (currentIndex < totalServices - 1) {
      setCurrentIndex(currentIndex + 1);
      setPhase("staff");
    } else {
      setPhase("done");
    }
  };

  const handleBack = () => {
    if (phase === "time") {
      // Go back to staff selection for this service
      const updated = [...assignments];
      updated[currentIndex] = {
        ...updated[currentIndex],
        staffId: "",
        staffName: "",
        staffSpecification: "",
        startTime: "",
        endTime: "",
      };
      setAssignments(updated);
      setPhase("staff");
    } else if (phase === "done") {
      // Go back to last service's time selection
      setCurrentIndex(totalServices - 1);
      setPhase("time");
    } else if (currentIndex > 0) {
      // Go back to previous service's time selection
      const updated = [...assignments];
      updated[currentIndex] = {
        ...updated[currentIndex],
        staffId: "",
        staffName: "",
        staffSpecification: "",
        startTime: "",
        endTime: "",
      };
      // Also clear previous service's time so they can re-pick
      updated[currentIndex - 1] = {
        ...updated[currentIndex - 1],
        startTime: "",
        endTime: "",
      };
      setAssignments(updated);
      setCurrentIndex(currentIndex - 1);
      setPhase("time");
    } else {
      // First service, staff phase -> go back to service selection
      onBack();
    }
  };

  const handleNext = () => {
    onNext({ services: assignments });
  };

  // Convert 24h time to 12h format
  const formatTime = (time) => {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
  };

  // Loading state
  if (loading && phase !== "done") return (
    <div>
      <h2 className="text-lg font-extrabold text-white mb-1">
        Assign Staff & Time
      </h2>
      <p className="text-muted-2 text-sm mb-5">
        Service {currentIndex + 1} of {totalServices}: {current?.serviceName}
      </p>
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (error && phase !== "done") return (
    <div>
      <p className="text-danger text-sm mb-4">{error}</p>
      <button onClick={handleBack} className="px-6 py-2.5 bg-surface-2 text-muted-2 text-sm font-bold rounded-lg border border-border hover:border-border-hover transition-all duration-200">
        ← Back
      </button>
    </div>
  );

  // ─── STAFF SELECTION PHASE ──────────────────────────────────────
  if (phase === "staff") {
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-extrabold text-white">Select Staff</h2>
          <span className="px-2.5 py-1 bg-accent-dim text-accent text-xs font-bold rounded-lg border border-accent/20">
            {currentIndex + 1} / {totalServices}
          </span>
        </div>
        <p className="text-muted-2 text-sm mb-5">
          Choose a staff member for <span className="text-accent font-bold">{current.serviceName}</span>
        </p>

        {/* Progress bar */}
        <div className="mb-5 flex gap-1.5">
          {assignments.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i < currentIndex ? "bg-accent" : i === currentIndex ? "bg-accent/60" : "bg-surface-2"
              }`}
            />
          ))}
        </div>

        {staffList.length === 0 ? (
          <div className="p-6 bg-surface-2 border border-border rounded-xl text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-danger-dim border border-danger-border flex items-center justify-center">
              <svg className="w-6 h-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-white font-bold text-sm mb-1">No Staff Available</p>
            <p className="text-muted-2 text-xs">No staff members are available for "{current.serviceName}" on {booking.date}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {staffList.map(member => (
              <div
                key={member.staff_id}
                onClick={() => selectStaff(member)}
                className="p-4 rounded-xl border cursor-pointer transition-all duration-200 border-border bg-surface-2 hover:border-accent hover:bg-accent-dim/30"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 bg-surface-3 border border-border text-accent`}>
                  <span className="font-black text-sm">
                    {member.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="text-white font-bold text-sm">{member.full_name}</p>
                {member.role && <p className="text-muted-2 text-xs mt-0.5">{member.role}</p>}
                {member.specification && <p className="text-accent text-xs mt-1 font-semibold">{member.specification}</p>}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between mt-6">
          <button onClick={handleBack} className="px-6 py-2.5 bg-surface-2 text-muted-2 text-sm font-bold rounded-lg border border-border hover:border-border-hover transition-all duration-200">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ─── TIME SLOT SELECTION PHASE ──────────────────────────────────
  if (phase === "time") {
    const durationHours = Math.ceil(current.serviceDuration / 60);
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-extrabold text-white">Select Time Slot</h2>
          <span className="px-2.5 py-1 bg-accent-dim text-accent text-xs font-bold rounded-lg border border-accent/20">
            {currentIndex + 1} / {totalServices}
          </span>
        </div>
        <p className="text-muted-2 text-sm mb-2">
          Choose a time for <span className="text-accent font-bold">{current.serviceName}</span>
          {" "}with <span className="text-white font-bold">{current.staffName}</span>
        </p>

        {/* Progress bar */}
        <div className="mb-4 flex gap-1.5">
          {assignments.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i < currentIndex ? "bg-accent" : i === currentIndex ? "bg-accent/60" : "bg-surface-2"
              }`}
            />
          ))}
        </div>

        {/* Info badge */}
        <div className="mb-4 p-3 bg-surface-2 border border-border rounded-xl">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-muted-2">Duration:</span>
              <span className="text-white font-bold">{durationHours} {durationHours === 1 ? "Hour" : "Hours"}</span>
            </div>
          </div>
        </div>

        {slots.length === 0 ? (
          <div className="p-6 bg-surface-2 border border-border rounded-xl text-center">
            <p className="text-white font-bold text-sm mb-1">No Available Slots</p>
            <p className="text-muted-2 text-xs">Try selecting a different staff member.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {slots.map((slot, i) => (
              <button
                key={i}
                onClick={() => selectTime(slot)}
                className="p-3.5 rounded-xl border text-left transition-all duration-200 border-border bg-surface-2 hover:border-accent hover:bg-accent-dim/30"
              >
                <p className="font-bold text-sm text-white">
                  {formatTime(slot.start_time)} — {formatTime(slot.end_time)}
                </p>
                {slot.required_slots > 1 && (
                  <p className="text-muted-2 text-xs mt-0.5">
                    {slot.required_slots} consecutive slots
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-between mt-6">
          <button onClick={handleBack} className="px-6 py-2.5 bg-surface-2 text-muted-2 text-sm font-bold rounded-lg border border-border hover:border-border-hover transition-all duration-200">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ─── DONE PHASE — ALL ASSIGNED, SHOW SUMMARY ───────────────────
  return (
    <div>
      <h2 className="text-lg font-extrabold text-white mb-1">All Services Assigned</h2>
      <p className="text-muted-2 text-sm mb-5">Review your staff and time selections before proceeding</p>

      <div className="space-y-3">
        {assignments.map((svc, i) => {
          const svcHours = Math.ceil(svc.serviceDuration / 60);
          return (
            <div key={svc.serviceId || i} className="p-4 bg-surface-2 border border-border rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white font-bold text-sm">{svc.serviceName}</p>
                <p className="text-accent font-extrabold text-sm">LKR {svc.servicePrice}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-2">
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

      {/* Total */}
      <div className="mt-4 p-3 bg-surface-2 border border-border rounded-xl flex items-center justify-between">
        <span className="text-muted-2 text-sm font-bold">Total</span>
        <span className="text-accent text-lg font-black">
          LKR {assignments.reduce((sum, s) => sum + s.servicePrice, 0)}
        </span>
      </div>

      <div className="flex justify-between mt-6">
        <button onClick={handleBack} className="px-6 py-2.5 bg-surface-2 text-muted-2 text-sm font-bold rounded-lg border border-border hover:border-border-hover transition-all duration-200">
          ← Back
        </button>
        <button
          disabled={!allAssigned}
          onClick={handleNext}
          className="px-6 py-2.5 bg-accent text-primary text-sm font-extrabold rounded-lg hover:bg-accent-hover transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-glow"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

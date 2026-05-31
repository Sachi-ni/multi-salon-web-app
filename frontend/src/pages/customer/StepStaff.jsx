import { useEffect, useState } from "react";
import { getAvailableStaff } from "../../../services/appointmentService";

export default function StepStaff({ booking, onNext, onBack }) {
  // staffOptions: { [service_id]: [{ staff_id, full_name, free_slots, availabilityId }] }
  const [staffOptions, setStaffOptions] = useState({});
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");

  // Track selection per service: { service_id: { staff_id, staff_name, slot, availabilityId } }
  const [selections, setSelections] = useState(
    Object.fromEntries(
      booking.services.map(s => [
        s.service_id,
        { staff_id: s.staff_id, staff_name: s.staff_name, slot: s.slot, availabilityId: s.availabilityId }
      ])
    )
  );

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const results = await Promise.all(
          booking.services.map(s =>
            getAvailableStaff(booking.date, s.service_id, booking.salonId)
              .then(res => ({ service_id: s.service_id, staff: res.data }))
          )
        );
        const map = {};
        results.forEach(r => { map[r.service_id] = r.staff; });
        setStaffOptions(map);
      } catch {
        setError("Failed to load available staff.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const selectStaff = (service_id, staffMember) => {
    setSelections(prev => ({
      ...prev,
      [service_id]: {
        staff_id:       staffMember.staff_id,
        staff_name:     staffMember.full_name,
        slot:           null, // reset slot when staff changes
        availabilityId: staffMember.availabilityId,
      }
    }));
  };

  const selectSlot = (service_id, slot) => {
    setSelections(prev => ({
      ...prev,
      [service_id]: { ...prev[service_id], slot }
    }));
  };

  const allAssigned = booking.services.every(s => {
    const sel = selections[s.service_id];
    return sel?.staff_id && sel?.slot;
  });

  const handleNext = () => {
    const updated = booking.services.map(s => ({
      ...s,
      ...selections[s.service_id]
    }));
    onNext({ services: updated });
  };

  if (loading) return <p>Checking staff availability...</p>;
  if (error)   return <p className="error">{error}</p>;

  return (
    <div className="step-staff">
      <h2>Select Staff & Time Slot</h2>
      <p>Choose a staff member and time slot for each service.</p>

      {booking.services.map(s => {
        const available = staffOptions[s.service_id] || [];
        const currentSel = selections[s.service_id];

        return (
          <div key={s.service_id} className="service-staff-block">
            <h4>{s.service_name} <span className="duration">({s.duration} min)</span></h4>

            {available.length === 0 ? (
              <p className="no-staff">No staff available for this service on {booking.date}.</p>
            ) : (
              <>
                {/* Staff selection */}
                <div className="staff-options">
                  {available.map(member => (
                    <div
                      key={member.staff_id}
                      className={`staff-card ${currentSel?.staff_id === member.staff_id ? "selected" : ""}`}
                      onClick={() => selectStaff(s.service_id, member)}
                    >
                      {member.image && <img src={member.image} alt={member.full_name} />}
                      <span>{member.full_name}</span>
                      {member.specification && <small>{member.specification}</small>}
                    </div>
                  ))}
                </div>

                {/* Slot selection — show only after staff is picked */}
                {currentSel?.staff_id && (
                  <div className="slot-options">
                    <p>Available slots:</p>
                    {available
                      .find(m => m.staff_id === currentSel.staff_id)
                      ?.free_slots.map((slot, i) => (
                        <button
                          key={i}
                          className={`slot-btn ${currentSel?.slot?.start_time === slot.start_time ? "selected" : ""}`}
                          onClick={() => selectSlot(s.service_id, slot)}
                        >
                          {slot.start_time} – {slot.end_time}
                        </button>
                      ))
                    }
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      <div className="step-actions">
        <button className="btn-secondary" onClick={onBack}>Back</button>
        <button
          className="btn-primary"
          disabled={!allAssigned}
          onClick={handleNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}
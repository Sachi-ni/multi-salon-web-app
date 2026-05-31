import { useEffect, useState } from "react";
import { getAvailableStaff } from "../../../services/appointmentService";

export default function StepStaff({ booking, onNext, onBack }) {
  const [staffOptions, setStaffOptions] = useState({});
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [selections, setSelections]     = useState(
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

  const selectStaff = (service_id, member) => {
    setSelections(prev => ({
      ...prev,
      [service_id]: { staff_id: member.staff_id, staff_name: member.full_name, slot: null, availabilityId: member.availabilityId }
    }));
  };

  const selectSlot = (service_id, slot) => {
    setSelections(prev => ({ ...prev, [service_id]: { ...prev[service_id], slot } }));
  };

  const allAssigned = booking.services.every(s => {
    const sel = selections[s.service_id];
    return sel?.staff_id && sel?.slot;
  });

  const handleNext = () => {
    onNext({ services: booking.services.map(s => ({ ...s, ...selections[s.service_id] })) });
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return <p className="text-danger text-sm">{error}</p>;

  return (
    <div>
      <h2 className="text-lg font-extrabold text-white mb-1">Select Staff & Time</h2>
      <p className="text-muted-2 text-sm mb-5">Choose a staff member and slot for each service</p>

      <div className="space-y-6">
        {booking.services.map(s => {
          const available  = staffOptions[s.service_id] || [];
          const currentSel = selections[s.service_id];

          return (
            <div key={s.service_id}>
              {/* Service label */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 bg-accent rounded-full" />
                <h4 className="font-extrabold text-white text-sm">{s.service_name}</h4>
                <span className="text-muted-2 text-xs">({s.duration} min)</span>
              </div>

              {available.length === 0 ? (
                <div className="p-3 bg-danger-dim border border-danger-border rounded-lg">
                  <p className="text-danger text-xs font-bold">No staff available for this service on {booking.date}</p>
                </div>
              ) : (
                <>
                  {/* Staff cards */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {available.map(member => (
                      <div
                        key={member.staff_id}
                        onClick={() => selectStaff(s.service_id, member)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all duration-200
                          ${currentSel?.staff_id === member.staff_id
                            ? "border-accent bg-accent-dim shadow-glow-sm"
                            : "border-border bg-surface-2 hover:border-border-hover"
                          }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-surface-3 border border-border flex items-center justify-center mb-2">
                          <span className="text-accent font-black text-sm">
                            {member.full_name.charAt(0)}
                          </span>
                        </div>
                        <p className="text-white font-bold text-xs">{member.full_name}</p>
                        {member.specification && (
                          <p className="text-muted-2 text-2xs mt-0.5">{member.specification}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Slot grid */}
                  {currentSel?.staff_id && (
                    <div>
                      <p className="text-muted-2 text-xs font-bold mb-2 uppercase tracking-wider">Available Slots</p>
                      <div className="flex flex-wrap gap-2">
                        {staffOptions[s.service_id]
                          ?.find(m => m.staff_id === currentSel.staff_id)
                          ?.free_slots.map((slot, i) => (
                            <button
                              key={i}
                              onClick={() => selectSlot(s.service_id, slot)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200
                                ${currentSel?.slot?.start_time === slot.start_time
                                  ? "bg-accent text-primary border-accent shadow-glow-sm"
                                  : "bg-surface-2 text-muted-2 border-border hover:border-accent hover:text-accent"
                                }`}
                            >
                              {slot.start_time} – {slot.end_time}
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mt-6">
        <button onClick={onBack} className="px-6 py-2.5 bg-surface-2 text-muted-2 text-sm font-bold rounded-lg border border-border hover:border-border-hover transition-all duration-200">
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
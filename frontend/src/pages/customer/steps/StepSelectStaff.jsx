import { useEffect, useState } from "react";
import { getAvailableStaff } from "../../../services/appointmentService";

export default function StepSelectStaff({ booking, onNext, onBack }) {
  const [staffList, setStaffList] = useState([]);
  const [selected, setSelected] = useState(booking.staffId || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAvailableStaff(booking.date, booking.serviceId, booking.salonId)
      .then(res => setStaffList(res.data))
      .catch(() => setError("Failed to load available staff."))
      .finally(() => setLoading(false));
  }, [booking.date, booking.serviceId, booking.salonId]);

  const handleNext = () => {
    const staff = staffList.find(s => s.staff_id === selected);
    if (!staff) return;
    onNext({
      staffId: staff.staff_id,
      staffName: staff.full_name,
      staffSpecification: staff.specification,
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return <p className="text-danger text-sm">{error}</p>;

  return (
    <div>
      <h2 className="text-lg font-extrabold text-white mb-1">Select a Staff Member</h2>
      <p className="text-muted-2 text-sm mb-5">Choose who you'd like to perform your service</p>

      {staffList.length === 0 ? (
        <div className="p-6 bg-surface-2 border border-border rounded-xl text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-danger-dim border border-danger-border flex items-center justify-center">
            <svg className="w-6 h-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-white font-bold text-sm mb-1">No Staff Available</p>
          <p className="text-muted-2 text-xs">No staff members are available for this service on {booking.date}.</p>
          <p className="text-muted-2 text-xs mt-1">Try selecting a different date or service.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {staffList.map(member => {
            const isSelected = selected === member.staff_id;
            return (
              <div
                key={member.staff_id}
                onClick={() => setSelected(member.staff_id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200
                  ${isSelected
                    ? "border-accent bg-accent-dim shadow-glow-sm"
                    : "border-border bg-surface-2 hover:border-border-hover"
                  }`}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-all
                  ${isSelected
                    ? "bg-accent text-primary"
                    : "bg-surface-3 border border-border text-accent"
                  }`}>
                  <span className="font-black text-sm">
                    {member.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <p className="text-white font-bold text-sm">{member.full_name}</p>
                {member.role && (
                  <p className="text-muted-2 text-xs mt-0.5">{member.role}</p>
                )}
                {member.specification && (
                  <p className="text-accent text-xs mt-1 font-semibold">{member.specification}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-between mt-6">
        <button onClick={onBack} className="px-6 py-2.5 bg-surface-2 text-muted-2 text-sm font-bold rounded-lg border border-border hover:border-border-hover transition-all duration-200">
          ← Back
        </button>
        <button
          disabled={!selected || staffList.length === 0}
          onClick={handleNext}
          className="px-6 py-2.5 bg-accent text-primary text-sm font-extrabold rounded-lg hover:bg-accent-hover transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-glow"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { getSalonServices } from "../../../services/salonService";

export default function StepServices({ booking, onNext, onBack }) {
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState(booking.services.map(s => s.service_id));
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    getSalonServices(booking.salonId)
      .then(res => setServices(res.data))
      .catch(() => setError("Failed to load services."))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleNext = () => {
    const chosen = services
      .filter(s => selected.includes(s._id))
      .map(s => ({
        service_id: s._id, service_name: s.service_name,
        base_price: s.base_price, duration: s.duration,
        staff_id: null, staff_name: null, slot: null, availabilityId: null,
      }));
    onNext({ services: chosen });
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return <p className="text-danger text-sm">{error}</p>;

  return (
    <div>
      <h2 className="text-lg font-extrabold text-white mb-1">Select Services</h2>
      <p className="text-muted-2 text-sm mb-5">You can select multiple services</p>

      <div className="space-y-3">
        {services.map(s => {
          const isSelected = selected.includes(s._id);
          return (
            <div
              key={s._id}
              onClick={() => toggle(s._id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all duration-200
                ${isSelected
                  ? "border-accent bg-accent-dim shadow-glow-sm"
                  : "border-border bg-surface-2 hover:border-border-hover"
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                    ${isSelected ? "bg-accent border-accent" : "border-border"}`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{s.service_name}</p>
                    {s.description && <p className="text-muted-2 text-xs mt-0.5">{s.description}</p>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-accent font-extrabold text-sm">LKR {s.base_price}</p>
                  <p className="text-muted-2 text-xs">{s.duration} min</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="mt-4 px-4 py-2.5 bg-accent-muted border border-accent/20 rounded-lg">
          <p className="text-accent text-xs font-bold">{selected.length} service{selected.length > 1 ? "s" : ""} selected</p>
        </div>
      )}

      <div className="flex justify-between mt-6">
        <button onClick={onBack} className="px-6 py-2.5 bg-surface-2 text-muted-2 text-sm font-bold rounded-lg border border-border hover:border-border-hover transition-all duration-200">
          ← Back
        </button>
        <button
          disabled={selected.length === 0}
          onClick={handleNext}
          className="px-6 py-2.5 bg-accent text-primary text-sm font-extrabold rounded-lg hover:bg-accent-hover transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-glow"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
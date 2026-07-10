import { useEffect, useState } from "react";
import { getSalonServices } from "../../../services/salonService";

export default function StepSelectService({ booking, onNext, onBack }) {
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState(booking.serviceId || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getSalonServices(booking.salonId)
      .then(res => setServices(res.data))
      .catch(() => setError("Failed to load services."))
      .finally(() => setLoading(false));
  }, [booking.salonId]);

  const handleNext = () => {
    const svc = services.find(s => s._id === selected);
    if (!svc) return;
    onNext({
      serviceId: svc._id,
      serviceName: svc.service_name,
      serviceDuration: svc.duration,
      servicePrice: svc.base_price,
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
      <h2 className="text-lg font-extrabold text-white mb-1">Select Services</h2>
      <p className="text-muted-2 text-sm mb-5">Choose the services you'd like to book (select one or more)</p>

      <div className="space-y-3">
        {services.map(s => {
          const isSelected = selected === s._id;
          const durationHours = Math.ceil(s.duration / 60);
          return (
            <div
              key={s._id}
              onClick={() => setSelected(s._id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all duration-200
                ${isSelected
                  ? "border-accent bg-accent-dim shadow-glow-sm"
                  : "border-border bg-surface-2 hover:border-border-hover"
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Radio indicator */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                    ${isSelected ? "border-accent" : "border-border"}`}>
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{s.service_name}</p>
                    {s.description && (
                      <p className="text-muted-2 text-xs mt-0.5 max-w-md">{s.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-muted-2 text-xs">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {durationHours} {durationHours === 1 ? "Hour" : "Hours"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-accent font-extrabold text-sm">LKR {s.base_price}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {services.length === 0 && (
        <div className="p-4 bg-surface-2 border border-border rounded-xl text-center">
          <p className="text-muted-2 text-sm">No services available for this salon.</p>
        </div>
      )}

      <div className="flex justify-between mt-6">
        <button onClick={onBack} className="px-6 py-2.5 bg-surface-2 text-muted-2 text-sm font-bold rounded-lg border border-border hover:border-border-hover transition-all duration-200">
          ← Back
        </button>
        <button
          disabled={!selected}
          onClick={handleNext}
          className="px-6 py-2.5 bg-accent text-primary text-sm font-extrabold rounded-lg hover:bg-accent-hover transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-glow"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { getSalonServices } from "../../../services/salonService";

export default function StepServices({ booking, onBack, onNext }) {
  const [services, setServices]   = useState([]);
  const [selected, setSelected]   = useState(
    booking.services.map(s => s.service_id)
  );
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  useEffect(() => {
    getSalonServices(booking.salonId)
      .then(res => setServices(res.data))
      .catch(() => setError("Failed to load services."))
      .finally(() => setLoading(false));
  }, [booking.salonId]);

  const toggle = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    const chosen = services
      .filter(s => selected.includes(s._id))
      .map(s => ({
        service_id:   s._id,
        service_name: s.service_name,
        base_price:   s.base_price,
        duration:     s.duration,
        staff_id:     null,
        staff_name:   null,
        slot:         null,
        availabilityId: null,
      }));
    onNext({ services: chosen });
  };

  if (loading) return <p>Loading services...</p>;
  if (error)   return <p className="error">{error}</p>;

  return (
    <div className="step-services">
      <h2>Select Services</h2>
      <p>You can select multiple services.</p>

      <div className="services-list">
        {services.map(s => (
          <label key={s._id} className={`service-card ${selected.includes(s._id) ? "selected" : ""}`}>
            <input
              type="checkbox"
              checked={selected.includes(s._id)}
              onChange={() => toggle(s._id)}
            />
            <div className="service-info">
              <span className="service-name">{s.service_name}</span>
              <span className="service-meta">{s.duration} min — ${s.base_price}</span>
              {s.description && <span className="service-desc">{s.description}</span>}
            </div>
          </label>
        ))}
      </div>

      <div className="step-actions">
        <button className="btn-secondary" onClick={onBack}>Back</button>
        <button
          className="btn-primary"
          disabled={selected.length === 0}
          onClick={handleNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}
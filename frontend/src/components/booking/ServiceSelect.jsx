import { useEffect, useState } from "react";
import { getServices } from "../../services/bookingService";

export default function ServiceSelect({ salon, onSelect }) {
  const [services, setServices] = useState([]);

  useEffect(() => {
    if (!salon) return;

    const load = async () => {
      const data = await getServices(salon._id);
      setServices(data);
    };

    load();
  }, [salon]);

  return (
    <div>
      <h2>Select Service</h2>

      {services.map((s) => (
        <button key={s._id} onClick={() => onSelect(s)}>
          {s.service_name || s.name}
        </button>
      ))}
    </div>
  );
}
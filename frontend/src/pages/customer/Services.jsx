import { useEffect, useState } from "react";
import { getSalons, getSalonServices } from "../../services/salonService";
import { Scissors } from "lucide-react";

export default function CustomerServices() {
  const [salons, setSalons]     = useState([]);
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    getSalons().then(res => {
      setSalons(res.data);
      if (res.data.length > 0) {
        setSelected(res.data[0]._id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    getSalonServices(selected)
      .then(res => setServices(res.data))
      .finally(() => setLoading(false));
  }, [selected]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Services</h1>
        <p className="text-muted-2 text-sm mt-1">Browse available services by branch</p>
      </div>

      {/* Branch filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {salons.map(s => (
          <button
            key={s._id}
            onClick={() => setSelected(s._id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-extrabold border transition-all duration-200
              ${selected === s._id
                ? "bg-accent text-primary border-accent"
                : "bg-surface-2 text-muted-2 border-border hover:border-border-hover"
              }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(s => (
            <div key={s._id} className="bg-surface border border-border rounded-2xl p-5 shadow-card hover:border-border-hover transition-all duration-200">
              <div className="w-10 h-10 bg-accent-dim border border-accent/20 rounded-xl flex items-center justify-center mb-4">
                <Scissors className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-white font-extrabold mb-1">{s.service_name}</h3>
              {s.description && <p className="text-muted-2 text-xs mb-3">{s.description}</p>}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-muted-2 text-xs">{s.duration} min</span>
                <span className="text-accent font-extrabold text-sm">LKR {s.base_price}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import { useEffect, useState } from "react";
import { getSalons } from "../../services/salonService";
import api from "../../services/api";

export default function CustomerStaff() {
  const [salons, setSalons]   = useState([]);
  const [staff, setStaff]     = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSalons().then(res => {
      setSalons(res.data);
      if (res.data.length > 0) setSelected(res.data[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    api.get("/staff", { params: { salonId: selected } })
      .then(res => setStaff(res.data))
      .finally(() => setLoading(false));
  }, [selected]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Our Staff</h1>
        <p className="text-muted-2 text-sm mt-1">Meet our talented team</p>
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
          {staff.map(s => (
            <div key={s._id} className="bg-surface border border-border rounded-2xl p-5 shadow-card hover:border-border-hover transition-all duration-200">
              <div className="w-14 h-14 rounded-xl bg-accent-dim border border-accent/20 flex items-center justify-center mb-4">
                {s.image ? (
                  <img src={s.image} alt={s.full_name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <span className="text-accent font-black text-2xl">{s.full_name.charAt(0)}</span>
                )}
              </div>
              <h3 className="text-white font-extrabold">{s.full_name}</h3>
              <p className="text-accent text-xs font-bold mt-0.5">{s.role}</p>
              {s.specification && <p className="text-muted-2 text-xs mt-1">{s.specification}</p>}
              <div className="mt-3 pt-3 border-t border-border">
                <span className={`px-2 py-0.5 rounded-full text-2xs font-extrabold border
                  ${s.status === "Active"
                    ? "bg-success-dim text-success border-success-border"
                    : "bg-danger-dim text-danger border-danger-border"
                  }`}>
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
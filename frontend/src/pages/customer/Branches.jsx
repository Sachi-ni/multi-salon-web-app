import { useEffect, useState } from "react";
import { getSalons } from "../../services/salonService";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function Branches() {
  const [salons, setSalons]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSalons().then(res => setSalons(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Our Branches</h1>
        <p className="text-muted-2 text-sm mt-1">Find a salon near you</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {salons.map(s => (
          <div key={s._id} className="bg-surface border border-border rounded-2xl p-5 shadow-card hover:border-border-hover transition-all duration-200">
            <div className="w-10 h-10 bg-accent-dim border border-accent/20 rounded-xl flex items-center justify-center mb-4">
              <span className="text-accent font-black text-lg">{s.name.charAt(0)}</span>
            </div>
            <h3 className="text-white font-extrabold mb-3">{s.name}</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-2 text-xs">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{s.location}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-2 text-xs">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{s.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-2 text-xs">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{s.email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-2 text-xs">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{s.open_time} – {s.close_time}</span>
              </div>
            </div>
            {s.about && (
              <p className="text-muted-2 text-xs mt-3 pt-3 border-t border-border">{s.about}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
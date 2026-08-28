import { useEffect, useState } from "react";
import { getSalons, getSalonServices } from "../../services/salonService";
import { Scissors } from "lucide-react";
import LandingNavbar from "./landing-sections/LandingNavbar";
import Footer from "./landing-sections/Footer";

export default function CustomerServices() {
  const [salons, setSalons] = useState([]);
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSalons().then(res => {
      setSalons(res.data);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    getSalonServices(selected === "all" ? "" : selected)
      .then(res => setServices(res.data))
      .finally(() => setLoading(false));
  }, [selected]);

  const visibleServices = selected === "all"
    ? Array.from(
        services.reduce((uniqueServices, service) => {
          const serviceName = service.service_name || service.name || "";
          const serviceKey = String(serviceName).trim().replace(/\s+/g, " ").toLowerCase();
          if (serviceKey && !uniqueServices.has(serviceKey)) {
            uniqueServices.set(serviceKey, service);
          }
          return uniqueServices;
        }, new Map()).values()
      )
    : services;

  return (
    <div className="min-h-screen bg-primary">
      <LandingNavbar />
      
      <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-12 text-center animate-fade-up">
          <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-4">
            <Scissors className="text-accent w-4 h-4" />
            <span className="text-xs font-bold text-accent uppercase tracking-wider">Our Offerings</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Our <span className="text-accent">Services</span></h1>
          <p className="text-muted-2 text-lg max-w-2xl mx-auto">Discover our premium range of grooming and beauty services, available across our luxury studio locations.</p>
        </div>

        {/* Branch filter */}
        <div className="flex gap-2 mb-8 flex-wrap justify-center animate-fade-up" style={{ animationDelay: "100ms" }}>
          <button
            onClick={() => setSelected("all")}
            className={`px-6 py-2 rounded-xl text-sm font-extrabold border transition-all duration-300
              ${selected === "all"
                ? "bg-accent text-primary border-accent shadow-glow"
                : "bg-surface border-border text-white hover:border-accent/50"
              }`}
          >
            All Branches
          </button>
          {salons.map(s => (
            <button
              key={s._id}
              onClick={() => setSelected(s._id)}
              className={`px-6 py-2 rounded-xl text-sm font-extrabold border transition-all duration-300
                ${selected === s._id
                  ? "bg-accent text-primary border-accent shadow-glow"
                  : "bg-surface border-border text-white hover:border-accent/50"
                }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-up" style={{ animationDelay: "200ms" }}>
            {visibleServices.map(s => (
              <div key={s._id} className="bg-surface border border-border rounded-2xl p-6 shadow-card hover:border-accent/50 hover:shadow-glow transition-all duration-300 group">
                <div className="w-12 h-12 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Scissors className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl text-white font-black mb-2">{s.service_name}</h3>
                {s.description && <p className="text-muted-2 text-sm mb-6 line-clamp-2">{s.description}</p>}
                
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-white/60 text-sm font-medium">{s.duration} min</span>
                  <span className="text-accent font-black text-lg">LKR {s.base_price}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
      
      <Footer />
    </div>
  );
}
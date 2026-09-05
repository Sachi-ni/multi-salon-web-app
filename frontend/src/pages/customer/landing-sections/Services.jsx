import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Scissors } from "lucide-react";
import { getServices } from "../../../services/serviceService";

const Services = () => {
  const [services, setServices] = useState([]);

  useEffect(() => {
    getServices()
      .then((response) => setServices((response.data || []).slice(0, 6)))
      .catch((error) => console.error("Could not load landing services", error));
  }, []);

  if (!services.length) return null;

  return (
    <section id="services" className="py-24 bg-primary relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-accent font-bold tracking-widest uppercase text-sm mb-3">Our Offerings</div>
          <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-6">Available <span className="text-gradient">Services</span></h2>
          <p className="text-white/60 text-lg">Services and prices from our salon database.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div key={service._id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} className="group glass-card card-accent p-6 hover:-translate-y-2 transition-all duration-300">
              <div className="text-white mb-5 bg-surface-3 w-12 h-12 rounded-xl flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-primary transition-colors duration-300"><Scissors className="w-8 h-8" /></div>
              <p className="text-accent text-xs font-bold uppercase tracking-wider mb-2">{service.category_id?.category_name || service.salon_id?.name || "Salon service"}</p>
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-accent transition-colors">{service.service_name}</h3>
              <p className="text-white/60 leading-relaxed min-h-12">{service.description || "No description provided."}</p>
              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-sm"><span className="text-accent font-extrabold">LKR {Number(service.base_price || 0).toLocaleString()}</span><span className="text-white/60">{service.duration} min</span></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;

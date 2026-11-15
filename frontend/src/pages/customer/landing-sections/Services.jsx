import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { ServiceIcon } from "../../../utils/serviceIcons";
import { getServices } from "../../../services/serviceService";
import { getUploadUrl } from "../../../config";

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
            <motion.div key={service._id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} className="group glass-card card-accent overflow-hidden hover:-translate-y-2 transition-all duration-300">
              {service.photo ? (
                <div className="h-64 w-full overflow-hidden">
                  <img src={getUploadUrl(service.photo)} alt={service.service_name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
              ) : (
                <div className="text-white h-64 w-full bg-surface-3 flex items-center justify-center text-accent">
                  <ServiceIcon name={service.service_name} category={service.category_id?.category_name} className="w-12 h-12" />
                </div>
              )}
              <div className="p-6">
                <p className="text-accent text-xs font-bold uppercase tracking-wider mb-2">{service.category_id?.category_name || service.salon_id?.name || "Salon service"}</p>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-accent transition-colors">{service.service_name}</h3>
                <p className="text-white/60 leading-relaxed min-h-12">{service.description || "No description provided."}</p>
                <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-sm">
                  <span className="text-accent font-extrabold">LKR {Number(service.base_price || 0).toLocaleString()}</span>
                  <span className="flex items-center gap-1 text-white/60">
                    <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                    {Number(service.rating || 0).toFixed(1)} ({service.ratingCount || 0})
                  </span>
                  <span>{service.duration} min</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;

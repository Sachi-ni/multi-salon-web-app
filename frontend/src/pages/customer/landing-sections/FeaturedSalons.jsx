import React from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, Phone, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const FeaturedSalons = () => {
  const navigate = useNavigate();

  const branches = [
    {
      name: "SalonHub Downtown",
      address: "123 Luxury Ave, Downtown District",
      hours: "Mon-Sat: 9AM - 8PM",
      phone: "+1 (555) 123-4567",
      rating: "4.9",
      reviews: "1.2k",
      image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?q=80&w=2022&auto=format&fit=crop"
    },
    {
      name: "SalonHub Westside",
      address: "456 Prestige Blvd, Westside Mall",
      hours: "Everyday: 10AM - 9PM",
      phone: "+1 (555) 987-6543",
      rating: "4.8",
      reviews: "850",
      image: "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?q=80&w=2070&auto=format&fit=crop"
    }
  ];

  return (
    <section id="salons" className="py-24 bg-surface-2 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <div className="text-accent font-bold tracking-widest uppercase text-sm mb-3">Our Locations</div>
            <h2 className="text-4xl md:text-5xl font-display font-black text-white">
              Experience <span className="text-gradient">Luxury Near You</span>
            </h2>
          </div>
          <button 
            onClick={() => navigate("/customer/branches")}
            className="px-6 py-3 bg-surface border border-border text-white rounded-xl font-bold hover:bg-surface-3 transition-colors"
          >
            View All Locations
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {branches.map((branch, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="group glass-card overflow-hidden flex flex-col md:flex-row hover:-translate-y-2 transition-all duration-300"
            >
              <div className="md:w-2/5 h-64 md:h-auto relative overflow-hidden">
                <img 
                  src={branch.image} 
                  alt={branch.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent md:hidden" />
                <div className="absolute top-4 left-4 bg-primary/80 backdrop-blur-md px-3 py-1 rounded-lg flex items-center gap-1 border border-border">
                  <Star className="w-4 h-4 fill-accent text-accent" />
                  <span className="text-white font-bold text-sm">{branch.rating}</span>
                  <span className="text-white/60 text-xs">({branch.reviews})</span>
                </div>
              </div>

              <div className="md:w-3/5 p-6 flex flex-col justify-between bg-surface/50">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-accent transition-colors">{branch.name}</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 text-white/70">
                      <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <span className="text-sm leading-tight">{branch.address}</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/70">
                      <Clock className="w-5 h-5 text-accent shrink-0" />
                      <span className="text-sm">{branch.hours}</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/70">
                      <Phone className="w-5 h-5 text-accent shrink-0" />
                      <span className="text-sm">{branch.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button 
                    onClick={() => navigate("/book")}
                    className="w-full py-3 bg-white/5 border border-border text-white rounded-xl font-bold hover:bg-accent hover:text-primary hover:border-accent transition-all duration-300"
                  >
                    Book at this Branch
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSalons;

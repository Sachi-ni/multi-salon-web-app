import React from "react";
import { motion } from "framer-motion";
import { Scissors, Sparkles, Droplets, Smile, Palette, Wine } from "lucide-react";

const Services = () => {
  const services = [
    {
      icon: <Scissors className="w-8 h-8" />,
      title: "Hair Styling",
      description: "Precision cuts, blowouts, and expert styling tailored to your face shape and lifestyle.",
      price: "From $45",
      duration: "45-60 min",
      image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=2069&auto=format&fit=crop"
    },
    {
      icon: <Palette className="w-8 h-8" />,
      title: "Color & Highlights",
      description: "Vibrant coloring, balayage, and highlights using premium, damage-free formulas.",
      price: "From $120",
      duration: "90-120 min",
      image: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?q=80&w=2036&auto=format&fit=crop"
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Facial Treatments",
      description: "Rejuvenating luxury facials to cleanse, exfoliate, and nourish your skin.",
      price: "From $85",
      duration: "60 min",
      image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=2070&auto=format&fit=crop"
    },
    {
      icon: <Smile className="w-8 h-8" />,
      title: "Bridal Makeup",
      description: "Flawless, long-lasting makeup application for your special day.",
      price: "From $150",
      duration: "90 min",
      image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?q=80&w=2071&auto=format&fit=crop"
    },
    {
      icon: <Droplets className="w-8 h-8" />,
      title: "Hair Treatments",
      description: "Deep conditioning, keratin treatments, and scalp therapy for healthy hair.",
      price: "From $65",
      duration: "45 min",
      image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=2000&auto=format&fit=crop"
    },
    {
      icon: <Wine className="w-8 h-8" />,
      title: "Spa & Massage",
      description: "Relaxing full-body massages and spa therapies to melt away stress.",
      price: "From $100",
      duration: "60-90 min",
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2070&auto=format&fit=crop"
    }
  ];

  return (
    <section id="services" className="py-24 bg-primary relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-accent font-bold tracking-widest uppercase text-sm mb-3">Our Offerings</div>
          <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-6">
            Premium <span className="text-gradient">Services</span>
          </h2>
          <p className="text-white/60 text-lg">
            Indulge in our comprehensive range of grooming and beauty treatments, performed by industry-leading professionals using top-tier products.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group glass-card overflow-hidden card-accent hover:-translate-y-2 transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={service.image} 
                  alt={service.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-primary/40 group-hover:bg-primary/20 transition-colors duration-300" />
              </div>
              <div className="p-6">
                <div className="text-white mb-4 bg-surface-3 w-12 h-12 rounded-xl flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-primary transition-colors duration-300">
                  {service.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-accent transition-colors">{service.title}</h3>
                <p className="text-white/60 leading-relaxed mb-2">
                  {service.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;

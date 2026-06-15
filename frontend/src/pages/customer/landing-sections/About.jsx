import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const About = () => {
  const benefits = [
    "Award-winning stylists",
    "Premium organic products",
    "Relaxing luxury environment",
    "Personalized consultations"
  ];

  return (
    <section id="about" className="py-24 bg-surface-2 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
        {/* Images Collage */}
        <div className="relative h-[600px] hidden md:block">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="absolute top-0 left-0 w-2/3 h-3/4 rounded-2xl overflow-hidden border border-border shadow-2xl"
          >
            <img
              src="https://images.unsplash.com/photo-1521590832167-7bfc17484d20?q=80&w=2070&auto=format&fit=crop"
              alt="Salon Interior"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-primary/20" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="absolute bottom-0 right-0 w-2/3 h-2/3 rounded-2xl overflow-hidden border-4 border-surface-2 shadow-2xl z-10"
          >
            <img
              src="https://images.unsplash.com/photo-1595476108010-b4d1f10d5e43?q=80&w=1974&auto=format&fit=crop"
              alt="Stylist at work"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-primary/20" />
          </motion.div>

          {/* Experience Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent w-32 h-32 rounded-full flex flex-col items-center justify-center text-primary shadow-glow z-20 border-4 border-surface-2"
          >
            <span className="text-4xl font-black">15+</span>
            <span className="text-xs font-bold uppercase tracking-wider text-center leading-tight mt-1">Years<br/>Experience</span>
          </motion.div>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col gap-8"
        >
          <div>
            <div className="text-accent font-bold tracking-widest uppercase text-sm mb-3">Our Story</div>
            <h2 className="text-4xl md:text-5xl font-display font-black text-white leading-tight">
              Redefining the standard of <span className="text-gradient">modern beauty.</span>
            </h2>
          </div>

          <div className="text-white/70 text-lg leading-relaxed space-y-4">
            <p>
              Founded with a vision to merge classic grooming techniques with contemporary style, SalonHub has grown into a premier destination for those who demand excellence.
            </p>
            <p>
              We believe that a visit to the salon should be more than just a service—it should be a rejuvenating experience. Every detail of our salons is designed to provide you with ultimate comfort and luxury.
            </p>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-3 text-white/90">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="font-medium">{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="pt-4">
            <button className="px-8 py-4 bg-surface backdrop-blur-md border border-accent/30 text-white rounded-xl text-base font-bold hover:bg-accent hover:text-primary transition-all duration-300">
              Read Full Story
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;

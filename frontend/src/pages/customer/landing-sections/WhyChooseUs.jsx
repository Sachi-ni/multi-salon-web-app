import React from "react";
import { motion } from "framer-motion";
import { Award, ShieldCheck, HeartHandshake, Zap } from "lucide-react";

const WhyChooseUs = () => {
  const features = [
    {
      icon: <Award className="w-10 h-10" />,
      title: "Master Professionals",
      description: "Our stylists undergo rigorous training and continuous education to master the latest techniques."
    },
    {
      icon: <ShieldCheck className="w-10 h-10" />,
      title: "Premium Products",
      description: "We use only the finest, carefully curated luxury products that are safe and effective."
    },
    {
      icon: <HeartHandshake className="w-10 h-10" />,
      title: "Personalized Care",
      description: "Every client receives a thorough consultation to ensure results that perfectly match their vision."
    },
    {
      icon: <Zap className="w-10 h-10" />,
      title: "Modern Facilities",
      description: "Our salons are equipped with state-of-the-art tools in a stunning, hygienic environment."
    }
  ];

  return (
    <section className="py-24 bg-surface-2 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
        
        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-accent font-bold tracking-widest uppercase text-sm mb-3">Why Choose Us</div>
          <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-6">
            The standard of <br/><span className="text-gradient">excellence.</span>
          </h2>
          <p className="text-white/70 text-lg mb-8 leading-relaxed">
            We don't just offer services; we offer an experience. From the moment you walk through our doors, every detail is tailored to ensure you feel valued, relaxed, and ultimately, look your absolute best.
          </p>
          
          <div className="grid sm:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="flex flex-col gap-3">
                <div className="text-accent bg-surface p-3 rounded-xl w-max border border-border">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                <p className="text-white/60 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative h-[600px] rounded-2xl overflow-hidden border border-border shadow-2xl hidden lg:block"
        >
          <img 
            src="https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=2069&auto=format&fit=crop" 
            alt="Luxury Salon Detail" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/20" />
        </motion.div>
      </div>
    </section>
  );
};

export default WhyChooseUs;

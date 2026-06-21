import React from 'react';
import { motion } from 'framer-motion';

export default function SalonHero() {
  return (
    <section className="pt-24 pb-12 bg-primary relative text-center">
      <div className="max-w-3xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-accent font-bold tracking-widest uppercase text-sm mb-3">
            Our Salon Locations
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-6">
            Discover Our <span className="text-gradient">Premium Branches</span>
          </h1>
          <p className="text-white/60 text-lg">
            Discover our premium salon branches and find the perfect location near you.
          </p>
        </motion.div>
      </div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-accent/20 blur-[120px] rounded-full pointer-events-none" />
    </section>
  );
}

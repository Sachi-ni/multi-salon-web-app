import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const BookingCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Image with Parallax effect illusion */}
      <div className="absolute inset-0 bg-fixed bg-center bg-cover" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2574&auto=format&fit=crop')" }}>
        <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="glass-card p-12 md:p-16 border-accent/20"
        >
          <h2 className="text-4xl md:text-6xl font-display font-black text-white mb-6">
            Ready for your <br />
            <span className="text-gradient">Transformation?</span>
          </h2>
          <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
            Book your appointment today and step into a world of unparalleled luxury, styling, and relaxation. Your premium experience awaits.
          </p>
          
          <button 
            onClick={() => navigate("/book")}
            className="px-10 py-5 bg-accent text-primary rounded-xl text-lg font-extrabold tracking-widest uppercase hover:bg-accent-hover hover:shadow-glow transition-all duration-300 hover:-translate-y-1 inline-flex items-center gap-3 group"
          >
            Book Now 
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default BookingCTA;

import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Background Image / Gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-primary z-10" />
        <img
          src="https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2574&auto=format&fit=crop"
          alt="Premium Salon Background"
          className="w-full h-full object-cover object-center opacity-40"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-12 items-center">
        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col gap-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-2/50 backdrop-blur-sm border border-accent/20 w-max">
            <Star className="text-accent w-4 h-4 fill-accent" />
            <span className="text-sm font-semibold tracking-wide text-accent uppercase">
              Premium Grooming Studio
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-black leading-[1.1] tracking-tight text-white">
            ELEVATE <br />
            <span className="text-gradient">YOUR STYLE.</span> <br />
            EMBRACE LUXURY.
          </h1>
          
          <p className="text-lg md:text-xl text-white/70 max-w-xl font-light leading-relaxed">
            Experience world-class grooming and beauty services in an atmosphere of pure luxury. Our expert stylists are dedicated to crafting your perfect look.
          </p>

          <div className="flex flex-wrap gap-4 mt-4">
            <button
              onClick={() => navigate("/book")}
              className="px-8 py-4 bg-accent text-primary rounded-xl text-base font-extrabold tracking-wide hover:bg-accent-hover hover:shadow-glow transition-all duration-300 hover:-translate-y-1 flex items-center gap-2 group"
            >
              Book Appointment
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => {
                document.querySelector("#services")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-8 py-4 bg-surface/50 backdrop-blur-md border border-border text-white rounded-xl text-base font-bold hover:bg-surface-2 transition-all duration-300 hover:-translate-y-1"
            >
              Explore Services
            </button>
          </div>
        </motion.div>

        {/* Stats Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="hidden lg:flex flex-col gap-6 items-end"
        >
          <div className="grid grid-cols-2 gap-4 w-full max-w-md">
            {[
              { label: "Happy Clients", value: "10K+" },
              { label: "Expert Stylists", value: "50+" },
              { label: "Salon Branches", value: "5" },
              { label: "Years Experience", value: "15+" },
            ].map((stat, i) => (
              <div key={i} className="glass-card p-6 flex flex-col items-center justify-center text-center hover-glow group">
                <div className="text-3xl font-black text-white group-hover:text-accent transition-colors duration-300">
                  {stat.value}
                </div>
                <div className="text-sm text-white/60 font-medium mt-1 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Decorative Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary to-transparent z-10" />
    </section>
  );
};

export default Hero;

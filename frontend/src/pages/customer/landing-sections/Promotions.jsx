import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Tag, Calendar, ArrowRight, Gift } from "lucide-react";

const PROMOTIONS = [
  {
    id: 1,
    badge: "Exclusive Welcome",
    title: "Signature First-Visit Experience",
    description: "Complimentary detailed hair & scalp diagnostic consultation paired with every styling reservation.",
    service: "Haircut & Styling",
    validity: "Valid for all first-time visitors",
    highlight: "Complimentary Consultation",
    bgImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    badge: "Executive Special",
    title: "Gentleman's Complete Grooming",
    description: "Full haircut, artisan hot-towel beard contouring, and scalp stimulation treatment bundled for total refinement.",
    service: "Executive Barbering",
    validity: "Available Monday through Thursday",
    highlight: "Complete Package",
    bgImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    badge: "Wellness Ritual",
    title: "Keratin Restorative Revitalization",
    description: "Intensive deep-conditioning hair spa treatment formulated to restore natural shine, strength, and softness.",
    service: "Hair Spa & Therapy",
    validity: "Seasonal luxury treatment",
    highlight: "Deep Rejuvenation",
    bgImage: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
  },
];

const Promotions = () => {
  const navigate = useNavigate();

  return (
    <section id="promotions" className="py-24 sm:py-32 bg-surface-2 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[140px] pointer-events-none -translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full bg-surface/60 border border-accent/20 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Special Privileges
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-white tracking-tight leading-tight">
              Featured <span className="text-gradient">Promotions & Packages</span>
            </h2>
            <p className="text-white/60 text-base sm:text-lg mt-3 max-w-xl">
              Elevate your appointment with our signature seasonal experiences and tailored styling packages.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/book")}
            className="inline-flex items-center gap-2 text-sm font-bold text-accent hover:text-accent-hover tracking-wider uppercase group self-start md:self-end pb-1 border-b border-accent/30 hover:border-accent transition-all"
          >
            <span>Book an Experience</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>

        {/* Promotion Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PROMOTIONS.map((promo, idx) => (
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="group rounded-3xl bg-surface/80 border border-white/[0.08] hover:border-accent/40 shadow-xl overflow-hidden flex flex-col justify-between transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] relative"
            >
              {/* Card Banner Visual */}
              <div className="relative h-48 w-full overflow-hidden bg-surface-3">
                <img
                  src={promo.bgImage}
                  alt={promo.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-black/40 to-black/20" />

                {/* Badge Tag */}
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-accent text-primary text-[11px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
                  <Gift className="w-3 h-3" />
                  {promo.badge}
                </span>

                <span className="absolute bottom-3 right-4 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-xs font-semibold text-accent">
                  {promo.highlight}
                </span>
              </div>

              {/* Card Content */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-accent text-xs font-bold uppercase tracking-wider mb-2">
                    <Tag className="w-3.5 h-3.5" />
                    {promo.service}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-accent transition-colors duration-300">
                    {promo.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-6">
                    {promo.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-white/50">
                    <Calendar className="w-3.5 h-3.5 text-accent" />
                    <span>{promo.validity}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/book")}
                    className="px-4 py-2 rounded-full bg-accent text-primary text-xs font-extrabold uppercase tracking-wider hover:bg-accent-hover hover:shadow-[0_0_16px_rgba(245,200,0,0.5)] active:scale-95 transition-all inline-flex items-center gap-1.5"
                  >
                    <span>Reserve</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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

export default Promotions;


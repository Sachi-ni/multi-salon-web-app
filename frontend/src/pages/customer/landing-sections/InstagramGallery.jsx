import React from "react";
import { motion } from "framer-motion";
import { Instagram, Sparkles, Eye } from "lucide-react";

const GALLERY_PHOTOS = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
    caption: "Salon Interior & Styling Stations",
    tag: "#SalonAesthetic",
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80",
    caption: "Luxe Blowout & Volumizing",
    tag: "#HairGoals",
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
    caption: "Classic Barber Chair Craft",
    tag: "#GentlemansGrooming",
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80",
    caption: "Precision Shear Detailing",
    tag: "#MasterCut",
  },
  {
    id: 5,
    url: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80",
    caption: "Therapeutic Scalp Spa",
    tag: "#ScalpRitual",
  },
  {
    id: 6,
    url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80",
    caption: "Artisan Beard Sculpting",
    tag: "#BeardPerfection",
  },
];

const InstagramGallery = () => {
  return (
    <section id="gallery" className="py-24 sm:py-32 bg-surface-2 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full bg-surface/60 border border-accent/20 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Visual Gallery
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-white tracking-tight leading-tight">
              Life Inside <span className="text-gradient">Salon Hub</span>
            </h2>
            <p className="text-white/60 text-base sm:text-lg mt-3 max-w-xl">
              A glimpse into our daily styling sessions, client transformations, and welcoming spaces.
            </p>
          </div>

          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface border border-white/10 hover:border-accent text-white hover:text-accent text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 self-start md:self-end group shadow-lg"
          >
            <Instagram className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
            <span>Follow @salonhub</span>
          </a>
        </div>

        {/* 6-Grid Gallery */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {GALLERY_PHOTOS.map((photo, idx) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.06 }}
              className="group relative h-64 sm:h-72 rounded-2xl overflow-hidden bg-surface-3 border border-white/[0.06] cursor-pointer"
            >
              <img
                src={photo.url}
                alt={photo.caption}
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                loading="lazy"
              />

              {/* Hover Dark Overlay with Details */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <span className="text-[11px] font-bold text-accent uppercase tracking-wider mb-1">
                  {photo.tag}
                </span>
                <p className="text-xs text-white/90 font-medium line-clamp-2">
                  {photo.caption}
                </p>
                <div className="mt-2 pt-2 border-t border-white/15 flex items-center justify-between text-white/60 text-[10px]">
                  <span className="flex items-center gap-1">
                    <Instagram className="w-3 h-3 text-accent" /> Salon Hub
                  </span>
                  <Eye className="w-3.5 h-3.5 text-accent" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InstagramGallery;


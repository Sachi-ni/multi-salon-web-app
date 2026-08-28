import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import api from "../../../services/api";
import { mediaUrl } from "../../../utils/mediaUrl";

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    api.get("/feedback/public")
      .then((response) => setTestimonials(response.data || []))
      .catch((error) => console.error("Could not load customer feedback", error));
  }, []);

  if (!testimonials.length) return null;
  const testimonial = testimonials[currentIndex];
  const initials = testimonial.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <section id="testimonials" className="py-24 bg-primary relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface-2 via-primary to-primary opacity-50" />
      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
        <div className="text-accent font-bold tracking-widest uppercase text-sm mb-3">Testimonials</div>
        <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-16">Client <span className="text-gradient">Stories</span></h2>
        <div className="relative h-[400px] md:h-[300px]">
          <AnimatePresence mode="wait">
            <motion.div key={testimonial.id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.5 }} className="absolute inset-0 flex flex-col items-center justify-center">
              <Quote className="w-12 h-12 text-accent/20 mb-6" />
              <div className="flex gap-1 mb-6">{[...Array(testimonial.rating)].map((_, index) => <Star key={index} className="w-5 h-5 fill-accent text-accent" />)}</div>
              <p className="text-xl md:text-2xl text-white/90 font-light leading-relaxed mb-8 max-w-3xl">“{testimonial.text}”</p>
              <div className="flex items-center gap-4">
                {testimonial.image ? <img src={mediaUrl(testimonial.image)} alt={testimonial.name} className="w-14 h-14 rounded-full object-cover border-2 border-accent" /> : <div className="w-14 h-14 rounded-full bg-accent text-primary flex items-center justify-center font-black border-2 border-accent">{initials}</div>}
                <div className="text-left"><h4 className="text-white font-bold">{testimonial.name}</h4><span className="text-white/50 text-sm">{testimonial.salon || "Verified customer"}</span></div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        {testimonials.length > 1 && <div className="flex justify-center gap-4 mt-8"><button onClick={() => setCurrentIndex((currentIndex - 1 + testimonials.length) % testimonials.length)} className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-white hover:bg-surface-3 hover:text-accent transition-colors"><ChevronLeft /></button><button onClick={() => setCurrentIndex((currentIndex + 1) % testimonials.length)} className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-white hover:bg-surface-3 hover:text-accent transition-colors"><ChevronRight /></button></div>}
      </div>
    </section>
  );
};

export default Testimonials;

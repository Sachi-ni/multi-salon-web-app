import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sophia Martinez",
      role: "Regular Client",
      text: "The absolute best salon experience I've ever had. The attention to detail and the luxurious atmosphere make every visit incredibly special. My hair has never looked better.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1974&auto=format&fit=crop"
    },
    {
      name: "James Wilson",
      role: "Executive",
      text: "Professional, precise, and premium. I come here for my weekly grooming and the service is consistently flawless. Highly recommend their beard trim and hot towel shave.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop"
    },
    {
      name: "Olivia Thompson",
      role: "Bride",
      text: "They handled my bridal makeup and hair, and I was blown away. The team was calming, professional, and made me feel like an absolute queen on my big day.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop"
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section id="testimonials" className="py-24 bg-primary relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface-2 via-primary to-primary opacity-50" />
      
      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
        <div className="text-accent font-bold tracking-widest uppercase text-sm mb-3">Testimonials</div>
        <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-16">
          Client <span className="text-gradient">Stories</span>
        </h2>

        <div className="relative h-[400px] md:h-[300px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <Quote className="w-12 h-12 text-accent/20 mb-6" />
              
              <div className="flex gap-1 mb-6">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                ))}
              </div>

              <p className="text-xl md:text-2xl text-white/90 font-light leading-relaxed mb-8 max-w-3xl">
                "{testimonials[currentIndex].text}"
              </p>

              <div className="flex items-center gap-4">
                <img 
                  src={testimonials[currentIndex].image} 
                  alt={testimonials[currentIndex].name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-accent" 
                />
                <div className="text-left">
                  <h4 className="text-white font-bold">{testimonials[currentIndex].name}</h4>
                  <span className="text-white/50 text-sm">{testimonials[currentIndex].role}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mt-8">
          <button 
            onClick={prevTestimonial}
            className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-white hover:bg-surface-3 hover:text-accent transition-colors"
          >
            <ChevronLeft />
          </button>
          <button 
            onClick={nextTestimonial}
            className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-white hover:bg-surface-3 hover:text-accent transition-colors"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

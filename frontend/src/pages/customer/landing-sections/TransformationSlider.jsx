import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ServiceIcon } from "../../../utils/serviceIcons";

const TRANSFORMATIONS = [
  {
    id: "haircut",
    category: "Cut & Styling",
    serviceName: "Hair Cutting",
    title: "Precision Haircut & Volumizing Style",
    description:
      "Full hair trimming and custom layered cut eliminating split ends, restoring natural bounce, shape, and effortless elegance.",
    duration: "30 min",
    price: "LKR 700",
    beforeImg:
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1200&q=80",
    afterImg:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Custom Layering", "Split-End Removal", "Mirror-Shine Blowout"],
  },
  {
    id: "beard",
    category: "Barber Grooming",
    serviceName: "Beard Trimming",
    title: "Executive Skin Fade & Beard Sculpting",
    description:
      "Razor-sharp taper fade paired with artisan hot towel beard contouring, neckline alignment, and nourishing conditioning oil.",
    duration: "30 min",
    price: "LKR 500",
    beforeImg:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=80",
    afterImg:
      "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Symmetrical Edge-Up", "Hot Towel Finish", "Beard Oil Hydration"],
  },
  {
    id: "color",
    category: "Color Transformation",
    serviceName: "Hair Color",
    title: "Dimensional Radiant Balayage & Gloss",
    description:
      "Multi-tonal sun-kissed blonde balayage and gloss treatment, restoring vibrant radiance, seamless blending, and mirror shine.",
    duration: "45 min",
    price: "LKR 3000",
    beforeImg:
      "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=1200&q=80",
    afterImg:
      "https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Ammonia-Free Formula", "High-Shine Gloss", "Zero Line of Demarcation"],
  },
  {
    id: "facial",
    category: "Skin Rejuvenation",
    serviceName: "Facial",
    title: "Deep Pore Purifying & Hydra-Glow Facial",
    description:
      "Intensive clarifying facial with gentle botanical exfoliation, ultrasonic pore cleanse, and gold peptide hydration for radiant skin.",
    duration: "60 min",
    price: "LKR 3200",
    beforeImg:
      "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1200&q=80",
    afterImg:
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Ultrasonic Extraction", "Collagen Infusion", "Instant Dewy Complexion"],
  },
];

const TransformationSlider = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [sliderPos, setSliderPos] = useState(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const activeItem = TRANSFORMATIONS[activeTab];

  // Move slider position based on clientX
  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(2, Math.min(98, (x / rect.width) * 100));
    setSliderPos(pos);
  }, []);

  // Global mousemove/mouseup listeners for smooth drag outside boundary
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    const handleGlobalTouchMove = (e) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
      window.addEventListener("touchmove", handleGlobalTouchMove);
      window.addEventListener("touchend", handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("touchmove", handleGlobalTouchMove);
      window.removeEventListener("touchend", handleGlobalMouseUp);
    };
  }, [isDragging, handleMove]);

  return (
    <section id="transformations" className="py-24 bg-surface-2 relative overflow-hidden select-none">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Visible Service Results
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-white tracking-tight leading-tight">
            Before & After <span className="text-gradient">Transformations</span>
          </h2>
          <p className="text-white/70 text-base sm:text-lg mt-3 max-w-2xl mx-auto">
            Drag the interactive slider to see the true difference our expert stylists make for our clients.
          </p>

          {/* Service Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            {TRANSFORMATIONS.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(idx);
                  setSliderPos(50);
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 ${activeTab === idx
                  ? "bg-accent text-primary shadow-[0_0_18px_rgba(245,200,0,0.4)]"
                  : "bg-surface text-white/70 hover:text-white border border-white/10 hover:border-accent/40"
                  }`}
              >
                <ServiceIcon name={item.serviceName} className="w-4 h-4" />
                <span>{item.category}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Main Interactive Split Comparison Slider ── */}
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl bg-surface border border-border p-4 sm:p-6 shadow-2xl">
            <div
              ref={containerRef}
              onMouseDown={(e) => {
                setIsDragging(true);
                handleMove(e.clientX);
              }}
              onTouchStart={(e) => {
                setIsDragging(true);
                handleMove(e.touches[0].clientX);
              }}
              onClick={(e) => handleMove(e.clientX)}
              className="relative h-[340px] sm:h-[460px] md:h-[500px] w-full rounded-2xl overflow-hidden cursor-ew-resize touch-none select-none border border-white/10"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeItem.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0"
                >
                  {/* Underneath: AFTER Image (Full Width) */}
                  <img
                    src={activeItem.afterImg}
                    alt={`${activeItem.title} - After Service`}
                    className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
                  />
                  {/* "AFTER" Badge */}
                  <span className="absolute top-5 right-5 px-4 py-1.5 rounded-full bg-accent text-primary text-xs font-black uppercase tracking-widest shadow-xl pointer-events-none">
                    AFTER
                  </span>

                  {/* Overlap: BEFORE Image (Clipped dynamically by sliderPos) */}
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                  >
                    <img
                      src={activeItem.beforeImg}
                      alt={`${activeItem.title} - Before Service`}
                      className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
                    />
                    {/* "BEFORE" Badge */}
                    <span className="absolute top-5 left-5 px-4 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-xs font-black uppercase tracking-widest text-white/90 shadow-xl pointer-events-none">
                      BEFORE
                    </span>
                  </div>

                  {/* Golden Vertical Divider & Center Drag Handle */}
                  <div
                    className="absolute top-0 bottom-0 z-20 pointer-events-none"
                    style={{ left: `${sliderPos}%` }}
                  >
                    <div className="absolute top-0 bottom-0 -left-[1.5px] w-[3px] bg-accent shadow-[0_0_14px_rgba(245,200,0,0.85)]" />
                    <div className="absolute top-1/2 -left-5 -translate-y-1/2 w-10 h-10 rounded-full bg-accent text-primary font-black flex items-center justify-center shadow-[0_0_24px_rgba(245,200,0,0.95)] border-2 border-primary">
                      <span className="text-xs font-extrabold tracking-tighter">◀▶</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Transformation Info & Booking Action */}
            <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-1 rounded-md border border-accent/20">
                    {activeItem.category}
                  </span>
                  <span className="text-xs text-white/60 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    {activeItem.duration}
                  </span>
                  <span className="text-sm font-black text-accent">{activeItem.price}</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {activeItem.title}
                </h3>
                <p className="text-sm text-white/60 max-w-xl leading-relaxed">
                  {activeItem.description}
                </p>

                {/* Highlights tags */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {activeItem.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 text-xs text-white/80 bg-surface-3/60 px-2.5 py-1 rounded-lg border border-white/5"
                    >
                      <CheckCircle2 className="w-3 h-3 text-accent" />
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate("/book")}
                  className="px-6 py-3.5 rounded-xl bg-accent text-primary font-extrabold text-sm tracking-wide hover:bg-accent-hover hover:shadow-[0_0_25px_rgba(245,200,0,0.6)] active:scale-95 transition-all inline-flex items-center justify-center gap-2 shadow-xl"
                >
                  <span>Book This Service</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/our-services")}
                  className="px-6 py-3 rounded-xl bg-surface border border-border text-white/80 hover:text-white hover:border-accent/50 text-xs font-bold tracking-wide transition-all text-center"
                >
                  View All Services
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Gallery Cards Grid (Side-by-Side Thumbnails) ── */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {TRANSFORMATIONS.map((item, index) => {
            const isSelected = activeTab === index;
            return (
              <div
                key={item.id}
                onClick={() => {
                  setActiveTab(index);
                  setSliderPos(50);
                  const el = document.getElementById("transformations");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className={`cursor-pointer rounded-2xl p-4 transition-all duration-300 border bg-surface group ${isSelected
                  ? "border-accent shadow-[0_0_20px_rgba(245,200,0,0.2)]"
                  : "border-border hover:border-accent/40 hover:-translate-y-1"
                  }`}
              >
                {/* 2-Column Before / After Image Preview */}
                <div className="grid grid-cols-2 gap-2 h-36 rounded-xl overflow-hidden mb-3.5 relative">
                  <div className="relative h-full">
                    <img
                      src={item.beforeImg}
                      alt="Before"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-black/80 text-white">
                      Before
                    </span>
                  </div>
                  <div className="relative h-full">
                    <img
                      src={item.afterImg}
                      alt="After"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-accent text-primary font-bold">
                      After
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-accent font-semibold mb-1">
                  <span className="flex items-center gap-1.5">
                    <ServiceIcon name={item.serviceName} className="w-3.5 h-3.5" />
                    {item.category}
                  </span>
                  <span>{item.price}</span>
                </div>
                <h4 className="text-white font-bold text-sm line-clamp-1 group-hover:text-accent transition-colors">
                  {item.title}
                </h4>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TransformationSlider;

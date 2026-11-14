import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import api from "../../../services/api";

/* ─── Local Luxury Salon Background Slides ─────────────────────────── */
const HERO_IMAGES = [
  `${process.env.PUBLIC_URL || ""}/hero-slide-1.jpg`,
  `${process.env.PUBLIC_URL || ""}/hero-slide-2.jpg`,
  `${process.env.PUBLIC_URL || ""}/hero-slide-3.jpg`,
  `${process.env.PUBLIC_URL || ""}/hero-slide-4.jpg`,
];

const SLIDE_INTERVAL_MS = 5000;

const initialStats = {
  happyClients: 0,
  expertStylists: 0,
  salonBranches: 0,
  yearsExperience: 0,
};

const formatCount = (count, suffix = "+") => {
  const num = Number(count) || 0;
  return `${new Intl.NumberFormat("en").format(num)}${num > 0 ? suffix : ""}`;
};

const Hero = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(initialStats);
  const [currentIndex, setCurrentIndex] = useState(0);

  /* ── 1. Fetch Dynamic Platform Statistics ───────────────────────── */
  useEffect(() => {
    let isMounted = true;

    api
      .get("/utils/platform-stats")
      .then(({ data }) => {
        if (isMounted) setStats({ ...initialStats, ...data });
      })
      .catch((error) => {
        console.error("Unable to load platform statistics:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  /* ── 2. Background Slideshow Logic & Image Preloading ────────────── */
  useEffect(() => {
    HERO_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const intervalId = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, SLIDE_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      <section
        id="home"
        className="relative min-h-[85vh] lg:min-h-[92vh] flex items-center justify-center pt-24 pb-16 overflow-hidden bg-primary"
      >
        {/* ── Background Slideshow Layer (Vibrant, Clear, Smooth 1.5s Fade) ── */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {HERO_IMAGES.map((src, index) => {
            const isActive = index === currentIndex;
            return (
              <div
                key={src}
                className={`absolute inset-0 w-full h-full transition-opacity duration-[1500ms] ease-in-out ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  backgroundImage: `url(${src})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
                role="img"
                aria-label={`Luxury Salon Ambiance ${index + 1}`}
                aria-hidden={!isActive}
              />
            );
          })}
        </div>

        {/* ── Subtle Cinematic Overlays (Images Stay Bright and Clear) ── */}
        {/* Top soft vignette for navigation legibility */}
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/60 via-black/20 to-transparent z-10 pointer-events-none" />

        {/* Left gentle gradient for text legibility (center/right stay unobstructed) */}
        <div className="absolute inset-y-0 left-0 w-full md:w-3/5 bg-gradient-to-r from-black/65 via-black/30 to-transparent z-10 pointer-events-none" />

        {/* Bottom smooth blend into stats strip */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-primary via-primary/50 to-transparent z-10 pointer-events-none" />

        {/* ── Clean & Professional Hero Content (Simple & Uncluttered) ── */}
        <div className="relative z-20 max-w-7xl mx-auto px-6 w-full">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col gap-5 max-w-2xl"
          >
            {/* Elegant Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-accent/30 w-max shadow-lg">
              <Star className="text-accent w-3.5 h-3.5 fill-accent" />
              <span className="text-xs font-semibold tracking-wider text-accent uppercase">
                Premium Grooming Studio
              </span>
            </div>

            {/* Clear, Impactful Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-black leading-[1.12] tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
              ELEVATE YOUR STYLE. <br />
              <span className="text-gradient">EMBRACE LUXURY.</span>
            </h1>

            {/* Concise Tagline */}
            <p className="text-base sm:text-lg text-white/90 max-w-lg font-light leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
              Experience world-class grooming and beauty services in an atmosphere of pure luxury.
            </p>

            {/* Clean Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => navigate("/book")}
                className="px-7 py-3.5 bg-accent text-primary rounded-xl text-base font-extrabold tracking-wide hover:bg-accent-hover hover:shadow-[0_0_25px_rgba(245,200,0,0.6)] active:scale-[0.98] transition-all duration-300 flex items-center gap-2 group shadow-xl"
              >
                <span>Book Appointment</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                type="button"
                onClick={() => navigate("/our-services")}
                className="px-7 py-3.5 bg-black/50 backdrop-blur-md border border-white/20 text-white rounded-xl text-base font-bold hover:bg-white/10 hover:border-accent/50 hover:shadow-[0_0_20px_rgba(245,200,0,0.3)] active:scale-[0.98] transition-all duration-300 shadow-xl"
              >
                Explore Services
              </button>
            </div>
          </motion.div>
        </div>

        {/* ── Slide Progress Indicator Dots (Subtle & Minimal) ─────── */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {HERO_IMAGES.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                index === currentIndex
                  ? "w-8 bg-accent"
                  : "w-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </section>

      {/* ── Sleek Platform Stats Bar (Clean & Professional Social Proof) ── */}
      <div className="relative z-20 bg-surface/95 border-y border-white/[0.08] py-8 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
            {[
              { label: "Happy Clients", value: formatCount(stats.happyClients) },
              { label: "Expert Stylists", value: formatCount(stats.expertStylists) },
              { label: "Salon Branches", value: formatCount(stats.salonBranches, "") },
              {
                label: "Years Experience",
                value: stats.yearsExperience > 0 ? `${stats.yearsExperience}+` : "1+",
              },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-center p-3">
                <div className="text-3xl sm:text-4xl font-display font-black text-accent tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-white/70 font-medium uppercase tracking-wider mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Hero;

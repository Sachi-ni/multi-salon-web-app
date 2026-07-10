import { motion } from "framer-motion";

/**
 * CustomerDashboardBackground
 * 
 * Premium decorative background with salon-themed SVG illustrations.
 * Positioned behind all dashboard content with elegant gold accents.
 */
export default function CustomerDashboardBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      
      {/* ─── Ambient Glow Layers ─── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-surface-3 via-primary to-primary opacity-50" />
      <div className="absolute top-10 right-[-10%] w-[700px] h-[700px] bg-[#d4af37]/[0.06] rounded-full blur-[150px]" />
      <div className="absolute bottom-0 left-[-10%] w-[600px] h-[600px] bg-[#d4af37]/[0.04] rounded-full blur-[120px]" />
      <div className="absolute top-[50%] left-[30%] w-[500px] h-[300px] bg-white/[0.02] rounded-full blur-[180px]" />

      {/* ─── TOP-LEFT: Large Scissors ─── */}
      <motion.div
        className="absolute top-28 left-4 md:left-10"
        animate={{ y: [0, -12, 0], rotate: [0, 3, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="160" height="160" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 0 12px rgba(212,175,55,0.15))" }}>
          <circle cx="30" cy="85" r="18" stroke="#d4af37" strokeWidth="1.8" opacity="0.18" />
          <circle cx="30" cy="85" r="7" stroke="#d4af37" strokeWidth="1.2" opacity="0.25" />
          <circle cx="90" cy="85" r="18" stroke="#d4af37" strokeWidth="1.8" opacity="0.18" />
          <circle cx="90" cy="85" r="7" stroke="#d4af37" strokeWidth="1.2" opacity="0.25" />
          <line x1="42" y1="72" x2="60" y2="40" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" opacity="0.2" />
          <line x1="78" y1="72" x2="60" y2="40" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" opacity="0.2" />
          {/* Blade edges */}
          <line x1="42" y1="72" x2="60" y2="35" stroke="#d4af37" strokeWidth="0.8" strokeLinecap="round" opacity="0.12" />
          <line x1="78" y1="72" x2="60" y2="35" stroke="#d4af37" strokeWidth="0.8" strokeLinecap="round" opacity="0.12" />
        </svg>
      </motion.div>

      {/* ─── TOP-RIGHT: Comb ─── */}
      <motion.div
        className="absolute top-32 right-6 md:right-14 hidden sm:block"
        animate={{ y: [0, 14, 0], rotate: [12, 16, 12] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="180" height="80" viewBox="0 0 160 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 0 10px rgba(212,175,55,0.12))" }}>
          {/* Handle */}
          <rect x="5" y="24" width="150" height="14" rx="7" stroke="#d4af37" strokeWidth="1.5" opacity="0.18" />
          <rect x="8" y="27" width="144" height="8" rx="4" stroke="#d4af37" strokeWidth="0.6" opacity="0.1" />
          {/* Teeth */}
          {Array.from({ length: 18 }).map((_, i) => (
            <line key={i} x1={14 + i * 8} y1="24" x2={14 + i * 8} y2="5" stroke="#d4af37" strokeWidth="1.3" strokeLinecap="round" opacity="0.2" />
          ))}
        </svg>
      </motion.div>

      {/* ─── LEFT EDGE: Hair Dryer ─── */}
      <motion.div
        className="absolute top-[42%] left-2 md:left-8 hidden md:block"
        animate={{ y: [0, 16, 0], rotate: [-8, -4, -8] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="170" height="170" viewBox="0 0 130 140" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 0 14px rgba(212,175,55,0.12))" }}>
          {/* Nozzle */}
          <rect x="5" y="48" width="45" height="20" rx="5" stroke="#d4af37" strokeWidth="1.5" opacity="0.18" />
          <line x1="10" y1="54" x2="42" y2="54" stroke="#d4af37" strokeWidth="0.6" opacity="0.1" />
          <line x1="10" y1="62" x2="42" y2="62" stroke="#d4af37" strokeWidth="0.6" opacity="0.1" />
          {/* Body */}
          <ellipse cx="75" cy="58" rx="32" ry="28" stroke="#d4af37" strokeWidth="1.8" opacity="0.18" />
          {/* Inner fan circle */}
          <ellipse cx="75" cy="58" rx="16" ry="14" stroke="#d4af37" strokeWidth="1" opacity="0.15" />
          <line x1="75" y1="44" x2="75" y2="72" stroke="#d4af37" strokeWidth="0.8" opacity="0.12" />
          <line x1="61" y1="58" x2="89" y2="58" stroke="#d4af37" strokeWidth="0.8" opacity="0.12" />
          {/* Handle */}
          <path d="M68 86 L63 125 Q62 130 67 130 L83 130 Q88 130 87 125 L82 86" stroke="#d4af37" strokeWidth="1.5" strokeLinejoin="round" opacity="0.18" />
          <line x1="70" y1="100" x2="80" y2="100" stroke="#d4af37" strokeWidth="0.6" opacity="0.1" />
          <line x1="69" y1="110" x2="81" y2="110" stroke="#d4af37" strokeWidth="0.6" opacity="0.1" />
        </svg>
      </motion.div>

      {/* ─── BOTTOM-LEFT: Razor ─── */}
      <motion.div
        className="absolute bottom-28 left-6 md:left-14 hidden sm:block"
        animate={{ y: [0, -10, 0], rotate: [25, 30, 25] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="140" height="100" viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 0 10px rgba(212,175,55,0.12))" }}>
          {/* Handle */}
          <rect x="5" y="28" width="60" height="14" rx="7" stroke="#d4af37" strokeWidth="1.5" opacity="0.18" />
          <line x1="12" y1="35" x2="55" y2="35" stroke="#d4af37" strokeWidth="0.6" opacity="0.1" />
          {/* Blade head */}
          <rect x="58" y="18" width="28" height="34" rx="4" stroke="#d4af37" strokeWidth="1.6" opacity="0.2" />
          {/* Blade lines */}
          {[24, 30, 36, 42, 48].map((y) => (
            <line key={y} x1="64" y1={y} x2="80" y2={y} stroke="#d4af37" strokeWidth="0.9" opacity="0.15" />
          ))}
        </svg>
      </motion.div>

      {/* ─── RIGHT EDGE: Hair Brush ─── */}
      <motion.div
        className="absolute top-[52%] right-4 md:right-12 hidden md:block"
        animate={{ y: [0, -14, 0], rotate: [-15, -10, -15] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="70" height="200" viewBox="0 0 55 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 0 12px rgba(212,175,55,0.12))" }}>
          {/* Handle */}
          <rect x="16" y="100" width="22" height="70" rx="11" stroke="#d4af37" strokeWidth="1.5" opacity="0.18" />
          <line x1="23" y1="115" x2="31" y2="115" stroke="#d4af37" strokeWidth="0.6" opacity="0.1" />
          <line x1="23" y1="130" x2="31" y2="130" stroke="#d4af37" strokeWidth="0.6" opacity="0.1" />
          {/* Brush head */}
          <ellipse cx="27" cy="50" rx="24" ry="50" stroke="#d4af37" strokeWidth="1.6" opacity="0.18" />
          {/* Bristle dots */}
          {[18, 35, 52, 68, 80].map((cy) => (
            <g key={cy}>
              <circle cx="14" cy={cy} r="2.5" stroke="#d4af37" strokeWidth="1" opacity="0.2" />
              <circle cx="27" cy={cy} r="2.5" stroke="#d4af37" strokeWidth="1" opacity="0.2" />
              <circle cx="40" cy={cy} r="2.5" stroke="#d4af37" strokeWidth="1" opacity="0.2" />
            </g>
          ))}
        </svg>
      </motion.div>

      {/* ─── BOTTOM-RIGHT: Hair Clipper ─── */}
      <motion.div
        className="absolute bottom-20 right-8 md:right-18 hidden sm:block"
        animate={{ y: [0, 10, 0], rotate: [-12, -8, -12] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="110" height="160" viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 0 12px rgba(212,175,55,0.12))" }}>
          {/* Body */}
          <rect x="14" y="22" width="52" height="80" rx="10" stroke="#d4af37" strokeWidth="1.6" opacity="0.18" />
          {/* Inner body detail */}
          <rect x="20" y="28" width="40" height="68" rx="6" stroke="#d4af37" strokeWidth="0.6" opacity="0.08" />
          {/* Blade */}
          <rect x="10" y="8" width="60" height="18" rx="4" stroke="#d4af37" strokeWidth="1.5" opacity="0.2" />
          {/* Blade teeth */}
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={i} x1={17 + i * 5} y1="8" x2={17 + i * 5} y2="0" stroke="#d4af37" strokeWidth="1.2" strokeLinecap="round" opacity="0.22" />
          ))}
          {/* Body detail lines */}
          <line x1="24" y1="45" x2="56" y2="45" stroke="#d4af37" strokeWidth="0.8" opacity="0.12" />
          <line x1="24" y1="60" x2="56" y2="60" stroke="#d4af37" strokeWidth="0.8" opacity="0.12" />
          {/* Power button */}
          <circle cx="40" cy="78" r="7" stroke="#d4af37" strokeWidth="1.2" opacity="0.18" />
          <circle cx="40" cy="78" r="3" fill="#d4af37" fillOpacity="0.15" />
        </svg>
      </motion.div>

      {/* ─── Geometric Accents ─── */}
      
      {/* Diamond — top right area */}
      <motion.div
        className="absolute top-56 right-[28%] hidden lg:block"
        animate={{ rotate: [45, 52, 45], scale: [1, 1.08, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="50" height="50" viewBox="0 0 50 50" fill="none" style={{ filter: "drop-shadow(0 0 8px rgba(212,175,55,0.1))" }}>
          <rect x="8" y="8" width="34" height="34" rx="2" stroke="#d4af37" strokeWidth="1" opacity="0.14" transform="rotate(45 25 25)" />
        </svg>
      </motion.div>

      {/* Concentric circles — bottom left area */}
      <motion.div
        className="absolute bottom-56 left-[8%] hidden sm:block"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" style={{ filter: "drop-shadow(0 0 8px rgba(212,175,55,0.08))" }}>
          <circle cx="50" cy="50" r="45" stroke="#d4af37" strokeWidth="0.8" opacity="0.12" />
          <circle cx="50" cy="50" r="32" stroke="#d4af37" strokeWidth="0.7" opacity="0.1" />
          <circle cx="50" cy="50" r="19" stroke="#d4af37" strokeWidth="0.6" opacity="0.08" />
        </svg>
      </motion.div>

      {/* Thin gold lines — left edge */}
      <motion.div
        className="absolute top-[22%] left-0 hidden lg:block"
        animate={{ x: [0, 6, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="220" height="80" viewBox="0 0 220 80" fill="none">
          <line x1="0" y1="15" x2="200" y2="15" stroke="url(#lineGradL1)" strokeWidth="0.8" opacity="0.14" />
          <line x1="0" y1="35" x2="150" y2="35" stroke="url(#lineGradL2)" strokeWidth="0.6" opacity="0.1" />
          <line x1="0" y1="55" x2="100" y2="55" stroke="url(#lineGradL3)" strokeWidth="0.5" opacity="0.08" />
          <defs>
            <linearGradient id="lineGradL1"><stop offset="0%" stopColor="#d4af37" stopOpacity="0.5" /><stop offset="100%" stopColor="#d4af37" stopOpacity="0" /></linearGradient>
            <linearGradient id="lineGradL2"><stop offset="0%" stopColor="#d4af37" stopOpacity="0.4" /><stop offset="100%" stopColor="#d4af37" stopOpacity="0" /></linearGradient>
            <linearGradient id="lineGradL3"><stop offset="0%" stopColor="#d4af37" stopOpacity="0.3" /><stop offset="100%" stopColor="#d4af37" stopOpacity="0" /></linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Thin gold lines — right edge */}
      <motion.div
        className="absolute bottom-[18%] right-0 hidden lg:block"
        animate={{ x: [0, -6, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      >
        <svg width="220" height="80" viewBox="0 0 220 80" fill="none">
          <line x1="220" y1="20" x2="20" y2="20" stroke="url(#lineGradR1)" strokeWidth="0.8" opacity="0.14" />
          <line x1="220" y1="40" x2="70" y2="40" stroke="url(#lineGradR2)" strokeWidth="0.6" opacity="0.1" />
          <line x1="220" y1="60" x2="120" y2="60" stroke="url(#lineGradR3)" strokeWidth="0.5" opacity="0.08" />
          <defs>
            <linearGradient id="lineGradR1"><stop offset="0%" stopColor="#d4af37" stopOpacity="0" /><stop offset="100%" stopColor="#d4af37" stopOpacity="0.5" /></linearGradient>
            <linearGradient id="lineGradR2"><stop offset="0%" stopColor="#d4af37" stopOpacity="0" /><stop offset="100%" stopColor="#d4af37" stopOpacity="0.4" /></linearGradient>
            <linearGradient id="lineGradR3"><stop offset="0%" stopColor="#d4af37" stopOpacity="0" /><stop offset="100%" stopColor="#d4af37" stopOpacity="0.3" /></linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* ─── Sparkle Stars ─── */}
      
      {/* Sparkle — top center-right */}
      <motion.div
        className="absolute top-40 right-[32%] hidden md:block"
        animate={{ opacity: [0.15, 0.3, 0.15], scale: [1, 1.3, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ filter: "drop-shadow(0 0 6px rgba(212,175,55,0.3))" }}>
          <path d="M12 0 L14 9 L24 12 L14 15 L12 24 L10 15 L0 12 L10 9 Z" fill="#d4af37" fillOpacity="0.5" />
        </svg>
      </motion.div>

      {/* Sparkle — bottom center-left */}
      <motion.div
        className="absolute bottom-36 left-[22%] hidden md:block"
        animate={{ opacity: [0.12, 0.25, 0.12], scale: [1, 1.4, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ filter: "drop-shadow(0 0 5px rgba(212,175,55,0.25))" }}>
          <path d="M12 0 L14 9 L24 12 L14 15 L12 24 L10 15 L0 12 L10 9 Z" fill="#d4af37" fillOpacity="0.45" />
        </svg>
      </motion.div>

      {/* Sparkle — large bottom-right */}
      <motion.div
        className="absolute bottom-12 right-[18%]"
        animate={{ opacity: [0.18, 0.35, 0.18], rotate: [0, 20, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
      >
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ filter: "drop-shadow(0 0 10px rgba(212,175,55,0.35))" }}>
          <path d="M18 0 L21 14 L36 18 L21 22 L18 36 L15 22 L0 18 L15 14 Z" fill="#d4af37" fillOpacity="0.4" />
        </svg>
      </motion.div>

      {/* Sparkle — small top-left */}
      <motion.div
        className="absolute top-52 left-[18%] hidden sm:block"
        animate={{ opacity: [0.1, 0.22, 0.1], scale: [1, 1.2, 1] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ filter: "drop-shadow(0 0 4px rgba(212,175,55,0.2))" }}>
          <path d="M12 0 L14 9 L24 12 L14 15 L12 24 L10 15 L0 12 L10 9 Z" fill="#d4af37" fillOpacity="0.5" />
        </svg>
      </motion.div>

      {/* Sparkle — mid-right */}
      <motion.div
        className="absolute top-[38%] right-[5%]"
        animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.15, 1] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ filter: "drop-shadow(0 0 5px rgba(212,175,55,0.2))" }}>
          <path d="M12 0 L14 9 L24 12 L14 15 L12 24 L10 15 L0 12 L10 9 Z" fill="#d4af37" fillOpacity="0.45" />
        </svg>
      </motion.div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Scissors, LogIn, UserPlus, LogOut, CalendarCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../context/AuthContext";
import CustomerHeader from "../../../components/layout/CustomerHeader";

const LandingNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("#home");

  useEffect(() => {
    if (location.pathname === "/" || location.pathname === "") {
      setActiveLink(location.hash || "#home");
    } else {
      setActiveLink(location.pathname);
    }
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Logged-in customers get the app header (same as the My Appointments page)
  if (user && (user.role === "customer" || user.role === "user")) {
    return <CustomerHeader />;
  }

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "About", href: "/about" },
    { name: "Services", href: "/our-services" },
    { name: "Salons", href: "/our-salons" },
    { name: "Our Team", href: "/team" },
    { name: "Testimonials", href: "/testimonials" },
    { name: "Contact", href: "/contact" },
  ];

  const isHomePage = location.pathname === "/" || location.pathname === "";

  const isLinkActive = (link) => {
    if (isHomePage) {
      if (link.href === "#home") {
        return activeLink === "#home" || !activeLink || activeLink === "/";
      }
      return activeLink === link.href || (location.hash && location.hash === link.href);
    }
    return link.href === location.pathname;
  };

  const scrollToSection = (href) => {
    setIsMobileMenuOpen(false);

    if (href === "#home" || href === "/") {
      setActiveLink("#home");
      if (location.pathname !== "/") {
        navigate("/");
      } else {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
      return;
    }

    if (href.startsWith("/")) {
      setActiveLink(href);
      navigate(href);
      return;
    }

    if (location.pathname !== "/") {
      navigate("/" + href);
      return;
    }

    const element = document.querySelector(href);
    if (element) {
      setActiveLink(href);
      const offsetTop = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-surface/80 backdrop-blur-2xl border-b border-white/[0.06] py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          : "bg-gradient-to-b from-black/50 to-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 flex items-center justify-between">
        {/* ── Logo ───────────────────────────────────────────── */}
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() =>
            location.pathname !== "/" ? navigate("/") : window.scrollTo(0, 0)
          }
        >
          <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shadow-[0_0_16px_rgba(245,200,0,0.35)] group-hover:shadow-[0_0_24px_rgba(245,200,0,0.55)] transition-shadow duration-300">
            <Scissors className="w-4.5 h-4.5 text-primary" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-black tracking-tight">
            <span className="text-white">Salon</span>
            <span className="text-accent"> Hub</span>
          </span>
        </div>

        {/* ── Desktop Navigation ─────────────────────────────── */}
        <nav className="hidden lg:flex items-center">
          <div className={`flex items-center gap-0.5 rounded-full px-1.5 py-1.5 transition-all duration-500 ${
            isScrolled
              ? "bg-white/[0.04] border border-white/[0.06]"
              : "bg-white/[0.06] border border-white/[0.08] backdrop-blur-xl"
          }`}>
            {navLinks.map((link) => {
              const isActive = isLinkActive(link);
              return (
                <button
                  key={link.name}
                  onClick={() => scrollToSection(link.href)}
                  className={`relative px-4 py-2 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 ${
                    isActive
                      ? "text-primary font-bold"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="navbar-active-pill"
                      className="absolute inset-0 bg-accent rounded-full shadow-[0_0_16px_rgba(245,200,0,0.4)]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{link.name}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* ── Desktop Right Actions ──────────────────────────── */}
        <div className="hidden lg:flex items-center gap-2">
          {!user ? (
            <>
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-white/70 hover:text-white px-4 py-2 rounded-full hover:bg-white/[0.06] transition-all duration-300"
              >
                <LogIn className="w-3.5 h-3.5" />
                Login
              </button>
              <button
                onClick={() => navigate("/register")}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-white/70 hover:text-white px-4 py-2 rounded-full hover:bg-white/[0.06] transition-all duration-300"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Sign Up
              </button>
            </>
          ) : user.role === "customer" ? (
            <>
              <button
                onClick={() => navigate("/customer/dashboard")}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-white/70 hover:text-white px-4 py-2 rounded-full hover:bg-white/[0.06] transition-all duration-300"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                My Appointments
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-white/70 hover:text-white px-4 py-2 rounded-full hover:bg-white/[0.06] transition-all duration-300"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-white/70 hover:text-white px-4 py-2 rounded-full hover:bg-white/[0.06] transition-all duration-300"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          )}
          <button
            onClick={() => navigate("/book")}
            className="ml-1 px-5 py-2.5 bg-accent text-primary rounded-full text-[13px] font-extrabold tracking-wide shadow-[0_2px_20px_rgba(245,200,0,0.35)] hover:shadow-[0_2px_28px_rgba(245,200,0,0.6)] hover:bg-accent-hover active:scale-[0.97] transition-all duration-300 hover:-translate-y-0.5"
          >
            Book Appointment
          </button>
        </div>

        {/* ── Mobile Menu Toggle ─────────────────────────────── */}
        <button
          className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.08] border border-white/[0.1] text-white hover:text-accent hover:border-accent/40 transition-all duration-300"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ── Mobile Menu ──────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-[300px] bg-surface/95 backdrop-blur-2xl border-l border-white/[0.06] z-50 lg:hidden overflow-y-auto"
            >
              {/* Close Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                    <Scissors className="w-4 h-4 text-primary" strokeWidth={2.5} />
                  </div>
                  <span className="text-base font-black">
                    <span className="text-white">Salon</span>
                    <span className="text-accent"> Hub</span>
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-white/70 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Nav Links */}
              <nav className="px-4 py-4 flex flex-col gap-1">
                {navLinks.map((link, i) => {
                  const isActive = isLinkActive(link);
                  return (
                    <motion.button
                      key={link.name}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => scrollToSection(link.href)}
                      className={`text-left px-4 py-3 rounded-xl text-[15px] font-semibold transition-all duration-200 ${
                        isActive
                          ? "bg-accent/10 text-accent border border-accent/20"
                          : "text-white/80 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      {link.name}
                    </motion.button>
                  );
                })}
              </nav>

              {/* Divider */}
              <div className="mx-6 h-px bg-white/[0.06]" />

              {/* Auth Actions */}
              <div className="px-4 py-4 flex flex-col gap-2">
                {!user ? (
                  <>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate("/login");
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-semibold text-white/80 hover:bg-white/[0.04] hover:text-white transition-all"
                    >
                      <LogIn className="w-4 h-4 text-white/50" />
                      Login
                    </button>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate("/register");
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-semibold text-white/80 hover:bg-white/[0.04] hover:text-white transition-all"
                    >
                      <UserPlus className="w-4 h-4 text-white/50" />
                      Sign Up
                    </button>
                  </>
                ) : user.role === "customer" ? (
                  <>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate("/customer/dashboard");
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-semibold text-white/80 hover:bg-white/[0.04] hover:text-white transition-all"
                    >
                      <CalendarCheck className="w-4 h-4 text-white/50" />
                      My Appointments
                    </button>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        logout();
                        navigate("/");
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-semibold text-white/80 hover:bg-white/[0.04] hover:text-white transition-all"
                    >
                      <LogOut className="w-4 h-4 text-white/50" />
                      Logout
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                      navigate("/");
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-semibold text-white/80 hover:bg-white/[0.04] hover:text-white transition-all"
                  >
                    <LogOut className="w-4 h-4 text-white/50" />
                    Logout
                  </button>
                )}
              </div>

              {/* Book Appointment CTA */}
              <div className="px-4 pb-6">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate("/book");
                  }}
                  className="w-full py-3.5 rounded-xl bg-accent text-primary text-[15px] font-extrabold tracking-wide shadow-[0_4px_20px_rgba(245,200,0,0.3)] hover:bg-accent-hover active:scale-[0.98] transition-all"
                >
                  Book Appointment
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default LandingNavbar;

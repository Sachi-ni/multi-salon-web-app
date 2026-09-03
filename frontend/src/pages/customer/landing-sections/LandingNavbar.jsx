import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../context/AuthContext";

const LandingNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "About", href: "/about" },
    { name: "Services", href: "/our-services" },
    { name: "Salons", href: "/our-salons" },
    { name: "Our Team", href: "/team" },
    { name: "Testimonials", href: "/testimonials" },
    { name: "Contact", href: "/contact" },
  ];

  const scrollToSection = (href) => {
    setIsMobileMenuOpen(false);
    
    if (href.startsWith("/")) {
      navigate(href);
      return;
    }

    if (location.pathname !== "/") {
      navigate("/" + href);
      return;
    }

    const element = document.querySelector(href);
    if (element) {
      const offsetTop = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-surface/90 backdrop-blur-glass border-b border-border py-3 shadow-glass"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 text-xl font-black text-accent tracking-tight cursor-pointer" onClick={() => location.pathname !== "/" ? navigate("/") : window.scrollTo(0, 0)}>
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-lg font-black text-primary flex-shrink-0">
            S
          </div>
          <span className="text-white">Salon</span>Hub
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => scrollToSection(link.href)}
              className="text-sm font-medium text-white/80 hover:text-accent transition-colors"
            >
              {link.name}
            </button>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {!user ? (
            <>
              <button
                onClick={() => navigate("/login")}
                className="text-sm font-bold text-white hover:text-accent transition-colors px-4 py-2"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="text-sm font-bold text-white hover:text-accent transition-colors px-4 py-2"
              >
                Sign Up
              </button>
            </>
          ) : user.role === "customer" ? (
            <>
              <button
                onClick={() => navigate("/customer/dashboard")}
                className="text-sm font-bold text-white hover:text-accent transition-colors px-4 py-2"
              >
                My Appointments
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="text-sm font-bold text-white hover:text-accent transition-colors px-4 py-2"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="text-sm font-bold text-white hover:text-accent transition-colors px-4 py-2"
            >
              Logout
            </button>
          )}
          <button
            onClick={() => navigate("/book")}
            className="px-6 py-2.5 bg-accent text-primary rounded-xl text-sm font-extrabold tracking-wide hover:bg-accent-hover hover:shadow-glow transition-all duration-200 hover:-translate-y-0.5"
          >
            Book Appointment
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-surface/95 backdrop-blur-xl border-b border-border py-6 px-6 flex flex-col gap-6 md:hidden shadow-modal"
          >
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => scrollToSection(link.href)}
                  className="text-lg font-semibold text-white/90 hover:text-accent text-left"
                >
                  {link.name}
                </button>
              ))}
            </nav>
            <div className="h-px bg-border w-full" />
            <div className="flex flex-col gap-4">
              {!user ? (
                <>
                  <button
                    onClick={() => navigate("/login")}
                    className="text-center text-lg font-bold text-white py-3 rounded-xl border border-border hover:bg-surface-2 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate("/signup")}
                    className="text-center text-lg font-bold text-white py-3 rounded-xl border border-border hover:bg-surface-2 transition-colors"
                  >
                    Sign Up
                  </button>
                </>
              ) : user.role === "customer" ? (
                <>
                  <button
                    onClick={() => navigate("/customer/dashboard")}
                    className="text-center text-lg font-bold text-white py-3 rounded-xl border border-border hover:bg-surface-2 transition-colors"
                  >
                    My Appointments
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                    className="text-center text-lg font-bold text-white py-3 rounded-xl border border-border hover:bg-surface-2 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="text-center text-lg font-bold text-white py-3 rounded-xl border border-border hover:bg-surface-2 transition-colors"
                >
                  Logout
                </button>
              )}
              <button
                onClick={() => navigate("/book")}
                className="text-center text-lg font-extrabold text-primary bg-accent py-3 rounded-xl hover:bg-accent-hover transition-colors"
              >
                Book Appointment
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default LandingNavbar;

import React, { useEffect } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LandingNavbar from "./landing-sections/LandingNavbar";
import Hero from "./landing-sections/Hero";
import About from "./landing-sections/About";
import Services from "./landing-sections/Services";
import WhyChooseUs from "./landing-sections/WhyChooseUs";
import BookingCTA from "./landing-sections/BookingCTA";
import Footer from "./landing-sections/Footer";

const Landing = () => {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        setTimeout(() => {
          const offsetTop = element.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({
            top: offsetTop,
            behavior: "smooth",
          });
        }, 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  // If customer is already logged in, display customer dashboard directly
  if (user && (user.role === "customer" || user.role === "user")) {
    return <Navigate to="/customer/dashboard" replace />;
  }

  return (
    <div className="bg-primary min-h-screen font-sans selection:bg-accent selection:text-primary">
      <LandingNavbar />
      <Hero />
      <About />
      <WhyChooseUs />
      <Services />
      <BookingCTA />
      <Footer />
    </div>
  );
};

export default Landing;

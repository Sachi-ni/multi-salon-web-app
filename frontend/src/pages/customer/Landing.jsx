import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import LandingNavbar from "./landing-sections/LandingNavbar";
import Hero from "./landing-sections/Hero";
import About from "./landing-sections/About";
import Services from "./landing-sections/Services";
import WhyChooseUs from "./landing-sections/WhyChooseUs";
import Testimonials from "./landing-sections/Testimonials";
import BookingCTA from "./landing-sections/BookingCTA";
import Contact from "./landing-sections/Contact";
import Footer from "./landing-sections/Footer";

const Landing = () => {
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

  return (
    <div className="bg-primary min-h-screen font-sans selection:bg-accent selection:text-primary">
      <LandingNavbar />
      <Hero />
      <About />
      <WhyChooseUs />
      <Services />
      <Testimonials />
      <BookingCTA />
      <Contact />
      <Footer />
    </div>
  );
};

export default Landing;

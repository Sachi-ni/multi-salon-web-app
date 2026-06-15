import React from "react";
import LandingNavbar from "./landing-sections/LandingNavbar";
import Hero from "./landing-sections/Hero";
import About from "./landing-sections/About";
import Services from "./landing-sections/Services";
import FeaturedSalons from "./landing-sections/FeaturedSalons";
import Team from "./landing-sections/Team";
import WhyChooseUs from "./landing-sections/WhyChooseUs";
import Testimonials from "./landing-sections/Testimonials";
import BookingCTA from "./landing-sections/BookingCTA";
import Contact from "./landing-sections/Contact";
import Footer from "./landing-sections/Footer";

const Landing = () => {
  return (
    <div className="bg-primary min-h-screen font-sans selection:bg-accent selection:text-primary">
      <LandingNavbar />
      <Hero />
      <About />
      <WhyChooseUs />
      <Services />
      <FeaturedSalons />
      <Team />
      <Testimonials />
      <BookingCTA />
      <Contact />
      <Footer />
    </div>
  );
};

export default Landing;

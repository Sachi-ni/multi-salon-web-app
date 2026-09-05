import React from "react";
import LandingNavbar from "./landing-sections/LandingNavbar";
import Testimonials from "./landing-sections/Testimonials";
import Footer from "./landing-sections/Footer";

const TestimonialsPage = () => {
  return (
    <div className="bg-primary min-h-screen font-sans selection:bg-accent selection:text-primary">
      <LandingNavbar />
      <main className="pt-16">
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
};

export default TestimonialsPage;
import React from "react";
import LandingNavbar from "./landing-sections/LandingNavbar";
import Contact from "./landing-sections/Contact";
import Footer from "./landing-sections/Footer";

const ContactPage = () => {
  return (
    <div className="bg-primary min-h-screen font-sans selection:bg-accent selection:text-primary">
      <LandingNavbar />
      <main className="pt-16">
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;

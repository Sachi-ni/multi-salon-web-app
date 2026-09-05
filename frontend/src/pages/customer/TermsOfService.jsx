import React from "react";
import LandingNavbar from "./landing-sections/LandingNavbar";
import Footer from "./landing-sections/Footer";

const sections = [
  ["Using SalonHub", "SalonHub helps customers discover participating salons, review their services, choose available professionals, and request appointments. You agree to provide accurate information and use the platform lawfully."],
  ["Accounts", "You are responsible for keeping your account credentials secure and for the activity performed through your account. Please notify SalonHub promptly if you believe your account has been used without permission."],
  ["Appointments and cancellations", "Appointment availability, pricing, salon policies, and service delivery are managed by the relevant salon. Please review the details shown during booking and contact the salon or SalonHub as soon as possible when you need to change or cancel an appointment."],
  ["Content and feedback", "You retain responsibility for feedback or other content you submit. Content must be truthful, respectful, and must not infringe another person's rights or contain unlawful material."],
  ["Platform availability", "We work to keep SalonHub useful and available, but features may change and occasional interruptions may occur for maintenance, updates, or circumstances outside our control."],
  ["Contact", "Questions about these terms can be sent through the SalonHub contact form or to info@salonhub.com."]
];

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-primary font-sans text-white">
      <LandingNavbar />
      <main className="pt-32 pb-24 px-6">
        <article className="max-w-4xl mx-auto">
          <p className="text-accent text-sm font-extrabold tracking-[0.22em] uppercase mb-4">SalonHub</p>
          <h1 className="text-4xl md:text-6xl font-display font-black mb-5">Terms of <span className="text-gradient">Service</span></h1>
          <p className="text-white/60 text-lg leading-relaxed mb-12">The terms that apply when you use the SalonHub customer booking platform.</p>
          <div className="space-y-8">
            {sections.map(([title, text]) => (
              <section key={title} className="border-t border-border pt-6">
                <h2 className="text-xl font-extrabold mb-3">{title}</h2>
                <p className="text-white/65 leading-relaxed">{text}</p>
              </section>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}

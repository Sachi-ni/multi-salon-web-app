import React from "react";
import LandingNavbar from "./landing-sections/LandingNavbar";
import Footer from "./landing-sections/Footer";

const sections = [
  ["Information we collect", "We collect the information you provide when creating an account, booking an appointment, contacting SalonHub, or sharing feedback. This may include your name, email address, phone number, booking details, and message content."],
  ["How we use your information", "SalonHub uses this information to manage appointments, connect you with salons, respond to enquiries, improve the platform, and send important account or booking updates."],
  ["Sharing and protection", "We share relevant booking information with the salon and professionals involved in providing your appointment. We do not sell your personal information. We use reasonable technical and organizational measures to protect information held by the platform."],
  ["Your choices", "You may review or update your account information, request help with your personal data, or contact us about privacy questions using the contact details on our Contact page."],
  ["Updates to this policy", "We may update this policy as SalonHub develops. The latest version will always be available on this page."]
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-primary font-sans text-white">
      <LandingNavbar />
      <main className="pt-32 pb-24 px-6">
        <article className="max-w-4xl mx-auto">
          <p className="text-accent text-sm font-extrabold tracking-[0.22em] uppercase mb-4">SalonHub</p>
          <h1 className="text-4xl md:text-6xl font-display font-black mb-5">Privacy <span className="text-gradient">Policy</span></h1>
          <p className="text-white/60 text-lg leading-relaxed mb-12">How SalonHub collects, uses, and protects information across our customer booking experience.</p>
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

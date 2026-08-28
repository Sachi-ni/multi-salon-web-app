import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarCheck, CheckCircle2, HeartHandshake, ShieldCheck, Store } from "lucide-react";
import LandingNavbar from "./landing-sections/LandingNavbar";
import Footer from "./landing-sections/Footer";

const principles = [
  { icon: Store, title: "Choice across salons", text: "Compare services, staff, availability, and prices in one straightforward place." },
  { icon: CalendarCheck, title: "Simple booking", text: "Book the time and professional that fit your day, with appointment updates in your account." },
  { icon: ShieldCheck, title: "Clear information", text: "See the details you need before booking: service duration, price, location, and availability." },
  { icon: HeartHandshake, title: "Built for every visit", text: "A connected experience for customers, salon teams, and the people who keep each branch running." },
];

export default function AboutUs() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-primary font-sans text-white">
      <LandingNavbar />
      <main className="pt-28 pb-24 overflow-hidden">
        <section className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="relative min-h-[420px] md:min-h-[560px]">
            <div className="absolute top-0 left-0 w-[68%] h-[66%] overflow-hidden rounded-3xl border border-border shadow-2xl"><img src="/salon_interior.png" alt="Salon interior" className="w-full h-full object-cover" /></div>
            <div className="absolute bottom-0 right-0 w-[72%] h-[63%] overflow-hidden rounded-3xl border-4 border-primary shadow-2xl"><img src="/stylist_at_work.png" alt="Professional styling a customer" className="w-full h-full object-cover" /></div>
            <div className="absolute top-[47%] left-[48%] w-20 h-20 bg-accent rounded-2xl hidden md:flex items-center justify-center text-primary shadow-glow"><HeartHandshake className="w-9 h-9" /></div>
          </div>

          <div>
            <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-bold text-white/60 hover:text-accent mb-8"><ArrowLeft className="w-4 h-4" /> Back</button>
            <p className="text-accent text-sm font-extrabold tracking-[0.22em] uppercase mb-4">About SalonHub</p>
            <h1 className="text-5xl md:text-6xl font-display font-black leading-[1.04] tracking-tight mb-7">One place to find your <span className="text-gradient">next salon visit.</span></h1>
            <div className="space-y-5 text-lg leading-relaxed text-white/70">
              <p>SalonHub is a multi-salon booking platform created to make self-care easier to plan. We bring participating salons, their services, and their professionals together in one customer-friendly experience.</p>
              <p>Instead of calling around for availability, customers can explore branches, compare services, choose a preferred professional, and manage bookings online. Salon teams get the tools to keep schedules, services, and customer appointments organized.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 mt-9">
              {["Browse real salon services", "Choose an available professional", "Manage upcoming bookings", "Share feedback after a visit"].map((item) => <div key={item} className="flex gap-3 items-center text-white font-semibold"><CheckCircle2 className="w-5 h-5 text-accent shrink-0" />{item}</div>)}
            </div>
            <button type="button" onClick={() => navigate("/our-salons")} className="mt-10 px-7 py-3.5 rounded-xl bg-accent text-primary font-extrabold inline-flex items-center gap-2 hover:bg-accent-hover transition-colors">Explore salons <ArrowRight className="w-5 h-5" /></button>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 mt-28">
          <div className="max-w-2xl"><p className="text-accent text-sm font-extrabold tracking-[0.22em] uppercase mb-3">What guides us</p><h2 className="text-3xl md:text-5xl font-display font-black">A better connection between customers and salons.</h2></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">{principles.map(({ icon: Icon, title, text }) => <article key={title} className="bg-surface border border-border rounded-2xl p-6"><div className="w-11 h-11 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-5"><Icon className="w-5 h-5" /></div><h3 className="font-extrabold text-lg mb-2">{title}</h3><p className="text-white/60 leading-relaxed text-sm">{text}</p></article>)}</div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

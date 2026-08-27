import React from "react";
import { MapPin, Phone, Clock, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-primary pt-20 pb-10 border-t border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-2xl font-black text-accent tracking-tight">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-lg font-black text-primary flex-shrink-0">
                S
              </div>
              <span className="text-white">Salon</span>Hub
            </div>
            <p className="text-white/60 leading-relaxed text-sm">
              The premier destination for luxury grooming and beauty services. Experience the standard of modern elegance.
            </p>
            <div className="flex gap-4">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-white hover:bg-accent hover:text-primary transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-white hover:bg-accent hover:text-primary transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-white hover:bg-accent hover:text-primary transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-white/60 hover:text-accent transition-colors text-sm">About Us</Link></li>
              <li><Link to="/our-services" className="text-white/60 hover:text-accent transition-colors text-sm">Our Services</Link></li>
              <li><Link to="/team" className="text-white/60 hover:text-accent transition-colors text-sm">Our Team</Link></li>
              <li><Link to="/our-salons" className="text-white/60 hover:text-accent transition-colors text-sm">Locations</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6">Services</h4>
            <ul className="space-y-4">
              <li><a href="/our-services" className="text-white/60 hover:text-accent transition-colors text-sm">Hair Styling</a></li>
              <li><a href="/our-services" className="text-white/60 hover:text-accent transition-colors text-sm">Color & Highlights</a></li>
              <li><a href="/our-services" className="text-white/60 hover:text-accent transition-colors text-sm">Facial Treatments</a></li>
              <li><a href="/our-services" className="text-white/60 hover:text-accent transition-colors text-sm">Bridal Makeup</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-white/60 text-sm"><MapPin className="w-5 h-5 text-accent shrink-0" /><span>Colombo</span></li>
              <li className="flex items-center gap-3 text-white/60 text-sm"><Phone className="w-5 h-5 text-accent shrink-0" /><span>011256369</span></li>
              <li className="flex items-start gap-3 text-white/60 text-sm"><Mail className="w-5 h-5 text-accent shrink-0 mt-0.5" /><span className="flex flex-col gap-1"><a href="mailto:info@salonhub.com" className="hover:text-accent">info@salonhub.com</a><a href="mailto:bookings@salonhub.com" className="hover:text-accent">bookings@salonhub.com</a></span></li>
              <li className="flex items-center gap-3 text-white/60 text-sm"><Clock className="w-5 h-5 text-accent shrink-0" /><span>Monday – Sunday: 9:00 AM – 7:00 PM</span></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} SalonHub. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-white/40">
            <Link to="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-accent transition-colors">Terms of Service</Link>
            <a href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-accent transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

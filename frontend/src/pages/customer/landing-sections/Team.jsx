import React from "react";
import { motion } from "framer-motion";

const Team = () => {
  const staff = [
    {
      name: "Elena Rodriguez",
      role: "Master Stylist",
      specialty: "Color & Balayage",
      experience: "12 Years",
      image: "https://images.unsplash.com/photo-1595959183082-7b570b7e08e2?q=80&w=2071&auto=format&fit=crop"
    },
    {
      name: "Marcus Chen",
      role: "Senior Barber",
      specialty: "Precision Cuts",
      experience: "8 Years",
      image: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?q=80&w=1974&auto=format&fit=crop"
    },
    {
      name: "Sarah Jenkins",
      role: "Esthetician",
      specialty: "Advanced Facials",
      experience: "10 Years",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop"
    },
    {
      name: "David Smith",
      role: "Creative Director",
      specialty: "Avant-Garde Styling",
      experience: "15 Years",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1974&auto=format&fit=crop"
    }
  ];

  return (
    <section id="team" className="py-24 bg-primary relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-accent font-bold tracking-widest uppercase text-sm mb-3">The Artists</div>
          <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-6">
            Meet Our <span className="text-gradient">Experts</span>
          </h2>
          <p className="text-white/60 text-lg">
            Our team of handpicked professionals represents the pinnacle of grooming and beauty expertise.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {staff.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="relative h-96 rounded-2xl overflow-hidden mb-6">
                <img 
                  src={member.image} 
                  alt={member.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter grayscale group-hover:grayscale-0"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/20 to-transparent opacity-80" />
                
                {/* Socials - Slide up on hover */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <button className="bg-surface/80 backdrop-blur-sm p-2 rounded-full text-white hover:text-accent hover:bg-surface-3 transition-colors">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </button>
                  <button className="bg-surface/80 backdrop-blur-sm p-2 rounded-full text-white hover:text-accent hover:bg-surface-3 transition-colors">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-accent transition-colors">{member.name}</h3>
                <p className="text-accent font-medium text-sm mb-2 uppercase tracking-wide">{member.role}</p>
                <div className="flex flex-col text-white/50 text-sm gap-1">
                  <span>Specialty: {member.specialty}</span>
                  <span>Exp: {member.experience}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;

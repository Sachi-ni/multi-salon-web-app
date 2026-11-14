import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Scissors, Star, MapPin } from "lucide-react";
import { getTeam } from "../../../services/staffService";
import { mediaUrl } from "../../../utils/mediaUrl";

// Curated high-res fallback visuals for stylists if photo not yet uploaded
const fallbackStylists = [
  "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
];

const TeamSection = () => {
  const navigate = useNavigate();
  const [team, setTeam] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getTeam()
      .then((res) => {
        if (isMounted) {
          // Take top 4 active stylists
          setTeam((res.data || []).slice(0, 4));
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Could not load team members:", err);
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const handleBookWithStylist = (member) => {
    try {
      const draft = {
        salonId: member.salon?._id || member.salon_id?._id || member.salon_id || "",
        salonName: member.salon?.name || member.salon_id?.name || "",
        staffId: member._id,
        staffName: member.name,
        staffSpecification: member.specification || "",
        date: new Date().toISOString().split("T")[0],
        services: [],
      };
      sessionStorage.setItem("appointment_booking_draft", JSON.stringify(draft));
      sessionStorage.setItem("appointment_booking_step", "0");
    } catch {
      // Storage fallback
    }

    navigate("/book", {
      state: { staff: member },
    });
  };

  if (!isLoading && team.length === 0) return null;

  return (
    <section id="team" className="py-24 sm:py-32 bg-surface-2 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[140px] pointer-events-none -translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full bg-surface/60 border border-accent/20 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Master Craftsmen
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-white tracking-tight leading-tight">
              Meet Our <span className="text-gradient">Styling Experts</span>
            </h2>
            <p className="text-white/60 text-base sm:text-lg mt-3 max-w-xl">
              Trained in international techniques, passionate about precision, and committed to your perfect look.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/team")}
            className="inline-flex items-center gap-2 text-sm font-bold text-accent hover:text-accent-hover tracking-wider uppercase group self-start md:self-end pb-1 border-b border-accent/30 hover:border-accent transition-all"
          >
            <span>View All Team Members</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>

        {/* Team Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {team.map((member, index) => {
            const photoUrl = member.image
              ? mediaUrl(member.image)
              : fallbackStylists[index % fallbackStylists.length];

            const salonName = member.salon?.name || member.salon_id?.name || "Salon Hub";

            return (
              <motion.div
                key={member._id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="group rounded-3xl bg-surface/80 border border-white/[0.08] hover:border-accent/40 shadow-xl overflow-hidden flex flex-col transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
              >
                {/* Stylist Portrait */}
                <div className="relative h-72 w-full overflow-hidden bg-surface-3">
                  <img
                    src={photoUrl}
                    alt={member.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-black/20" />

                  {/* Stylist Role Pill */}
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-bold uppercase tracking-wider text-accent flex items-center gap-1">
                    <Star className="w-3 h-3 fill-accent" />
                    {member.role || "Stylist"}
                  </span>
                </div>

                {/* Profile Information */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-accent transition-colors duration-300">
                      {member.name}
                    </h3>
                    <p className="text-accent text-xs font-semibold uppercase tracking-wider mt-1">
                      {member.specification || "Master Stylist"}
                    </p>

                    <div className="flex items-center gap-1.5 text-white/50 text-xs mt-3">
                      <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span className="truncate">{salonName}</span>
                    </div>
                  </div>

                  {/* Action CTA */}
                  <div className="pt-5 mt-5 border-t border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => handleBookWithStylist(member)}
                      className="w-full py-2.5 px-4 rounded-xl bg-accent text-primary text-xs font-black uppercase tracking-wider hover:bg-accent-hover hover:shadow-[0_0_16px_rgba(245,200,0,0.5)] active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Book with Stylist</span>
                      <Scissors className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile View All Button */}
        <div className="mt-12 text-center md:hidden">
          <button
            type="button"
            onClick={() => navigate("/team")}
            className="w-full py-4 rounded-full bg-surface border border-accent/30 text-white font-bold text-sm tracking-wide hover:bg-accent hover:text-primary transition-all"
          >
            View All Team Members
          </button>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;


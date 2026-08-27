import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Briefcase, Calendar } from "lucide-react";
import { mediaUrl } from '../../../utils/mediaUrl';
import { getUploadUrl } from '../../../config';

export default function StaffCard({ member, index }) {
  const navigate = useNavigate();

  const handleBookClick = () => {
    navigate('/book', { state: { staff: member } });
  };

  const imageUrl = member.image 
    ? mediaUrl(member.image)
    ? getUploadUrl(member.image)
    : "https://images.unsplash.com/photo-1595959183082-7b570b7e08e2?q=80&w=2071&auto=format&fit=crop";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-surface rounded-2xl overflow-hidden border border-border hover:border-accent/50 transition-colors group flex flex-col"
    >
      <div className="relative h-64 overflow-hidden flex-shrink-0">
        <img
          src={imageUrl}
          alt={member.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-80" />
      </div>
      <div className="p-6 flex flex-col flex-grow text-center items-center">
        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-accent transition-colors">
          {member.name || member.full_name}
        </h3>
        <p className="text-accent text-sm font-bold uppercase tracking-wider mb-4">
          {member.role || "Professional"}
        </p>
        
        <div className="w-full space-y-3 mb-6 mt-auto text-left">
          {/* Salon */}
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted flex-shrink-0" />
            <span className="text-muted-2 truncate">{member.salon_id?.name || member.salonName || "Unknown"}</span>
          </div>
          
          {/* Bookings */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted flex-shrink-0" />
            <span className="text-muted-2">
              <span className="text-white font-semibold">{member.bookings || 0}</span> bookings
            </span>
          </div>

          {/* Services */}
          <div className="flex items-start gap-2 text-sm">
            <Briefcase className="w-4 h-4 text-muted flex-shrink-0 mt-0.5" />
            {member.services?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {member.services.slice(0, 3).map((service) => (
                  <span
                    key={service._id || service}
                    className="px-2 py-1 rounded-md bg-accent-dim border border-accent-muted text-[0.65rem] font-bold text-accent"
                  >
                    {service.service_name || service}
                  </span>
                ))}
                {member.services.length > 3 && (
                  <span className="px-2 py-1 rounded-md bg-surface-2 border border-border text-[0.65rem] font-bold text-white/70">
                    +{member.services.length - 3} more
                  </span>
                )}
              </div>
            ) : (
              <span className="text-muted-2">No services assigned</span>
            )}
          </div>
        </div>

        {/* Footer: Rating */}
        <div className="w-full flex items-center justify-between pb-4">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(parseFloat(member.rating) || 0)
                      ? "fill-accent text-accent"
                      : "text-border"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-muted-2">
              {member.rating || "0.0"}
            </span>
          </div>
        </div>

        <button
          onClick={handleBookClick}
          className="w-full py-2.5 bg-accent/10 text-accent font-bold rounded-lg hover:bg-accent hover:text-primary transition-all duration-300"
        >
          Book with this Staff Member
        </button>
      </div>
    </motion.div>
  );
}

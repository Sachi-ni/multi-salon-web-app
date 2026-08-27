import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Phone, Star, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mediaUrl } from '../../../utils/mediaUrl';

export default function SalonCard({ branch, index }) {
  const navigate = useNavigate();

  const handleBookClick = () => {
    navigate('/book', { state: { salon: branch } });
  };

  const handleDetailsClick = () => {
    navigate(`/our-salons/${branch._id}`);
  };

  const primaryImage = (branch.images && branch.images.length > 0)
    ? branch.images[0]
    : (branch.logo || null);

  const imageUrl = primaryImage 
    ? mediaUrl(primaryImage)
    : "/salon_interior.png";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group glass-card overflow-hidden flex flex-col hover:-translate-y-2 transition-all duration-300 h-full"
    >
      <div className="h-64 relative overflow-hidden flex-shrink-0">
        <img 
          src={imageUrl} 
          alt={branch.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
        <div className="absolute top-4 left-4 bg-primary/80 backdrop-blur-md px-3 py-1 rounded-lg flex items-center gap-1 border border-border">
<Star className="w-4 h-4 fill-accent text-accent" />
          <span className="text-white font-bold text-sm">{branch.rating || 0}</span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow bg-surface/50">
        <div className="flex-grow">
          <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-accent transition-colors">{branch.name}</h3>
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 text-white/70">
              <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <span className="text-sm leading-tight">{branch.location || branch.address || 'Address not available'}</span>
            </div>
            {(branch.open_time || branch.close_time) && (
              <div className="flex items-center gap-3 text-white/70">
                <Clock className="w-5 h-5 text-accent shrink-0" />
                <span className="text-sm">{branch.open_time} - {branch.close_time}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-white/70">
              <Phone className="w-5 h-5 text-accent shrink-0" />
              <span className="text-sm">{branch.phone_number || branch.contact_number || branch.phone || 'Phone not available'}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-auto">
          <button 
            onClick={handleBookClick}
            className="w-full py-3 bg-accent text-primary rounded-xl font-bold hover:bg-accent-hover transition-all duration-300 shadow-glow"
          >
            Book Appointment
          </button>
          <button 
            onClick={handleDetailsClick}
            className="w-full py-3 flex justify-center items-center gap-2 bg-white/5 border border-border text-white rounded-xl font-bold hover:bg-white/10 transition-all duration-300"
          >
            View Details <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

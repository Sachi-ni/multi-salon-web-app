import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LandingNavbar from './landing-sections/LandingNavbar';
import Footer from './landing-sections/Footer';
import { getSalon } from '../../services/salonService';
import { getTeam } from '../../services/staffService';
import { MapPin, Clock, Phone, Star, ChevronLeft } from 'lucide-react';
import { mediaUrl } from '../../utils/mediaUrl';
import { getUploadUrl } from '../../config';

export default function SalonDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [salon, setSalon] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      getSalon(id),
      getTeam(id) // fetch staff for this salon
    ])
    .then(([salonRes, staffRes]) => {
      setSalon(salonRes.data || salonRes);
      setStaff(staffRes.data || staffRes);
      setLoading(false);
    })
    .catch((err) => {
      console.error(err);
      setError(true);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="bg-primary min-h-screen font-sans flex flex-col">
        <LandingNavbar />
        <div className="flex-grow flex items-center justify-center pt-24 pb-12">
           <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !salon) {
    return (
      <div className="bg-primary min-h-screen font-sans flex flex-col">
        <LandingNavbar />
        <div className="flex-grow flex items-center justify-center pt-24 pb-12 text-red-400 font-bold">
           Unable to load salon details.
        </div>
        <Footer />
      </div>
    );
  }

  const handleBookClick = () => {
    navigate('/book', { state: { salon } });
  };

  // Build a list of gallery images from uploaded salon photos only (no external links)
  const galleryImages = (salon.images && salon.images.length > 0)
    ? salon.images
    : (salon.logo ? [salon.logo] : []);

  const imageUrl = galleryImages[0]
    ? getUploadUrl(galleryImages[0])
    : "/salon_interior.png";

  return (
    <div className="bg-primary min-h-screen font-sans flex flex-col">
      <LandingNavbar />
      
      <main className="pt-24 flex-grow pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/60 hover:text-accent transition-colors mb-8"
          >
            <ChevronLeft className="w-5 h-5" /> Back to Salons
          </button>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Left: Images */}
            <div className="space-y-4">
              <div className="h-64 sm:h-96 rounded-3xl overflow-hidden border border-border">
                <img src={imageUrl} alt={salon.name} className="w-full h-full object-cover" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {galleryImages.slice(1).map((img, i) => (
                  <div key={i} className="h-32 rounded-xl overflow-hidden border border-border">
                    <img src={mediaUrl(img)} alt={`${salon.name} gallery ${i + 2}`} className="w-full h-full object-cover" />
                  </div>
                ))}
                {galleryImages.length <= 1 && (
                  <>
                    <div className="h-32 rounded-xl overflow-hidden border border-border bg-surface flex items-center justify-center text-white/40 text-xs font-bold">
                      No additional photos
                    </div>
                    <div className="h-32 rounded-xl overflow-hidden border border-border bg-surface flex items-center justify-center text-white/40 text-xs font-bold">
                      No additional photos
                    </div>
                  </>
                )}
                {galleryImages.length > 1 && (
                  <div className="h-32 rounded-xl overflow-hidden border border-border bg-surface flex items-center justify-center text-accent font-bold">
                    + {Math.max(galleryImages.length - 1, 0)} More
                  </div>
                )}
              </div>
            </div>

            {/* Right: Info */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                 <Star className="w-5 h-5 fill-accent text-accent" />
                 <span className="text-white font-bold text-lg">{salon.rating || 0}</span>
                 <span className="text-muted-2">({salon.ratingCount || 0} reviews)</span>
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-black text-white mb-4 sm:mb-6">
                {salon.name}
              </h1>
              
              <div className="space-y-6 mb-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Address</h4>
                    <p className="text-white/60">{salon.location || salon.address || "Address not available"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Operating Hours</h4>
                    <p className="text-white/60">{salon.open_time} - {salon.close_time}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Contact</h4>
                    <p className="text-white/60">{salon.phone_number || salon.contact_number || salon.phone || "Phone not available"}</p>
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <button 
                  onClick={handleBookClick}
                  className="w-full py-4 bg-accent text-primary rounded-xl font-bold text-lg hover:bg-accent-hover transition-all duration-300 shadow-glow"
                >
                  Book Appointment Here
                </button>
              </div>
            </div>
          </div>

          {/* Team Section */}
          <div className="mt-20">
            <h3 className="text-2xl font-bold text-white mb-8 border-b border-border pb-4">
              Professionals at this Branch
            </h3>
            {staff.length > 0 ? (
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
                {staff.map(member => (
                  <div key={member._id} className="bg-surface rounded-2xl p-4 border border-border text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-surface-2 border-2 border-accent mb-4 overflow-hidden">
                       {member.image ? (
                         <img src={getUploadUrl(member.image)} alt={member.name} className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xl">
                            {member.name.charAt(0)}
                         </div>
                       )}
                    </div>
                    <h4 className="text-white font-bold">{member.name}</h4>
                    <p className="text-accent text-xs uppercase tracking-wider font-bold mt-1">{member.role}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-2">No professionals listed for this branch yet.</p>
            )}
          </div>
          
        </div>
      </main>

      <Footer />
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import LandingNavbar from './landing-sections/LandingNavbar';
import Footer from './landing-sections/Footer';
import SalonHero from './salon-components/SalonHero';
import SalonFilters from './salon-components/SalonFilters';
import SalonGrid from './salon-components/SalonGrid';
import EmptyState from './salon-components/EmptyState';
import { getSalons } from '../../services/salonService';

export default function SalonsPage() {
  const [salons, setSalons] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationTerm, setLocationTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getSalons()
      .then((res) => {
        setSalons(res.data || res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load salons", err);
        setError(true);
        setLoading(false);
      });
  }, []);

  const filteredSalons = useMemo(() => {
    if (!Array.isArray(salons)) return [];
    return salons.filter((salon) => {
      const matchName = salon.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const loc = salon.location || salon.address || "";
      const matchLoc = loc.toLowerCase().includes(locationTerm.toLowerCase());
      return matchName && matchLoc;
    });
  }, [salons, searchTerm, locationTerm]);

  const handleReset = () => {
    setSearchTerm('');
    setLocationTerm('');
  };

  return (
    <div className="bg-primary min-h-screen font-sans flex flex-col">
      <LandingNavbar />
      
      <main className="pt-10 flex-grow">
        <SalonHero />
        
        {error ? (
          <div className="py-20 text-center text-red-400 font-bold">
            Unable to load salon branches. Please try again later.
          </div>
        ) : (
          <>
            <SalonFilters 
              searchTerm={searchTerm} 
              setSearchTerm={setSearchTerm} 
              locationTerm={locationTerm} 
              setLocationTerm={setLocationTerm} 
            />

            {loading ? (
              <div className="max-w-7xl mx-auto px-6 pb-24 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
                 {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-surface rounded-2xl h-96 animate-pulse border border-border" />
                 ))}
              </div>
            ) : filteredSalons.length > 0 ? (
              <SalonGrid salons={filteredSalons} />
            ) : (
              <EmptyState onReset={handleReset} />
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

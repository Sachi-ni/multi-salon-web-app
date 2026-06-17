import React, { useState, useEffect } from 'react';
import LandingNavbar from './landing-sections/LandingNavbar';
import Footer from './landing-sections/Footer';
import TeamHero from './team-components/TeamHero';
import TeamFilters from './team-components/TeamFilters';
import StaffGrid from './team-components/StaffGrid';
import EmptyState from './team-components/EmptyState';
import { getTeam } from '../../services/staffService';
import { getSalons } from '../../services/salonService';
import { getServices } from '../../services/serviceService';

export default function TeamPage() {
  const [staff, setStaff] = useState([]);
  const [salons, setSalons] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedSalon, setSelectedSalon] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Fetch Salons and Services ONCE on mount
  useEffect(() => {
    Promise.all([getSalons(), getServices()])
      .then(([salonRes, serviceRes]) => {
        setSalons(salonRes.data || salonRes);
        setServices(serviceRes.data || serviceRes);
      })
      .catch(err => {
        console.error("Failed to load metadata", err);
      });
  }, []);

  // Fetch Team whenever filters change
  useEffect(() => {
    setLoading(true);
    setError(false);
    getTeam(selectedSalon, selectedService)
      .then(res => {
        setStaff(res.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load team", err);
        setError(true);
        setLoading(false);
      });
  }, [selectedSalon, selectedService]);

  const handleReset = () => {
    setSelectedSalon('');
    setSelectedService('');
  };

  return (
    <div className="bg-primary min-h-screen font-sans flex flex-col">
      <LandingNavbar />
      
      <main className="pt-10 flex-grow">
        <TeamHero />
        
        {error ? (
          <div className="py-20 text-center text-red-400 font-bold">
            Unable to load team members. Please try again later.
          </div>
        ) : (
          <>
            <TeamFilters 
              salons={salons} 
              services={services} 
              selectedSalon={selectedSalon}
              setSelectedSalon={setSelectedSalon}
              selectedService={selectedService}
              setSelectedService={setSelectedService}
            />

            {loading ? (
              <div className="max-w-7xl mx-auto px-6 pb-24 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                 {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-surface rounded-2xl h-96 animate-pulse border border-border" />
                 ))}
              </div>
            ) : staff.length > 0 ? (
              <StaffGrid staff={staff} />
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

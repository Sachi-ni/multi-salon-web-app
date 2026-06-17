import React from 'react';

export default function TeamFilters({
  salons,
  services,
  selectedSalon,
  setSelectedSalon,
  selectedService,
  setSelectedService
}) {
  return (
    <div className="max-w-7xl mx-auto px-6 mb-12 flex flex-col md:flex-row gap-4 justify-center items-center">
      <select
        value={selectedSalon}
        onChange={(e) => setSelectedSalon(e.target.value)}
        className="w-full md:w-64 bg-surface border border-border rounded-xl px-4 py-3 text-white focus:border-accent outline-none"
      >
        <option value="">All Salons</option>
        {Array.isArray(salons) && salons.map((salon) => (
          <option key={salon._id} value={salon._id}>
            {salon.name}
          </option>
        ))}
      </select>

      <select
        value={selectedService}
        onChange={(e) => setSelectedService(e.target.value)}
        className="w-full md:w-64 bg-surface border border-border rounded-xl px-4 py-3 text-white focus:border-accent outline-none"
      >
        <option value="">All Services</option>
        {Array.isArray(services) && services.map((service) => (
          <option key={service._id} value={service._id}>
            {service.service_name}
          </option>
        ))}
      </select>
    </div>
  );
}

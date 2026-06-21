import React from 'react';
import { Search, MapPin } from 'lucide-react';

export default function SalonFilters({ searchTerm, setSearchTerm, locationTerm, setLocationTerm }) {
  return (
    <div className="max-w-7xl mx-auto px-6 mb-12 flex flex-col md:flex-row justify-center gap-4">
      <div className="relative w-full md:w-96">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-2" />
        <input 
          type="text" 
          placeholder="Search salon by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-surface-2 border border-border rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-muted-2 outline-none focus:border-accent focus:bg-accent-dim/20 transition-all duration-300"
        />
      </div>
      <div className="relative w-full md:w-96">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-2" />
        <input 
          type="text" 
          placeholder="Filter by city or location..."
          value={locationTerm}
          onChange={(e) => setLocationTerm(e.target.value)}
          className="w-full bg-surface-2 border border-border rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-muted-2 outline-none focus:border-accent focus:bg-accent-dim/20 transition-all duration-300"
        />
      </div>
    </div>
  );
}

import React from 'react';
import SalonCard from './SalonCard';

export default function SalonGrid({ salons }) {
  return (
    <div className="max-w-7xl mx-auto px-6 pb-24 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
      {salons.map((salon, index) => (
        <SalonCard key={salon._id} branch={salon} index={index} />
      ))}
    </div>
  );
}

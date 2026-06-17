import React from 'react';
import StaffCard from './StaffCard';

export default function StaffGrid({ staff }) {
  return (
    <div className="max-w-7xl mx-auto px-6 pb-24 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {staff.map((member, index) => (
        <StaffCard key={member._id} member={member} index={index} />
      ))}
    </div>
  );
}

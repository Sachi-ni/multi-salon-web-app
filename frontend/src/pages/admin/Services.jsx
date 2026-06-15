import React from 'react';
import { useParams } from 'react-router-dom';

// This is a placeholder component.
// You can expand this to fetch and display services for the specific salon.
const Services = () => {
  const { salonId } = useParams();

  return (
    <div className="text-white">
      <h1 className="text-2xl font-bold">Services for Salon {salonId}</h1>
      <p className="mt-4 text-muted-2">Service management for this salon will be displayed here.</p>
    </div>
  );
};

export default Services;
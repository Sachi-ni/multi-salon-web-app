import React from 'react';

export default function TeamHero() {
  return (
    <section className="pt-24 pb-12 bg-primary relative text-center">
      <div className="max-w-3xl mx-auto px-6 relative z-10">
        <div className="text-accent font-bold tracking-widest uppercase text-sm mb-3">The Artists</div>
        <h1 className="text-4xl md:text-5xl font-display font-black text-white mb-6">
          Meet Our <span className="text-gradient">Experts</span>
        </h1>
        <p className="text-white/60 text-lg">
          Discover our talented professionals across all Salon Hub branches.
        </p>
      </div>
    </section>
  );
}

import React from 'react';

export default function EmptyState({ onReset }) {
  return (
    <div className="text-center py-20 max-w-md mx-auto">
      <div className="w-24 h-24 mx-auto bg-surface-2 rounded-full flex items-center justify-center mb-6 border border-border">
        <svg className="w-10 h-10 text-muted-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">No salon branches available</h3>
      <p className="text-muted-2 mb-6">
        We couldn't find any salon branches matching your current search criteria.
      </p>
      <button 
        onClick={onReset}
        className="px-6 py-2.5 bg-surface-2 border border-border text-white rounded-xl font-bold hover:bg-surface-3 transition-colors"
      >
        Clear Filters
      </button>
    </div>
  );
}

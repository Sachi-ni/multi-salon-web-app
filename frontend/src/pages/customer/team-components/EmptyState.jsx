import React from 'react';

export default function EmptyState({ onReset }) {
  return (
    <div className="text-center py-20 max-w-md mx-auto">
      <div className="w-24 h-24 mx-auto bg-surface-2 rounded-full flex items-center justify-center mb-6 border border-border">
        <svg className="w-10 h-10 text-muted-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">No team members found</h3>
      <p className="text-white/60 mb-6">
        No team members match your current filters. Try adjusting your salon or service selection.
      </p>
      <button
        onClick={onReset}
        className="px-6 py-2 bg-surface-2 text-white font-bold rounded-lg hover:bg-surface-3 transition-colors border border-border"
      >
        Reset Filters
      </button>
    </div>
  );
}

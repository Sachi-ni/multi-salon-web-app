import { useState } from "react";

export default function StepDateTime({ booking, onNext }) {
  const [date, setDate] = useState(booking.date || "");

  // Minimum date is today
  const today = new Date().toLocaleDateString('en-CA');

  const handleNext = () => {
    if (!date) return;
    onNext({ date });
  };

  return (
    <div className="step-datetime">
      <h2>Select a Date</h2>
      <p>Choose the date for your appointment.</p>

      <input
        type="date"
        value={date}
        min={today}
        onChange={e => setDate(e.target.value)}
        className="date-input"
      />

      <div className="step-actions">
        <button
          className="btn-primary"
          disabled={!date}
          onClick={handleNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}
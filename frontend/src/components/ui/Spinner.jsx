import React from "react";
import clsx from "clsx";

const Spinner = ({ size = "md", className = "" }) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
  };

  return (
    <svg
      className={clsx("animate-spin text-accent", sizes[size], className)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
};

const FullPageSpinner = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Spinner size="lg" />
  </div>
);

Spinner.FullPage = FullPageSpinner;

export default Spinner;

import React from "react";
import clsx from "clsx";

const variants = {
  success: "bg-success-dim text-success border-success-border",
  danger: "bg-danger-dim text-danger border-danger-border",
  warning: "bg-accent-dim text-accent border-accent-muted",
  info: "bg-info-dim text-info border-info-border",
  purple: "bg-purple-dim text-purple border-purple-border",
  neutral: "bg-surface-2 text-muted-2 border-border",
};

const Badge = ({ children, variant = "neutral", dot = true, className = "" }) => {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold whitespace-nowrap border",
        variants[variant],
        className
      )}
    >
      {dot && <span className="text-[0.5rem]">●</span>}
      {children}
    </span>
  );
};

export default Badge;

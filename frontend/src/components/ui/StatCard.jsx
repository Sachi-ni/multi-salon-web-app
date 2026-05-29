import React from "react";
import clsx from "clsx";

const StatCard = ({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
  onClick,
  className = "",
}) => {
  return (
    <div
      className={clsx(
        "bg-surface border border-border rounded-xl p-5 relative overflow-hidden transition-all duration-200",
        "hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(245,200,0,0.08)]",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {/* Background glow circle */}
      <div className="absolute -bottom-5 -right-5 w-20 h-20 rounded-full bg-accent opacity-[0.06]" />

      {/* Icon */}
      {Icon && (
        <div className="w-9 h-9 rounded-lg bg-accent-dim flex items-center justify-center mb-3.5 text-accent">
          <Icon className="w-[18px] h-[18px]" />
        </div>
      )}

      {/* Label */}
      <div className="text-[0.68rem] font-bold text-muted-2 tracking-wider uppercase mb-1.5">
        {label}
      </div>

      {/* Value */}
      <div className="text-[1.9rem] font-black leading-none mb-1.5 text-white">
        {value || "—"}
      </div>

      {/* Subtitle / Trend */}
      {(subtitle || trend) && (
        <div className="text-xs flex items-center gap-1.5">
          {trend && (
            <span
              className={clsx(
                "font-bold",
                trend.startsWith("+") || trend.startsWith("↑")
                  ? "text-success"
                  : trend.startsWith("-") || trend.startsWith("↓")
                  ? "text-danger"
                  : "text-muted-2"
              )}
            >
              {trend}
            </span>
          )}
          {subtitle && <span className="text-muted-2">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;

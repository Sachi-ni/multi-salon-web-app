import React from "react";
import clsx from "clsx";

const Card = ({
  children,
  className = "",
  accent = false,
  glass = false,
  hover = false,
  padding = "p-5",
  ...props
}) => {
  return (
    <div
      className={clsx(
        "rounded-xl border border-border transition-all duration-200",
        glass
          ? "bg-surface/80 backdrop-blur-glass"
          : "bg-surface",
        accent && "relative overflow-hidden",
        hover && "hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-card-hover cursor-pointer",
        padding,
        className
      )}
      {...props}
    >
      {accent && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-accent to-accent-hover rounded-t-xl" />
      )}
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = "" }) => (
  <div className={clsx("flex items-center justify-between mb-4", className)}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3 className={clsx("text-sm font-bold text-white", className)}>
    {children}
  </h3>
);

const CardSubtitle = ({ children, className = "" }) => (
  <span className={clsx("text-xs text-muted-2", className)}>
    {children}
  </span>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Subtitle = CardSubtitle;

export default Card;

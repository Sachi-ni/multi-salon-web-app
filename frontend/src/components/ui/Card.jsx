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

const CardHeader = ({ children, className = "" }) => {
  const hasRowLayout = className.includes("justify-between") || className.includes("flex-row");
  return (
    <div className={clsx(hasRowLayout ? "flex mb-4" : "flex flex-col gap-1 mb-4", className)}>
      {children}
    </div>
  );
};

const CardTitle = ({ children, className = "" }) => (
  <h3 className={clsx("text-sm font-bold text-white tracking-tight", className)}>
    {children}
  </h3>
);

const CardSubtitle = ({ children, className = "" }) => (
  <p className={clsx("text-xs text-muted-2 leading-relaxed block", className)}>
    {children}
  </p>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Subtitle = CardSubtitle;

export default Card;

import React from "react";
import clsx from "clsx";

const variants = {
  primary:
    "bg-accent text-primary font-extrabold hover:bg-accent-hover hover:shadow-glow",
  ghost:
    "bg-surface-2 text-white border border-border hover:border-accent hover:text-accent",
  danger:
    "bg-danger-dim text-danger border border-danger-border hover:bg-danger/20",
  success:
    "bg-success-dim text-success border border-success-border hover:bg-success/20",
  warning:
    "bg-accent-dim text-accent border border-accent-muted hover:bg-accent-muted",
  info:
    "bg-info-dim text-info border border-info-border hover:bg-info/20",
};

const sizes = {
  xs: "px-2.5 py-1 text-[0.7rem] rounded-md",
  sm: "px-3.5 py-1.5 text-xs rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-lg",
  lg: "px-6 py-3 text-sm rounded-xl",
};

const Button = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  icon: Icon,
  ...props
}) => {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 font-bold tracking-wide uppercase transition-all duration-200 ease-in-out cursor-pointer select-none",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
        "hover:-translate-y-px active:translate-y-0",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4"
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
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;

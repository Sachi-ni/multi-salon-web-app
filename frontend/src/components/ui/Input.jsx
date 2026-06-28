import React from "react";
import clsx from "clsx";

const Input = ({
  label,
  error,
  helper,
  type = "text",
  className = "",
  containerClassName = "",
  ...props
}) => {
  const baseInput =
    "w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-white outline-none transition-all duration-200 placeholder:text-muted focus:border-accent focus:bg-accent-dim/30 focus:ring-1 focus:ring-accent/20";

  return (
    <div className={clsx("mb-3.5", containerClassName)}>
      {label && (
        <label className="block text-[0.68rem] font-extrabold text-muted-2 tracking-wider uppercase mb-1.5">
          {label} {props.required && <span className="text-accent/60 lowercase tracking-widest ml-1 font-bold">(required)</span>}
        </label>
      )}
      {type === "textarea" ? (
        <textarea
          className={clsx(baseInput, "resize-y min-h-[80px]", className)}
          {...props}
        />
      ) : type === "select" ? (
        <select className={clsx(baseInput, "cursor-pointer", className)} {...props}>
          {props.children}
        </select>
      ) : (
        <input
          type={type}
          className={clsx(baseInput, className)}
          autoComplete={props.autoComplete || "new-password"}
          {...props}
        />
      )}
      {error && (
        <p className="mt-1 text-xs text-danger font-medium">{error}</p>
      )}
      {helper && !error && (
        <p className="mt-1 text-xs text-muted-2">{helper}</p>
      )}
    </div>
  );
};

export default Input;

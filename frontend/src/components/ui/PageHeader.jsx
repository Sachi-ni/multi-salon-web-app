import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

const PageHeader = ({
  title,
  subtitle,
  backTo,
  children,
  className = "",
}) => {
  const navigate = useNavigate();

  return (
    <div className={clsx("flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6", className)}>
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {backTo && (
          <button
            onClick={() => navigate(backTo)}
            className="w-8 h-8 bg-transparent border border-border rounded-lg flex items-center justify-center text-muted-2 hover:border-accent hover:text-accent hover:bg-accent-dim transition-all duration-150 flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold text-white leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-muted-2 mt-1 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {children && (
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0 w-full sm:w-auto">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;

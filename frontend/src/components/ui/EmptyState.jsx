import React from "react";
import { Inbox } from "lucide-react";
import Button from "./Button";

const EmptyState = ({
  icon: Icon = Inbox,
  title = "No data found",
  description = "There's nothing to show here yet.",
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mb-5">
        <Icon className="w-7 h-7 text-muted-2" />
      </div>
      <h3 className="text-sm font-bold text-white mb-1.5">{title}</h3>
      <p className="text-xs text-muted-2 max-w-xs mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;

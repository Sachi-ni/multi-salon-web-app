import React from "react";
import clsx from "clsx";

const Skeleton = ({ className = "", rounded = "rounded-lg" }) => (
  <div
    className={clsx(
      "animate-pulse bg-surface-2",
      rounded,
      className
    )}
  />
);

const SkeletonStatCard = () => (
  <div className="bg-surface border border-border rounded-xl p-5">
    <Skeleton className="w-9 h-9 mb-3.5 rounded-lg" />
    <Skeleton className="w-24 h-3 mb-2" />
    <Skeleton className="w-16 h-7 mb-2" />
    <Skeleton className="w-20 h-3" />
  </div>
);

const SkeletonTableRow = ({ cols = 5 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-3.5 py-3 border-t border-border">
        <Skeleton className="h-4 w-full max-w-[120px]" />
      </td>
    ))}
  </tr>
);

const SkeletonCard = () => (
  <div className="bg-surface border border-border rounded-xl p-5">
    <Skeleton className="w-full h-4 mb-3" />
    <Skeleton className="w-3/4 h-4 mb-3" />
    <Skeleton className="w-1/2 h-4" />
  </div>
);

Skeleton.StatCard = SkeletonStatCard;
Skeleton.TableRow = SkeletonTableRow;
Skeleton.Card = SkeletonCard;

export default Skeleton;

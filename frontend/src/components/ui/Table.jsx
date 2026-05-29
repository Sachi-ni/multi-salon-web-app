import React from "react";
import clsx from "clsx";

const Table = ({ children, className = "" }) => {
  return (
    <div className={clsx("overflow-x-auto rounded-xl border border-border", className)}>
      <table className="w-full border-collapse bg-surface">
        {children}
      </table>
    </div>
  );
};

const THead = ({ children }) => (
  <thead>
    <tr className="bg-surface-2">
      {children}
    </tr>
  </thead>
);

const Th = ({ children, className = "", align = "left" }) => (
  <th
    className={clsx(
      "px-3.5 py-2.5 text-[0.63rem] font-extrabold text-muted-2 uppercase tracking-widest whitespace-nowrap",
      align === "right" && "text-right",
      className
    )}
  >
    {children}
  </th>
);

const Td = ({ children, className = "", align = "left", bold = false }) => (
  <td
    className={clsx(
      "px-3.5 py-3 text-[0.82rem] border-t border-border text-white",
      align === "right" && "text-right",
      bold && "font-bold",
      className
    )}
  >
    {children}
  </td>
);

const TBody = ({ children }) => (
  <tbody className="[&>tr:hover>td]:bg-white/[0.02]">
    {children}
  </tbody>
);

Table.Head = THead;
Table.Th = Th;
Table.Body = TBody;
Table.Td = Td;

export default Table;

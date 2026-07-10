import React from "react";
import CustomerHeader from "./CustomerHeader";
import clsx from "clsx";

const CustomerLayout = ({ children }) => {

  return (
    <div className="min-h-screen bg-primary">
      <CustomerHeader />
      <main className={clsx(
        "pt-header min-h-screen transition-[margin] duration-300 ease-in-out",
        "px-4 sm:px-5 pb-5"
      )}>
        <div className="py-5 max-w-[1500px] mx-auto animate-fade-up">
          {children}
        </div>
      </main>
    </div>
  );
};

export default CustomerLayout;
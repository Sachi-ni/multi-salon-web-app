import React, { useState } from "react";
import CustomerHeader from "./CustomerHeader";
import CustomerSidebar from "./CustomerSidebar";
import clsx from "clsx";

const CustomerLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-primary">
      <CustomerHeader onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
      <CustomerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={clsx(
        "pt-header min-h-screen transition-[margin] duration-300 ease-in-out",
        "lg:ml-sidebar",
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
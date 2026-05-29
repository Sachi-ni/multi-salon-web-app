import React, { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import clsx from "clsx";

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-primary">
      <Header onToggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main Content */}
      <main
        className={clsx(
          "pt-header min-h-screen transition-[margin] duration-300 ease-in-out",
          "lg:ml-sidebar",
          "px-4 sm:px-5 pb-5"
        )}
      >
        <div className="py-5 max-w-[1500px] mx-auto animate-fade-up">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
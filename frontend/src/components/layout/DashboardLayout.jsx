import React, { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import clsx from "clsx";

const DashboardLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      setIsCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem("sidebar_collapsed", String(next));
        } catch {}
        return next;
      });
    } else {
      setMobileOpen((prev) => !prev);
    }
  };

  const closeMobileSidebar = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-primary">
      <Header onToggleSidebar={toggleSidebar} isCollapsed={isCollapsed} />
      <Sidebar
        isOpen={mobileOpen}
        onClose={closeMobileSidebar}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Main Content */}
      <main
        className={clsx(
          "pt-header min-h-screen transition-all duration-300 ease-in-out",
          isCollapsed ? "lg:ml-[72px]" : "lg:ml-sidebar",
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
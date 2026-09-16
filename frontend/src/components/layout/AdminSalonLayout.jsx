import React, { useState } from "react";
import AdminHeader from "./adminHeader";
import AdminSidebar from "./adminSiderbar";
import clsx from "clsx";
import { useLocation } from "react-router-dom";

const AdminSalonLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });
  const location = useLocation();

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

  // Extract current salon-admin base: /salon-admin/:salonId
  // Example path: /salon-admin/6a1e.../adminDashboard
  const match = location.pathname.match(/^\/salon-admin\/[^/]+/);
  const base = match ? match[0].replace(/\/$/, "") : "";

  return (
    <div className="min-h-screen bg-primary">
      <AdminHeader onToggleSidebar={toggleSidebar} isCollapsed={isCollapsed} />
      <AdminSidebar
        isOpen={mobileOpen}
        onClose={closeMobileSidebar}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleSidebar}
        basePath={base}
      />

      <main
        className={clsx(
          "pt-header min-h-screen transition-all duration-300 ease-in-out",
          isCollapsed ? "lg:ml-[72px]" : "lg:ml-sidebar",
          "px-4 sm:px-5 pb-5"
        )}
      >
        <div className="py-5 max-w-[1500px] mx-auto animate-fade-up">{children}</div>
      </main>
    </div>
  );
};

export default AdminSalonLayout;



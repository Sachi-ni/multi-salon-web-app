import React, { useState } from "react";
import AdminHeader from "./adminHeader";
import AdminSidebar from "./adminSiderbar";
import clsx from "clsx";
import { useLocation } from "react-router-dom";

const AdminSalonLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  // Extract current salon-admin base: /salon-admin/:salonId
  // Example path: /salon-admin/6a1e.../adminDashboard
  const match = location.pathname.match(/^\/salon-admin\/[^/]+/);
  const base = match ? match[0].replace(/\/$/, "") : "";

  return (
    <div className="min-h-screen bg-primary">
      <AdminHeader onToggleSidebar={toggleSidebar} />
      <AdminSidebar isOpen={sidebarOpen} onClose={closeSidebar} basePath={base} />

      <main
        className={clsx(
          "pt-header min-h-screen transition-[margin] duration-300 ease-in-out",
          "lg:ml-sidebar",
          "px-4 sm:px-5 pb-5"
        )}
      >
        <div className="py-5 max-w-[1500px] mx-auto animate-fade-up">{children}</div>
      </main>
    </div>
  );
};

export default AdminSalonLayout;



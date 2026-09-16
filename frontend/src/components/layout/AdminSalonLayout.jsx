import React, { useState } from "react";
import AdminHeader from "./adminHeader";
import AdminSidebar from "./adminSiderbar";
import clsx from "clsx";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AdminSalonLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const isStandardStaff = user?.role && !["super-admin", "manager"].includes(user.role);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  // Extract current salon-admin base: /salon-admin/:salonId
  // Example path: /salon-admin/6a1e.../adminDashboard
  const match = location.pathname.match(/^\/salon-admin\/[^/]+/);
  // Profile pages live outside `/salon-admin/:salonId`, but managers should
  // still be able to use the salon navigation from there.
  const base = match
    ? match[0].replace(/\/$/, "")
    : user?.salon_id
      ? `/salon-admin/${user.salon_id}`
      : "";

  return (
    <div className="min-h-screen bg-primary">
      <AdminHeader onToggleSidebar={isStandardStaff ? undefined : toggleSidebar} />
      {!isStandardStaff && (
        <AdminSidebar isOpen={sidebarOpen} onClose={closeSidebar} basePath={base} />
      )}

      <main
        className={clsx(
          "pt-header min-h-screen transition-[margin] duration-300 ease-in-out",
          !isStandardStaff && "lg:ml-sidebar",
          "px-4 sm:px-5 pb-5"
        )}
      >
        <div className="py-5 max-w-[1500px] mx-auto animate-fade-up">{children}</div>
      </main>
    </div>
  );
};

export default AdminSalonLayout;



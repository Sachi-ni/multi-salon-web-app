import React, { useState } from "react";
import AdminHeader from "./adminHeader";
import AdminSidebar from "./adminSiderbar";
import clsx from "clsx";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

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
  const { user } = useAuth();
  const isStandardStaff = user?.role && !["super-admin", "manager"].includes(user.role);

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
  // Profile pages live outside `/salon-admin/:salonId`, but managers should
  // still be able to use the salon navigation from there.
  const base = match
    ? match[0].replace(/\/$/, "")
    : user?.salon_id
      ? `/salon-admin/${user.salon_id}`
      : "";

  return (
    <div className="min-h-screen bg-primary">
      <AdminHeader
        onToggleSidebar={isStandardStaff ? undefined : toggleSidebar}
        isCollapsed={isCollapsed}
      />
      {!isStandardStaff && (
        <AdminSidebar
          isOpen={mobileOpen}
          onClose={closeMobileSidebar}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleSidebar}
          basePath={base}
        />
      )}

      <main
        className={clsx(
          "pt-header min-h-screen transition-all duration-300 ease-in-out",
          !isStandardStaff && (isCollapsed ? "lg:ml-[72px]" : "lg:ml-sidebar"),
          "px-4 sm:px-5 pb-5"
        )}
      >
        <div className="py-5 max-w-[1500px] mx-auto animate-fade-up">{children}</div>
      </main>
    </div>
  );
};

export default AdminSalonLayout;



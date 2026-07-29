import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,

  Store,
  Users,
  Scissors,
  Calendar,
  DollarSign,
  LogOut,
  Receipt,
  Star,
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  {
    group: "Overview",
    items: [
      { label: "Dashboard", path: "/superAdminDashboard", icon: LayoutDashboard },
    ],
  },
  {
    group: "Management",
    items: [
      { label: "Salons", path: "/salons", icon: Store, countId: "cnt-s" },
      { label: "Staff", path: "/Staff", icon: Users },
      { label: "Services", path: "/Services", icon: Scissors },
      { label: "Appointments", path: "/Appointments", icon: Calendar, countId: "cnt-a" },
      { label: "Reviews", path: "/superAdminReviews", icon: Star },
    ],
  },
  {
    group: "Finance",
    items: [
      { label: "Revenue", path: "/Revenue", icon: DollarSign },
      { label: "Billing", path: "/superAdminBilling", icon: Receipt },
    ],
  },
];

const Sidebar = ({ isOpen = true, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleNav = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[140] lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed top-header bottom-0 left-0 z-[150] w-sidebar bg-surface border-r border-border flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Nav Groups */}
        <nav className="flex-1 py-2">
          {navItems.map((group) => (
            <div key={group.group}>
              {/* Group Label */}
              <div className="px-3 pt-4 pb-1 text-[0.58rem] font-extrabold text-muted tracking-[0.14em] uppercase">
                {group.group}
              </div>

              {/* Items */}
              {group.items.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    className={clsx(
                      "w-[calc(100%-16px)] mx-2 flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[0.82rem] font-medium transition-all duration-150 text-left",
                      active
                        ? "bg-accent-dim text-accent border border-accent/20 font-semibold"
                        : "text-muted-2 hover:bg-white/[0.04] hover:text-white border border-transparent"
                    )}
                  >
                    <Icon className={clsx("w-4 h-4 flex-shrink-0", active && "text-accent")} />
                    <span className="flex-1">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 mt-auto">
          {/* System Status */}
          <div className="bg-surface-2 border border-border rounded-xl px-3 py-2.5 flex items-center gap-2.5 text-xs mb-2">
            <span className="w-2 h-2 rounded-full bg-success flex-shrink-0 animate-pulse-dot" />
            <span className="text-muted-2">System Online</span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[0.82rem] font-semibold text-danger border border-danger/20 hover:bg-danger-dim transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;